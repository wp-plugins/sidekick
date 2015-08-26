<?php

// licensing.php

if (!class_exists('sidekickMassActivator')) {

    class sidekickMassActivator {

        var $sites_per_page = 25;
        var $offet = 0;

        function activate($blog_id, $user_id, $domain, $path) {
            mlog("FUNCTION: activate [$blog_id, $user_id, $domain, $path]");

            switch_to_blog($blog_id);
            $sk_activation_id = get_option('sk_activation_id');
            restore_current_blog();

            $checked_blogs = get_option('sk_checked_blogs');

            if (isset($checked_blogs['active'][$blog_id]) || $sk_activation_id) {
                unset($checked_blogs['unactivated'][$blog_id]);
                $blog                              = $this->get_blog_by_id($blog_id);
                $checked_blogs['active'][$blog_id] = $blog[0];

                update_option('sk_checked_blogs', $checked_blogs);

                $result = array(
                    "payload" => array(
                        "blog"    => $blog[0],
                        "message" => "Already Activated",
                        ),
                    );

                return json_encode($result);
            }

            $user                = get_user_by('id', $user_id);
            $email               = ($user) ? $user->user_email : 'unknown';
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

                if (isset($checked_blogs['deactivated'][$blog_id])) {
                    $checked_blogs['active'][$blog_id] = $checked_blogs['deactivated'][$blog_id];
                    unset($checked_blogs['deactivated'][$blog_id]);
                } else if (isset($checked_blogs['unactivated'][$blog_id])) {
                    $checked_blogs['active'][$blog_id] = $checked_blogs['unactivated'][$blog_id];
                    unset($checked_blogs['unactivated'][$blog_id]);
                }

                update_option('sk_checked_blogs', $checked_blogs);
                update_option('sk_last_setup_blog_id', $blog_id);

                delete_option('sk_auto_activation_error');
            } else {

                update_option('sk_auto_activation_error', $result->message);
                    // wp_mail( 'support@sidekick.pro', 'Failed Mass Domain Add', json_encode($result));
                wp_mail('bart@sidekick.pro', 'Failed Mass Domain Add', json_encode($result));
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
            $checked_blogs = get_option('sk_checked_blogs');
            $count         = 0;

            if (isset($checked_blogs['unactivated']) && is_array($checked_blogs['unactivated'])) {
                foreach ($checked_blogs['unactivated'] as $key => $blog) {
                    if ($count == $this->sites_per_page) {
                        break;
                    }
                    $this->activate($blog->blog_id, $blog->user_id, $blog->domain, $blog->path);
                    $count++;
                }
            }
            //mlog('$checked_blogs',$checked_blogs);

            $result = array('activated_count' => $count, 'sites_per_page' => $this->sites_per_page, 'unactivated_count' => count($checked_blogs['unactivated']));
            die(json_encode($result));
        }

        function activate_single() {
            $result = $this->activate($_POST['blog_id'], $_POST['user_id'], $_POST['domain'], $_POST['path']);
            die(json_encode($result));
        }

        function deactivate_single() {

            $checked_blogs = get_option('sk_checked_blogs');
            $blog_id       = $_POST['blog_id'];

            if (isset($checked_blogs['active'][$_POST['blog_id']])) {
                $checked_blogs['deactivated'][$blog_id] = $checked_blogs['active'][$blog_id];
                unset($checked_blogs['active'][$blog_id]);
                update_option('sk_checked_blogs', $checked_blogs);
                die('{"success":1}');
            } else {
                die('{"payload":{"message":"Error #13"}}');
            }
        }

        function send_request($type, $end_point, $data = null, $second_attempt = null) {

                // var_dump("FUNCTION: send_request [$type] -> $end_point");

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
            }

            $result = wp_remote_post($url, $args);

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

        function get_blogs() {
            global $wpdb;

            if (false === ($blogs = get_transient('sk_blog_list'))) {
                $blogs = $wpdb->get_results($wpdb->prepare("SELECT *
                 FROM $wpdb->blogs
                 WHERE spam = '%d' AND deleted = '%d'
                 "
                 , 0, 0));
                set_transient('sk_blog_list', $blogs, 24 * HOUR_IN_SECONDS);
            }

            return $blogs;
        }

        function get_unchecked_blogs($blogs, $checked_blogs) {
            $return = array();

            foreach ($blogs as $key => $blog) {

                if (isset($checked_blogs['deactivated']) && is_array($checked_blogs['deactivated']) && isset($checked_blogs['deactivated'][$blog->blog_id])) {
                    continue;
                }

                if (isset($checked_blogs['unactivated']) && is_array($checked_blogs['unactivated']) && isset($checked_blogs['unactivated'][$blog->blog_id])) {
                    continue;
                }

                if (isset($checked_blogs['active']) && is_array($checked_blogs['active']) && isset($checked_blogs['active'][$blog->blog_id])) {
                    continue;
                }

                $return[$blog->blog_id] = $blog;
            }

            return $return;
        }

        function check_statuses() {
            $checked_blogs   = get_option('sk_checked_blogs');
            $blogs           = $this->get_blogs();
            $unchecked_blogs = $this->get_unchecked_blogs($blogs, $checked_blogs);
            $count           = 0;

            if (!isset($checked_blogs['unactivated'])) {
                $checked_blogs['unactivated'] = array();
            }

            if (!isset($checked_blogs['active'])) {
                $checked_blogs['active'] = array();
            }

            if (!isset($checked_blogs['deactivated'])) {
                $checked_blogs['deactivated'] = array();
            }

            foreach ($unchecked_blogs as $blog) {

//                if ($count > $this->sites_per_page) {
//                    break;
//                }

                $blog_id       = $blog->blog_id;
                $activation_id = null;
                $count++;

                switch_to_blog($blog_id);
                if ($user = get_user_by('email', get_option('admin_email'))) {
                    $blog->user_id = $user->ID;
                }
                $activation_id = get_site_option('sk_activation_id');
                restore_current_blog();

                if ($activation_id) {
                    $status = 'active';
                } elseif (isset($checked_blogs['deactivated']) && in_array($blog_id, $checked_blogs['deactivated'])) {
                    $status = 'deactivated';
                } else {
                    $status = 'unactivated';
                }

                $checked_blogs[$status][$blog_id] = $blog;

            }

            update_option('sk_checked_blogs', $checked_blogs);

            return $checked_blogs;

        }

        function load_sites_by_status() {
            global $wpdb;

            $checked_blogs = $this->check_statuses();
            $status        = sanitize_text_field($_POST['status']);
            $this->offet   = sanitize_text_field($_POST['offset']);

            if (isset($checked_blogs[$status]) && is_array($checked_blogs[$status])) {

                $return['sites']                 = array_slice($checked_blogs[$status], $this->offet, $this->sites_per_page);
                $return['counts']['all_blogs']   = intval($wpdb->get_var($wpdb->prepare("SELECT count(blog_id) as count FROM $wpdb->blogs WHERE spam = '%d' AND deleted = '%d'", 0, 0)));
                $return['counts']['active']      = count($checked_blogs['active']);
                $return['counts']['deactivated'] = count($checked_blogs['deactivated']);
                $return['counts']['unactivated'] = intval($return['counts']['all_blogs']) - intval($return['counts']['active']) - $return['counts']['deactivated'];


                $currentStatusCount = intval($return['counts'][$status]);
                $return['pages']    = ceil($currentStatusCount / $this->sites_per_page);

                // $return['counts'][$status] = count($checked_blogs[$status]);
            } else {
                // $return['counts'][$status] = 0;
                $return[$status]['sites'] = array();
            }

            die(json_encode($return));
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

        function schedule(){
            if ( ! wp_next_scheduled( array($this,'check_statuses') ) ) {
                wp_schedule_event( time(), 'hourly', array($this,'check_statuses'));
                wp_schedule_event( time(), 'hourly', array($this,'activate_batch'));
            }

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

            require_once('ms_admin_page.php');
        }
    }
}

// //licensing.php