// Single Site

var currently_disabled_wts;
var currently_disabled_network_wts;
var lastTimeout;
var loadCount         = 0;
var lastLoadedStatus  = null;
var loadOffset        = 0;
var maxLoadOffset     = null;
var activated         = 0;
var unactivated_count = 0;

function load_sites_by_status(status,target){

	activated = 0;

	if (status) {
		lastLoadedStatus = status;
	} else {
		status = lastLoadedStatus;
	}

	jQuery('.stats>div').removeClass('selected');
	jQuery('.stats .' + status).addClass('selected');
	jQuery('.sites h2 span').html(status + ' site list');

	if (parseInt(jQuery(target).find('h3').html(),10) === 0) {
		jQuery('.site_list').html('<div class="site">No Sites</div>');
		jQuery('.sites .action').hide();
		return false;
	} else {
		jQuery('.sites .action').show();
	}

	var data = {
		action:  'sk_load_sites_by_status',
		status: status,
		offset: (loadOffset) ? loadOffset : 0
	};

	// console.log('data %o', data);
	jQuery('.site_list .site').fadeTo('fast',0.5);


	jQuery.post(ajaxurl, data, function(e,msg){

		// console.log('back %o', e);

		jQuery('.site_list').html('');



		jQuery('.pagination .start').html(loadOffset+1);
		jQuery('.pagination .end').html(e.pages);

		jQuery('.stats .unactivated h3').html(e.counts.unactivated);
		jQuery('.stats .active h3').html(e.counts.active);
		jQuery('.stats .deactivated h3').html(e.counts.deactivated);

		var button = '<button class="activate">Activate</button></div>';

		if (lastLoadedStatus == 'active') {
			button = '<button class="deactivate">Deactivate</button></div>';
		}

		if (e.sites) {
			_.each(e.sites,function(site,key){
				jQuery('.site_list').append('<div class="site" data-path="' + site.path + '" data-domain="' + site.domain + '" data-userid="' + site.user_id + '" data-blogid="' + site.blog_id + '">' + site.domain + '/' + site.path + button);
			});
		} else {
			jQuery('.site_list').append('<div class="site">No Sites</div>');
		}


		setup_buttons();

	},'json');
}

function setup_buttons(){
	// console.log('setup_buttons');
	setup_buttons_next_prev();
	setup_buttons_activate();
	setup_buttons_deactivate();
	setup_buttons_activate_batch();
}

function setup_buttons_deactivate(){
	jQuery('.site button.deactivate').off('click').click(function(){
		window.open('https://www.sidekick.pro/profile/#/overview','_blank');
	});
}

function setup_buttons_next_prev(){

	jQuery('.pagination .next').off('click').click(function(){
		// jQuery('.site_list').html('Loading...');
		jQuery('.pagination .prev').show();

		loadOffset = loadOffset + 1;
		load_sites_by_status(null,loadOffset);

		if (loadOffset === parseInt(jQuery('.pagination .end').html(),10)-1) {
			jQuery('.pagination .next').hide();
		}

	});

	jQuery('.pagination .prev').off('click').click(function(){
		// jQuery('.site_list').html('Loading...');
		jQuery('.pagination .next').show();

		loadOffset = loadOffset - 1;
		load_sites_by_status(null,loadOffset);

		if (loadOffset === 0) {
			jQuery('.pagination .prev').hide();
		}
	});
}

function setup_buttons_activate_batch(){
	jQuery('.activate_all').off('click').click(function(){

		var data = {
			action:  'sk_activate_batch'
		};

		if (activated > 0) {
			var activated_perc = Math.round((activated/unactivated_count)*100,0);
			jQuery(this).html('Activating... ' + activated_perc + '%').addClass('loading');
		} else {
			jQuery(this).html('Activating...').addClass('loading');
		}

		jQuery.post(ajaxurl, data, function(e){

			activated += parseInt(e.activated_count,10);
			unactivated_count = parseInt(e.unactivated_count,10);

			updateStatCounts(parseInt(e.activated_count,10));
			if (parseInt(e.activated_count,10) === parseInt(e.sites_per_page,10)) {
				jQuery('.activate_all').trigger('click');
			} else {
				jQuery(this).html('Done').removeClass('loading');
			}

		},'json');

	});
}

