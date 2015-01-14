<?php

if (defined('SK_PLUGIN_DEGBUG')) {
	// mlog('PHP: Sidekick run debug class');
	$sidekick = new SidekickDev;
}

if (!(isset($_GET['tab']) && $_GET['tab'] == 'plugin-information') && !defined('IFRAME_REQUEST')) {
	add_action('admin_enqueue_scripts',              array($sidekick,'enqueue'));
	add_action('admin_enqueue_scripts',              array($sidekick,'enqueue_required'));
	add_action('customize_controls_enqueue_scripts', array($sidekick,'enqueue'));

	if (defined('SK_PLUGIN_DEGBUG')) {
		add_action('admin_footer',                            array($sidekick,'footer_dev'));
		add_action('customize_controls_print_footer_scripts', array($sidekick,'footer_dev'));
	}
}
