// Single Site

'use strict';

var currently_disabled_wts;
var currently_disabled_network_wts;
var lastTimeout;
var loadCount         = 0;
var lastLoadedStatus  = null;
var loadOffset        = 0;
var activated         = 0;
var unactivated_count = 0;


function updateCounts(e){
	// jQuery('.site_list').html('');
	jQuery('.pagination .start').html(loadOffset+1);
	jQuery('.pagination .end').html(e.pages);
	jQuery('.stats .unactivated h3').html(e.counts.unactivated);
	jQuery('.stats .active h3').html(e.counts.active);
	jQuery('.stats .deactivated h3').html(e.counts.deactivated);
}

function setup_buttons_deactivate(){
	jQuery('.site button.deactivate').off('click').click(function(){

		var data = {
			action:  'sk_deactivate_single',
			blog_id: jQuery(this).parent().data('blogid'),
			user_id: jQuery(this).parent().data('userid'),
			domain:  jQuery(this).parent().data('domain'),
			path:    jQuery(this).parent().data('path')
		};

		jQuery(this).html('Deactivating...');
		jQuery('.single_activation_error').html('').hide();
		jQuery.post(ajaxurl, data, deactivateCallback(this),'json');

	});
}

function setup_buttons_next_prev(){

	jQuery('.pagination .next').off('click').click(function(e){
		e.preventDefault();

		jQuery('.pagination .prev').show();

		var lastVisibleIndex = jQuery('.site_list .site:visible:last').index();

		var start = lastVisibleIndex+1;
		var end = lastVisibleIndex+1+paginationSize;

		var oldSites = jQuery('.site_list .site:visible').addClass('hidden');
		var newSites = jQuery('.site_list .site').slice(start,end).removeClass('hidden');

		console.log('showing %s to %s', start,end);

		var visibleCount = jQuery('.site_list .site:visible').length;

		if (jQuery('.site_list .site:last:visible').length > 0) {
			jQuery('.pagination .next').hide();
		}
		checkStatusOfVisibleButtons();
	});

	jQuery('.pagination .prev').off('click').click(function(e){
		e.preventDefault();

		jQuery('.pagination .next').show();

		var firstVisibleSiteIndex = jQuery('.site_list .site:visible:first').index();
		var start = firstVisibleSiteIndex  - paginationSize - 1;
		var end = firstVisibleSiteIndex;
		if (start < 0){
			start = 0;
			end = paginationSize;
		}
		var oldSites = jQuery('.site_list .site:visible').addClass('hidden');
		var newSites = jQuery('.site_list .site').slice(start,end).removeClass('hidden');

		console.log('showing %s to %s', start,end);

		if (jQuery('.site_list .site:first:visible').length > 0) {
			jQuery('.pagination .prev').hide();
		}

		checkStatusOfVisibleButtons();
	});
}


function setup_buttons_activate_batch(){
	jQuery('.activate_all').off('click').click(function(){

		var data = {
			action:  'sk_activate_batch'
		};

		jQuery('.activate_all').html('Activating...').addClass('loading');

		jQuery('.site_list .site').removeClass('hidden');

		checkStatusOfVisibleButtons(triggerAllActivations)
		.done(function(){
			jQuery('.activate_all').html('Done').removeClass('loading');
		});

	});
}

function triggerAllActivations(){
	var activateTotal = jQuery('.site .activate').length;
	jQuery.each(jQuery('.site .activate'), function(i, el){
		if (activateTotal-1 == i) {
			jQuery('.activate_all').hide().html('Activate All');
		};
		setTimeout(function(){
			jQuery('html, body').animate({scrollTop: jQuery(el).offset().top - 100}, 200);

			jQuery(el).trigger('click');
		},500 + ( i * 500 ));

	});
}

var changeStatusCallback = function(button){
	console.log('changeStatusCallback');
	return function(e){

		if (!e.success) {
			jQuery(button).html('Error').addClass('red');
			jQuery('.single_activation_error').html(e.payload.message).show();
		} else if (e.success) {

			var newButtonClass = 'deactivate';
			var newButtonName = 'Deactivate';
			var prevButtonClass = 'activate';

			if (jQuery(button).hasClass('deactivate')) {
				newButtonClass = 'activate';
				newButtonName  = 'Activate';
				prevButtonClass = 'deactivate';
			}

			jQuery(button).html('Success').addClass('green').delay(1000).queue(function(next){
				jQuery(this).html(newButtonName).removeClass(prevButtonClass).removeClass('green').addClass(newButtonClass);
				next();
			});

		}
	};
};

