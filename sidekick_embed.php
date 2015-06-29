<?php

/*
SIDEKICK Embed Plugin
Plugin URL: http://wordpress.org/plugins/sidekick/
Description: Adds a real-time WordPress training walkthroughs right in your Dashboard. 
 This SIDEKICK embed file will enable SIDEKICK as part of your plugin or theme. This is strictly a configuration plugin for the SIDEKICK platform, the actual platform is requested directly from our servers. 
 We recommend not activating SIDEKICK automatically for people but via an Opt-In process when they configure your own theme or plugin.
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

$sidekick_active = null;
if (!function_exists('is_plugin_active')) {	include_once( ABSPATH . 'wp-admin/includes/plugin.php' );} 
if (function_exists('is_plugin_active')) {	$sidekick_active = is_plugin_active('sidekick/sidekick.php');}
if (!$sidekick_active && !class_exists('Sidekick')){

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
				
<script type="text/javascript">
	if (typeof ajax_url === 'undefined') {
		ajax_url = '<?php echo admin_url() ?>admin-ajax.php';
	}
	var last_site_key = null;
	var sk_ms_admin   = false;

</script>

<div class="page-header"><h2><a id="pluginlogo_32" class="header-icon32" href="http://www.sidekick.pro/modules/wordpress-core-module-premium/?utm_source=plugin&utm_medium=settings&utm_campaign=header" target="_blank"></a>Sidekick Dashboard</h2></div>

<h3>Welcome to the fastest and easiest way to learn WordPress</h3>

<?php if (isset($error_message) && $error_message): ?>
	<div class="error" id="sk_dashboard_message">
		<p>There was a problem activating your license. The following error occured <?php echo $error_message ?></p>
	</div>
<?php elseif (isset($error) && $error): ?>
	<div class="error" id="sk_dashboard_message">
		<p><?php echo $error ?></p>
	</div>
<?php elseif (isset($warn) && $warn): ?>
	<div class="updated" id="sk_dashboard_message">
		<p><?php echo $warn ?></p>
	</div>
<?php elseif (isset($success) && $success): ?>
	<div class="updated" id="sk_dashboard_message">
		<p><?php echo $success ?></p>
	</div>
<?php endif ?>

<div class="sidekick_admin">

	<div class="sk_box left">
		<div class="wrapper_left">
			<div class="sk_box license">
				<div class="well">
					<?php if (!$error): ?>
						<h3>My Sidekick Account</h3>
						<form method="post">
							<?php settings_fields('sk_license'); ?>
							<table class="form-table">
								<tbody>
									<tr valign="top">
										<th scope="row" valign="top">Activation ID</th>
										<?php if (is_multisite()): ?>
											<?php if (isset($activation_id) && $activation_id): ?>
												<td><input class='regular-text' style='color: gray;' type='text' name='activation_id' value='xxxxxxxx-xxxx-xxxx-xxxx-<?php echo substr($activation_id, 25,20) ?>'></input></td>
											<?php else: ?>
												<td><input class='regular-text' style='color: gray;' type='text' name='activation_id' ></input></td>
											<?php endif ?>
										<?php else: ?>
											<td><input class='regular-text' type='text' name='activation_id' value='<?php echo $activation_id ?>'></input></td>
										<?php endif ?>
									</tr>

									<tr valign="top">
										<th scope="row" valign="top">Status</th>
										<td><span style='color: blue' class='sk_license_status'><span><?php echo ucfirst($status) ?></span>  <a style='display: none' class='sk_upgrade' href='http://www.sidekick.pro/modules/wordpress-core-module-premium/?utm_source=plugin&utm_medium=settings&utm_campaign=upgrade' target="_blank"> Upgrade Now!</a> </span></td>
									</tr>

									<tr valign="top">
										<th scope="row" valign="top">
											Data Tracking
										</th>
										<td>
											<input name="sk_track_data" type="checkbox" <?php if ($sk_track_data): ?>CHECKED<?php endif ?> />
											<input type='hidden' name='status' value='<?php echo $status ?>'/>
											<label class="description" for="track_data">Help Sidekick by providing tracking data which will help us build better help tools.</label>
										</td>
									</tr>

									<tr valign="top">
										<th scope="row" valign="top">
											Enable Composer Mode
										</th>
										<td>
											<button type='button' class='open_composer'>Open Composer</button>
										</td>
									</tr>
								</tbody>
							</table>
							<?php submit_button('Update'); ?>
							<?php wp_nonce_field( 'update_sk_settings' ); ?>
						</form>
					<?php endif ?>
				</div>
			</div>

			<div class="sk_box composer" style='display: none'>
				<div class="well">
					<h3>Build Your Own Walkthroughs</h3>
					<a href='http://www.sidekick.pro/plans/create_wp_walkthroughs/?utm_source=plugin&utm_medium=settings&utm_campaign=composer' target='_blank'><div class='composer_beta_button'>Build Your Own<br/>Walkthroughs</div></a>
					<ul>
						<li>Get more info about <a href='http://www.sidekick.pro/how-it-works/?utm_source=plugin&utm_medium=settings&utm_campaign=composer' target='_blank'>Custom Walkthroughs</a> now!</li>
						<li><a href="http://www.sidekick.pro/plans/create_wp_walkthroughs/?utm_source=plugin&utm_medium=settings&utm_campaign=composer" target="_blank">Check out our custom walkthroughs plans</a></li>
					</ul>
				</div>
			</div>

			<div class="sk_box you_should_know">
				<div class="well">
					<h3>Few Things you should know:</h3>
					<div class="">
						<ul>
							<li>Clicking the check-box above will allow us to link your email address to the stats we collect so we can contact you if we have a question or notice an issue. It’s not mandatory, but it would help us out.</li>
							<li>Your Activation ID is unique and limited to your production, staging, and development urls.</li>
							<li>The Sidekick team adheres strictly to CANSPAM. From time to time we may send critical updates (such as security notices) to the email address setup as the Administrator on this site.</li>
							<li>If you have any questions, bug reports or feedback, please send them to <a target="_blank" href="mailto:support@sidekick.pro">us</a> </li>
							<li>You can find our terms of use <a target="_blank" href="http://www.sidekick.pro/terms-of-use/">here</a></li>
						</ul>
					</div>
				</div>
			</div>

			<div class="sk_box advanced">
				<div class="well">
					<h3>Advanced</h3>
					<form method="post">
						<table class="form-table">
							<tbody>
								<tr valign="top">
									<th scope="row" valign="top">API</th>
									<td>
										<select name='sk_api'>
											<?php if (get_option('sk_api') == 'production'): ?>
												<option value='production' SELECTED>Production</option>
												<option value='staging'>Staging</option>
											<?php else: ?>
												<option value='production' >Production</option>
												<option value='staging' SELECTED>Staging</option>
											<?php endif ?>
										</select>
									</td>
								</tr>
							</tbody>
						</table>

						<?php wp_nonce_field( 'update_sk_settings' ); ?>
						<input class='button button-primary' type='submit' value='Save'/>
					</form>

				</div>
			</div>

		</div>
	</div>

	<div class="sk_box right">
		<div class="wrapper_right">

			<div class="sk_box configure">
	<div class="well">
		<h3>Configure - Auto Start</h3>

		<form method='post'>

			<p>This Walkthrough will be played once for every user that logs into the backend of WordPress.</p>
			<select name='sk_autostart_walkthrough_id'>
				<option value='0'>No Auto Start</option>
			</select>
			<input class='button button-primary' type='submit' value='Save'/>
			<input type='hidden' name='is_ms_admin' value=' echo (isset($is_ms_admin)) ? $is_ms_admin : false ?>'/>
			<input type='hidden' name='sk_setting_autostart' value='true'/>

			<?php wp_nonce_field( 'update_sk_settings' ); ?>
		</form>
	</div>
</div>

<div class="sk_box configure">
	<div class="well">
		<h3>Configure - Other</h3>

		<form method="post">
			<?php settings_fields('sk_license'); ?>
			<table class="form-table long_label">
				<tbody>

					<tr valign="top">
						<th scope="row" valign="top">Hide Composer Button in Taskbar</th>
						<td>
							<input class='checkbox' type='checkbox' name='sk_hide_composer_taskbar_button' <?php echo (isset($sk_hide_composer_taskbar_button) && $sk_hide_composer_taskbar_button) ? 'CHECKED' : '' ?>>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" valign="top">Hide Config Button in Taskbar</th>
						<td>
							<input class='checkbox' type='checkbox' name='sk_hide_config_taskbar_button' <?php echo (isset($sk_hide_config_taskbar_button) && $sk_hide_config_taskbar_button) ? 'CHECKED' : '' ?>>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" valign="top">Hide Composer Upgrade Button in Drawer</th>
						<td>
							<input class='checkbox' type='checkbox' name='sk_hide_composer_upgrade_button' <?php echo (isset($sk_hide_composer_upgrade_button) && $sk_hide_composer_upgrade_button) ? 'CHECKED' : '' ?>>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" valign="top"></th>
						<td>
							<input class='button button-primary' type='submit' value='Save'/>
						</td>
					</tr>

					<input type='hidden' name='is_ms_admin' value='<?php echo (isset($is_ms_admin)) ? $is_ms_admin : false ?>'/>
					<input type='hidden' name='sk_setting_other' value='true'/>

					<?php wp_nonce_field( 'update_sk_settings' ); ?>

				</tbody>
			</table>
		</form>
	</div>
</div>

<div class="sk_box configure">
	<div class="well">
		<form method='post'>

			<input class='top-right button button-primary alignright' type='submit' value='Save'/>
			<h3>Configure - Turn Off Walkthroughs</h3>

			<p>Below you can turn off specific Walkthroughs for this website.</p>
			<p>Please note, incompatible multisite walkthroughs will be disabled automatically on individual sites already. Here you're being show the raw unfiltered list of all available walkthroughs.</p>
			<div class='sk_walkthrough_list wrapper_wts'>
				Loading...
			</div>
			<input class='button button-primary' type='submit' value='Save'/>
			<input type='hidden' name='sk_setting_disabled' value='true'/>
			<input type='hidden' name='is_ms_admin' value='<?php echo (isset($is_ms_admin)) ? $is_ms_admin : false ?>'/>
			<?php wp_nonce_field( 'update_sk_settings' ); ?>
		</form>
	</div>
</div>

			<div class="sk_box love">
				<div class="well">
					<h3>Love the Sidekick plugin?</h3>
					<ul>
						<li>Please help spread the word!</li>
						<li><a href="https://twitter.com/share" class="twitter-share-button" data-url="http://sidekick.pro" data-text="I use @sidekickhelps for the fastest and easiest way to learn WordPress." data-via="sidekickhelps" data-size="large">Tweet</a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script></li>
						<li>Like SIDEKICK? Please leave us a 5 star rating on <a href='http://WordPress.org' target='_blank'>WordPress.org</a></li>
						<li><a href="http://www.sidekick.pro/plans/wordpress-basics/">Sign up for a full WordPress Basics package</a></li>
						<li><a href="http://support.sidekick.pro/collection/50-quick-start-guides" target="_blank"><strong>Visit the SIDEKICK Quick Start guides</strong></a>.</li>
					</ul>
				</div>
			</div>
		</div>
	</div>





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
		

// licensing.php

if (!$sidekick_active && !class_exists('sidekickMassActivator')) {

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

                $this->track('Mass Activate', array('domain' => $domain, 'email' => $email));

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

                $this->track('Mass Activate Error', array('domain' => $domain, 'message' => $result->message, 'email' => $email));
                update_option('sk_auto_activation_error', $result->message);
                    // wp_mail( 'support@sidekick.pro', 'Failed Mass Domain Add', json_encode($result));
                wp_mail('bart@sidekick.pro', 'Failed Mass Domain Add', json_encode($result));
            }

            return $result;

        }

        function setup_super_admin_key($domainKey) {
                // Use the super admin's site activation key if not set using last activation key
            if (!get_option('sk_activation_id')) {
                update_option('sk_activation_id', $domainKey);
            }
        }

        function track($event, $data) {
            if (file_exists(realpath(dirname(__FILE__)) . '/mixpanel/Mixpanel.php')) {
                require_once(realpath(dirname(__FILE__)) . '/mixpanel/Mixpanel.php');
                $mp     = Mixpanel::getInstance("965556434c5ae652a44f24b85b442263");
                $domain = str_replace("http://", "", $_SERVER["SERVER_NAME"]);

                $mp->track($event, $data);
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

            if (strpos($_SERVER['SERVER_PROTOCOL'], 'https') === false) {
                $protocol = 'http:';
            } else {
                $protocol = 'https:';
            }

            $url      = $protocol . SK_API . $end_point;
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

            $this->track(array('what' => 'Network Settings Page', 'where' => 'plugin'));

            ?>
?> <!-- ms_admin_page.php -->

<script type="text/javascript">
	if (typeof ajax_url === 'undefined') {
		ajax_url = '<?php echo admin_url() ?>admin-ajax.php';
	}
	var last_site_key = null;
	var sk_ms_admin   = true;

</script>

<div class="page-header"><h2><a id="pluginlogo_32" class="header-icon32" href="http://www.sidekick.pro" target="_blank"></a>Sidekick Licensing</h2></div>

<h3>Welcome to the fastest and easiest way to learn WordPress</h3>

<?php if (isset($error_message) && $error_message): ?>
	<div class="error" id="sk_dashboard_message">
		<p>There was a problem activating your license. The following error occured <?php echo $error_message ?></p>
	</div>
<?php elseif (isset($error) && $error): ?>
	<div class="error" id="sk_dashboard_message">
		<p><?php echo $error ?></p>
	</div>
<?php elseif (isset($sk_auto_activation_error) && $sk_auto_activation_error): ?>
	<div class="error" id="sk_dashboard_message">
		<p><?php echo $sk_auto_activation_error ?></p>
	</div>
<?php elseif (isset($login_status['error']) && $login_status['error']): ?>
	<div class="error" id="sk_dashboard_message">
		<p><?php echo $login_status['error'] ?></p>
	</div>
<?php elseif (isset($warn) && $warn): ?>
	<div class="updated" id="sk_dashboard_message">
		<p><?php echo $warn ?></p>
	</div>
<?php elseif (isset($success) && $success): ?>
	<div class="updated" id="sk_dashboard_message">
		<p><?php echo $success ?></p>
	</div>
<?php elseif (isset($login_status['success']) && $login_status['success']): ?>
	<div class="updated" id="sk_dashboard_message">
		<p>Successful Login!</p>
	</div>
<?php endif ?>

<div class="sidekick_admin">

	<div class="sk_box left">
		<div class="wrapper_left">
			<div class="sk_box license">
				<div class="well">
					<h3>Activate Sidekick Account</h3>
					<p>Please keep this information <b>private</b>.</p>
					<p>Once active every site create on this multisite installation will have Sidekick automatically activted.</p>
					<p><b>Important - </b>Only WordPress basics and Enterprise plans are currently supported. <b>Custom Walkthrough</b> plans will be supported in the near future.</p>

					<form method="post">
						<?php settings_fields('sk_license'); ?>
						<table class="form-table">
							<tbody>
								<tr valign="top">
									<th scope="row" valign="top">Account (E-mail)</th>
									<td>
										<input id='<?php echo time() ?>' class='regular-text' type='text' name='sk_account' placeholder='<?php echo get_option('sk_account') ?>'></input>
									</td>
								</tr>
								<tr valign="top">
									<th scope="row" valign="top">Password</th>
									<td>
										<input class='regular-text' type='password' name='sk_password' placeholder='********'></input>
									</td>
								</tr>

								<tr valign="top" class='walkthrough_library'>
									<th scope="row" valign="top">Library to Distribute</th>
									<td>
										<select name='sk_selected_library'>
											<?php if (isset($sk_subs['libraries']) && count($sk_subs['libraries']) > 0): ?>
												<?php foreach ($sk_subs['libraries'] as $key => $library): ?>
													<option <?php echo ($sk_selected_library == $library->id) ? 'SELECTED' : '' ?> value='<?php echo $library->id ?>'><?php echo $library->name ?></option>
												<?php endforeach ?>
											<?php endif ?>
											<option <?php echo ($sk_selected_library == -1) ? 'SELECTED' : '' ?> value='-1'>WordPress Basics Only</option>
										</select>
									</td>
								</tr>


								<tr valign="top">
									<th scope="row" valign="top">Enable Auto-Activations</th>
									<td>
										<input class='checkbox' type='checkbox' name='sk_auto_activations' <?php echo ($sk_auto_activations) ? 'CHECKED' : '' ?>>
									</td>
								</tr>

								<?php if (isset($selected_sub) && !isset($no_product)): ?>
									<tr>
										<th scope="row" valign="top">Active Domains</th>
										<td><?php echo $selected_sub->activeDomainCount ?>/ <?php echo ($selected_sub->CurrentTier->numberOfDomains == -1) ? 'Unlimited' : $selected_sub->CurrentTier->numberOfDomains ?> (<a href='https://www.sidekick.pro/profile/#/overview' target='_blank'>Manage</a>)
										</td>
									</tr>
								<?php endif ?>
								<?php if (isset($login_status['error']) && $login_status['error']): ?>
									<tr>
										<th colspan='2'>
											<span class='red'><?php echo $login_status['error'] ?></span>
										</th>
									</tr>
								<?php endif ?>
								<?php if (isset($sk_auto_activation_error) && $sk_auto_activation_error): ?>
									<tr>
										<th scope="row" valign="top">Auto Activation Error</th>
										<td>
											<span class='red'><?php echo $sk_auto_activation_error ?></span>
										</td>
									</tr>
								<?php endif ?>

								<?php if (isset($login_status['success']) && $login_status['success']): ?>
									<tr>
										<th colspan='2'>
											<span class='green'>Successful!	</span>
										</th>
									</tr>
								<?php endif ?>
								<tr>
									<th></th>
									<td><?php submit_button('Update'); ?></td>
								</tr>
							</tbody>
						</table>
					</form>
				</div>
			</div>

			<!-- Sites -->

			<div class="sk_box sites">
				<div class="well">
					<h3>Sidekick Network Activations</h3>

					<div class='stats'>
						<div class='active' onclick='load_sites_by_status("active",this)'>
							<i>></i>
							<h3>0</h3>
							<span>Active</span>
						</div>
						<div class='unactivated' onclick='load_sites_by_status("unactivated",this)'>
							<i>></i>
							<h3>0</h3>
							<span>Unactivated</span>
						</div>
						<div class='deactivated' onclick='load_sites_by_status("deactivated",this)'>
							<i>></i>
							<h3>0</h3>
							<span>Deactivated</span>
						</div>
					</div>

					<div class="status">

					</div>

					<h2><span>Loading...</span><button class='activate_all'>Activate All<div class="spinner"></div></button></h2>

					<div class='action'>
						<div class="pagination">
							<button class='prev'>Prev</button>
							<span>Showing <span class="start">1</span>/<span class='end'>1</span></span>
							<button class='next'>Next</button>
						</div>
						<div class="filter">
							<!-- <input type='text' placeholder='Find'> -->
						</div>
					</div>

					<div class="single_activation_error red"></div>

					<div class="site_list">
						Loading...
					</div>

				</div>
			</div>

		</div>
	</div>

	<script type="text/javascript">
		last_site_key = '<?php echo (isset($last_key) && $last_key) ? $last_key : '' ?>';
	</script>


	<div class="sk_box left">
		<div class="wrapper_left">
			<div class="sk_box configure">
	<div class="well">
		<h3>Configure - Auto Start</h3>

		<form method='post'>

			<p>This Walkthrough will be played once for every user that logs into the backend of WordPress.</p>
			<select name='sk_autostart_walkthrough_id'>
				<option value='0'>No Auto Start</option>
			</select>
			<input class='button button-primary' type='submit' value='Save'/>
			<input type='hidden' name='is_ms_admin' value=' echo (isset($is_ms_admin)) ? $is_ms_admin : false ?>'/>
			<input type='hidden' name='sk_setting_autostart' value='true'/>

			<?php wp_nonce_field( 'update_sk_settings' ); ?>
		</form>
	</div>
</div>

<div class="sk_box configure">
	<div class="well">
		<h3>Configure - Other</h3>

		<form method="post">
			<?php settings_fields('sk_license'); ?>
			<table class="form-table long_label">
				<tbody>

					<tr valign="top">
						<th scope="row" valign="top">Hide Composer Button in Taskbar</th>
						<td>
							<input class='checkbox' type='checkbox' name='sk_hide_composer_taskbar_button' <?php echo (isset($sk_hide_composer_taskbar_button) && $sk_hide_composer_taskbar_button) ? 'CHECKED' : '' ?>>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" valign="top">Hide Config Button in Taskbar</th>
						<td>
							<input class='checkbox' type='checkbox' name='sk_hide_config_taskbar_button' <?php echo (isset($sk_hide_config_taskbar_button) && $sk_hide_config_taskbar_button) ? 'CHECKED' : '' ?>>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" valign="top">Hide Composer Upgrade Button in Drawer</th>
						<td>
							<input class='checkbox' type='checkbox' name='sk_hide_composer_upgrade_button' <?php echo (isset($sk_hide_composer_upgrade_button) && $sk_hide_composer_upgrade_button) ? 'CHECKED' : '' ?>>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" valign="top"></th>
						<td>
							<input class='button button-primary' type='submit' value='Save'/>
						</td>
					</tr>

					<input type='hidden' name='is_ms_admin' value='<?php echo (isset($is_ms_admin)) ? $is_ms_admin : false ?>'/>
					<input type='hidden' name='sk_setting_other' value='true'/>

					<?php wp_nonce_field( 'update_sk_settings' ); ?>

				</tbody>
			</table>
		</form>
	</div>
</div>

<div class="sk_box configure">
	<div class="well">
		<form method='post'>

			<input class='top-right button button-primary alignright' type='submit' value='Save'/>
			<h3>Configure - Turn Off Walkthroughs</h3>

			<p>Below you can turn off specific Walkthroughs for this website.</p>
			<p>Please note, incompatible multisite walkthroughs will be disabled automatically on individual sites already. Here you're being show the raw unfiltered list of all available walkthroughs.</p>
			<div class='sk_walkthrough_list wrapper_wts'>
				Loading...
			</div>
			<input class='button button-primary' type='submit' value='Save'/>
			<input type='hidden' name='sk_setting_disabled' value='true'/>
			<input type='hidden' name='is_ms_admin' value='<?php echo (isset($is_ms_admin)) ? $is_ms_admin : false ?>'/>
			<?php wp_nonce_field( 'update_sk_settings' ); ?>
		</form>
	</div>
</div>
		</div>
	</div>


</div>

<!-- //ms_admin_page.php -->


<?php

        }
    }
}

// //licensing.php
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


// sk_config_data.php

if (!$sidekick_active && !class_exists('sk_config_data')) {

	class sk_config_data{

		var $cache_time = 43200; // 12 Hours

		function get_domain(){
			$site_url = get_site_url();
			if(substr($site_url, -1) == '/') {
				$site_url = substr($site_url, 0, -1);
			}
			$site_url = str_replace(array("http://","https://"),array(""),$site_url);
			return $site_url;
		}

		// Return list of post types registered in WordPress
		// Transients cleared on post type update, create, delete

		function get_post_types(){
			global $wpdb;

			if ( false === ( $result = get_transient( 'sk_' . SK_CACHE_PREFIX . '_get_post_types' ) ) ) {

				$query  = "SELECT post_type, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type";
				$counts = $wpdb->get_results($query);
				$result = array();

				foreach ($counts as $key => $type) {
					$type->post_type = str_replace('-', '_', $type->post_type);
					$result["post_type_{$type->post_type}"] = intval($type->count);
				}
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_get_post_types', $result, $this->cache_time );
			}

			return $result;
		}

		function get_file_editor_enabled(){
			if (defined('GD_SYSTEM_PLUGIN_DIR')) {
				// Only check this file editor setting for GoDaddy Themes
				$gd_file_editor_enabled = get_site_option( 'gd_file_editor_enabled', null );
				if (isset($gd_file_editor_enabled) && $gd_file_editor_enabled) {
					$gd_file_editor_enabled = 'true';
				} else {
					$gd_file_editor_enabled = 'false';
				}
			}
			return (isset($gd_file_editor_enabled)) ? $gd_file_editor_enabled : null;
		}

		function get_themes(){
			if ( false === ( $result = get_transient( 'sk_' . SK_CACHE_PREFIX . '_get_themes' ) ) ) {
				$result = wp_get_themes( array( 'allowed' => true ) );
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_get_themes', $result, $this->cache_time );
			}

			return count($result);
		}

		function get_post_types_and_statuses(){
			global $wpdb;

			// Can't find a good method to clear cache for newly registered post types that fires once
			// if ( false === ( $result = get_transient( 'sk_' . SK_CACHE_PREFIX . '_get_post_types_and_statuses' ) ) ) {
				$query  = "SELECT post_type, post_status, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type, post_status";
				$counts = $wpdb->get_results($query);
				$result = array();

				foreach ($counts as $key => $type) {
					$type->post_type   = str_replace('-', '_', $type->post_type);
					$type->post_status = str_replace('-', '_', $type->post_status);

					$result["post_type_{$type->post_type}_{$type->post_status}"] = intval($type->count);
				}
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_get_post_types_and_statuses', $result, $this->cache_time );
			// }

			return $result;
		}

		function get_taxonomies(){
			global $wpdb;

			// if ( false === ( $result = get_transient( 'sk_' . SK_CACHE_PREFIX . '_get_taxonomies' ) ) ) {
				$query  = "SELECT count(distinct term_taxonomy_id) as count, taxonomy from {$wpdb->prefix}term_taxonomy group by taxonomy";
				$counts = $wpdb->get_results($query);

				foreach ($counts as $key => $taxonomy) {
					$taxonomy->taxonomy = str_replace('-', '_', $taxonomy->taxonomy);
					$result["taxonomy_{$taxonomy->taxonomy}"] = intval($taxonomy->count);
				}
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_get_taxonomies', $result, $this->cache_time );
			// }

			return $result;
		}

		function get_comments(){
			global $wpdb;

			if ( false === ( $counts = get_transient( 'sk_' . SK_CACHE_PREFIX . '_get_comments' ) ) ) {
				$query = "SELECT count(distinct comment_ID) as count from {$wpdb->prefix}comments";
				$counts = $wpdb->get_var($query);
				if (!$counts) $counts = 0;
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_get_comments', $counts, $this->cache_time );
			}

			return intval($counts);
		}

		function get_post_statuses(){
			global $wpdb;

			if ( false === ( $result = get_transient( 'sk_' . SK_CACHE_PREFIX . '_post_statuses' ) ) ) {
				$query  = "SELECT post_status, count(ID) as count from {$wpdb->prefix}posts group by post_status";
				$counts = $wpdb->get_results($query);
				$result = array();

				foreach ($counts as $key => $type) {
					$type->post_status = str_replace('-', '_', $type->post_status);
					$result["post_status_{$type->post_status}"] = intval($type->count);
				}
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_post_statuses', $result, $this->cache_time );
			}

			return $result;
		}

		function get_user_data(){
			global $current_user;

			if ( false === ( $result = get_transient( 'sk_' . SK_CACHE_PREFIX . '_get_user_data' ) ) ) {
				$data   = get_userdata($current_user->ID);
				$result = array("user_id" => $current_user->ID);

				foreach ($data->allcaps as $cap => $val) {
					$cap = sanitize_title($cap);
					$cap = str_replace('-', '_', $cap);
					if (!$val) $val = 0;
					$result["cap_{$cap}"] = $val;
				}
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_get_user_data', $result, $this->cache_time );
			}

			return $result;
		}

		function get_framework(){
			global $current_user;

			$frameworks = array('genesis');

			$result = array("theme_framework" => false);

			foreach ($frameworks as $framework) {
				switch ($framework) {
					case 'genesis':
					if (function_exists( 'genesis' ) ) {
						if (defined('PARENT_THEME_VERSION')) {
							$result["theme_framework"] = array(
								"name" => $framework, 
								"version" => PARENT_THEME_VERSION 
							);
						}
					}
					break;
				}
			}
			return $result;
		}

		function get_current_url() {
			if (isset($_SERVER['REQUEST_URI'])) {
				return 'http'.(empty($_SERVER['HTTPS'])?'':'s').'://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
			} else if (isset($_SERVER['PATH_INFO'])) {
				return $_SERVER['PATH_INFO'];
			} else {
				$host = $_SERVER['HTTP_HOST'];
				$port = $_SERVER['SERVER_PORT'];
				$request = $_SERVER['PHP_SELF'];
				$query = isset($_SERVER['argv']) ? substr($_SERVER['argv'][0], strpos($_SERVER['argv'][0], ';') + 1) : '';
				$toret = $protocol . '://' . $host . ($port == $protocol_port ? '' : ':' . $port) . $request . (empty($query) ? '' : '?' . $query);
				return $toret;
			}
		}

		function get_disabled_wts(){
			$wts = str_replace('"', '', get_option('sk_disabled_wts'));
			if ($wts) {
				return $wts;
			}
			return 'false';
		}

		function get_disabled_network_wts(){
			if (is_multisite()) {
				$wts = str_replace('"', '', get_site_option('sk_disabled_wts'));
				if ($wts) {
					return $wts;
				}
			}
			return 'false';
		}

		function get_plugins(){

			if ( false === ( $result = get_transient( 'sk_' . SK_CACHE_PREFIX . '_get_plugins' ) ) ) {
				$active_plugins = wp_get_active_and_valid_plugins();
				$mu_plugins     = get_mu_plugins();
				$result         = array();

				if (is_array($active_plugins)) {
					foreach ($active_plugins as $plugins_key => $plugin) {
						$data          = get_plugin_data( $plugin, false, false );
						$slug          = explode('/',plugin_basename($plugin));
						$slug          = str_replace('.php', '', $slug[1]);
						$result[$slug] = $data['Version'];
					}
				}

				if (is_array($mu_plugins)) {
					foreach ($mu_plugins as $plugins_key => $plugin) {
						$slug          = str_replace('.php', '', $plugins_key);
						$result[$slug] = '1.0.0';
					}
				}
				set_transient( 'sk_' . SK_CACHE_PREFIX . '_get_plugins', $result, $this->cache_time );
			}

			return $result;
		}

		function get_user_role(){
			global $current_user, $wp_roles;

			if (is_super_admin($current_user->ID)) {
				return 'administrator';
			}

			if(!isset($current_user->caps) || count($current_user->caps) < 1){
				// In MS in some specific pages current user is returning empty caps so this is a work around for that case.
				if (current_user_can('activate_plugins')){
					return 'administrator';
				}
			}
			foreach($wp_roles->role_names as $role => $Role) {
				if (array_key_exists($role, $current_user->caps)){
					$user_role = $role;
					break;
				}
			}
			return $user_role;
		}

	}
}

// //sk_config_data.php
