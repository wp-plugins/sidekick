<!-- ms_admin_page.php -->

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
			<?php require_once('walkthrough_config.php') ?>
		</div>
	</div>


</div>

<!-- //ms_admin_page.php -->


