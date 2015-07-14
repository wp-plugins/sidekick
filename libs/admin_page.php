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
										<td><span style='color: blue' class='sk_license_status'><span><?php echo ucfirst($status) ?></span>  <a style='display: none' class='sk_upgrade' href='http://www.sidekick.pro/modules/wordpress-core-module-premium/?utm_source=plugin&utm_medium=settings&utm_campaign=upgrade<?php echo ($affiliate_id) ? '&ref=' . $affiliate_id : '' ?>' target="_blank"> Upgrade Now!</a> </span></td>
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
					<a href='http://www.sidekick.pro/plans/create_wp_walkthroughs/?utm_source=plugin&utm_medium=settings&utm_campaign=composer<?php echo ($affiliate_id) ? '&ref=' . $affiliate_id : '' ?>' target='_blank'><div class='composer_beta_button'>Build Your Own<br/>Walkthroughs</div></a>
					<ul>
						<li>Get more info about <a href='http://www.sidekick.pro/how-it-works/?utm_source=plugin&utm_medium=settings&utm_campaign=composer<?php echo ($affiliate_id) ? '&ref=' . $affiliate_id : '' ?>' target='_blank'>Custom Walkthroughs</a> now!</li>
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
							<li>You can find our terms of use <a target="_blank" href="http://www.sidekick.pro/terms-of-use/<?php echo ($affiliate_id) ? '&ref=' . $affiliate_id : '' ?>">here</a></li>
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

			<?php require_once('walkthrough_config.php') ?>

			<div class="sk_box love">
				<div class="well">
					<h3>Love the Sidekick plugin?</h3>
					<ul>
						<li>Please help spread the word!</li>
						<li><a href="https://twitter.com/share" class="twitter-share-button" data-url="http://sidekick.pro" data-text="I use @sidekickhelps for the fastest and easiest way to learn WordPress." data-via="sidekickhelps" data-size="large">Tweet</a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script></li>
						<li>Like SIDEKICK? Please leave us a 5 star rating on <a href='http://WordPress.org' target='_blank'>WordPress.org</a></li>
						<li><a href="http://www.sidekick.pro/plans/wordpress-basics/<?php echo ($affiliate_id) ? '&ref=' . $affiliate_id : '' ?>">Sign up for a full WordPress Basics package</a></li>
						<li><a href="http://support.sidekick.pro/collection/50-quick-start-guides" target="_blank"><strong>Visit the SIDEKICK Quick Start guides</strong></a>.</li>
					</ul>
				</div>
			</div>
		</div>
	</div>



