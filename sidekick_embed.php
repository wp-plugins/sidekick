<?php

/*
SIDEKICK Embed Plugin
Plugin URL: http://wordpress.org/plugins/sidekick/
Description: Adds a real-time WordPress training walkthroughs right in your Dashboard. 
 This SIDEKICK embed file will enable SIDEKICK as part of your plugin or theme. This is strictly a configuration plugin for the SIDEKICK platform, the actual platform is requested directly from our servers. 
 We recommend not activating SIDEKICK automatically for people but via an Opt-In process when they configure your own theme or plugin.
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
				
<script type="text/javascript">
	if (typeof ajax_url === 'undefined') {
		ajax_url = '<?php echo admin_url() ?>admin-ajax.php';
	}
	var last_site_key = null;
	var sk_ms_admin   = false;

	jQuery(document).ready(function($) {
		mixpanel.track('Settings Page Visit - Plugin');
	});

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
										<?php if (defined('MULTISITE') && MULTISITE): ?>
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

									<tr valign="top" style='display: none'>
										<th scope="row" valign="top">
											Enable Composer Mode
										</th>
										<td>
											<input name="sk_composer_button" type="checkbox" <?php if (get_option('sk_composer_button')): ?>CHECKED<?php endif ?> />
											<label class="description" for="track_data">Enable Walkthrough creation.</label>
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

			<div class="sk_box composer">
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
						<li><a href="http://support.sidekick.pro/category/85-getting-started" target="_blank"><strong>Visit the SIDEKICK Quick Start guides</strong></a>.</li>
					</ul>
				</div>
			</div>
		</div>
	</div>





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
						embeded:					true,

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



	
		

if (defined('SK_PLUGIN_DEGBUG')) {
	// mlog('PHP: Sidekick run debug class');
	$sidekick = new SidekickDev;
}

if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information') && !defined('IFRAME_REQUEST')) {
	add_action('admin_enqueue_scripts',              array($sidekick,'enqueue'));
	add_action('admin_enqueue_scripts',              array($sidekick,'enqueue_required'));
	add_action('customize_controls_enqueue_scripts', array($sidekick,'enqueue'));

	if (defined('SK_PLUGIN_DEGBUG')) {
		add_action('admin_footer',                            array($sidekick,'footer_dev'));
		add_action('customize_controls_print_footer_scripts', array($sidekick,'footer_dev'));
	}
}


	if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information') && !defined('IFRAME_REQUEST')) {
		add_action('admin_footer', array($sidekick,'footer'));
		add_action('customize_controls_print_footer_scripts', array($sidekick,'footer'));
	}
}



// Multisite Licensing

if (defined('MULTISITE')) {
	

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

			?>
?> <!-- ms_admin_page.php -->

<script type="text/javascript">
	if (typeof ajax_url === 'undefined') {
		ajax_url = '<?php echo admin_url() ?>admin-ajax.php';
	}
	var last_site_key = null;
	var sk_ms_admin   = true;

	jQuery(document).ready(function($) {
		mixpanel.track('Network Settings Page Visit - Plugin');
	});

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
								<tr valign="top" style='display: none'>
									<th scope="row" valign="top">Subscription</th>
									<td>
										<select name='sk_selected_subscription'>
											<?php if (isset($sk_subs['subscriptions']) && count($sk_subs['subscriptions']) > 0): ?>
												<?php foreach ($sk_subs['subscriptions'] as $key => $sub): ?>
													<?php
													if ($sub->PlanId !== 1 && $sub->Plan->CreatableProductType->name !== 'Private') {
														continue;
													}

													if (isset($sub->Plan->CreatableProductType->name) && $sub->Plan->CreatableProductType->name == 'Private') {
														$type = 'product';
													} else {
														$type = 'subscription';
													}


													if ($sk_selected_subscription == ($type . '-' . $sub->id) || !isset($selected_sub)) {
														$selected_sub = $sub;
														$selected     = 'SELECTED';
													} else {
														$selected = '';
													}
													?>
													<option <?php echo $selected ?> value='<?php echo (isset($sub->Plan->CreatableProductType->name) && $sub->Plan->CreatableProductType->name == 'Private') ? "product-" : "subscription-"; echo $sub->id ?>'><?php echo $sub->Plan->name . ' - ' . $sub->CurrentTier->name ?></option>
												<?php endforeach ?>
												<?php if (!isset($selected_sub)): ?>
													<option value='0'>No Compatible Subscriptions</option>
												<?php endif ?>
											<?php else: ?>
												<option>No Subscriptions</option>
											<?php endif ?>
										</select>
									</td>
								</tr>
								<?php if (isset($sk_subs['products'])): ?>

									<tr valign="top" style='display: none' class='walkthrough_library'>
										<th scope="row" valign="top">Library</th>
										<td>
											<select name='sk_selected_product'>
												<?php if (isset($sk_subs['products']) && count($sk_subs['products']) > 0): ?>
													<?php foreach ($sk_subs['products'] as $key => $product): ?>
														<option <?php echo ($sk_selected_product == $product->id) ? 'SELECTED' : '' ?> value='<?php echo $product->id ?>'><?php echo $product->name ?></option>
													<?php endforeach ?>
												<?php else: ?>
													<option style='color: red' value='0'>No Libraries Found!</option>
													<?php $no_product = true; delete_option( 'sk_auto_activations') ?>
												<?php endif ?>
											</select>
										</td>
									</tr>

								<?php endif ?>

								<tr valign="top">
									<th scope="row" valign="top">Enable Auto-Activations</th>
									<td>
										<?php if (!isset($selected_sub) || isset($no_product)): ?>
											<input class='checkbox' type='checkbox' name='sk_auto_activations' DISABLED>
										<?php else: ?>
											<input class='checkbox' type='checkbox' name='sk_auto_activations' <?php echo ($sk_auto_activations) ? 'CHECKED' : '' ?>>
										<?php endif ?>
									</td>
								</tr>
								<?php //var_dump($selected_sub); ?>
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
					<h3>Sidekick Network Activations - (<a class='activate_all' href='#'>Activate All</a>)</h3>

					<p>To manage your complete list of domains please login to your <a href='https://www.sidekick.pro/profile/#' target='_blank'>account center</a>.</p>

					<?php $blogs = wp_get_sites(array('limit' => 10000)) ?>
					<ul>
						<?php foreach ($blogs as $key => $blog): ?>
							<?php

							switch_to_blog($blog['blog_id']);

							if ($user = get_user_by('email', get_option('admin_email'))) {
								$user_id = $user->ID;
							} else {
								$user_id = null;
							}

							$key = get_option('sk_activation_id');
							if ($key) $last_key = $key;

							$turn_on_button = '';

							if (isset($selected_sub)) {
								$turn_on_button = "<button class=\"activate_sk\" data-blogid=\"{$blog["blog_id"]}\" data-userid=\"{$user_id}\" data-domain=\"{$blog["domain"]}\" data-path=\"{$blog["path"]}\">Turn On</button>";
							}

							?>

							<li>
								<div class='bold'>
									<h3><?php echo ucfirst(str_replace('/', '', $blog['path'])) ?></h3>
									<?php echo $blog['domain'] . $blog['path'] ?>
									<span><?php echo ($key) ? ' - <span class="green">Active</span>' : " - <span class=\"not_active\">Not Activated</span> $turn_on_button" ?></span>
								</div>
							</li>
						<?php endforeach ?>
					</ul>

					<div class="single_activation_error red"></div>


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
	add_action('wpmu_new_blog',array($sidekickMassActivator,'activate'),10,6);
	add_action('network_admin_menu', array($sidekickMassActivator,'setup_menu'));
	add_action('wp_ajax_sk_activate_single', array($sidekickMassActivator,'activate_single'));
}


// sk_config_data.php

if (!class_exists('sk_config_data')) {

	class sk_config_data{
		function get_domain(){
			$site_url = get_site_url();
			if(substr($site_url, -1) == '/') {
				$site_url = substr($site_url, 0, -1);
			}
			$site_url = str_replace(array("http://","https://"),array(""),$site_url);
			return $site_url;
		}

		function get_post_types(){
			global $wpdb;
			$query  = "SELECT post_type, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $type) {
				$type->post_type = str_replace('-', '_', $type->post_type);
				$output .= "\n 						post_type_{$type->post_type} : $type->count,";
			}
			return $output;
		}

		function get_themes(){
			$themes = wp_get_themes( array( 'allowed' => true ) );
			return count($themes);
		}

		function get_post_types_and_statuses(){
			global $wpdb;
			$query  = "SELECT post_type, post_status, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type, post_status";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $type) {
				$type->post_type   = str_replace('-', '_', $type->post_type);
				$type->post_status = str_replace('-', '_', $type->post_status);

				$output .= "\n 						post_type_{$type->post_type}_{$type->post_status} : $type->count,";
			}
			return $output;
		}

		function get_taxonomies(){
			global $wpdb;
			$query  = "SELECT count(distinct term_taxonomy_id) as count, taxonomy from {$wpdb->prefix}term_taxonomy group by taxonomy";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $taxonomy) {
				$taxonomy->taxonomy = str_replace('-', '_', $taxonomy->taxonomy);
				$output .= "\n 						taxonomy_{$taxonomy->taxonomy} : $taxonomy->count,";
			}
			return $output;
		}

		function get_comments(){
			global $wpdb;
			$query = "SELECT count(distinct comment_ID) as count from {$wpdb->prefix}comments";
			$counts = $wpdb->get_var($query);
			if (!$counts) $counts = 0;
			return "\n 						comment_count : $counts,";
		}

		function get_post_statuses(){
			global $wpdb;
			$query  = "SELECT post_status, count(ID) as count from {$wpdb->prefix}posts group by post_status";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $type) {
				$type->post_status = str_replace('-', '_', $type->post_status);
				$output .= "\n 						post_status_{$type->post_status} : $type->count,";
			}
			return $output;
		}

		function get_user_data(){
			global $current_user;

			$data   = get_userdata($current_user->ID);
			$output = "\n 						user_id : $current_user->ID,";

			foreach ($data->allcaps as $cap => $val) {
				$cap = sanitize_title($cap);
				$cap = str_replace('-', '_', $cap);
				if (!$val) $val = 0;
				$output .= "\n 						cap_{$cap} : $val,";
			}
			return $output;
		}

		function get_framework(){
			global $current_user;

			$frameworks = array('genesis');

			$output = "\n 						theme_framework : false,";

			foreach ($frameworks as $framework) {
				switch ($framework) {
					case 'genesis':
					if (function_exists( 'genesis' ) ) {
						if (defined('PARENT_THEME_VERSION')) {
							$output = "\n 						theme_framework : {name: '" . $framework . "', version: '" . PARENT_THEME_VERSION . "'},";
						}
					}
					break;
				}
			}
			return $output;
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

			$active_plugins = wp_get_active_and_valid_plugins();
			$mu_plugins     = get_mu_plugins();
			$output         = array();

			if (is_array($active_plugins)) {
				foreach ($active_plugins as $plugins_key => $plugin) {
					$data          = get_plugin_data( $plugin, false, false );
					$slug          = explode('/',plugin_basename($plugin));
					$slug          = str_replace('.php', '', $slug[1]);
					$output[$slug] = $data['Version'];
				}
			}

			if (is_array($mu_plugins)) {
				foreach ($mu_plugins as $plugins_key => $plugin) {
					$slug          = str_replace('.php', '', $plugins_key);
					$output[$slug] = '1.0.0';
				}
			}
			return $output;
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
