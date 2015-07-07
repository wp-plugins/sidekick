<!-- ms_admin_page.php -->

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
			<?php require_once('walkthrough_config.php') ?>
		</div>
	</div>


</div>

<!-- //ms_admin_page.php -->


