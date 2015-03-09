<div class="sk_box configure">
	<div class="well">
		<h3>Configure - Auto Start</h3>

		<form method='post'>

			<p>This Walkthrough will be played once for every user that logs into the backend of WordPress.</p>
			<select name='sk_autostart_walkthrough_id'>
				<option value='0'>No Auto Start</option>
			</select>
			<input class='button button-primary' type='submit' value='Save'/>
			<input type='hidden' name='is_ms_admin' value='<?php echo (isset($is_ms_admin)) ? $is_ms_admin : false ?>'/>
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