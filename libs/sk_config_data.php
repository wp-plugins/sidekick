<?php
// sk_config_data.php

if (!class_exists('sk_config_data')) {

	class sk_config_data{
		function get_domain(){
			$site_url = get_site_url();
			if(substr($site_url, -1) == '/') {
				$site_url = substr($site_url, 0, -1);
			}
			$site_url = str_replace(array("http://","https://"),array(""),$site_url);
			return $site_url;
		}

		function get_post_types(){
			global $wpdb;
			$query  = "SELECT post_type, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $type) {
				$type->post_type = str_replace('-', '_', $type->post_type);
				$output .= "\n 						post_type_{$type->post_type} : $type->count,";
			}
			return $output;
		}

		function get_themes(){
			$themes = wp_get_themes( array( 'allowed' => true ) );
			return count($themes);
		}

		function get_post_types_and_statuses(){
			global $wpdb;
			$query  = "SELECT post_type, post_status, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type, post_status";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $type) {
				$type->post_type   = str_replace('-', '_', $type->post_type);
				$type->post_status = str_replace('-', '_', $type->post_status);

				$output .= "\n 						post_type_{$type->post_type}_{$type->post_status} : $type->count,";
			}
			return $output;
		}

		function get_taxonomies(){
			global $wpdb;
			$query  = "SELECT count(distinct term_taxonomy_id) as count, taxonomy from {$wpdb->prefix}term_taxonomy group by taxonomy";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $taxonomy) {
				$taxonomy->taxonomy = str_replace('-', '_', $taxonomy->taxonomy);
				$output .= "\n 						taxonomy_{$taxonomy->taxonomy} : $taxonomy->count,";
			}
			return $output;
		}

		function get_comments(){
			global $wpdb;
			$query = "SELECT count(distinct comment_ID) as count from {$wpdb->prefix}comments";
			$counts = $wpdb->get_var($query);
			if (!$counts) $counts = 0;
			return "\n 						comment_count : $counts,";
		}

		function get_post_statuses(){
			global $wpdb;
			$query  = "SELECT post_status, count(ID) as count from {$wpdb->prefix}posts group by post_status";
			$counts = $wpdb->get_results($query);
			$output = '';

			foreach ($counts as $key => $type) {
				$type->post_status = str_replace('-', '_', $type->post_status);
				$output .= "\n 						post_status_{$type->post_status} : $type->count,";
			}
			return $output;
		}

		function get_user_data(){
			global $current_user;

			$data   = get_userdata($current_user->ID);
			$output = "\n 						user_id : $current_user->ID,";

			foreach ($data->allcaps as $cap => $val) {
				$cap = sanitize_title($cap);
				$cap = str_replace('-', '_', $cap);
				if (!$val) $val = 0;
				$output .= "\n 						cap_{$cap} : $val,";
			}
			return $output;
		}

		function get_framework(){
			global $current_user;

			$frameworks = array('genesis');

			$output = "\n 						theme_framework : false,";

			foreach ($frameworks as $framework) {
				switch ($framework) {
					case 'genesis':
					if (function_exists( 'genesis' ) ) {
						if (defined('PARENT_THEME_VERSION')) {
							$output = "\n 						theme_framework : {name: '" . $framework . "', version: '" . PARENT_THEME_VERSION . "'},";
						}
					}
					break;
				}
			}
			return $output;
		}

		function get_current_url() {
			if (isset($_SERVER['REQUEST_URI'])) {
				return 'http'.(empty($_SERVER['HTTPS'])?'':'s').'://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
			} else if (isset($_SERVER['PATH_INFO'])) {
				return $_SERVER['PATH_INFO'];
			} else {
				$host = $_SERVER['HTTP_HOST'];
				$port = $_SERVER['SERVER_PORT'];
				$request = $_SERVER['PHP_SELF'];
				$query = isset($_SERVER['argv']) ? substr($_SERVER['argv'][0], strpos($_SERVER['argv'][0], ';') + 1) : '';
				$toret = $protocol . '://' . $host . ($port == $protocol_port ? '' : ':' . $port) . $request . (empty($query) ? '' : '?' . $query);
				return $toret;
			}
		}

		function get_disabled_wts(){
			$wts = str_replace('"', '', get_option('sk_disabled_wts'));
			if ($wts) {
				return $wts;
			}
			return 'false';
		}

		function get_disabled_network_wts(){
			if (is_multisite()) {
				$wts = str_replace('"', '', get_site_option('sk_disabled_wts'));
				if ($wts) {
					return $wts;
				}
			}
			return 'false';
		}

		function get_plugins(){

			$active_plugins = wp_get_active_and_valid_plugins();
			$mu_plugins     = get_mu_plugins();
			$output         = array();

			if (is_array($active_plugins)) {
				foreach ($active_plugins as $plugins_key => $plugin) {
					$data          = get_plugin_data( $plugin, false, false );
					$slug          = explode('/',plugin_basename($plugin));
					$slug          = str_replace('.php', '', $slug[1]);
					$output[$slug] = $data['Version'];
				}
			}

			if (is_array($mu_plugins)) {
				foreach ($mu_plugins as $plugins_key => $plugin) {
					$slug          = str_replace('.php', '', $plugins_key);
					$output[$slug] = '1.0.0';
				}
			}
			return $output;
		}

		function get_user_role(){
			global $current_user, $wp_roles;

			if (is_super_admin($current_user->ID)) {
				return 'administrator';
			}

			if(!isset($current_user->caps) || count($current_user->caps) < 1){
				// In MS in some specific pages current user is returning empty caps so this is a work around for that case.
				if (current_user_can('activate_plugins')){
					return 'administrator';
				}
			}
			foreach($wp_roles->role_names as $role => $Role) {
				if (array_key_exists($role, $current_user->caps)){
					$user_role = $role;
					break;
				}
			}
			return $user_role;
		}
	}
}

// //sk_config_data.php
