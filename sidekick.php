<?php

/*
Plugin Name: Sidekick
Plugin URL: http://wordpress.org/plugins/sidekick/
Description: Adds a real-time WordPress training walkthroughs right in your Dashboard
Requires at least: 4.0
Tested up to: 4.1.1
Version: 2.2.3
Author: Sidekick.pro
Author URI: http://www.sidekick.pro
*/


if ( ! defined( 'PLAYER_DOMAIN' ) ) 	define( 'PLAYER_DOMAIN', 'player.sidekick.pro' );
if ( ! defined( 'PLAYER_PATH' ) ) 		define( 'PLAYER_PATH', 'tag/latest' );
if ( ! defined( 'PLAYER_FILE' ) ) 		define( 'PLAYER_FILE', 'sidekick.min.js' );
if ( ! defined( 'COMPOSER_DOMAIN' ) ) 	define( 'COMPOSER_DOMAIN', 'composer.sidekick.pro' );
if ( ! defined( 'COMPOSER_PATH' ) ) 	define( 'COMPOSER_PATH', 'tag/latest' );
if ( ! function_exists('mlog')) {
	function mlog(){}
}

if (!class_exists('Sidekick')){

	class Sidekick{

		function __construct(){
			if (!defined('SK_TRACKING_API')) 	define('SK_TRACKING_API','//tracking.sidekick.pro/');
			if (!defined('SK_COMPOSER_API')) 	define('SK_COMPOSER_API','//apiv2.sidekick.pro');
			if (!defined('SK_API')) 			define('SK_API','//apiv2.sidekick.pro/');
			if (!defined('SK_LIBRARY')) 		define('SK_LIBRARY','//librarycache.sidekick.pro/');
			if (!defined('SK_ASSETS')) 			define('SK_ASSETS','//assets.sidekick.pro/');
			if (!defined('SK_AUDIO')) 			define('SK_AUDIO','//audio.sidekick.pro/');
		}

		function enqueue_required(){
			wp_enqueue_script('jquery'                      , null );
			wp_enqueue_script('underscore'                  , null, array('underscore'));
			wp_enqueue_script('backbone'                    , null, array('jquery','underscore'));
			wp_enqueue_script('jquery-ui-core'				, null, array('jquery') );
			wp_enqueue_script('jquery-ui-position'			, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-ui-draggable'			, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-ui-droppable'			, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-effects-scale'		, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-effects-highlight'	, null, array('jquery-ui-core') );
			wp_enqueue_script('sidekick-admin'				, '//assets.sidekick.pro/plugin/tag/latest/js/sidekick_admin.js',array( 'jquery' ));
		}

		function enqueue(){
			wp_enqueue_script('sidekick'   		,"//" . PLAYER_DOMAIN ."/" . PLAYER_PATH . "/" . PLAYER_FILE,	array('backbone','jquery','underscore','jquery-effects-highlight'),null);
			wp_enqueue_style('wp-pointer');
			wp_enqueue_script('wp-pointer');
		}

		function setup_menu(){
			add_submenu_page( 'options-general.php', 'Sidekick', 'Sidekick', 'activate_plugins','sidekick', array(&$this,'admin_page'));
		}

		function ajax_save(){
			if (current_user_can('install_plugins')) {
				if (isset($_POST['sk_composer_button']) && $_POST['sk_composer_button'] == "true") {
					update_option( 'sk_composer_button', true );
				} elseif (isset($_POST['sk_composer_button']) && $_POST['sk_composer_button'] == "false") {
					delete_option('sk_composer_button');
				}
			}
		}

		function admin_page(){

			if ( empty( $_POST ) || check_admin_referer( 'update_sk_settings' ) ) {

				if (isset($_POST['option_page']) && $_POST['option_page'] == 'sk_license') {

					if (isset($_POST['activation_id']) && $_POST['activation_id'] && strpos($_POST['activation_id'], '-xxxx-xxxx') === false){
						$result = $this->activate(true);
					} else if (isset($_POST['activation_id']) && strpos($_POST['activation_id'], '-xxxx-xxxx') === false) {
						delete_option('sk_activation_id');
					}

					if (isset($_POST['sk_composer_button'])) {
						update_option( 'sk_composer_button', true );
					} else {
						delete_option('sk_composer_button');
					}

					if (isset($_POST['sk_track_data'])) {
						update_option( 'sk_track_data', true );
					} else {
						delete_option('sk_track_data');
					}

					update_option( 'sk_activated', true );
					die('<script>window.open("' . get_site_url() . '/wp-admin/options-general.php?page=sidekick","_self")</script>');
				}

			}

			$activation_id = (get_option( "sk_activation_id" ) ? get_option( "sk_activation_id" ) : '');
			$sk_track_data = get_option( 'sk_track_data' );
			$current_user  = wp_get_current_user();
			$status        = 'Free';
			$error         = null;

			if (isset($SK_PAID_LIBRARY_FILE) && $activation_id) {
				$_POST['activation_id'] = $activation_id;
				$check_activation       = $this->activate(true);
				$status = 'Checking...';
			}

			global $wp_version;
			if (version_compare($wp_version, '3.9', '<=')) {
				$error = "Sorry, Sidekick requires WordPress 3.9 or higher to function.";
			}

			if (!$activation_id) {
				$warn = "You're using the <b>free</b> version of Sidekick, to upgrade or get your license key, visit your <a target='_blank' href='http://www.sidekick.pro/plans/#/login?utm_source=plugin&utm_medium=settings&utm_campaign=upgrade_nag'>account page</a> or <a target='_blank' href='http://www.sidekick.pro/plans/?utm_source=plugin&utm_medium=settings&utm_campaign=upgrade_nag'>sign-up</a> for a paid plan.";
			}

			if(preg_match('/(?i)msie [6-8]/',$_SERVER['HTTP_USER_AGENT'])){
				$error = "Sorry, Sidekick requires Internet Explorer 9 or higher to function.";
			}

			?>

			<?php if (get_option('sk_firstuse') == true): ?>
				<?php delete_option('sk_firstuse') ?>
				<script type="text/javascript">
					jQuery(document).ready(function($) {
						jQuery('#sidekick #logo').trigger('click');
					});
				</script>
			<?php endif ?>

			<div class="wrap">
				<?php include('libs/admin_page.php') ?>
			</div>
			<?php
		}

		function set_disabled_wts(){

			if (!check_admin_referer('update_sk_settings')) {
				print 'Sorry, your nonce did not verify or you\'re not logged in.';
				exit;
			}

			$_POST['disable_wts'] =  array_map("mysql_real_escape_string",$_POST['disable_wts']);

			if (isset($_POST['disable_wts']) && $_POST['disable_wts']) {
				update_option('sk_disabled_wts',json_encode($_POST['disable_wts']));
				if (is_network_admin()) {
					update_site_option('sk_disabled_wts',json_encode($_POST['disable_wts']));
				}
			} else {
				delete_option('sk_disabled_wts');
				if (is_network_admin()) {
					delete_site_option('sk_disabled_wts');
				}
			}
		}

		function set_autostart_wt(){

			if (!check_admin_referer('update_sk_settings')) {
				print 'Sorry, your nonce did not verify or you\'re not logged in.';
				exit;
			}

			if (isset($_POST['sk_autostart_walkthrough_id']) && intval($_POST['sk_autostart_walkthrough_id']) > 0){
				if (is_network_admin()) {
					update_site_option('sk_autostart_walkthrough_id',wp_filter_kses($_POST['sk_autostart_walkthrough_id']));
				}
				update_option('sk_autostart_walkthrough_id',wp_filter_kses($_POST['sk_autostart_walkthrough_id']));
			} else {
				delete_option('sk_autostart_walkthrough_id');
				if (is_network_admin()) {
					delete_site_option('sk_autostart_walkthrough_id');
				}
			}
		}

		function set_api(){

			if (!check_admin_referer('update_sk_settings')) {
				print 'Sorry, your nonce did not verify or you\'re not logged in.';
				exit;
			}


			if (isset($_POST['sk_api'])){
				update_option('sk_api',wp_filter_kses($_POST['sk_api']));
				update_site_option('sk_api',wp_filter_kses($_POST['sk_api']));
			}
		}

		function footer(){
			global $current_user;

			require_once('libs/sk_config_data.php');

			$sk_config_data                   = new sk_config_data;
			$current_user                     = wp_get_current_user();
			$sk_just_activated                = get_option( 'sk_just_activated' );
			$sk_track_data                    = get_option( 'sk_track_data' );
			$sk_composer_button               = get_option( 'sk_composer_button' );
			$activation_id                    = (get_option( "sk_activation_id" ) ? get_option( "sk_activation_id" ) : '');
			$autostart_network_walkthrough_id = (get_site_option('sk_autostart_walkthrough_id') ? get_site_option('sk_autostart_walkthrough_id') : 'null' );
			$autostart_walkthrough_id         = (get_option('sk_autostart_walkthrough_id') ? get_option('sk_autostart_walkthrough_id') : $autostart_network_walkthrough_id );
			$custom_class                     = (get_option( "sk_custom_class" ) ? get_option( "sk_custom_class" ) : '');
			$theme                            = wp_get_theme();
			$not_supported_ie                 = false;
			$user_email                       = '';
			if ($sk_track_data) {
				$user_email = $current_user->user_email;
			}

			$disabled_wts            = (!is_network_admin()) ? $sk_config_data->get_disabled_wts() : '[]';
			$user_role               = $sk_config_data->get_user_role();
			$site_url                = $sk_config_data->get_domain();
			$installed_plugins       = $sk_config_data->get_plugins();
			$plugin_count            = (isset($plugins) && is_array($plugins)) ? count($plugins) : array();
			$disabled_network_wts    = $sk_config_data->get_disabled_network_wts();
			$current_url             = $sk_config_data->get_current_url();
			$post_types              = $sk_config_data->get_post_types();
			$taxonomies              = $sk_config_data->get_taxonomies();
			$user_data               = $sk_config_data->get_user_data();
			$comments                = $sk_config_data->get_comments();
			$post_statuses           = $sk_config_data->get_post_statuses();
			$post_types_and_statuses = $sk_config_data->get_post_types_and_statuses();
			$number_of_themes        = $sk_config_data->get_themes();
			$frameworks              = $sk_config_data->get_framework();

			delete_option( 'sk_just_activated' );
			if(preg_match('/(?i)msie [6-8]/',$_SERVER['HTTP_USER_AGENT'])) $not_supported_ie = true;

			?>


			<?php if (!$not_supported_ie): ?>

				<script type="text/javascript">

					<?php if (is_network_admin()): ?>var is_network_admin = true;		<?php endif ?>

					var sk_config = {
						// Compatibility

						compatibilities: {
							<?php                     	echo $post_types ?>
							<?php                     	echo $taxonomies ?>
							<?php                     	echo $user_data ?>
							<?php                     	echo $comments ?>
							<?php                     	echo $post_statuses ?>
							<?php                     	echo $frameworks ?>
							<?php                     	echo $post_types_and_statuses ?>
							installed_plugins:        	<?php echo json_encode($installed_plugins) ?>,
							plugin_count: 				<?php echo ($plugin_count) ? $plugin_count : 0 ?>,
							is_multisite:             	<?php echo (is_multisite()) ? "true" : "false" ?>,
							number_of_themes:         	<?php echo $number_of_themes ?>,
							installed_theme:          	'<?php echo sanitize_title($theme->Name) ?>',
							theme_version:            	'<?php echo $theme->Version ?>',
							main_soft_version:        	'<?php echo get_bloginfo("version") ?>',
							user_level:               	'<?php echo $user_role ?>',
							main_soft_name: 			'WordPress',
							role:               		'<?php echo $user_role ?>'
						},

						disable_wts:              	<?php echo $disabled_wts ?>,
						disable_network_wts: 		<?php echo $disabled_network_wts ?>,
						main_soft_name:           	'WordPress',
						embeded:					false,

						// User Settings
						activation_id:                  '<?php echo $activation_id ?>',
						auto_open_root_bucket_id:       79,
						auto_open_product:              'default',
						disable_wts_in_root_bucket_ids: [5,87],
						autostart_walkthrough_id:       <?php echo $autostart_walkthrough_id ?>,
						sk_composer_button:             <?php echo ($sk_composer_button ? "true" : "false") ?>,
						track_data:                     '<?php echo $sk_track_data ?>',
						user_email:                     '<?php echo $user_email ?>',
						custom_class:                   '<?php echo $custom_class ?>',

						// Toggles
						path_not_found_continue: true,
						show_powered_by:         true,
						show_powered_by_link:    true,
						sk_autostart_only_once:  true,
						use_native_controls:     false,
						composer_upgrade_off:    false,
						basics_upgrade:          true,

						// Platform Info
						library_version: 2,
						platform_id:     1,

						// Generic Info
						just_activated:           	<?php echo ($sk_just_activated) ? "true" : "false" ?>,
						platform_version:         	null,
						plugin_version:           	'2.2.3',
						show_login:               	<?php echo ($sk_just_activated) ? "true" : "false" ?>,

						// SIDEKICK URLS
						assets:       				'<?php echo SK_ASSETS ?>',
						api:          				'<?php echo SK_API ?>',
						tracking_api: 				'<?php echo SK_TRACKING_API ?>',
						sk_path:      				'<?php echo PLAYER_PATH ?>',
						audio:        				'<?php echo SK_AUDIO ?>',
						library: 					'<?php echo SK_LIBRARY ?>',

						// URLS
						site_url:                 '<?php echo $site_url ?>',
						domain:                   '<?php echo str_replace("http://","",$_SERVER["SERVER_NAME"]) ?>',
						domain_used:              '//<?php echo PLAYER_DOMAIN ?>/',
						plugin_url:               '<?php echo admin_url("admin.php?page=sidekick") ?>',
						base_url:                 '<?php echo site_url() ?>',
						current_url:              '<?php echo $current_url ?>'
						// fallback_notfication_mp3: '//assets.sidekick.pro/fallback.mp3'
					}

					var skc_config = {
						audioPlaceholderUrl: '<?php echo SK_ASSETS ?>walkthrough-audio-placeholder.mp3',
						audioBaseUrl:        '<?php echo SK_AUDIO ?>',
						apiUrl:              '<?php echo SK_COMPOSER_API ?>',
						trackingUrl:         '<?php echo SK_TRACKING_API ?>',
						js:                  '//<?php echo COMPOSER_DOMAIN ?>/<?php echo COMPOSER_PATH ?>/sidekick-composer.js',
						css:                 '//<?php echo COMPOSER_DOMAIN ?>/<?php echo COMPOSER_PATH ?>/sidekick-composer.css',
						baseSiteUrl:         sk_config.base_url,
						platformId:          1,
						compatibilities:     sk_config.compatibilities,
						siteAjaxUrl:         window.ajaxurl || ''
					}

				</script>
			<?php endif ?>

			<?php
		}

		function track($data){
			mlog('track');

			if (file_exists(realpath(dirname(__FILE__)) . '/libs/mixpanel/Mixpanel.php')) {
				require_once(realpath(dirname(__FILE__)) . '/libs/mixpanel/Mixpanel.php');
				$mp     = Mixpanel::getInstance("965556434c5ae652a44f24b85b442263");
				$domain = str_replace("http://","",$_SERVER["SERVER_NAME"]);

				switch ($data['type']) {
					case 'activate':
					$mp->track("Activate - Plugin", array("domain" => $domain));
					break;

					case 'deactivate':
					$mp->track("Deactivate - Plugin", array("domain" => $domain));
					break;

					default:
					if (isset($data['event'])) {
						$mp->track($data['event'], array("domain" => $domain));
					}
					break;
				}
			}

			$response = wp_remote_post( SK_TRACKING_API . 'event', array(
				'method' => 'POST',
				'timeout' => 45,
				'redirection' => 5,
				'httpversion' => '1.0',
				'blocking' => true,
				'headers' => array(),
				'body' => $data,
				'cookies' => array()
				)
			);
		}

		function activate($return = false){
			if (isset($_POST['activation_id']) && current_user_can('install_plugins')) {
				update_option('sk_activation_id',$_POST['activation_id']);
			}
		}

		function activate_plugin(){
			update_option( 'sk_firstuse', true );
			update_option( 'sk_do_activation_redirect', true );
			$data = array(
				'source' => 'plugin',
				'action' => 'track',
				'type' => 'activate'
				);
			$this->track($data);
		}

		function curl_get_data($url){
			$ch = curl_init();
			$timeout = 5;
			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
			$data = curl_exec($ch);
			curl_close($ch);
			return $data;
		}

		function redirect(){
			if (get_option('sk_do_activation_redirect', false)) {
				delete_option('sk_do_activation_redirect');
				$siteurl = get_site_url();
				wp_redirect($siteurl . "/wp-admin/options-general.php?page=sidekick");
				die();
			}
		}

		function check_ver(){

			$data = json_encode('2.2.3');

			if(array_key_exists('callback', $_GET)){

				header('Content-Type: text/javascript; charset=utf8');
				header('Access-Control-Allow-Origin: http://www.example.com/');
				header('Access-Control-Max-Age: 3628800');
				header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

				$callback = $_GET['callback'];
				echo $callback.'('.$data.');';

			}else{
				header('Content-Type: application/json; charset=utf8');

				echo $data;
			}

			die();
		}

		function admin_notice() {
			global $current_user ;

			if ( ! get_user_meta($current_user->ID, 'sk_ignore_notice') ) {
				printf ('<div class="updated"><p>Need help with WordPress? Click HELP ME in the bottom left corner to get started! <a href="%1$s">Hide</a></p></div>','?sk_ignore_notice=1');
			}
		}

		function admin_notice_ignore() {
			global $current_user;
			if ( isset($_GET['sk_ignore_notice'])) {
				add_user_meta($current_user->ID, 'sk_ignore_notice', true);
			}
		}

		function deactivate_plugin(){
			$data = array(
				'source' => 'plugin',
				'action' => 'track',
				'type' => 'deactivate',
				'user' => get_option( "activation_id" )
				);
			$this->track($data);
			?>
			<script type="text/javascript">
				window._gaq = window._gaq || [];
				window._gaq.push(['sk._setAccount', 'UA-39283622-1']);

				(function() {
					var ga_wpu = document.createElement('script'); ga_sk.type = 'text/javascript'; ga_sk.async = true;
					ga_sk.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
					var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga_wpu, s);
				})();
				window._gaq.push(['sk._trackEvent', 'Plugin - Deactivate', '', null, 0,true]);
			</script>
			<?php
			delete_option( 'sk_activated' );
		}
	}
	$sidekick = new Sidekick;
	register_activation_hook( __FILE__, array($sidekick,'activate_plugin') );
	register_deactivation_hook( __FILE__, array($sidekick,'deactivate_plugin')  );

	// if (isset($_POST['sk_setting_disabled'])) 	$sidekick->set_disabled_wts();
	// if (isset($_POST['sk_setting_autostart']))	$sidekick->set_autostart_wt();
	// if (isset($_POST['sk_api'])) 				$sidekick->set_api();
	// if (isset($_GET['sk_ver_check'])) 			$sidekick->check_ver();

	if (isset($_POST['sk_setting_disabled'])) 	 add_action('admin_init', array($sidekick,'set_disabled_wts'));
	if (isset($_POST['sk_setting_autostart']))	 add_action('admin_init', array($sidekick,'set_autostart_wt'));
	if (isset($_POST['sk_api'])) 				 add_action('admin_init', array($sidekick,'set_api'));
	if (isset($_GET['sk_ver_check'])) 			 add_action('admin_init', array($sidekick,'check_ver'));


	add_action('admin_menu', array($sidekick,'setup_menu'));
	add_action('admin_init', array($sidekick,'redirect'));
	add_action('wp_ajax_sk_activate', array($sidekick,'activate'));
	add_action('wp_ajax_sk_save', array($sidekick,'ajax_save'));
	add_action('admin_notices', array($sidekick,'admin_notice'));
	add_action('admin_init', array($sidekick,'admin_notice_ignore'));



	if (!defined('SK_PLUGIN_DEGBUG'))
		require_once('sk_init.php');

	if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information') && !defined('IFRAME_REQUEST')) {
		add_action('admin_footer', array($sidekick,'footer'));
		add_action('customize_controls_print_footer_scripts', array($sidekick,'footer'));
	}
}



// Multisite Licensing

if (defined('MULTISITE')) {
	require_once('libs/licensing.php');
	$sidekickMassActivator = new sidekickMassActivator;
	add_action('wpmu_new_blog',array($sidekickMassActivator,'activate'),10,6);
	add_action('network_admin_menu', array($sidekickMassActivator,'setup_menu'));
	add_action('wp_ajax_sk_activate_single', array($sidekickMassActivator,'activate_single'));
}

