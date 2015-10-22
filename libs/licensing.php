<?php

// licensing.php

if (!class_exists('sidekickMassActivator')) {

	class sidekickMassActivator {

		var $sites_per_page = 50;
		var $offet = 0;

		function activate($blog_id, $user_id, $domain, $path) {
			// mlog("FUNCTION: activate [$blog_id, $user_id, $domain, $path]");

			switch_to_blog($blog_id);
			$sk_activation_id = get_option('sk_activation_id');
			restore_current_blog();

			if ($sk_activation_id) {
				$result = array(
					"payload" => array(
						"blog"    => $blog[0],
						"message" => "Already Activated",
						),
					);

				return json_encode($result);
			}

			$email = '';

			if ($user_id) {
				$user                = get_user_by('id', $user_id);
				$email               = ($user) ? $user->user_email : 'unknown';
			}
			$sk_subscription_id  = get_option("sk_subscription_id");
			$sk_selected_library = get_option("sk_selected_library");

			if (isset($sk_selected_library) && $sk_selected_library && $sk_selected_library !== -1 && $sk_selected_library !== '-1') {
				$data = array('domainName' => $domain . '/' . $path, 'productId' => $sk_selected_library);
			} elseif (isset($sk_subscription_id) && intval($sk_subscription_id)) {
				$data = array('domainName' => $domain . '/' . $path, 'subscriptionId' => $sk_subscription_id);
			} else {
				update_option('sk_auto_activation_error', "No selected library or subscriptionId set");


				return false;
			}

			$result = $this->send_request('post', '/domains', $data);

			if (isset($result->success) && $result->success == true && $result->payload->domainKey) {

				$this->setup_super_admin_key($result->payload->domainKey);

				switch_to_blog($blog_id);
				update_option('sk_activation_id', $result->payload->domainKey);
				update_option('sk_email', $email);
				restore_current_blog();
				
				update_option('sk_last_setup_blog_id', $blog_id);

				delete_option('sk_auto_activation_error');
			} else {

				update_option('sk_auto_activation_error', $result->message);
                    // wp_mail( 'support@sidekick.pro', 'Failed Mass Domain Add', json_encode($result));
				wp_mail('bart@sidekick.pro', 'Failed Mass Domain Add', json_encode($result));
			}

			return $result;

		}

		function deactivate($blog_id) {
			// mlog("FUNCTION: deactivate [$blog_id]");

			switch_to_blog($blog_id);
			$sk_activation_id = get_option('sk_activation_id');
			delete_option('sk_activation_id');
			restore_current_blog();

			$result = $this->send_request('delete', '/domains', array('domainKey' => $sk_activation_id));

			// mlog('$result',$result);

			if (isset($result) && isset($result->success) && $result->success == true) {
				delete_option('sk_auto_activation_error');
			} else {
				update_option('sk_auto_activation_error', $result->message);
				wp_mail('bart@sidekick.pro', 'Failed Domain Deactivation', json_encode($result));
			}

			return $result;

		}

		function getAffiliateId(){
			if (defined('SK_AFFILIATE_ID')) {
				$affiliate_id = intval(SK_AFFILIATE_ID);
			} else if (get_option( "sk_affiliate_id")){
				$affiliate_id = intval(get_option( "sk_affiliate_id"));
			} else {
				$affiliate_id = '';
			}
			return $affiliate_id;
		}

		function setup_super_admin_key($domainKey) {
                // Use the super admin's site activation key if not set using last activation key
			if (!get_option('sk_activation_id')) {
				update_option('sk_activation_id', $domainKey);
			}
		}

		function activate_batch() {
			
			$count = 0;
			$blogs = $this->get_blogs(true);
			
			foreach ($blogs as $key => $blog) {

				$userId = null;
				if (isset($blog->user_id)) {
					$userId = $blog->user_id;
				}

				$this->activate($blog->blog_id, $userId, $blog->domain, $blog->path);
			}

			die();
		}

		function activate_single() {
			$result = $this->activate($_POST['blog_id'], null, $_POST['domain'], $_POST['path']);
			die(json_encode($result));
		}

		function deactivate_single() {
			// mlog("deactivate_single");

			$blog_id = $_POST['blog_id'];

			if ($this->deactivate($blog_id)){
				die('{"success":1}');
			} else {
				die('{"payload":{"message":"Error #13a"}}');
			}


		}

		function send_request($type, $end_point, $data = null, $second_attempt = null) {

			// mlog("FUNCTION: send_request [$type] -> $end_point");

			$url      = SK_API . $end_point;
			$sk_token = get_transient('sk_token');

			if (!$sk_token && $end_point !== '/login') {
				$this->login();
				$sk_token = get_transient('sk_token');
			}

			$headers = array('Content-Type' => 'application/json');

			if ($sk_token && $end_point !== '/login') {
				$headers['Authorization'] = $sk_token;
			}

			$args = array(
				'timeout'     => 45,
				'redirection' => 5,
				'httpversion' => '1.0',
				'blocking'    => true,
				'headers'     => $headers
				);

			if (isset($type) && $type == 'post') {
				$args['method'] = 'POST';
				$args['body']   = json_encode($data);
			} else if (isset($type) && $type == 'get') {
				$args['method'] = 'GET';
				$args['body']   = $data;
			} else if (isset($type) && $type == 'delete') {
				$args['method'] = 'DELETE';
				$url .= '?' . http_build_query($data);
			}

			$result = wp_remote_post($url, $args);
			// mlog('$result',$result);

			if ($end_point == '/login' && $result['response']['message'] == 'Unauthorized') {
                // If tried to login and is unauthorized return;
				update_option('sk_auto_activation_error', $result->message);
				delete_transient('sk_token');
				return array('error' => $result->message);
			}

			if ($result['response']['message'] == 'Unauthorized' && !$second_attempt) {
                    // var_dump('Getting rid of token and trying again');
				delete_transient('sk_token');
				$this->login();

				return $this->send_request($type, $end_point, $data, true);
			}

			return json_decode($result['body']);
		}

		function setup_menu() {
			add_submenu_page('settings.php', 'Sidekick - Licensing', 'Sidekick - Licensing', 'activate_plugins', 'sidekick-licensing', array(&$this, 'admin_page'));
		}

		function login() {
			$email    = get_option('sk_account');
			$password = get_option('sk_password');
			delete_option('sk_auto_activation_error');

			if (!$password || !$email) {
				return false;
			}

			$key                = 'hash';
			$decrypted_password = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5($key), base64_decode($password), MCRYPT_MODE_CBC, md5(md5($key))), "\0");

			$result = $this->send_request('post', '/login', array('email' => $email, 'password' => $decrypted_password));

			if (!isset($result) || !$result->success) {
				delete_option('sk_token');

				return array('error' => $result->message);
			} else {
				set_transient('sk_token', $result->payload->token->value, 24 * HOUR_IN_SECONDS);
                    // var_dump($result->payload->token->value);
				$this->load_subscriptions($result->payload->token->value);

				return array('success' => true);
			}
		}

		function load_user_data() {
			return $this->send_request('get', '/users/');
		}

		function load_subscriptions() {

			$result         = $this->send_request('get', '/users/subscriptions');

			if (isset($result->success) && isset($result->payload)) {

				$sub = $result->payload[0];

				if (isset($sub->Plan->CreatableProductType) && $sub->Plan->CreatableProductType->name == 'Public') {
					$this->logout();
					update_option('sk_auto_activation_error', 'Public accounts are not compatible with MultiSite activations.');

					return false;
				}

				update_option('sk_subscription_id', $sub->id);

				$sub->activeDomainCount = 0;

				if (count($sub->Domains) > 0) {
					foreach ($sub->Domains as &$domain) {
						if (!$domain->end) {
							if (isset($sub->activeDomainCount)) {
								$sub->activeDomainCount++;
							} else {
								$sub->activeDomainCount = 1;
							}
						}
					}
				}

				$data['subscriptions'] = $result->payload;
				$data['libraries']     = $this->load_libraries();

				return $data;
			} else if (isset($result->message) && strpos($result->message, 'Invalid Token') !== false) {
				$this->logout();
				update_option('sk_auto_activation_error', 'Please authorize SIDEKICK by logging in.');
			}

			return null;
		}

		function get_blog_by_id($id) {
			global $wpdb;

			$blogs = $wpdb->get_results($wpdb->prepare("SELECT *
				FROM $wpdb->blogs
				WHERE blog_id = '%d'
				"
				, $id));

			return $blogs;
		}

		function get_blogs($noCache = false) {
			global $wpdb;

			if ($noCache || false === ($blogs = get_transient('sk_blog_list'))) {
				$blogs = $wpdb->get_results($wpdb->prepare("SELECT *
					FROM $wpdb->blogs
					WHERE spam = '%d' AND deleted = '%d'
					"
					, 0, 0));
				set_transient('sk_blog_list', $blogs, 24 * HOUR_IN_SECONDS);
			}

			return $blogs;
		}

		function logout() {
			delete_option('sk_account');
			delete_option('sk_password');
			delete_option('sk_subscription_id');
			delete_option('sk_selected_library');
		}

		function load_libraries() {
			$result = $this->send_request('get', '/products');
			if ($result->success) {
				return $result->payload->products;
			}

			return null;
		}

		function check_batch_status(){
			$blogList = $_POST['blogIdList'];
			$activeList = [];

			foreach ($blogList as $blogList_key => $blog_id) {
				switch_to_blog($blog_id);
				$sk_activation_id = get_option('sk_activation_id');
				if ($sk_activation_id) {
					$activeList[] = $blog_id;
				}
				restore_current_blog();
			}
			die(json_encode($activeList));
		}

		function admin_page() {
			if (isset($_POST['sk_account'])) {

				delete_option('sk_auto_activation_error');

				if (isset($_POST['sk_password']) && $_POST['sk_password'] && isset($_POST['sk_account']) && $_POST['sk_account']) {
					$key    = 'hash';
					$string = $_POST['sk_password'];

					$encrypted_password = base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5($key), $string, MCRYPT_MODE_CBC, md5(md5($key))));
					$decrypted_password = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5($key), base64_decode($encrypted_password), MCRYPT_MODE_CBC, md5(md5($key))), "\0");

					update_option('sk_account', $_POST['sk_account']);
					update_option('sk_password', $encrypted_password);
					$login_status = $this->login();
					delete_option('sk_auto_activation_error');
				}

				if (isset($_POST['sk_auto_activations'])) {
					update_option('sk_auto_activations', true);
				} else {
					delete_option('sk_auto_activations');
				}

				if (isset($_POST['sk_selected_library'])) {
					update_option('sk_selected_library', $_POST['sk_selected_library']);
				}

			}

			if (!$sk_token = get_transient('sk_token')) {
				$login_status = $this->login();
			}

			$sk_subs                         = $this->load_subscriptions();
			$user_data                       = $this->load_user_data();
			$sk_auto_activations             = get_option('sk_auto_activations');
			$sk_auto_activation_error        = get_option('sk_auto_activation_error');
			$sk_subscription_id              = get_option('sk_subscription_id');
			$sk_selected_library             = get_option('sk_selected_library');
			$sk_hide_composer_taskbar_button = get_option('sk_hide_composer_taskbar_button');
			$sk_hide_config_taskbar_button   = get_option('sk_hide_config_taskbar_button');
			$sk_hide_composer_upgrade_button = get_option('sk_hide_composer_upgrade_button');
			$is_ms_admin                     = true;
			$affiliate_id                    = $this->getAffiliateId();
			$all_sites                       = $this->get_blogs(true);

			require_once('ms_admin_page.php');
		}
	}
}

// //licensing.php