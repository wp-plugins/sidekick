<?php

/*
Plugin Name: Sidekick
Plugin URL: http://www.wpuniversity.com/plugin/
Description: Adds a real-time WordPress training right into your Dashboard
Requires at least: 3.5
Tested up to: 3.6.1
Version: 1.00
Author: WPUniversity.com
Author URI: http://www.wpuniversity.com
*/

define('SK_DOMAIN','http://www.wpuniversity.com');
define('SK_PLUGIN_VERSION',1.00);
define('SK_LIBRARY_VERSION',3);
define('SK_PLATFORM_VERSION',3);

// this is the URL our updater / license checker pings. This should be the URL of the site with EDD installed
define( 'SK_STORE_URL', 'http://www.wpuniversity.com' ); // you should use your own CONSTANT name, and be sure to replace it throughout this file

// the name of your product. This should match the download name in EDD exactly
define( 'SK_ITEM_NAME', 'WPUniversity' ); // you should use your own CONSTANT name, and be sure to replace it throughout this file

if ( ! defined( 'SK_SL_PLUGIN_DIR' ) ) define( 'SK_SL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
if ( ! defined( 'SK_SL_PLUGIN_URL' ) ) define( 'SK_SL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
if ( ! defined( 'SK_SL_PLUGIN_FILE' ) ) define( 'SK_SL_PLUGIN_FILE', __FILE__ );
if ( !function_exists('mlog')) {
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

	function enqueue(){
		// mlog('Sidekick Prod');
		if ($license = get_option("sk_license_key")){
			define('SK_LIBRARY_FILE', "http://library.sidekick.pro/library/v3/releases/{$license}/library.js");
		} else {
			define('SK_LIBRARY_FILE', "http://library.sidekick.pro/library/v3/sources/wpuniversity-free_library.js");
		}

		wp_enqueue_script('sidekick'   ,'http://platform.sidekick.pro/v3/sidekick.min.js',				array('backbone','jquery','underscore','jquery-effects-highlight'), SK_PLUGIN_VERSION);
		wp_enqueue_script('sk'         ,plugins_url( '/js/sk.source.js'		, __FILE__ ),				array('sidekick')	,SK_PLUGIN_VERSION);
		wp_enqueue_script("sk_library" , SK_LIBRARY_FILE					,							array("sk")			,rand(1, 5000));
		wp_enqueue_style('sk-style'    ,plugins_url( '/css/sidekick_wordpress.css' , __FILE__ ),		null 				,SK_PLUGIN_VERSION);
	}

	function setup_menu(){
		add_menu_page( 'Sidekick', 'Sidekick', 'activate_plugins', 'sidekick', array(&$this,'admin_page'));
	}

	function admin_page(){
		$license    = get_option( 'sk_license_key' );
		$status     = get_option( 'sk_license_status' );
		$email      = get_option( 'sk_email' );
		$first_name = get_option( 'sk_first_name' );
		$track_data = get_option( 'sk_track_data' );
		$error      = null;

		if (!$license) {
			$license    = get_option( 'wpu_license_key' );
			if ($license) update_option( 'sk_license_key', $license );
			$status     = get_option( 'wpu_license_status' );
			if ($status) update_option( 'sk_license_status', $status );
			$email      = get_option( 'wpu_email' );
			if ($email) update_option( 'sk_email', $email );
			$first_name = get_option( 'wpu_first_name' );
			if ($first_name) update_option( 'sk_first_name', $first_name );
		}

		if (isset($_POST['option_page']) && $_POST['option_page'] == 'sk_license') {
			if (isset($_POST['first_name'])) {
				update_option('sk_first_name',$_POST['first_name']);
				update_option('sk_email',$_POST['email']);
				if (isset($_POST['sk_track_data'])) {
					update_option( 'sk_track_data', true );
				} else {
					delete_option('sk_track_data');
				}

				$first_name         = $_POST['first_name'];
				$email              = $_POST['email'];
				$track_data         = get_option( 'sk_track_data' );
				$_POST['item_name'] = SK_ITEM_NAME;

				if (defined('SK_PLUGIN_DEGBUG')) {
					$url = 'http://dev.wpuniversity.com?action=remote_wpu_register';
				} else {
					$url = 'http://www.wpuniversity.com?action=remote_wpu_register';
				}

				$response = wp_remote_post( $url, array(
					'method'      => 'POST',
					'timeout'     => 45,
					'redirection' => 5,
					'httpversion' => '1.0',
					'blocking'    => true,
					'headers'     => array(),
					'body'        => $_POST,
					'cookies'     => array()
					)
				);

				if ( is_wp_error( $response ) ) {
					$error_message = $response->get_error_message();
					// echo "Something went wrong: $error_message";
				} else {
					$success = 'Successfully Activated';
					update_option('sk_license_key',$response['body']);
					$license = $response['body'];
					$email = $_POST['email'];
					$status = 'valid';

					update_option('sk_license_status','valid');
				}
				update_option( 'sk_activated', true );
				die('<script>window.open("' . get_site_url() . '/wp-admin/admin.php?page=sidekick&firstuse","_self")</script>');
			}
		}

		$current_user = wp_get_current_user();
		if (!$first_name)
			$first_name = $current_user->user_firstname;

		if (!$email)
			$email = $current_user->user_email;

		$track_data = get_option( 'sk_track_data' );

		global $wp_version;
		if (version_compare($wp_version, '3.4', '<=')) {
			$error = "Sorry, Sidekick requires WordPress 3.5 or higher to function.";
		}

		if (!$license) {
			$warn = "You're using the <b>Demo</b> version of Sidekick, to gain full access to the walkthrough library please fill out your name and email address below.";
		}

		if(preg_match('/(?i)msie [1-8]/',$_SERVER['HTTP_USER_AGENT'])){
			$error = "Sorry, Sidekick requires Internet Explorer 9 or higher to function.";
		}

		?>

		<?php if ($_SERVER['QUERY_STRING'] == 'page=sidekick&firstuse'): ?>
			<script type="text/javascript">
				jQuery(document).ready(function($) {
					jQuery('#wpu #logo').trigger('click');
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
				<?php if ($status == 'valid'): ?>
					<h2>Your Sidekick Account</h2>
				<?php else: ?>
					<h2>Activate <b>Full Library</b></h2>
				<?php endif ?>

				<form method="post">
					<?php settings_fields('sk_license'); ?>
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
							<?php if ($status !== 'valid'): ?>
								<tr valign="top">
									<th scope="row" valign="top">
										Data Tracking
									</th>
									<td>
										<input id="sk_track_data" name="sk_track_data" type="checkbox" class="regular-text" <?php if ($track_data): ?>CHECKED<?php endif ?> />
										<label class="description" for="sk_track_data">Help Sidekick by providing tracking data which will help us build better help tools.</label>
									</td>
								</tr>
							<?php endif; ?>
						</tbody>
					</table>
					<?php if (defined('SK_PLUGIN_DEGBUG')): ?>
						<?php submit_button('Activate Library (Debug)'); ?>
					<?php elseif ($status !== 'valid'): ?>
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

	function footer(){
		global $current_user, $wp_roles;

		$current_user      = wp_get_current_user();
		$sk_just_activated = get_option( 'sk_just_activated' );
		$track_data        = get_option( 'sk_track_data' );
		$theme             = wp_get_theme();
		$not_supported_ie  = false;

		delete_option( 'sk_just_activated' );
		foreach($wp_roles->role_names as $role => $Role) {
			if (array_key_exists($role, $current_user->caps)){
				$user_role = $role;
				break;
			}
		}

		if(preg_match('/(?i)msie [1-8]/',$_SERVER['HTTP_USER_AGENT'])){
			$not_supported_ie = true;
		}

		?>

		<?php if (!$not_supported_ie): ?>

			<script type="text/javascript">
				var sk_library_file      = '<?php echo SK_LIBRARY_FILE ?>';
				var sk_main_soft_version = '<?php echo get_bloginfo("version"); ?>';
				var sk_installed_plugins = <?php echo $this->list_plugins() ?>;
				var sk_installed_theme   = '<?php echo  $theme->Name ?>';
				var sk_theme_version     = '<?php echo $theme->Version ?>';
				var sk_domain            = '<?php echo SK_DOMAIN ?>';
				var sk_license_status    = '<?php echo get_option( "sk_license_status" ) ?>';
				<?php if ($license_key = get_option( "sk_license_key" )): ?>
					var sk_license_key       = '<?php echo $license_key ?>';
				<?php else: ?>
					var sk_license_key       = 'demo';
				<?php endif ?>
				var sk_plugin_version    = <?php echo SK_PLUGIN_VERSION ?>;
				var sk_library_version   = <?php echo SK_LIBRARY_VERSION ?>;
				var sk_platform_version  = <?php echo SK_PLATFORM_VERSION ?>;
				var sk_track_data        = '<?php echo get_option( 'sk_track_data' ) ?>';
				var sk_user_level        = '<?php echo $user_role ?>';
				<?php if ($sk_just_activated): ?>var sk_just_activated = true;<?php endif; ?>
			</script>

			<?php if ($track_data): ?>
				<script id="IntercomSettingsScriptTag">
					window.intercomSettings = {
						email: "<?php echo $current_user->user_email; ?>",
						created_at: 1234567980,
						app_id: "75fbe21e31b2881f775fba2ff3ff7928485478e8",
						// last_date_watched : 0,
						// walkthroughs_watched: 0,
						// number_of_plugins: 0,
						// domain: 0,
						// first_name: 0,
						// plugin_version: '<?php echo SK_PLUGIN_VERSION ?>'
					}
				</script>
				<script>(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',intercomSettings);}else{var d=document;var i=function(){i.c(arguments)};i.q=[];i.c=function(args){i.q.push(args)};w.Intercom=i;function l(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://static.intercomcdn.com/intercom.v1.js';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);}if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}};})()</script>
			<?php endif ?>
		<?php endif ?>
		<?php
	}

	function list_plugins(){
		$active_plugins = wp_get_active_and_valid_plugins();
		echo '[';
		foreach ($active_plugins as $plugins_key => $plugin) {
			$data = get_plugin_data( $plugin, false, false );

			$plugins[addslashes($data['Name'])] = $data['Version'];
			if ($plugins_key > 0) echo ',';
			$data['Name'] = addslashes($data['Name']);
			echo "{'{$data['Name']}' : '{$data['Version']}'}";
		}
		echo ']';
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
			wp_redirect("/wp-admin/admin.php?page=sidekick&firstuse");
			die();
		}
	}

	function deactivate_plugin(){
		$track_data = get_option( 'sk_track_data' );
		if ($track_data) {
			$data = array(
				'source' => 'plugin',
				'action' => 'track',
				'type' => 'deactivate',
				'user' => get_option( "sk_license_key" )
				);
			$this->track($data);
			?>
			<script type="text/javascript">
				window._gaq = window._gaq || [];
				window._gaq.push(['wpu._setAccount', 'UA-39283622-1']);

				(function() {
					var ga_wpu = document.createElement('script'); ga_wpu.type = 'text/javascript'; ga_wpu.async = true;
					ga_wpu.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
					var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga_wpu, s);
				})();
				window._gaq.push(['wpu._trackEvent', 'Plugin - Deactivate', '', <?php echo SK_PLUGIN_VERSION ?>, 0,true]);
			</script>
			<?php
		}
	}
}

$sidekick = new Sidekick;
if (!defined('SK_PLUGIN_DEGBUG')){
	mlog('Setting up Activation Hooks');
	register_activation_hook( __FILE__, array($sidekick,'activate_plugin') );
	register_deactivation_hook( __FILE__, array($sidekick,'deactivate_plugin')  );
}

add_filter('http_request_args', array($sidekick,'bal_http_request_args'), 100, 1);
add_action('http_api_curl', array($sidekick,'bal_http_api_curl'), 100, 1);
add_action('admin_menu', array($sidekick,'setup_menu'));
add_action('admin_init', array($sidekick,'redirect'));

if (!defined('SK_PLUGIN_DEGBUG'))
	require_once('sk_init.php');

if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information')) {
	add_action('admin_footer', array($sidekick,'footer'));
	add_action('customize_controls_print_footer_scripts', array($sidekick,'footer'));
}


