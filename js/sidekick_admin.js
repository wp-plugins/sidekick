// Single Site

var currently_disabled_wts;
var currently_disabled_network_wts;
var lastTimeout;
var loadCount = 0;

function sk_populate(data){

	jQuery('.sk_walkthrough_list').html('');

	_.each(data.products,function(item,key){

		if (!item.cacheId) {
			return false;
		}

		jQuery('.sk_walkthrough_list').append('<div class="sk_product" id="' + item.cacheId + '"><b>' + item.name + '</b> (<span class="select_all">Toggle All</span>)</div>');


		if (sk_config.disable_wts) {
			currently_disabled_wts = sk_config.disable_wts;
			sk_config.disable_wts  = null;
		}

		if (sk_config.disable_network_wts) {
			currently_disabled_network_wts = sk_config.disable_network_wts;
			sk_config.disable_network_wts  = null;
		}

		jQuery.ajax({
			url:sk_config.library + 'products/cache?cacheId=' + item.cacheId,
			cacheId: item.cacheId,
			success: function(data,cacheId){

				// console.log('SUCCESS %o',arguments);
				loadCount++;

				if (data.payload && data.payload.buckets) {

					// Clear out disabled wts so that compatibility doesn't screen out wts from this screen. Put it back after we're done.

					console.groupCollapsed('Checking Compatibilities');

					_.each(data.payload.buckets,function(bucket,key){

						clearTimeout(lastTimeout);
						lastTimeout = setTimeout(function(){setup_events();},1000);

						if (typeof sk_config.disable_wts_in_root_bucket_ids !== 'undefined' && jQuery.inArray( bucket.id, sk_config.disable_wts_in_root_bucket_ids ) > -1) {
							// Don't draw root bucket
							return false;
						}

						jQuery('#' + item.cacheId).append("<li class='sk_bucket' id='sk_bucket_" + bucket.id + "'>" + bucket.name + " (<span class=\"select_all\">Toggle All</span>)<ul></ul></li>");

						var pass_data = {
							bucket_id:        bucket.id,
							all_walkthroughs: data.payload.walkthroughs
						};

						_.each(bucket.walkthroughs,function(walkthrough,key){

							var pass = false;

							if (typeof sk_ms_admin === 'undefined' || !sk_ms_admin && jQuery.inArray(parseInt(key,10),currently_disabled_network_wts) > -1) {
								// If single site and network disabled walkthroughs then don't even show it.
								return;
							}

							if (sidekick.compatibilityModel.check_compatiblity_array(this.all_walkthroughs[key]) || (typeof sk_ms_admin !== 'undefined' && sk_ms_admin)){
								// Only check compatibilities for single sites not network admin page
								pass = true;
							}

							if (pass){
								var checked  = false;
								var selected = false;

								if (jQuery.inArray(parseInt(key,10),currently_disabled_wts) > -1 || jQuery.inArray(parseInt(key,10),currently_disabled_network_wts) > -1) {
									checked = 'CHECKED';
								}

								if (sk_config.autostart_walkthrough_id !== 'undefined' && sk_config.autostart_walkthrough_id == parseInt(key,10)) {
									selected = 'SELECTED';
								}

								jQuery('#sk_bucket_' + this.bucket_id).find('ul').append("<li class=\" sk_walkthrough\"><span><input type=\"checkbox\" " + checked + " value='" + key + "' name=\"disable_wts[]\"></span><span class='title'>" + this.all_walkthroughs[key].title + "</span></li>");
								jQuery('[name="sk_autostart_walkthrough_id"]').append('<option ' + selected + ' value="' + key + '">' + this.all_walkthroughs[key].title + '</option>');

							}
							clearTimeout(lastTimeout);
							lastTimeout = setTimeout(function(){setup_events();},1000);
						},pass_data);

					}); //

					jQuery('.configure').show(); //

					console.groupEnd();//

				} else { //
					jQuery('#' + this.cacheId).remove();
				}

			}
		});
		}); //
	} //

	function setup_events(){
		// console.log('setup_events');

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

		jQuery('.activate_all').click(function(){
			jQuery('.activate_sk').each(function(key,item){
				setTimeout(function() {
					jQuery(item).trigger('click');
				}, key*1000);
			});
		});

		jQuery('.sk_bucket').not(':has(li)').remove();
		jQuery('.sk_product').not(':has(li)').remove();

		// Set the disable_wts back to original state
		sk_config.disable_wts         = currently_disabled_wts;
		sk_config.disable_network_wts = currently_disabled_network_wts;
	}

	function load_sk_library($key){

		// console.log('BBBB load_sk_library %o', $key);
		var sk_url;

		if (loadCount > 5) {
			console.warn('Something is wrong...');
			return false;
		}

		if ($key) {
			sk_url = sk_config.library + 'domains/cache?domainKey=' + $key;
		} else {
			sk_url = sk_config.library + 'platform/cache?platformId=1';
		}

		loadCount++;

		jQuery.ajax({
			url: sk_url,
			error: function(data){
				jQuery('.sk_license_status span').html('Invalid Key').css({color: 'red'});
				jQuery('.sk_upgrade').show();
				load_sk_library();
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
		});
	}

	jQuery(document).ready(function($) {

		if (jQuery('.sidekick_admin').length === 0) {
			return;
		}

		if (typeof sk_ms_admin !== 'undefined' && sk_ms_admin) {

			// Multisite

			var clicked_button;

			if (typeof last_site_key !== 'undefined') {
				load_sk_library(last_site_key);
			} else {
				jQuery('.sk_box.configure').html('Need to activate at least one site to configure walkthroughs').show();
			}

			jQuery('.activate_sk').click(function(){

				clicked_button = this;
				jQuery('.single_activation_error').html('');

				var data = {
					action:  'sk_activate_single',
					blog_id: jQuery(this).data('blogid'),
					user_id: jQuery(this).data('userid'),
					domain:  jQuery(this).data('domain'),
					path:    jQuery(this).data('path')
				};

				jQuery.post(ajaxurl, data, function(e){

					if (!e.success) {
						jQuery('.single_activation_error').html(e.message);
						jQuery(clicked_button).parent().html('- <span class="not_active">Error Activating</span>');
					} else if (e.success) {
						jQuery(clicked_button).parent().html('- <span class="green">Activated</span>');
					}
				},'json');

			});

			if (jQuery('select[name="sk_selected_subscription"]').val().indexOf('roduct') > -1) {
				jQuery('.walkthrough_library').show();
			}

			jQuery('select[name="sk_selected_subscription"]').on('change',function(){
				if (jQuery('select[name="sk_selected_subscription"]').val().indexOf('roduct') > -1) {
					jQuery('.walkthrough_library').show();
				} else {
					jQuery('.walkthrough_library').val(0);
					jQuery('.walkthrough_library').hide();
				}
			});

		} else {
			jQuery(document).ready(function($) {
				if (sk_config.activation_id) {
					load_sk_library(sk_config.activation_id);
				} else {
					jQuery('.sk_upgrade').show();
				}

				jQuery('h3:contains(My Sidekick Account)').click(function(e){
					if (e.shiftKey) {
						jQuery('.advanced').show();
					}
				});

			});
		}

	});