function setup_buttons_activate(){
	jQuery('.site button.activate').off('click').click(function(){
		// console.log('activate');

		var data = {
			action:  'sk_activate_single',
			blog_id: jQuery(this).parent().data('blogid'),
			user_id: jQuery(this).parent().data('userid'),
			domain:  jQuery(this).parent().data('domain'),
			path:    jQuery(this).parent().data('path')
		};

		jQuery(this).html('Activating...');
		jQuery('.single_activation_error').html('').hide();

		// console.log('data %o', data);


		jQuery.post(ajaxurl, data, activateCallback(this),'json');

	});
}

var activateCallback = function(button){
	return function(e){

		// console.log('activateCallback back e %o', e);

		if (!e.success) {
			jQuery(button).html('Error').addClass('red');
			if (e.payload.message == 'Already Activated') {
				updateStatCounts();
			}
			jQuery('.single_activation_error').html(e.payload.message).show();
		} else if (e.success) {
			updateStatCounts();
			jQuery(button).html('Success').addClass('green');
		}
	};
};

function updateStatCounts(increment){

	var default_increment = 1;
	if (increment) {
		default_increment = increment;
	}

	jQuery('h3','div.' + lastLoadedStatus).html(parseInt(jQuery('h3','div.' + lastLoadedStatus).html(),10)-default_increment);
	jQuery('h3','div.active').html(parseInt(jQuery('h3','div.active').html(),10)+default_increment);
}

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

					// console.groupCollapsed('Checking Compatibilities');

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

							if (typeof sidekick !== 'undefined' && sidekick.compatibilityModel.check_compatiblity_array(this.all_walkthroughs[key]) || (typeof sk_ms_admin !== 'undefined' && sk_ms_admin)){
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

					// console.groupEnd();//

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

		// TODO we need to switch based on library to distribute and load the right library

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

		jQuery('.open_composer').click(function(e){
			e.preventDefault();
			jQuery('#toggle_composer').trigger('click');
		});

		if (typeof sk_ms_admin !== 'undefined' && sk_ms_admin) {

			// Multisite
			load_sites_by_status('unactivated');

			var clicked_button;

			if (typeof last_site_key !== 'undefined') {
				load_sk_library(last_site_key);
			} else {
				jQuery('.sk_box.configure').html('Need to activate at least one site to configure walkthroughs').show();
			}

			jQuery('.activate_sk').click(function(){

				clicked_button = this;
				jQuery('.single_activation_error').html('').hide();

				var data = {
					action:  'sk_activate_single',
					blog_id: jQuery(this).parent().data('blogid'),
					user_id: jQuery(this).parent().data('userid'),
					domain:  jQuery(this).parent().data('domain'),
					path:    jQuery(this).parent().data('path')
				};

				jQuery.post(ajaxurl, data, function(e){

					if (!e.success) {
						jQuery('.single_activation_error').html(e.message).show();
						jQuery(clicked_button).parent().html('- <span class="not_active">Error Activating</span>');
					} else if (e.success) {
						jQuery(clicked_button).parent().html('- <span class="green">Activated</span>');
					}
				},'json');

			});



			// if (jQuery('select[name="sk_selected_subscription"]').val().indexOf('roduct') > -1) {
				// jQuery('.walkthrough_library').show();
			// }

			// jQuery('select[name="sk_selected_subscription"]').on('change',function(){
			// 	if (jQuery('select[name="sk_selected_subscription"]').val().indexOf('roduct') > -1) {
			// 		jQuery('.walkthrough_library').show();
			// 	} else {
			// 		jQuery('.walkthrough_library').val(0);
			// 		jQuery('.walkthrough_library').hide();
			// 	}
			// });

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