function setup_buttons_activate(){
	console.log('setup_buttons_activate');
	jQuery('.site_list button').off('click').click(function(){
		console.log('click');
		var data = {
			action:  'sk_activate_single',
			blog_id: jQuery(this).parent().data('blogid'),
			user_id: jQuery(this).parent().data('userid'),
			domain:  jQuery(this).parent().data('domain'),
			path:    jQuery(this).parent().data('path')
		};

		if (jQuery(this).hasClass('deactivate')) {
			data.action = 'sk_deactivate_single';
			jQuery(this).html('Deactivating...');
		} else {
			jQuery(this).html('Activating...');
		}

		
		jQuery('.single_activation_error').html('').hide();
		jQuery.post(ajaxurl, data, changeStatusCallback(this),'json');
	});
}

function setup_buttons(){
	setup_buttons_next_prev();
	setup_buttons_activate();
	setup_buttons_activate_batch();
}


function drawProduct(product){

	// console.log('drawProduct %o',product);
	// console.log('this %o', this);

	loadCount++;

	if (product.payload && product.payload.buckets) {

		// Clear out disabled wts so that compatibility doesn't screen out wts from this screen. Put it back after we're done.

		console.groupCollapsed('Checking Compatibilities');

		_.each(product.payload.buckets,function(bucket,key){
			// console.log('this.cacheId %o', this.cacheId);

			drawBuckets(this.cacheId,product,bucket,key,product.payload.walkthroughs);
		},this); 

		jQuery('.configure').show();

		console.groupEnd();

	} else { 
		jQuery('#' + this.cacheId).remove();
	}
}

function sk_populate(products){

	// console.log('sk_populate %o',products);

	jQuery('.sk_walkthrough_list').html('');


	if (typeof sk_config.disable_wts === 'string' && sk_config.disable_wts.indexOf(']') > -1) {
		sk_config.disable_wts = JSON.parse(sk_config.disable_wts);
	}

	if (typeof sk_config.disable_network_wts === 'string' && sk_config.disable_network_wts.indexOf(']') > -1) {
		sk_config.disable_network_wts = JSON.parse(sk_config.disable_network_wts);
	}

	if (sk_config.disable_wts) {
		currently_disabled_wts = sk_config.disable_wts;
		sk_config.disable_wts  = null;
	}

	if (sk_config.disable_network_wts) {
		currently_disabled_network_wts = sk_config.disable_network_wts;
		sk_config.disable_network_wts  = null;
	}

	_.each(products,function(product){

		// Looping over products

		if (!product.cacheId) {
			return false;
		}

		// console.log('LOAD PRODUCT -> %s', product.name);

		jQuery('.sk_walkthrough_list').append('<div class="sk_product" id="' + product.cacheId + '"><b>' + product.name + '</b> (<span class="select_all">Toggle All</span>)</div>');

		jQuery.ajax({
			url:sk_config.library + 'products/cache?cacheId=' + product.cacheId,
			cacheId: product.cacheId,
			success: drawProduct
		});
	}); 
}


function drawBuckets(cacheId,data,bucket,key,productWalkthroughs){

	// console.log('drawBuckets %o', arguments);


	clearTimeout(lastTimeout);
	lastTimeout = setTimeout(function(){setup_events();},1000);

	if (typeof sk_config.disable_wts_in_root_bucket_ids !== 'undefined' && jQuery.inArray( bucket.id, sk_config.disable_wts_in_root_bucket_ids ) > -1) {
		// Don't draw root bucket
		return false;
	}

	jQuery('#' + cacheId).append('<li class=\'sk_bucket\' id=\'sk_bucket_' + bucket.id + '\'>' + bucket.name + ' (<span class=\'select_all\'>Toggle All</span>)<ul></ul></li>');

	var pass_data = {
		bucket_id:           bucket.id,
		productWalkthroughs: productWalkthroughs
	};

	_.each(bucket.walkthroughs,function(walkthrough){

		// This is temporary for new walkthrough ordering
		if (typeof walkthrough === 'object') {
			walkthrough = productWalkthroughs[walkthrough.id];
		} else {
			walkthrough = productWalkthroughs[walkthrough];
		}

		drawWalkthrough(walkthrough,this.bucket_id);
		
	},pass_data);
}

