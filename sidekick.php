<?php

/*
Plugin Name: Sidekick
Plugin URL: http://wordpress.org/plugins/sidekick/
Description: Adds a real-time WordPress training walkthroughs right in your Dashboard
Requires at least: 3.7
Tested up to: 3.9
Version: 1.3.2
Author: Sidekick.pro
Author URI: http://www.sidekick.pro
*/

define('SK_PLUGIN_VERSION','1.3.2');
define('SK_LIBRARY_VERSION',5);
define('SK_PLATFORM_VERSION',6);

if ( ! defined( 'SK_SL_PLUGIN_DIR' ) ) define( 'SK_SL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
if ( ! defined( 'SK_SL_PLUGIN_URL' ) ) define( 'SK_SL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
if ( ! defined( 'SK_SL_PLUGIN_FILE' ) ) define( 'SK_SL_PLUGIN_FILE', __FILE__ );
if ( ! function_exists('mlog')) {
	function mlog(){}
}

class Sidekick{
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

	function protocol() {
		if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443) {
			return 'https://';
		} else {
			return 'http://';
		}
	}

	function enqueue(){
		$activation_id = get_option("sk_activation_id");

		$protocol = $this->protocol();

		define('SK_FREE_LIBRARY_FILE', "{$protocol}library.sidekick.pro/library/v" . SK_LIBRARY_VERSION . "/releases/xxxxxxxx-xxxx-xxxx-xxxx-xxxxfree/library.js?" . date('m-d-y-G'));
		if ($activation_id) {
			define('SK_PAID_LIBRARY_FILE', "{$protocol}library.sidekick.pro/library/v" . SK_LIBRARY_VERSION . "/releases/{$activation_id}/library.js?" . date('m-d-y-G'));
			wp_enqueue_script("sk_paid_library" , SK_PAID_LIBRARY_FILE					,							null			,null);
			wp_enqueue_script("sk_free_library" , SK_FREE_LIBRARY_FILE					,							array('sk_paid_library')			,null);
		} else {
			wp_enqueue_script("sk_free_library" , SK_FREE_LIBRARY_FILE					,							array()			,null);
		}

		wp_enqueue_script('sidekick'   		,"{$protocol}platform.sidekick.pro/v" . SK_PLATFORM_VERSION . '/sidekick.min.js',				array('sk_free_library','backbone','jquery','underscore','jquery-effects-highlight'), SK_PLUGIN_VERSION);
		wp_enqueue_script('player'         	,plugins_url( '/js/sk.source.js'		, __FILE__ ),				array('sidekick')	,SK_PLUGIN_VERSION);

		wp_enqueue_style('sk-style'    		,plugins_url( '/css/sidekick_wordpress.css' , __FILE__ ),		null 				,SK_PLUGIN_VERSION);

		wp_enqueue_style('wp-pointer');
		wp_enqueue_script('wp-pointer');
	}

	function setup_menu(){
		add_submenu_page( 'options-general.php', 'Sidekick', 'Sidekick', 'activate_plugins','sidekick', array(&$this,'admin_page'));
	}

	function admin_page(){
		if (isset($_POST['option_page']) && $_POST['option_page'] == 'sk_license') {

			if (isset($_POST['first_name']) && $_POST['first_name'])
				update_option('sk_first_name',$_POST['first_name']);

			if (isset($_POST['email']) && $_POST['email'])
				update_option('sk_email',$_POST['email']);

			if (isset($_POST['activation_id']) && $_POST['activation_id']){
				$result = $this->activate(true);
			} else {
				delete_option('sk_activation_id');
			}

			if (isset($_POST['sk_track_data'])) {
				update_option( 'sk_track_data', true );
			} else {
				delete_option('sk_track_data');
			}

			update_option( 'sk_activated', true );
			die('<script>window.open("' . get_site_url() . '/wp-admin/options-general.php?page=sidekick&firstuse","_self")</script>');
		}

		$activation_id = get_option( 'sk_activation_id' );
		$email         = get_option( 'sk_email' );
		$first_name    = get_option( 'sk_first_name' );
		$sk_track_data    = get_option( 'sk_track_data' );
		$error         = null;

		if (defined('SK_PAID_LIBRARY_FILE') && $activation_id) {
			$_POST['activation_id'] = $activation_id;
			$check_activation       = $this->activate(true);
			if ($check_activation) {
				$library = file_get_contents(SK_PAID_LIBRARY_FILE);
				if (strlen($library) > 30) {
					$site_url = $this->get_domain();
					if (strpos($library, $site_url) !== false) {
						$status = 'Active';
					} else {
						$status = 'Domain not authorized.';
					}
				} else {
					$status = 'Expired';
				}
			} else {
				$status = 'Invalid';
			}
		} else {
			$status = 'Free';
		}

		$current_user = wp_get_current_user();
		if (!$first_name)
			$first_name = $current_user->user_firstname;

		if (!$email)
			$email = $current_user->user_email;

		$sk_track_data = get_option( 'sk_track_data' );

		global $wp_version;
		if (version_compare($wp_version, '3.7', '<=')) {
			$error = "Sorry, Sidekick requires WordPress 3.7 or higher to function.";
		}

		if (!$activation_id) {
			$warn = "You're using the <b>Demo</b> version of Sidekick, to gain full access to the walkthrough library please fill out your name and email address below.";
		}

		if(preg_match('/(?i)msie [6-8]/',$_SERVER['HTTP_USER_AGENT'])){
			$error = "Sorry, Sidekick requires Internet Explorer 9 or higher to function.";
		}

		?>

		<?php if ($_SERVER['QUERY_STRING'] == 'page=sidekick&firstuse'): ?>
			<script type="text/javascript">
				jQuery(document).ready(function($) {
					jQuery('#sidekick #logo').trigger('click');
				});
			</script>
		<?php endif ?>

		<div class="wrap">
			<div class="icon32" id="icon-tools"><br></div><h2>Sidekick</h2>

			<?php if (isset($error_message)): ?>
				<div class="error" style="padding:15px; position:relative;" id="gf_dashboard_message">
					There was a problem activating your license. The following error occured <?php echo $error_message ?>
				</div>
			<?php elseif (isset($error)): ?>
				<div class="error" style="padding:15px; position:relative;" id="gf_dashboard_message">
					<?php echo $error ?>
				</div>
			<?php elseif (isset($warn)): ?>
				<div class="updated" style="padding:15px; position:relative;" id="gf_dashboard_message">
					<?php echo $warn ?>
				</div>
			<?php elseif (isset($success)): ?>
				<div class="updated" style="padding:15px; position:relative;" id="gf_dashboard_message">
					<?php echo $success ?>
				</div>
			<?php endif ?>

			<?php if (!$error): ?>
				<h3>Your Sidekick Account</h3>
				<form method="post">
					<?php settings_fields('sk_license'); ?>
					<table class="form-table">
						<tbody>
								<!-- <tr valign="top">
									<th scope="row" valign="top">First Name</th>
									<td>
										<input id="first_name" name="first_name" type="text" class="regular-text" value="<?php echo $first_name ?>" />
										<label class="description" for="first_name"><?php _e('Enter your first name'); ?></label>
									</td>
								</tr> -->

								<!-- <tr valign="top">
									<th scope="row" valign="top">E-Mail</th>
									<td>
										<input id="email" name="email" type="text" class="regular-text" value="<?php echo $email ?>" />
										<label class="description" for="email"><?php _e('Enter your email address'); ?></label>
									</td>
								</tr> -->

								<tr valign="top">
									<th scope="row" valign="top">Activation ID</th>
									<td><input class='regular-text' type='text' name='activation_id' value='<?php echo $activation_id ?>'></input></td>
								</tr>

								<tr valign="top">
									<th scope="row" valign="top">Status</th>
									<td><span style='color: green' class='<?php echo strtolower($status) ?>'><?php echo ucfirst($status) ?></span></td>
								</tr>

								<tr valign="top">
									<th scope="row" valign="top">
										Data Tracking
									</th>
									<td>
										<input id="track_data" name="sk_track_data" type="checkbox" <?php if ($sk_track_data): ?>CHECKED<?php endif ?> />
										<input type='hidden' name='status' value='<?php echo $status ?>'/>
										<label class="description" for="track_data">Help Sidekick by providing tracking data which will help us build better help tools.</label>
									</td>
								</tr>
							</tbody>
						</table>
						<?php submit_button('Update'); ?>
					</form>
				<?php endif ?>

				<h3>Welcome to the fastest and easiest way to learn WordPress</h3>

				<p></p>
				<p>Like SIDEKICK? Please leave us a 5 star rating on <a target='_blank' href='http://wordpress.org/plugins/sidekick/'>http://WordPress.org</a></p>
				<br/>
				<p>Here are a few things you should know:</p>

				<ul>
					<li>&nbsp;&nbsp;&nbsp;&nbsp;1. Clicking the check-box above will allow us to link your email address to the stats we collect so we can contact you if we have a question or notice an issue. It’s not mandatory, but it would help us out. </li>
					<li>&nbsp;&nbsp;&nbsp;&nbsp;2. Your Activation ID is unique and locked to this URL. </li>
					<li>&nbsp;&nbsp;&nbsp;&nbsp;3. Want even more Walkthroughs for WordPress, WooCommerce and more? <a target='_blank' href='http://www.sidekick.pro/wordpress/modules?utm_source=plugin_settings'>UPGRADE Now!</a> </li>
					<li>&nbsp;&nbsp;&nbsp;&nbsp;4. The Sidekick team adheres strictly to CANSPAM. From time to time we may send critical updates (such as security notices) to the email address setup as the Administrator on this site. </li>
					<li>&nbsp;&nbsp;&nbsp;&nbsp;5. If you have any questions, bug reports or feedback, please send them to <a target='_blank' href='mailto:info@sidekick.pro'>us</a> </li>
					<li>&nbsp;&nbsp;&nbsp;&nbsp;6. You can find our terms of use <a target='_blank' href='http://www.sidekick.pro/terms-of-use/'>here</a></li>
				</ul>
				<p>Thank you,</p><br/>

			</div>
			<?php
		}

		function get_domain(){
			$site_url = get_site_url();
			if(substr($site_url, -1) == '/') {
				$site_url = substr($site_url, 0, -1);
			}
			$site_url = str_replace(array("http://","https://"),array(""),$site_url);
			return $site_url;
		}

		function list_post_types(){
			global $wpdb;
			$query = "SELECT post_type, count(distinct ID) as count from wp_posts group by post_type";
			$counts = $wpdb->get_results($query);
			foreach ($counts as $key => $type) {
				$type->post_type = str_replace('-', '_', $type->post_type);
				echo "\n 						post_type_{$type->post_type} : $type->count,";
			}
		}

		function list_comments(){
			global $wpdb;
			$query = "SELECT count(distinct comment_ID) as count from wp_comments";
			$counts = $wpdb->get_var($query);
			echo "\n 						comment_count : $counts,";
		}

		function get_user_data(){
			global $current_user;
			$data = get_userdata($current_user->ID);
			foreach ($data->allcaps as $cap => $val) {
				$cap = str_replace('-', '_', $cap);
				echo "\n 						cap_{$cap} : $val,";
			}
		}

		function footer(){
			global $current_user, $wp_roles;

			$current_user      = wp_get_current_user();
			$sk_just_activated = get_option( 'sk_just_activated' );
			$sk_track_data     = get_option( 'sk_track_data' );
			$theme             = wp_get_theme();
			$not_supported_ie  = false;

			delete_option( 'sk_just_activated' );
			foreach($wp_roles->role_names as $role => $Role) {
				if (array_key_exists($role, $current_user->caps)){
					$user_role = $role;
					break;
				}
			}

			if(preg_match('/(?i)msie [6-8]/',$_SERVER['HTTP_USER_AGENT'])){
				$not_supported_ie = true;
			}

			$site_url = $this->get_domain();

			?>

			<?php if (!$not_supported_ie): ?>

				<script type="text/javascript">

					var sk_config = {
						domain:              	'<?php echo str_replace("http://","",$_SERVER["SERVER_NAME"]) ?>',
						installed_plugins:   	<?php echo $this->list_plugins() ?>,
						installed_theme:     	'<?php echo $theme->Name ?>',
						library_free_file:   	'<?php echo (defined("SK_FREE_LIBRARY_FILE") ? SK_FREE_LIBRARY_FILE : '') ?>',
						library_paid_file:   	'<?php echo (defined("SK_PAID_LIBRARY_FILE") ? SK_PAID_LIBRARY_FILE : '') ?>',
						library_version:   		'<?php echo (defined("SK_LIBRARY_VERSION") ? SK_LIBRARY_VERSION : '') ?>',
						plugin_version:   		'<?php echo (defined("SK_PLUGIN_VERSION") ? SK_PLUGIN_VERSION : '') ?>',
						platform_version:   	'<?php echo (defined("SK_PLATFORM_VERSION") ? SK_PLATFORM_VERSION : '') ?>',
						main_soft_name:      	'WordPress',
						main_soft_version:   	'<?php echo get_bloginfo("version") ?>',
						plugin_url:          	'<?php echo admin_url("admin.php?page=sidekick") ?>',
						theme_version:       	'<?php echo $theme->Version ?>',
						site_url: 				'<?php echo $site_url ?>',
						track_data:          	'<?php echo get_option( "track_data" ) ?>',
						user_level:          	'<?php echo $user_role ?>',
						user_email:          	'<?php echo $current_user->user_email ?>',
						<?php $this->list_post_types() ?>
						<?php $this->get_user_data() ?>
						<?php $this->list_comments() ?>
						use_native_controls: 	false,
						// open_bucket: 476
					}
					<?php if ($activation_id = get_option( "sk_activation_id" )){ ?>
						sk_config.activation_id = '<?php echo $activation_id ?>';
						<?php } ?>
						<?php if ($sk_just_activated): ?>
						sk_config.just_activated = true;
						sk_config.show_login = true;
					<?php endif; ?>
				</script>
			<?php endif ?>
			<?php
		}

		function list_plugins(){
			$active_plugins = wp_get_active_and_valid_plugins();
			$mu_plugins = get_mu_plugins();

			$printed = false;

			echo '[';

			if (is_array($active_plugins)) {
				foreach ($active_plugins as $plugins_key => $plugin) {
					$data = get_plugin_data( $plugin, false, false );

					$plugins[addslashes($data['Name'])] = $data['Version'];
					if ($plugins_key > 0) echo ',';
					$data['Name'] = addslashes($data['Name']);
					echo "{'{$data['Name']}' : '{$data['Version']}'}";
					$printed = true;
				}
			}

			if (is_array($mu_plugins)) {
				foreach ($mu_plugins as $plugins_key => $plugin) {
					$plugins[addslashes($data['Name'])] = $plugin['Version'];
					if ($printed) echo ',';
					$plugin['Name'] = addslashes($plugin['Name']);
					echo "{'{$plugin['Name']}' : '{$plugin['Version']}'}";
					$printed = true;
				}
			}
			echo ']';
		}

		function track($data){
			$protocol = $this->protocol();

			$response = wp_remote_post( "{$protocol}library.sidekick.pro/wp-admin/admin-ajax.php", array(
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
			if ($_POST['activation_id']) {

				$protocol = $this->protocol();

				$library_file = "{$protocol}library.sidekick.pro/library/v" . SK_LIBRARY_VERSION . "/releases/{$_POST['activation_id']}/library.js";
				$ch = curl_init($library_file);
				curl_setopt($ch, CURLOPT_NOBODY, true);
				curl_exec($ch);
				$retcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
				curl_close($ch);
				if ($retcode == 200) {
					update_option('sk_activation_id',$_POST['activation_id']);
					if ($return)
						return 1;
					die(json_encode(array('success' => 1)));
				} else {
					delete_option( 'sk_activation_id' );
					if ($return)
						return $retcode;
					die(json_encode(array('error' => $retcode)));
				}
			} else {
				die(json_encode(array('error' => 'No Activation ID')));
			}
		}

		function activate_plugin(){
			update_option( 'sk_do_activation_redirect', true );
			$data = array(
				'source' => 'plugin',
				'action' => 'track',
				'type' => 'activate'
				);
			$this->track($data);
		// $this->redirect();
		}

		function redirect(){
			if (get_option('sk_do_activation_redirect', false)) {
				delete_option('sk_do_activation_redirect');
				$siteurl = get_site_url();
				wp_redirect($siteurl . "/wp-admin/options-general.php?page=sidekick&firstuse");
				die();
			}
		}

		function deactivate_plugin(){
			$sk_track_data = get_option( 'sk_track_data' );
			if ($sk_track_data) {
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
			}
			delete_option( 'sk_activation_id' );
			delete_option( 'sk_first_name' );
			delete_option( 'sk_email' );
			delete_option( 'sk_activated' );
		}
	}

	$sidekick = new Sidekick;
	if (!defined('SK_PLUGIN_DEGBUG')){
		register_activation_hook( __FILE__, array($sidekick,'activate_plugin') );
		register_deactivation_hook( __FILE__, array($sidekick,'deactivate_plugin')  );
	}

	add_action('admin_menu', array($sidekick,'setup_menu'));
	add_action('admin_init', array($sidekick,'redirect'));
	add_action('wp_ajax_sk_activate', array($sidekick,'activate'));

	if (!defined('SK_PLUGIN_DEGBUG'))
		require_once('sk_init.php');

	global $screen;



	if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information') && !defined('IFRAME_REQUEST')) {
		add_action('admin_footer', array($sidekick,'footer'));
		add_action('customize_controls_print_footer_scripts', array($sidekick,'footer'));
	}


