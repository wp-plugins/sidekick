<?php

/*
Plugin Name: Sidekick
Plugin URL: http://wordpress.org/plugins/sidekick/
Description: Adds a real-time WordPress training walkthroughs right in your Dashboard
Requires at least: 4.0
Tested up to: 4.1.1
Version: 2.5.0
Author: Sidekick.pro
Author URI: http://www.sidekick.pro
*/


if ( ! defined( 'SK_EMBEDDED_PARTNER' ) ) 	define( 'SK_EMBEDDED_PARTNER', '' );

if ( ! function_exists('mlog')) {
	function mlog(){}
}

if (!class_exists('Sidekick')){

	class Sidekick{

		function __construct(){
			if (!defined('SK_API')) 			define('SK_API','//apiv2.sidekick.pro/');
			if (!defined('SK_CACHE_PREFIX')) 	define('SK_CACHE_PREFIX',str_replace('.', '_', '2.5.0'));
		}

		function enqueue_required(){
			wp_enqueue_script('jquery'                   , null );
			wp_enqueue_script('underscore'               , null, array('underscore'));
			wp_enqueue_script('backbone'                 , null, array('jquery','underscore'));
			wp_enqueue_script('jquery-ui-core'           , null, array('jquery') );
			wp_enqueue_script('jquery-ui-position'       , null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-ui-draggable'      , null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-ui-droppable'      , null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-effects-scale'     , null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-effects-highlight' , null, array('jquery-ui-core') );
			wp_enqueue_script('sidekick-admin'           , '//assets.sidekick.pro/plugin/tag/latest/js/sidekick_admin.js',array( 'jquery' ), null);
			wp_enqueue_script('sidekick'   		,"//loader.sidekick.pro/platforms/d9993157-d972-4c49-93be-a0c684096961.js",	array('backbone','jquery','underscore','jquery-effects-highlight'),null,true);
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

					if (isset($_POST['sk_track_data'])) {
						update_option( 'sk_track_data', true );
					} else {
						delete_option('sk_track_data');
					}

					update_option( 'sk_activated', true );
					die('<script>window.open("' . get_site_url() . '/wp-admin/options-general.php?page=sidekick","_self")</script>');
				}

			}

			$activation_id                   = (get_option( "sk_activation_id" ) ? get_option( "sk_activation_id" ) : '');
			$sk_track_data                   = get_option( 'sk_track_data' );
			
			$sk_hide_composer_taskbar_button = get_option('sk_hide_composer_taskbar_button');
			$sk_hide_config_taskbar_button   = get_option('sk_hide_config_taskbar_button');
			$sk_hide_composer_upgrade_button = get_option('sk_hide_composer_upgrade_button');
			
			$current_user                    = wp_get_current_user();
			$status                          = 'Free';
			$error                           = null;

			if (isset($SK_PAID_LIBRARY_FILE) && $activation_id) {
				$_POST['activation_id'] = $activation_id;
				$check_activation       = $this->activate(true);
				$status = 'Checking...';
			}

			$this->track(array('what' => 'Settings Page', 'where' => 'plugin'));

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

			if (isset($_POST['sk_setting_disabled'])){

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

		}

		function set_autostart_wt(){

			if (isset($_POST['sk_setting_autostart'])){

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

		}

		function set_configure_other(){

			if (isset($_POST['sk_setting_other'])){

				if (!check_admin_referer('update_sk_settings')) {
					print 'Sorry, your nonce did not verify or you\'re not logged in.';
					exit;
				}

				$checkboxes = array('sk_hide_composer_taskbar_button','sk_hide_config_taskbar_button','sk_hide_composer_upgrade_button');

				foreach ($checkboxes as $key => $checkbox) {
					if (isset($_POST[$checkbox])){
						if (is_network_admin()) {
							update_site_option($checkbox,wp_filter_kses($_POST[$checkbox]));
						}
						update_option($checkbox,wp_filter_kses($_POST[$checkbox]));
					} else {
						delete_option($checkbox);
						if (is_network_admin()) {
							delete_site_option($checkbox);
						}
					}
				}

			}

		}

		function footer(){
			global $current_user;

			delete_option( 'sk_just_activated' );

			require_once('libs/sk_config_data.php');

			$sk_config_data                   = new sk_config_data;

			$current_user                     = (get_option( 'sk_track_data' )) ? wp_get_current_user() : null;

			$autostart_network_walkthrough_id = (get_site_option('sk_autostart_walkthrough_id') ? get_site_option('sk_autostart_walkthrough_id') : null );
			$autostart_walkthrough_id         = (get_option('sk_autostart_walkthrough_id') ? get_option('sk_autostart_walkthrough_id') : $autostart_network_walkthrough_id );
			$theme                            = wp_get_theme();

			$installed_plugins                = $sk_config_data->get_plugins();
			$file_editor_enabled              = $sk_config_data->get_file_editor_enabled();

			$sk_config = array(
				"compatibilities" => array(
					"theme_version"     => $theme->Version,
					"installed_theme"   => sanitize_title($theme->Name),
					"main_soft_version" => get_bloginfo("version"),
					"is_multisite"      => (is_multisite()) ? true : false,
					"comment_count"     => $sk_config_data->get_comments(),
					"role"              => $sk_config_data->get_user_role(),
					"number_of_themes"  => $sk_config_data->get_themes(),
					"show_on_front"     => get_option('show_on_front'),
					"page_on_front"     => intval(get_option('page_on_front')),
					"page_for_posts"    => intval(get_option('page_for_posts')),
					"plugin_count"      => (isset($installed_plugins) && is_array($installed_plugins)) ? count($installed_plugins) : 0,
					"installed_plugins" => (isset($installed_plugins)) ? $installed_plugins : array()
					),

				// Platform
				"baseClientUrl" 		  		=> site_url(),
				"base_url"						=> site_url(),

				// User Settings
				"activation_id"            		=> (get_option( "sk_activation_id" ) ? get_option( "sk_activation_id" ) : ''),
				"custom_class" 					=> (get_option( "sk_custom_class" ) ? get_option( "sk_custom_class" ) : ''),
				"distributor_id" 				=> (get_option( "sk_distributor_id" ) ? intval(get_option( "sk_distributor_id" )) : ''),
				"user_email"               		=> ($current_user) ? $current_user->user_email : '',
				"autostart_walkthrough_id" 		=> ($autostart_walkthrough_id) ? $autostart_walkthrough_id : '',
				"disable_wts"              		=> (!is_network_admin()) ? $sk_config_data->get_disabled_wts() : array(), // Copying these to compatibilities, have to update this over time 
				"disable_network_wts"      		=> $sk_config_data->get_disabled_network_wts(), // Copying these to compatibilities, have to update this over time 

				// Toggles
				"hide_taskbar_composer_button" 	=> (get_option( 'sk_hide_composer_taskbar_button' ) ? true : false), // hide composer button on the taskbar
				"hide_taskbar_config_button"   	=> (get_option( 'sk_hide_config_taskbar_button' ) ? true : false), // hide settings button on taskbar						
				"show_login"                   	=> (get_option( 'sk_just_activated' )) ? true : false, // open drawer automatically, same as just_activated

				// WordPress
				"embedded"      				=> false,
				"embedPartner"  				=> SK_EMBEDDED_PARTNER, // for tracking purposes if sidekick has been embeded in another WordPress plugin or theme
				"plugin_version"				=> '2.5.0', // WordPress plugin version
				"site_url"      				=> $sk_config_data->get_domain(),
				"domain"        				=> str_replace("http://","",$_SERVER["SERVER_NAME"]),
				"plugin_url"    				=> admin_url("admin.php?page=sidekick"),

				);

			if ($file_editor_enabled) { //
				$sk_config["compatibilities"]["file_editor_enabled"] = $file_editor_enabled;
			}

			$sk_config['compatibilities'] = array_merge($sk_config['compatibilities'],$sk_config_data->get_post_types());
			$sk_config['compatibilities'] = array_merge($sk_config['compatibilities'],$sk_config_data->get_taxonomies());
			$sk_config['compatibilities'] = array_merge($sk_config['compatibilities'],$sk_config_data->get_user_data());
			$sk_config['compatibilities'] = array_merge($sk_config['compatibilities'],$sk_config_data->get_post_statuses());
			$sk_config['compatibilities'] = array_merge($sk_config['compatibilities'],$sk_config_data->get_post_types_and_statuses());
			$sk_config['compatibilities'] = array_merge($sk_config['compatibilities'],$sk_config_data->get_framework());

			$sk_config = apply_filters('sk_config',$sk_config);

			?>

			<!-- Old IE Not Supported -->
			<?php if (!preg_match('/(?i)msie [6-8]/',$_SERVER['HTTP_USER_AGENT'])): ?>

				<script type="text/preloaded" data-provider="sidekick">
					<?php echo json_encode($sk_config) ?>
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
			mlog('$response',$response);
		}

		function activate($return = false){
			if (isset($_POST['activation_id']) && current_user_can('install_plugins')) {
				update_option('sk_activation_id',$_POST['activation_id']);
			}
		}

		function activate_plugin(){
			update_option( 'sk_firstuse', true );
			update_option( 'sk_do_activation_redirect', true );
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

			if (isset($_GET['sk_ver_check'])){
				$data = json_encode('2.5.0');

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

		// Clear transients for cached sk_config_data

		function delete_sk_get_comments(){
			mlog("delete_sk_get_comments");
			delete_transient('sk_' . SK_CACHE_PREFIX . '_get_comments');
		}

		function delete_sk_get_post_types(){
			mlog('delete sk_get_post_types');
			delete_transient('sk_' . SK_CACHE_PREFIX . '_get_post_types');
			delete_transient('sk_' . SK_CACHE_PREFIX . '_post_statuses');
		}

		function delete_sk_get_user_data(){
			mlog('delete sk_get_user_data');
			delete_transient('sk_' . SK_CACHE_PREFIX . '_get_user_data');
		}

		function delete_sk_get_plugins(){
			mlog('delete sk_get_plugins');
			delete_transient('sk_' . SK_CACHE_PREFIX . '_get_plugins');
		}

	}

	$sidekick = new Sidekick;
	register_activation_hook( __FILE__, array($sidekick,'activate_plugin') );

	add_action('admin_init', array($sidekick,'set_disabled_wts'));
	add_action('admin_init', array($sidekick,'set_autostart_wt'));
	add_action('admin_init', array($sidekick,'set_configure_other'));
	add_action('admin_init', array($sidekick,'check_ver'));
	add_action('admin_init', array($sidekick,'redirect'));
	add_action('admin_init', array($sidekick,'admin_notice_ignore'));
	add_action('admin_menu', array($sidekick,'setup_menu'));
	add_action('wp_ajax_sk_activate', array($sidekick,'activate'));
	add_action('wp_ajax_sk_save', array($sidekick,'ajax_save'));
	add_action('admin_notices', array($sidekick,'admin_notice'));

	if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information')) {
		add_action('admin_footer',                            array($sidekick,'footer'));
		add_action('customize_controls_print_footer_scripts', array($sidekick,'footer'));
		add_action('admin_enqueue_scripts',                   array($sidekick,'enqueue_required'));
		add_action('customize_controls_enqueue_scripts',      array($sidekick,'enqueue_required'),1000);
	}

	// Reset Transient Cache

	add_action('wp_update_comment_count',array($sidekick,'delete_sk_get_comments'));

	add_action('set_user_role',array($sidekick,'delete_sk_get_user_data'));
	add_action('edit_user_profile',array($sidekick,'delete_sk_get_user_data'));

	add_action('activated_plugin',array($sidekick,'delete_sk_get_plugins'));
	add_action('deactivated_plugin',array($sidekick,'delete_sk_get_plugins'));

	// Multisite Licensing

	if (is_multisite()) {
		require_once('libs/licensing.php');
		$sidekickMassActivator = new sidekickMassActivator;

		add_action('network_admin_menu', array($sidekickMassActivator,'setup_menu'));
		add_action('wp_ajax_sk_activate_single', array($sidekickMassActivator,'activate_single'));
		add_action('wp_ajax_sk_activate_batch', array($sidekickMassActivator,'activate_batch'));
		add_action('wp_ajax_sk_load_sites_by_status', array($sidekickMassActivator,'load_sites_by_status'));

		$sk_auto_activations = get_option( 'sk_auto_activations');
		if ($sk_auto_activations) {
			add_action('wpmu_new_blog',array($sidekickMassActivator,'activate'),10,6);
			add_action('sk_hourly_event',array($sidekickMassActivator,'schedule'),10,6);
		}
	}
}

