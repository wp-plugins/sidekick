<?php

/*
Plugin Name: Sidekick
Plugin URL: http://wordpress.org/plugins/sidekick/
Description: Adds a real-time WordPress training walkthroughs right in your Dashboard
Requires at least: 3.3
Tested up to: 4.1
Version: 2.0.1
Author: Sidekick.pro
Author URI: http://www.sidekick.pro
*/

define('SK_LIBRARY_VERSION',6);
define('PLAYER_PATH','tag/latest');
define('COMPOSER_PATH','tag/latest');
define('DEFAULT_ACTIVATION_ID','');

if ( ! defined( 'SK_SL_PLUGIN_DIR' ) ) define( 'SK_SL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
if ( ! defined( 'SK_SL_PLUGIN_URL' ) ) define( 'SK_SL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
if ( ! defined( 'SK_SL_PLUGIN_FILE' ) ) define( 'SK_SL_PLUGIN_FILE', __FILE__ );
if ( ! function_exists('mlog')) {
	function mlog(){}
}

class Sidekick{

	function __construct(){
		global $SK_FREE_LIBRARY_FILE, $SK_PAID_LIBRARY_FILE;

		if (!defined('SK_TRACKING_API')) define('SK_TRACKING_API','//tracking.sidekick.pro/');
		if (!defined('SK_COMPOSER_API')) define('SK_COMPOSER_API','//apiv2.sidekick.pro');
		if (!defined('SK_API')) define('SK_API','//apiv2.sidekick.pro/');
		if (!defined('SK_LIBRARY')) define('SK_LIBRARY','//librarycache.sidekick.pro/');
		if (!defined('SK_ASSETS')) define('SK_ASSETS','//assets.sidekick.pro/');
		if (!defined('SK_AUDIO')) define('SK_AUDIO','//audio.sidekick.pro/');

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
	}

	function is_https() {
		if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443 || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https')) {
			return true;
		} else {
			return false;
		}
	}

	function enqueue(){
		global $SK_FREE_LIBRARY_FILE, $SK_PAID_LIBRARY_FILE;
		wp_enqueue_script('sidekick'   		,"//player.sidekick.pro/" . PLAYER_PATH . "/sidekick.min.js",	array('backbone','jquery','underscore','jquery-effects-highlight'),null);
		wp_enqueue_style('wp-pointer');
		wp_enqueue_script('wp-pointer');
	}

	function setup_menu(){
		add_submenu_page( 'options-general.php', 'Sidekick', 'Sidekick', 'activate_plugins','sidekick', array(&$this,'admin_page'));
	}

	function ajax_save(){
		if (isset($_POST['sk_composer_button']) && $_POST['sk_composer_button'] == "true") {
			update_option( 'sk_composer_button', true );
		} elseif (isset($_POST['sk_composer_button']) && $_POST['sk_composer_button'] == "false") {
			delete_option('sk_composer_button');
		}
	}

	function admin_page(){
		global $SK_PAID_LIBRARY_FILE, $SK_FREE_LIBRARY_FILE ;

		if ( empty( $_POST ) || check_admin_referer( 'update_sk_settings' ) ) {

			if (isset($_POST['option_page']) && $_POST['option_page'] == 'sk_license') {

				if (isset($_POST['activation_id']) && $_POST['activation_id']){
					$result = $this->activate(true);
				} else {
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

			if (isset($_POST['sk_api'])) {
				update_option( 'sk_api', $_POST['sk_api'] );
			} else {
				delete_option('sk_api');
			}

			if (isset($_POST['sk_autostart_walkthrough_id'])){
				update_option('sk_autostart_walkthrough_id',$_POST['sk_autostart_walkthrough_id']);
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
			$warn = "You're using the <b>free</b> version of Sidekick, to upgrade or get your license key, visit your <a target='_blank' href='http://www.sidekick.pro/plans/#/login?utm_source=plugin&utm_medium=settings&utm_campaign=upgrade_nag'>sign-up</a> or <a target='_blank' href='http://www.sidekick.pro/plans/?utm_source=plugin&utm_medium=settings&utm_campaign=upgrade_nag'>sign-up</a> for a paid plan.";
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
		update_option('sk_disabled_wts',json_encode($_POST['disable_wts']));
	}

	function footer(){
		global $current_user, $SK_FREE_LIBRARY_FILE, $SK_PAID_LIBRARY_FILE;

		require_once('libs/sk_config_data.php');

		$plugin_data              = get_plugin_data(plugin_dir_path( dirname( __FILE__ ) ) . 'sidekick/sidekick.php');
		$sk_config_data           = new sk_config_data;
		$current_user             = wp_get_current_user();
		$sk_just_activated        = get_option( 'sk_just_activated' );
		$sk_track_data            = get_option( 'sk_track_data' );
		$sk_composer_button       = get_option( 'sk_composer_button' );
		$activation_id            = (get_option( "sk_activation_id" ) ? get_option( "sk_activation_id" ) : DEFAULT_ACTIVATION_ID);
		$autostart_walkthrough_id = (get_option('sk_autostart_walkthrough_id') ? get_option('sk_autostart_walkthrough_id') : 'null' );
		$theme                    = wp_get_theme();
		$not_supported_ie         = false;
		$user_email               = '';
		if ($sk_track_data) {
			$user_email = $current_user->user_email;
		}

		$user_role               = $sk_config_data->get_user_role();
		$site_url                = $sk_config_data->get_domain();
		$plugin_data             = $sk_config_data->get_plugins();
		$disabled_wts            = $sk_config_data->get_disabled_wts();
		$current_url             = $sk_config_data->get_current_url();
		$post_types              = $sk_config_data->get_post_types();
		$taxonomies              = $sk_config_data->get_taxonomies();
		$user_data               = $sk_config_data->get_user_data();
		$comments                = $sk_config_data->get_comments();
		$post_statuses           = $sk_config_data->get_post_statuses();
		$post_types_and_statuses = $sk_config_data->get_post_types_and_statuses();
		$number_of_themes        = $sk_config_data->get_themes();

		$installed_plugins       = $plugin_data['plugins'];
		$plugin_count            = $plugin_data['count'];

		// $sk_composer_button = true; // BETA

		delete_option( 'sk_just_activated' );
		if(preg_match('/(?i)msie [6-8]/',$_SERVER['HTTP_USER_AGENT'])) $not_supported_ie = true;

		?>

		<?php if (!$not_supported_ie): ?>

			<script type="text/javascript">

				var sk_config = {
					// Compatibility

					compatibilities: {
						<?php                     	echo $post_types ?>
						<?php                     	echo $taxonomies ?>
						<?php                     	echo $user_data ?>
						<?php                     	echo $comments ?>
						<?php                     	echo $post_statuses ?>
						<?php                     	echo $post_types_and_statuses ?>
						installed_plugins:        	<?php echo $installed_plugins ?>,
						plugin_count: 				<?php echo $plugin_count ?>,
						is_multisite:             	<?php echo (is_multisite()) ? "true" : "false" ?>,
						number_of_themes:         	<?php echo $number_of_themes ?>,
						installed_theme:          	'<?php echo $theme->Name ?>',
						main_soft_version:        	'<?php echo get_bloginfo("version") ?>',
						theme_version:            	'<?php echo $theme->Version ?>',
						user_level:               	'<?php echo $user_role ?>',
						main_soft_name: 'WordPress',
						role:               		'<?php echo $user_role ?>'
					},

					<?php                     	echo $post_types ?>
					<?php                     	echo $taxonomies ?>
					<?php                     	echo $user_data ?>
					<?php                     	echo $comments ?>
					<?php                     	echo $post_statuses ?>
					<?php                     	echo $post_types_and_statuses ?>
					installed_plugins:        	<?php echo $installed_plugins ?>,
					is_multisite:             	<?php echo (is_multisite()) ? "true" : "false" ?>,
					number_of_themes:         	<?php echo $number_of_themes ?>,
					installed_theme:          	'<?php echo $theme->Name ?>',
					main_soft_version:        	'<?php echo get_bloginfo("version") ?>',
					theme_version:            	'<?php echo $theme->Version ?>',
					user_level:               	'<?php echo $user_role ?>',
					role:               		'<?php echo $user_role ?>',

					disable_wts:              	<?php echo $disabled_wts ?>,
					main_soft_name:           	'WordPress',

					// User Settings
					activation_id:                  '<?php echo $activation_id ?>',
					auto_open_root_bucket_id:       79,
					auto_open_product:              'default',
					disable_wts_in_root_bucket_ids: [5],

					autostart_walkthrough_id: 	<?php echo $autostart_walkthrough_id ?>,
					sk_composer_button:       	<?php echo ($sk_composer_button ? "true" : "false") ?>,
					track_data:               	'<?php echo $sk_track_data ?>',
					user_email:               	'<?php echo $user_email ?>',

					// Toggles
					path_not_found_continue: true,
					show_powered_by:         true,
					show_powered_by_link:    true,
					sk_autostart_only_once:  true,
					use_native_controls:     false,
					composer_upgrade_off:    false,
					basics_upgrade:          true,

					// Platform Info
					library_version: 			2,

					// Generic Info
					just_activated:           	<?php echo ($sk_just_activated) ? "true" : "false" ?>,
					platform_version:         	null,
					plugin_version:           	'2.0.1',
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
					domain_used:              '//player.sidekick.pro/',
					plugin_url:               '<?php echo admin_url("admin.php?page=sidekick") ?>',
					base_url:                 '<?php echo site_url() ?>',
					current_url:              '<?php echo $current_url ?>',
					// library_free_file:     '<?php echo (isset($SK_FREE_LIBRARY_FILE) ? $SK_FREE_LIBRARY_FILE : '') ?>',
					// library_paid_file:     '<?php echo (isset($SK_PAID_LIBRARY_FILE) ? $SK_PAID_LIBRARY_FILE : '') ?>',
					//,
					// fallback_notfication_mp3: '//assets.sidekick.pro/fallback.mp3'
				}

				var skc_config = {
					js:                  '//composer.sidekick.pro/<?php echo COMPOSER_PATH ?>/sidekick-composer.js',
					css:                 '//composer.sidekick.pro/<?php echo COMPOSER_PATH ?>/sidekick-composer.css',
					apiUrl:              '<?php echo SK_COMPOSER_API ?>',
					baseSiteUrl:         sk_config.base_url,
					compatibilities:     sk_config.compatibilities,
					audioBaseUrl:        '<?php echo SK_AUDIO ?>',
					audioPlaceholderUrl: '//assets.sidekick.pro/walkthrough-audio-placeholder.mp3',
					siteAjaxUrl:         window.ajaxurl || '',
					trackingUrl:         '//tracking.sidekick.pro/'
				}

			</script>
		<?php endif ?>



		<?php
	}

	function track($data){
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
		if (isset($_POST['activation_id'])) {
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
			window._gaq.push(['sk._trackEvent', 'Plugin - Deactivate', '', <?php echo plugin_version ?>, 0,true]);
		</script>
		<?php
		delete_option( 'sk_activated' );
	}
}

$sidekick = new Sidekick;
register_activation_hook( __FILE__, array($sidekick,'activate_plugin') );
register_deactivation_hook( __FILE__, array($sidekick,'deactivate_plugin')  );

add_action('admin_menu', array($sidekick,'setup_menu'));
add_action('admin_init', array($sidekick,'redirect'));
add_action('wp_ajax_sk_activate', array($sidekick,'activate'));
add_action('wp_ajax_sk_save', array($sidekick,'ajax_save'));
add_action('admin_notices', array($sidekick,'admin_notice'));
add_action('admin_init', array($sidekick,'admin_notice_ignore'));

if (isset($_POST['setting_disabled'])) {
	$sidekick->set_disabled_wts();
}

if (!defined('SK_PLUGIN_DEGBUG'))
	require_once('sk_init.php');

if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information') && !defined('IFRAME_REQUEST')) {
	add_action('admin_footer', array($sidekick,'footer'));
	add_action('customize_controls_print_footer_scripts', array($sidekick,'footer'));
}

