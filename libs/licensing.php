<?php

// licensing.php

if (!class_exists('sidekickMassActivator')) {

	class sidekickMassActivator{

		function activate($blog_id, $user_id, $domain, $path){
			// mlog('FUNCTION: activate');

			$sk_auto_activations = get_option( 'sk_auto_activations');

			if ($sk_auto_activations) {

				$user = get_user_by('id',$user_id);
				$email = ($user) ? $user->user_email : 'unknown';

				// TODO: Send Domain for good measure

				$sk_selected_subscription = get_option("sk_selected_subscription");
				$sk_selected_product      = get_option("sk_selected_product");

				if (isset($sk_selected_product) && $sk_selected_product) {
					$data = array('domainName'     => $domain . $path, 'productId' => $sk_selected_product);
				} else if (strpos($sk_selected_subscription,'subscription-') !== false) {
					$sk_selected_subscription = explode('subscription-',$sk_selected_subscription);
					$data = array('domainName'     => $domain . $path, 'subscriptionId' => $sk_selected_subscription[1]);
				}

				$result = $this->send_request('post','/domains',$data);

				if (isset($result->success) && $result->success == true && $result->payload->domainKey) {

					if (!get_option('sk_activation_id')) {
						// Use the first site's activation key for the network key
						update_option('sk_activation_id',$result->payload->domainKey);
					}

					switch_to_blog($blog_id);
					update_option('sk_activation_id',$result->payload->domainKey);
					update_option('sk_email',$email);
					restore_current_blog();

					$this->track('Mass Activate',array('domain' => $domain,'email' => $email));

					delete_option('sk_auto_activation_error');
				} else {

					$this->track('Mass Activate Error',array('domain' => $domain, 'message' => $result->message,'email' => $email));
					update_option('sk_auto_activation_error',$result->message);
					wp_mail( 'support@sidekick.pro', 'Failed Mass Domain Add', json_encode($result));
				}
				return $result;
			}
			return false;
		}

		function track($event,$data){
			if (file_exists(realpath(dirname(__FILE__)) . '/mixpanel/Mixpanel.php')) {
				require_once(realpath(dirname(__FILE__)) . '/mixpanel/Mixpanel.php');
				$mp     = Mixpanel::getInstance("965556434c5ae652a44f24b85b442263");
				$domain = str_replace("http://","",$_SERVER["SERVER_NAME"]);

				$mp->track($event, $data);
			}
		}

		function activate_single(){
			die(json_encode($this->activate($_POST['blog_id'], $_POST['user_id'], $_POST['domain'], $_POST['path'])));
		}

		function send_request_curl($url, $post){
			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
			curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode($post));
			curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
			$result = curl_exec($ch);
			curl_close($ch);
			return $result;
		}

		function send_request($type,$end_point, $data = null,$second_attempt = null){
		// var_dump('send_request');
		//var_dump("FUNCTION: send_request");

			if (strpos($_SERVER['SERVER_PROTOCOL'], 'https') === false) {
				$protocol = 'http:';
			} else {
				$protocol = 'https:';
			}

			$url      = $protocol . SK_API  . $end_point;
			$sk_token = get_transient('sk_token');

			if (!$sk_token && $end_point !== '/login') {
				$this->login();
				$sk_token = get_transient('sk_token');
			}

			$headers = array('Content-Type:application/json');

			if ($sk_token && $end_point !== '/login') {
				$headers[] = "Authorization: $sk_token";
			}

			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($type));
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			if ($data) {
				curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode($data));
			}
			curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
			$result = curl_exec($ch);
			curl_close($ch);

			// echo $result; var_dump($url); var_dump($headers); var_dump($data); var_dump($result); die();

			if ($result == 'HTTP/1.1 401 Unauthorized' && !$second_attempt) {
				// var_dump('Getting rid of token and trying again');
				$this->login();
				delete_transient('sk_token');
				$this->send_request('post',$type,$data,true);
			}

			return json_decode($result);
		}

		function setup_menu(){
			add_submenu_page( 'settings.php', 'Sidekick - Licensing', 'Sidekick - Licensing', 'activate_plugins','sidekick-licensing', array(&$this,'admin_page'));
		}

		function login(){
			global $login_error;

			$email    = get_option('sk_account');
			$password = get_option('sk_password');
			delete_option('sk_auto_activation_error');

			if (!$password || !$email) {
				return false;
			}

			$string = $password;
			$key    = 'hash';
			$decrypted_password = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5($key), base64_decode($password), MCRYPT_MODE_CBC, md5(md5($key))), "\0");

			$result = $this->send_request('post','/login',array('email' => $email, 'password' => $decrypted_password));

			if (!isset($result) || !$result->success) {
				delete_option( 'sk_token' );
				return array('error' => $result->message);
			} else {
				set_transient( 'sk_token', $result->payload->token->value, 24 * HOUR_IN_SECONDS );
				$this->load_subscriptions($result->payload->token->value);
				return array('success' => true);
			}
		}

		function load_user_data(){
			return $this->send_request('get','/users/');
		}

		function load_subscriptions(){

			$result        = $this->send_request('get','/users/subscriptions');
			$load_products = false;

			if (isset($result->success) && isset($result->payload)) {

				$sub = $result->payload[0];

				if (isset($sub->Plan->CreatableProductType) && $sub->Plan->CreatableProductType->name == 'Public') {
					$this->logout();
					update_option( 'sk_auto_activation_error', 'Public accounts are not compatible with MultiSite activations.');
					return false;
				} if (isset($sub->Plan->CreatableProductType) && $sub->Plan->CreatableProductType->name == 'Private') {
					update_option( 'sk_selected_subscription', 'product-' . $sub->id );
				} else {
					update_option( 'sk_selected_subscription', 'subscription-' . $sub->id );
				}

				if (isset($sub->Plan->CreatableProductType) && isset($sub->Plan->CreatableProductType->name) && $sub->Plan->CreatableProductType->name == 'Private') {
					$load_products = true;
				}

				if (count($sub->Domains) > 0) {
					foreach ($sub->Domains as &$domain) {
						if (!$domain->DomainSubscription->end) {
							if (isset($sub->activeDomainCount)) {
								$sub->activeDomainCount++;
							} else {
								$sub->activeDomainCount = 1;
							}
						}
					}
				} if (count($sub->PrivateProductSubscriptions) > 0) {
					foreach ($sub->PrivateProductSubscriptions as &$domain) {
						if (isset($sub->activeDomainCount)) {
							$sub->activeDomainCount++;
						} else {
							$sub->activeDomainCount = 1;
						}
					}
				} else {
					$sub->activeDomainCount = 0;
				}

				$data['subscriptions'] = $result->payload;

				if ($load_products) {
					$data['products'] = $this->load_products();
				}

				return $data;
			} else if (isset($result->message) && strpos($result->message, 'Invalid Token') !== false) {
				$this->logout();
				update_option( 'sk_auto_activation_error', 'Please authorize SIDEKICK by logging in.');
			}
			return null;
		}

		function logout(){
			delete_option( 'sk_account');
			delete_option( 'sk_password');
			delete_option( 'sk_selected_subscription');
			delete_option( 'sk_selected_product');
		}

		function load_products(){
			$result = $this->send_request('get','/products');
			if ($result->success) {
				return $result->payload->products;
			}
			return null;
		}

		function admin_page(){
			if (isset($_POST['sk_account'])) {

				delete_option('sk_auto_activation_error');

				if (isset($_POST['sk_password']) && $_POST['sk_password'] && isset($_POST['sk_account']) && $_POST['sk_account']) {
					$key    = 'hash';
					$string = $_POST['sk_password'];

					$encrypted_password = base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5($key), $string, MCRYPT_MODE_CBC, md5(md5($key))));
					$decrypted_password = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5($key), base64_decode($encrypted_password), MCRYPT_MODE_CBC, md5(md5($key))), "\0");

					update_option( 'sk_account', $_POST['sk_account'] );
					update_option( 'sk_password', $encrypted_password );
					$login_status = $this->login();
					delete_option('sk_auto_activation_error');
				} else {
					update_option( 'sk_selected_subscription', $_POST['sk_selected_subscription'] );
				}

				if (isset($_POST['sk_auto_activations'])) {
					update_option( 'sk_auto_activations', true );
				} else {
					delete_option( 'sk_auto_activations');
				}

				if (isset($_POST['sk_selected_product']) && $_POST['sk_selected_product'] !== '0' && isset($_POST['sk_selected_subscription']) && strpos($_POST['sk_selected_subscription'], 'product') !== false) {
					update_option( 'sk_selected_product', $_POST['sk_selected_product'] );
				} else {
					delete_option( 'sk_selected_product');
				}

			}

			$sk_token                 = get_transient('sk_token');
			if (!$sk_token) {
				$login_status = $this->login();
			}
			$sk_subs                  = $this->load_subscriptions();
			$user_data                = $this->load_user_data();
			$sk_auto_activations      = get_option( 'sk_auto_activations');
			$sk_auto_activation_error = get_option('sk_auto_activation_error');
			$sk_selected_subscription = get_option('sk_selected_subscription');
			$sk_selected_product      = get_option('sk_selected_product');
			$is_ms_admin              = true;
			$curl                     = function_exists('curl_version') ? true : false;
			$fgets                    = file_get_contents(__FILE__) ? true : false;
			$fgets_url                = ini_get('allow_url_fopen') ? true : false;

			if ($curl && (!$fgets || !$fgets_url)) {
				$error = "Sorry, SIDEKICK MultiSite activations require <b>CURL</b> or <b>file_get_contents</b> functions enabled in PHP.";
			}

			require_once('ms_admin_page.php');
		}
	}
}

// //licensing.php