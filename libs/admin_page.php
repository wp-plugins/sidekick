<style type="text/css">

	.wrapper_main{
		display:                -webkit-box;      /* OLD - iOS 6-, Safari 3.1-6 */
		display:                -moz-box;         /* OLD - Firefox 19- (buggy but mostly works) */
		display:                -ms-flexbox;      /* TWEENER - IE 10 */
		display:                -webkit-flex;     /* NEW - Chrome */
		display:                flex;             /* NEW, Spec - Opera 12.1, Firefox 20+ */
		-webkit-flex-wrap:      wrap;
		-moz-flex-wrap:         wrap;
		-ms-flex-wrap:          wrap;
		flex-wrap:              wrap;
		-webkit-flex-direction: row;
		-moz-flex-direction:    row;
		-ms-flex-direction:     row;
		flex-direction:         row;
	}

	.wrapper_main h3{
		margin: 0;
	}

	.wrapper_main .sk_box{
		-webkit-box-flex: 1;
		-moz-box-flex:    1;
		-webkit-flex:     1;
		-ms-flex:         1;
		flex:             1;
		max-width:        50%;
	}

	.wrapper_left{
		-webkit-flex-direction: column;
		-moz-flex-direction: column;
		-ms-flex-direction: column;
		flex-direction: column;
	}

	.wrapper_left .sk_box{
		max-width:  100%;
	}

	.wrapper_right{
		-webkit-flex-direction: column;
		-moz-flex-direction:    column;
		-ms-flex-direction:     column;
		flex-direction:         column;
	}

	.wrapper_right .sk_box{
		max-width:  100%;
	}

	.wrapper_wts{
		display:                -webkit-box;      /* OLD - iOS 6-, Safari 3.1-6 */
		display:                -moz-box;         /* OLD - Firefox 19- (buggy but mostly works) */
		display:                -ms-flexbox;      /* TWEENER - IE 10 */
		display:                -webkit-flex;     /* NEW - Chrome */
		display:                flex;             /* NEW, Spec - Opera 12.1, Firefox 20+ */
		-webkit-flex-direction: row;
		-moz-flex-direction:    row;
		-ms-flex-direction:     row;
		flex-direction:         row;
		-webkit-flex-wrap:      wrap;
		-moz-flex-wrap:         wrap;
		-ms-flex-wrap:          wrap;
		flex-wrap:              wrap;
	}

	.sk_bucket ul{
		display:                -webkit-box;      /* OLD - iOS 6-, Safari 3.1-6 */
		display:                -moz-box;         /* OLD - Firefox 19- (buggy but mostly works) */
		display:                -ms-flexbox;      /* TWEENER - IE 10 */
		display:                -webkit-flex;     /* NEW - Chrome */
		display:                flex;             /* NEW, Spec - Opera 12.1, Firefox 20+ */
		-webkit-flex-direction: row;
		-moz-flex-direction:    row;
		-ms-flex-direction:     row;
		flex-direction:         row;
		-webkit-flex-wrap:      wrap;
		-moz-flex-wrap:         wrap;
		-ms-flex-wrap:          wrap;
		flex-wrap:              wrap;
	}

	.sk_bucket ul div{
		-webkit-flex-grow: 2;
		-moz-flex-grow:    2;
		-ms-flex-grow:     2;
		flex-grow:         2;
		min-width:         50%;
		max-width:         50%;
	}



	.wrapper_wts .sk_product{
		min-width: 100%;
	}

	.configure{
		display: none;
	}



	.wrapper_wts .sk_box span{
		padding: 3px;
		/*display: block;*/
	}

	.well{
		background-color: #fbfbfb;
		margin-right:     10px;
		margin-bottom:    10px;
		padding:          20px;
		border:           1px solid #e3e3e3;
		border-radius:    4px;
		min-height:       150px;
		overflow:         hidden;
	}

	.advanced{
		display: none;
	}

	.sidekick_admin a{
		color: #F2641E;
	}

	.sidekick_admin ul{
		margin-left: 20px;
	}



	.sidekick_admin ul li{
		list-style-type: disc;
		list-style-position: outside;
		margin-left: 20px;
	}

	#sk_dashboard_message{
		padding:15px;
		position:relative;
	}

	a.sk_upgrade{
		background-color: green;
		color:            white;
		border-radius:    3px;
		text-decoration:  none;
		padding:          3px;
		margin-left:      10px;
	}

	.composer_beta_button{
		background: #ff712b;
		background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJod…EiIGhlaWdodD0iMSIgZmlsbD0idXJsKCNncmFkLXVjZ2ctZ2VuZXJhdGVkKSIgLz4KPC9zdmc+);
		background: -moz-linear-gradient(top, #ff712b 0%, #ed5f19 100%);
		background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #ff712b), color-stop(100%, #ed5f19));
		background: -webkit-linear-gradient(top, #ff712b 0%, #ed5f19 100%);
		background: -o-linear-gradient(top, #ff712b 0%, #ed5f19 100%);
		background: -ms-linear-gradient(top, #ff712b 0%, #ed5f19 100%);
		background: linear-gradient(to bottom, #ff712b 0%, #ed5f19 100%);
		filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ff712b', endColorstr='#ed5f19', GradientType=0);
		border-radius: 2px;
		text-align:    center;
		float:         right;
		color:         white;
		padding:       10px;
		font-size:     24px;
		line-height:   29px;
		border:        solid 4px #9C3D0E;
		margin-top:    20px;
		font-family:   "Lucida Sans Unicode", "Lucida Grande", sans-serif;
	}

	.composer_beta_button:hover{
		background: #e05c1b;
	}

	input.regular-text{
		width: 100%;
	}

	span.select_all{
		cursor:          pointer;
		color:           #F2641E;
		text-decoration: underline;
	}

	.sk_bucket{
		margin-top:       5px;
		background-color: #F1F1F1;
		padding:          5px;
		list-style-type:  none;
	}

	.sidekick_admin ul li.sk_walkthrough{
		list-style-type: none;
		padding-left:    0px;
		margin:          0px;
		min-width:       47%;
		max-width:       47%;
		margin-bottom:   5px;
	}

	.sidekick_admin ul li.sk_walkthrough span{
		margin-left: -20px;
	}

	.sidekick_admin ul li.sk_walkthrough span.title{
		margin-left: 0px;
		padding-right: 20px;
	}

</style>


<script type="text/javascript">

	function sk_populate(data){

		jQuery('.sk_walkthrough_list').html('');

		var sk_prod_counter = 1;


		_.each(data.products,function(item,key){

			var last = false;
			sk_prod_counter++;

			if (!item.cacheId) {
				return false;
			};

			console.log('data.products %o', data.products);

			console.log('sk_prod_counter %o', sk_prod_counter);


			if (_.size(data.products) == sk_prod_counter) {
				last = true;
			};

			jQuery('.sk_walkthrough_list').append('<div class="sk_product" id="' + item.cacheId + '"><b>' + item.name + '</b> (<span class="select_all">Toggle All</span>)</div>');

			jQuery.ajax({
				url:sk_config.library + 'products/cache?cacheId=' + item.cacheId,
				cacheId: item.cacheId,
				last: last,
				success: function(data,cacheId){

					if (data.payload.buckets) {

						// Clear out disabled wts so that compatibility doesn't screen out wts from this screen. Put it back after we're done.
						var currently_disabled_wts = sk_config.disable_wts;
						sk_config.disable_wts = null;

						console.groupCollapsed('Checking Compatibilities');

						_.each(data.payload.buckets,function(bucket,key){

							jQuery('#' + item.cacheId).append("<li class='sk_bucket' id='sk_bucket_" + bucket.id + "'>" + bucket.name + " (<span class=\"select_all\">Toggle All</span>)<ul></ul></li>");

							_.each(bucket.walkthroughs,function(walkthrough,key){
								if (sidekick.compatibilityModel.check_compatiblity_array(this.all_walkthroughs[key])){
									var checked = false;
									var selected = false;

									if (jQuery.inArray(parseInt(key),currently_disabled_wts) > -1) {
										checked = 'CHECKED'
									};

									if (sk_config.autostart_walkthrough_id !== 'undefined' && sk_config.autostart_walkthrough_id == parseInt(key)) {
										selected = 'SELECTED';
									};

									jQuery('#sk_bucket_' + this.bucket_id).find('ul').append("<li class=\" sk_walkthrough\"><span><input type=\"checkbox\" " + checked + " value='" + key + "' name=\"disable_wts[]\"></span><span class='title'>" + this.all_walkthroughs[key].title + "</span></li>");
									jQuery('[name="sk_autostart_walkthrough_id"]').append('<option ' + selected + ' value="' + key + '">' + this.all_walkthroughs[key].title + '</option>');

								}
							},{bucket_id: bucket.id,all_walkthroughs: data.payload.walkthroughs})
						}); //

						console.groupEnd();//

					} else { //
						jQuery('#' + this.cacheId).remove();
					}

					console.log('last %o', last);


					if (last) {
						jQuery('.sk_bucket').not(':has(li)').remove();

						jQuery('.select_all').click(function(){
							var checkBoxes = jQuery(this).parent().find('input[type="checkbox"]');
							_.each(checkBoxes,function(item,key){
								jQuery(item).attr("checked", !jQuery(item).attr("checked"));
							});
						});

						jQuery('[name="disable_wts[]"]').click(function(e){

							if (e.currentTarget.checked) {
								jQuery('input[value="' + e.currentTarget.value + '"]').attr('checked',true);
							} else {
								jQuery('input[value="' + e.currentTarget.value + '"]').attr('checked',false);
							}

						});

						jQuery('.configure').show();

						// Set the disable_wts back to original state
						sk_config.disable_wts = currently_disabled_wts;

					};
				}
			});
		}); //
	} //

	function load_sk_library($key){

		if ($key) {
			var sk_url = sk_config.library + 'domains/cache?domainKey=' + sk_config.activation_id;
		} else {
			var sk_url = sk_config.library + 'platform/cache?platformId=1';
		}

		jQuery.ajax({
			url: sk_url,
			error: function(data){
				jQuery('.sk_license_status span').html('Invalid Key').css({color: 'red'});
				jQuery('.sk_upgrade').show();
			},
			success: function(data){

				if (sk_config.library + 'domains/cache?domainKey=' + sk_config.activation_id == sk_url) {
					if (!data.payload) {
						jQuery('.sk_license_status').html('Invalid Key').css({color: 'red'});
					} else {
						jQuery('.sk_license_status').html('Valid').css({color: 'green'});
					}
				}

				if (!data.payload) {
					load_sk_library();
					return false;
				}

				if (data.payload) {
					sk_populate(data.payload);
				}
			}
		})
	}

	jQuery(document).ready(function($) {
		if (sk_config.activation_id) {
			load_sk_library(sk_config.activation_id);
		} else {
			jQuery('.sk_upgrade').show();
			jQuery('.configure').hide();
		}

		jQuery('h3:contains(Configure)').click(function(e){
			if (e.shiftKey) {
				jQuery('.advanced').show();
			};
		})

	});

</script>


<div class="page-header"><h2><a id="pluginlogo_32" class="header-icon32" href="http://www.sidekick.pro/modules/wordpress-core-module-premium/?utm_source=plugin&utm_medium=settings&utm_campaign=header" target="_blank"></a>Sidekick Dashboard</h2></div>

<h3>Welcome to the fastest and easiest way to learn WordPress</h3>

<?php if (isset($error_message)): ?>
	<div class="error" id="sk_dashboard_message">
		There was a problem activating your license. The following error occured <?php echo $error_message ?>
	</div>
<?php elseif (isset($error)): ?>
	<div class="error" id="sk_dashboard_message">
		<?php echo $error ?>
	</div>
<?php elseif (isset($warn)): ?>
	<div class="updated" id="sk_dashboard_message">
		<?php echo $warn ?>
	</div>
<?php elseif (isset($success)): ?>
	<div class="updated" id="sk_dashboard_message">
		<?php echo $success ?>
	</div>
<?php endif ?>

<div class="sidekick_admin wrapper_main">

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
										<td><input class='regular-text' type='text' name='activation_id' value='<?php echo $activation_id ?>'></input></td>
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
					<h3>Build Your Own Walkthroughs - Get Composer</h3>
					<a href='http://www.sidekick.pro/plans/create_wp_walkthroughs/?utm_source=plugin&utm_medium=settings&utm_campaign=composer' target='_blank'><div class='composer_beta_button'>Get<br/>Composer</div></a>
					<ul>
						<li>Get more info about <a href='http://www.sidekick.pro/composer' target='_blank'>Composer</a> now!</li>
						<li><a href="http://www.sidekick.pro/plans/create_wp_walkthroughs/" target="_blank">Check out our Composer Plans</a></li>
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
					<h3>Configure</h3>

					<form method='post'>

						<h4>Auto Start Walkthrough</h4>

						<p>This Walkthrough will be played once for every user that logs into the backend of WordPress.</p>
						<select name='sk_autostart_walkthrough_id'>
							<option value='0'>No Auto Start</option>
						</select>
						<input class='button button-primary' type='submit' value='Save'/>

						<h4>Turn Off Walkthroughs</h4>

						<p>Below you can turn off specific Walkthroughs for this website.</p>
						<div class='sk_walkthrough_list wrapper_wts'>
							Loading...
						</div>
						<input class='button button-primary' type='submit' value='Save'/>
						<input type='hidden' name='setting_disabled' value='true'/>
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
						<li><a href="http://www.sidekick.pro/wordpress/modules/wordpress-core-module-premium/">Check out the full WordPress Core Premium (150+ Walkthroughs)</a></li>
						<li><a href="http://wordpress.org/support/plugin/sidekick" target="_blank"><strong>Visit the plugin Help &amp; Support page</strong></a>.</li>
					</ul>
				</div>
			</div>
		</div>
	</div>



