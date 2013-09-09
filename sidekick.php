<?php

/*
Plugin Name: Sidekick
Plugin URL: http://www.wpuniversity.com/plugin/
Description: Adds a real-time WordPress training right into your Dashboard
Requires at least: 3.5
Tested up to: 3.6
Version: 0.78
Author: WPUniversity.com
Author URI: http://www.wpuniversity.com
*/

define('WPU_DOMAIN','http://www.wpuniversity.com');
define('WPU_LIBRARY_DOMAIN','http://library.wpuniversity.com');
define('WPU_PLUGIN_VERSION',0.78);
define('SK_LIBRARY_VERSION',3);

// this is the URL our updater / license checker pings. This should be the URL of the site with EDD installed
define( 'WPU_STORE_URL', 'http://www.wpuniversity.com' ); // you should use your own CONSTANT name, and be sure to replace it throughout this file

// the name of your product. This should match the download name in EDD exactly
define( 'WPU_ITEM_NAME', 'WPUniversity' ); // you should use your own CONSTANT name, and be sure to replace it throughout this file

if ( ! defined( 'WPU_SL_PLUGIN_DIR' ) ) define( 'WPU_SL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
if ( ! defined( 'WPU_SL_PLUGIN_URL' ) ) define( 'WPU_SL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
if ( ! defined( 'WPU_SL_PLUGIN_FILE' ) ) define( 'WPU_SL_PLUGIN_FILE', __FILE__ );
if ( !function_exists('mlog')) {function mlog(){}}

	class wpu{
		function enqueue(){

		// mlog('WPU Prod');
			wp_enqueue_script('jquery'                      , null );
			wp_enqueue_script('underscore'                  , null, array('underscore'));
			wp_enqueue_script('backbone'                    , null, array('jquery','underscore'));
			wp_enqueue_script('jquery-ui-core'				, null, array('jquery') );
			wp_enqueue_script('jquery-ui-position'			, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-ui-draggable'			, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-ui-droppable'			, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-effects-scale'		, null, array('jquery-ui-core') );
			wp_enqueue_script('jquery-effects-highlight'	, null, array('jquery-ui-core') );

			wp_enqueue_script('sidekick'                   	,'http://platform.sidekick.pro/v2/sidekick.min.js',										array('backbone','jquery','underscore','jquery-effects-highlight'), WPU_PLUGIN_VERSION);
			if ($license_key = get_option('wpu_license_key')) {
				wp_enqueue_script('wpu_library',                WPU_LIBRARY_DOMAIN . "/releases/v2/{$license_key}/library.js",	array('sidekick')	,rand(1, 5000));
			} else {
				wp_enqueue_script('wpu_library',                WPU_LIBRARY_DOMAIN . '/sources/library_demo.js',	array('sidekick')	,rand(1, 5000));
			}


			wp_enqueue_script('wpu'                    		,plugins_url( '/js/wpu.source.js' , __FILE__ ),										array('sidekick')	,WPU_PLUGIN_VERSION);
			wp_enqueue_style('wpu-style'                    ,plugins_url( '/css/wpu.css' , __FILE__ )											,null 			,WPU_PLUGIN_VERSION);
		}

		function setup_menu(){
			add_menu_page( 'Sidekick', 'Sidekick', 'activate_plugins', 'wpu', array(&$this,'admin_page'));
			add_submenu_page( 'wpu', 'Settings', 'Settings', 'activate_plugins', 'wpu_settings', array(&$this,'admin_page_settings') );
		}

		function admin_page(){
			$license    = get_option( 'wpu_license_key' );
			$status     = get_option( 'wpu_license_status' );
			// $status  	= 'valid';
			$email      = get_option( 'wpu_email' );
			$first_name = get_option( 'wpu_first_name' );


			$current_user = wp_get_current_user();
			if (!$first_name)
				$first_name = $current_user->user_firstname;

			if (!$email)
				$email = $current_user->user_email;
			// mlog('$_POST',$_POST);

			if (isset($_POST['option_page']) && $_POST['option_page'] == 'wpu_license') {
				if (isset($_POST['first_name'])) {
					update_option('wpu_first_name',$_POST['first_name']);
					update_option('wpu_email',$_POST['email']);
					$first_name = $_POST['first_name'];
					$email = $_POST['email'];
					$_POST['item_name'] = WPU_ITEM_NAME;

				// mlog('$_POST',$_POST);

					if (defined('WPU_PLUGIN_DEGBUG')) {
						$url = 'http://dev.wpuniversity.com?action=remote_wpu_register';
					} else {
						$url = 'http://www.wpuniversity.com?action=remote_wpu_register';
					}
				// mlog('$url',$url);

					$response = wp_remote_post( $url, array(
						'method' => 'POST',
						'timeout' => 45,
						'redirection' => 5,
						'httpversion' => '1.0',
						'blocking' => true,
						'headers' => array(),
						'body' => $_POST,
						'cookies' => array()
						)
					);
				// print_r($response);

				// mlog('$response',$response['body']);

					if ( is_wp_error( $response ) ) {
						$error_message = $response->get_error_message();
					// mlog('$error_message',$error_message);
					// echo "Something went wrong: $error_message";
					} else {
						$success = 'Successfully Activated';
						update_option('wpu_license_key',$response['body']);
						$license = $response['body'];
						$email = $_POST['email'];
						$status = 'valid';

						update_option('wpu_license_status','valid');
					}
					update_option( 'wpu_activated', true );
				// wp_redirect("/wp-admin/admin.php?page=wpu");
					die('<script>window.open("' . get_site_url() . '/wp-admin/admin.php?page=wpu&firstuse","_self")</script>');
				}
			}

			$track_data = get_option( 'wpu_track_data' );
			$error      = null;

			global $wp_version;
			if (version_compare($wp_version, '3.4', '<=')) {
				$error = "Sorry, Sidekick requires WordPress 3.5 or higher to function.";
			}

			if (!$license) {
				$warn = "Welcome to Sidekick. To access the <b>full library</b> of Core Walkthroughs, please click the \"<b>Activate Library</b>\" button below. ";
			}

			if(preg_match('/(?i)msie [1-8]/',$_SERVER['HTTP_USER_AGENT'])){
				$error = "Sorry, Sidekick requires Internet Explorer 9 or higher to function.";
			}

			?>

			<?php if ($_SERVER['QUERY_STRING'] == 'page=wpu&firstuse'): ?>
				<script type="text/javascript">
					jQuery(document).ready(function($) {
						jQuery('#wpu #logo').trigger('click');
					});
				</script>
			<?php endif ?>

			<div class="wrap">
				<div class="icon32" id="icon-tools"><br></div>
				<h2>Sidekick</h2>

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
					<?php if ($status == 'valid'): ?>
						<h2>Your Sidekick Account</h2>
					<?php else: ?>
						<h2>Activate <b>Full Library</b></h2>
					<?php endif ?>

					<form method="post">
						<?php settings_fields('wpu_license'); ?>
						<table class="form-table">
							<tbody>
								<tr valign="top">
									<th scope="row" valign="top">First Name</th>
									<td>
										<input id="first_name" name="first_name" type="text" class="regular-text" <?php if ($status == 'valid'): ?>DISABLED<?php endif ?> value="<?php echo $first_name ?>" />
										<label class="description" for="first_name"><?php _e('Enter your first name'); ?></label>
									</td>
								</tr>

								<tr valign="top">
									<th scope="row" valign="top">E-Mail</th>
									<td>
										<input id="email" name="email" type="text" class="regular-text" <?php if ($status == 'valid'): ?>DISABLED<?php endif ?> value="<?php echo $email ?>" />
										<label class="description" for="email"><?php _e('Enter your email address'); ?></label>
									</td>
								</tr>

								<?php if ($license): ?>
									<tr valign="top">
										<th scope="row" valign="top">License</th>
										<td><span><?php echo $license ?></span></td>
									</tr>
								<?php endif ?>

								<?php if ($status): ?>
									<tr valign="top">
										<th scope="row" valign="top">Status</th>
										<td>
											<?php if ($status == 'valid'): ?>
												<span style='color: green'><?php echo ucfirst($status) ?></span>
											<?php else: ?>
												<span style='color: red'><?php echo ucfirst($status) ?></span>
											<?php endif ?>
										</td>
									</tr>
								<?php else: ?>
									<tr valign="top">
										<th scope="row" valign="top">
											Status
										</th>

										<td>
											<span style='color: blue'>Demo</span>
										</td>
									</tr>
								<?php endif ?>
							</tbody>
						</table>
						<?php if ($status !== 'valid' || defined('WPU_PLUGIN_DEGBUG')): ?>
							<?php submit_button('Activate Library'); ?>
						<?php endif ?>
					</form>
				<?php endif ?>

				<h2>About Sidekick</h2>
				<p><b>WordPress is about to get a whole lot easier to learn and use!</b></p>
				<p>The Sidekick for WordPress Walkthrough library was created and is maintained by the team at http://www.wpuniversity.com. There is currently no charge to access and use the library of walkthroughs. All we ask is that you enter your first name and email address here so we can keep you posted on what's new with the plugin and any upcoming changes that you should be aware of. (entering your email address is not a requirement to use the plugin).</p>
				<p>Sidekick and our parent company FlowPress adhere strictly to CANSPAM rules and we promise never to lend, sell or otherwise divulge your personal data (including your name and email address) without your express consent.</p>
				<p>From time to time we send out WordPress tips & tricks, WordPress community updates and the occasional special offer to our users. If you'd like to receive these emails as well, please <a href='http://wpuniversity.us4.list-manage.com/subscribe?u=59d2b3278da2364941b040f74&id=b1a91625c0'>click here</a>.</p>
				<p>Sidekick for WordPress is still in BETA and there will be the occasional bug. If you have any questions, bug reports or feedback, please send them to <a href='mailto:info@wpuniversity.com'>info@wpuniversity.com</a>.</p>
				<p>Thank you,</p><br/>
			</div>
			<?php
		}

		function admin_page_settings(){
			if (isset($_POST['option_page']) && $_POST['option_page'] == 'wpu_license') {
				if (isset($_POST['wpu_track_data'])) {
					update_option( 'wpu_track_data', true );
				} else {
					delete_option('wpu_track_data');
				}
			}

			$track_data = get_option( 'wpu_track_data' );

			?>

			<div class="wrap">
				<div class="icon32" id="icon-tools"><br></div>
				<h2>Sidekick</h2>

				<form method="post">

					<?php settings_fields('wpu_license'); ?>

					<table class="form-table">
						<tbody>

							<tr valign="top">
								<th scope="row" valign="top">
									Data Tracking
								</th>
								<td>
									<input id="wpu_track_data" name="wpu_track_data" type="checkbox" class="regular-text" <?php if ($track_data): ?>CHECKED<?php endif ?> />
									<label class="description" for="wpu_track_data">Help Sidekick by providing tracking data which will help us build better help tools.</label>
								</td>
							</tr>

						</tbody>
					</table>
					<?php submit_button(); ?>
				</form>
			</div>
			<?php
		}

		function footer(){
			$current_user = wp_get_current_user();
			$wpu_just_activated = get_option( 'wpu_just_activated' );
			$not_supported_ie  = false;


			if(preg_match('/(?i)msie [1-8]/',$_SERVER['HTTP_USER_AGENT'])){
				$not_supported_ie = true;
			}

			delete_option( 'wpu_just_activated' );
			?>

			<?php if (!$not_supported_ie): ?>
				<script type="text/javascript">
					// var wpu_library_file      = '<?php echo WPU_LIBRARY_DOMAIN . "/sources/library_free.js" ?>';
					var wpu_library_file      = '<?php echo WPU_LIBRARY_DOMAIN . "/releases/v2/" . get_option("wpu_license_key") . "/library.js" ?>';
					var wpu_wp_version        = '<?php echo get_bloginfo("version"); ?>';
					var wpu_installed_plugins = jQuery.parseJSON('<?php echo $this->list_plugins() ?>');
					var wpu_domain            = '<?php echo WPU_DOMAIN ?>';
					var wpu_license_status    = 'valid';
					var wpu_license_key       = '<?php
					if ($key = get_option( "wpu_license_key" )) {
						echo $key;
					} else {
						echo "demo";
					}
					?>';
					var wpu_plugin_version    = '<?php echo WPU_PLUGIN_VERSION ?>';
					<?php if ($wpu_just_activated): ?>var wpu_just_activated = true;<?php endif; ?>
				</script>
			<?php endif ?>
			<?php
		}

		function list_plugins(){
			$plugins = array();
			// foreach ( get_plugins() as $plugin_info ){
			// 	if (isset($plugin_info['Name']) && $plugin_info['Version'])
			// 		$plugins[$plugin_info['Name']] = $plugin_info['Version'];
			// }
			return json_encode($plugins);
		}

		function bal_http_request_args($r){
			$r['timeout'] = 15;
			return $r;
		}

		function bal_http_api_curl($handle){
			curl_setopt( $handle, CURLOPT_CONNECTTIMEOUT, 15 );
			curl_setopt( $handle, CURLOPT_TIMEOUT, 15 );
		}

		function track($data){
		return false; // Tracking disabled for now
		$response = wp_remote_post( "http://www.wpuniversity.com/wp-admin/admin-ajax.php", array(
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

	function activate_plugin(){
		// mlog("activate_plugin");
		update_option( 'wpu_just_activated', true );
		update_option( 'wpu_track_data', true );
		$data = array(
			'source' => 'plugin',
			'action' => 'track',
			'type' => 'activate'
			);
		$this->track($data);
		add_option('wpu_do_activation_redirect', true);
	}

	function redirect(){
		// mlog("redirect");
		if (get_option('wpu_do_activation_redirect', false)) {
			// mlog('redirecting');
			delete_option('wpu_do_activation_redirect');
			wp_redirect("admin.php?page=wpu&firstuse");
			die();
		}
	}

	function deactivate_plugin(){
		// mlog('deactivate_plugin');
		$data = array(
			'source' => 'plugin',
			'action' => 'track',
			'type' => 'deactivate',
			'user' => get_option( "wpu_license_key" )
			);
		$this->track($data);
		?>
		<?php
	}
}

$wpu = new wpu;
if (!defined('WPU_PLUGIN_DEGBUG')){
	// mlog('Setting up Activation Hooks');
	register_activation_hook( __FILE__, array($wpu,'activate_plugin') );
	register_deactivation_hook( __FILE__, array($wpu,'deactivate_plugin')  );
}

add_filter('http_request_args', array($wpu,'bal_http_request_args'), 100, 1);
add_action('http_api_curl', array($wpu,'bal_http_api_curl'), 100, 1);
add_action('admin_menu', array($wpu,'setup_menu'));
add_action('admin_init', array($wpu,'redirect'));

// add_action('admin_init', array($wpu,'wpu_register_option'));
// add_action('admin_init', array($wpu,'wpu_activate_license'));
// add_action('admin_init', array($wpu,'wpu_deactivate_license'));

// if ( ! empty ( $GLOBALS['pagenow'] ) && 'plugins.php' === $GLOBALS['pagenow'] )
	// add_action( 'admin_notices', array($wpu,'admin_notices'), 0 );

// if (isset($_POST['wpu_license_key']))
	// $wpu->action();


if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information')) {
	add_action('admin_footer', array($wpu,'footer'));
}

if (!defined('WPU_PLUGIN_DEGBUG'))
	require_once('wpu_init.php');



