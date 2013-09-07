<?php

mlog('WPU: PHP Init');
if (defined('WPU_PLUGIN_DEGBUG')) {
	mlog('WPU: PHP Debug');
	$wpu = new wpuDev;
}

if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information')) {
	add_action('admin_enqueue_scripts', array($wpu,'enqueue'));
	if (defined('WPU_PLUGIN_DEGBUG')) {
		add_action('admin_footer', array($wpu,'footer_dev'));
	}
}
add_action('admin_init', array($wpu,'edd_sl_updater'));