function drawWalkthrough(walkthrough,bucket_id){

	// console.log('drawWalkthrough %o', arguments);


	var pass = false;

	if (typeof window.sk_ms_admin === 'undefined' || !window.sk_ms_admin && jQuery.inArray(parseInt(walkthrough.id,10),currently_disabled_network_wts) > -1) {
		// If single site and network disabled walkthroughs then don't even show it.
		return;
	}

	if (typeof window.sidekick !== 'undefined' && window.sidekick.compatibilityModel.check_compatiblity_array(walkthrough) || (typeof window.sk_ms_admin !== 'undefined' && window.sk_ms_admin)){
		// Only check compatibilities for single sites not network admin page
		pass = true;
	}

	if (pass){
		var checked  = false;
		var selected = false;

		if (jQuery.inArray(parseInt(walkthrough.id,10),currently_disabled_wts) > -1 || jQuery.inArray(parseInt(walkthrough.id,10),currently_disabled_network_wts) > -1) {
			checked = 'CHECKED';
		}

		if (sk_config.autostart_walkthrough_id !== 'undefined' && parseInt(sk_config.autostart_walkthrough_id,10) === parseInt(walkthrough.id,10)) {
			selected = 'SELECTED';
		}

		jQuery('#sk_bucket_' + bucket_id).find('ul').append('<li class="sk_walkthrough"><span><input type="checkbox" ' + checked + ' value=\'' + walkthrough.id + '\' name=\'disable_wts[]\'></span><span class=\'title\'>' + walkthrough.title + '</span></li>');
		jQuery('[name="sk_autostart_walkthrough_id"]').append('<option ' + selected + ' value="' + walkthrough.id + '">' + walkthrough.title + '</option>');

	}
	clearTimeout(lastTimeout);
	lastTimeout = setTimeout(function(){setup_events();},1000);
}

function setup_events(){

	jQuery('.select_all').click(function(){
		var checkBoxes = jQuery(this).parent().find('input[type="checkbox"]');

		_.each(checkBoxes,function(item){
			jQuery(item).attr('checked', !jQuery(item).attr('checked'));
		});
	});

	jQuery('[name="disable_wts[]"]').click(function(e){

		if (e.currentTarget.checked) {
			jQuery('input[value="' + e.currentTarget.value + '"]').attr('checked',true);
		} else {
			jQuery('input[value="' + e.currentTarget.value + '"]').attr('checked',false);
		}

	});

	// jQuery('.activate_all').click(function(){
	// 	jQuery('.activate_sk').each(function(key,item){
	// 		setTimeout(function() {
	// 			jQuery(item).trigger('click');
	// 		}, key*1000);
	// 	});
	// });

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
		// console.warn('Something is wrong...');
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
		error: function(){
			jQuery('.sk_license_status span').html('Invalid Key').css({color: 'red'});
			jQuery('.sk_upgrade').show();
			load_sk_library();
		},
		success: function(data){

			// console.log('%cload_sk_library success %o','color: green',data);

			if (sk_config.library + 'domains/cache?domainKey=' + sk_config.activation_id === sk_url) {
				if (!data.payload) {
					jQuery('.sk_license_status').html('Invalid Key').css({color: 'red'});
				} else {
					jQuery('.sk_license_status').html('Valid').css({color: 'green'});
				}
			}

			if (!data.payload) {
				// console.log('loading again');
				load_sk_library();
				return false;
			}

			if (data.payload) {

				window.sidekick.compatibilityModel.filter_products(data.payload.products);

				sk_populate(window.sidekick.compatibilityModel.get('passed_products'));
			}
		}
	});
}

function setup_intro_welcome_button(){
	jQuery('.sk_start_intro').on('click',function(){
		sidekick.play_intro(true); 
		Sidekick.Events.trigger('track_play_intro',{
			location: 'welcome_header'
		});
	});
}

function checkStatusOfVisibleButtons(callback){
	

	var blogIdList = jQuery('button.checking:visible').closest('.site').map(function(){
		return jQuery(this).data('blogid');
	}).get();

	var data = {
		action:     'sk_check_batch_status',
		blogIdList: blogIdList
	};

	return jQuery.post(ajaxurl, data, function(e){

		jQuery.each(e,function(key,blogId){
			jQuery('div[data-blogid="' + blogId + '"] button').removeClass('checking').addClass('deactivate').html('Deactivate');
		});
		jQuery('button.checking:visible').removeClass('checking').addClass('activate').html('Activate');
		if (callback) {
			callback();
		};

	},'json');

}

function setup_sk_admin(){
	// console.log('setup_sk_admin');
	if (jQuery('.sidekick_admin').length === 0) {
		return;
	}

	jQuery('.open_composer').click(function(e){
		e.preventDefault();
		jQuery('#toggle_composer').trigger('click');
	});

	if (typeof window.sk_ms_admin !== 'undefined' && window.sk_ms_admin) {

		// Multisite
		checkStatusOfVisibleButtons();

		var clicked_button;

		if (typeof window.last_site_key !== 'undefined') {
			load_sk_library(window.last_site_key);
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

	} else {

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
	}
}

jQuery(document).ready(function($) {
	setup_buttons();
	setup_intro_welcome_button();
});
