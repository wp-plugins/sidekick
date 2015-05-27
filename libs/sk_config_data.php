<?php
// sk_config_data.php

if (!class_exists('sk_config_data')) {

	class sk_config_data{

		var $cache_time = 43200; // 12 Hours

		function get_domain(){
			$site_url = get_site_url();
			if(substr($site_url, -1) == '/') {
				$site_url = substr($site_url, 0, -1);
			}
			$site_url = str_replace(array("http://","https://"),array(""),$site_url);
			return $site_url;
		}

		// Return list of post types registered in WordPress
		// Transients cleared on post type update, create, delete

		function get_post_types(){
			global $wpdb;

			if ( false === ( $result = get_transient( 'sk_get_post_types' ) ) ) {

				$query  = "SELECT post_type, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type";
				$counts = $wpdb->get_results($query);
				$result = '';

				foreach ($counts as $key => $type) {
					$type->post_type = str_replace('-', '_', $type->post_type);
					$result .= "\n 						post_type_{$type->post_type} : $type->count,";
				}
				set_transient( 'sk_get_post_types', $result, $this->cache_time );
			}

			return $result;
		}

		function get_file_editor_enabled(){
			if (defined('GD_SYSTEM_PLUGIN_DIR')) {
				// Only check this file editor setting for GoDaddy Themes
				$gd_file_editor_enabled = get_site_option( 'gd_file_editor_enabled', null );
				if (isset($gd_file_editor_enabled) && $gd_file_editor_enabled) {
					$gd_file_editor_enabled = 'true';
				} else {
					$gd_file_editor_enabled = 'false';
				}
			}
			return (isset($gd_file_editor_enabled)) ? $gd_file_editor_enabled : null;
		}

		function get_themes(){
			if ( false === ( $result = get_transient( 'sk_get_themes' ) ) ) {
				$result = wp_get_themes( array( 'allowed' => true ) );
				set_transient( 'sk_get_themes', $result, $this->cache_time );
			}

			return count($result);
		}

		function get_post_types_and_statuses(){
			global $wpdb;

			// Can't find a good method to clear cache for newly registered post types that fires once
			// if ( false === ( $result = get_transient( 'sk_get_post_types_and_statuses' ) ) ) {
				$query  = "SELECT post_type, post_status, count(distinct ID) as count from {$wpdb->prefix}posts group by post_type, post_status";
				$counts = $wpdb->get_results($query);
				$result = '';

				foreach ($counts as $key => $type) {
					$type->post_type   = str_replace('-', '_', $type->post_type);
					$type->post_status = str_replace('-', '_', $type->post_status);

					$result .= "\n 						post_type_{$type->post_type}_{$type->post_status} : $type->count,";
				}
				set_transient( 'sk_get_post_types_and_statuses', $result, $this->cache_time );
			// }

			return $result;
		}

		function get_taxonomies(){
			global $wpdb;

			// if ( false === ( $result = get_transient( 'sk_get_taxonomies' ) ) ) {
				$query  = "SELECT count(distinct term_taxonomy_id) as count, taxonomy from {$wpdb->prefix}term_taxonomy group by taxonomy";
				$counts = $wpdb->get_results($query);
				$result = '';

				foreach ($counts as $key => $taxonomy) {
					$taxonomy->taxonomy = str_replace('-', '_', $taxonomy->taxonomy);
					$result .= "\n 						taxonomy_{$taxonomy->taxonomy} : $taxonomy->count,";
				}
				set_transient( 'sk_get_taxonomies', $result, $this->cache_time );
			// }

			return $result;
		}

		function get_comments(){
			global $wpdb;

			if ( false === ( $result = get_transient( 'sk_get_comments' ) ) ) {
				$query = "SELECT count(distinct comment_ID) as count from {$wpdb->prefix}comments";
				$counts = $wpdb->get_var($query);
				if (!$counts) $counts = 0;
				$result = "\n 						comment_count : $counts,";
				set_transient( 'sk_get_comments', $result, $this->cache_time );
			}

			return $result;
		}

		function get_post_statuses(){
			global $wpdb;

			if ( false === ( $result = get_transient( 'sk_post_statuses' ) ) ) {
				$query  = "SELECT post_status, count(ID) as count from {$wpdb->prefix}posts group by post_status";
				$counts = $wpdb->get_results($query);
				$result = '';

				foreach ($counts as $key => $type) {
					$type->post_status = str_replace('-', '_', $type->post_status);
					$result .= "\n 						post_status_{$type->post_status} : $type->count,";
				}
				set_transient( 'sk_post_statuses', $result, $this->cache_time );
			}

			return $result;
		}

		function get_user_data(){
			global $current_user;

			if ( false === ( $result = get_transient( 'sk_get_user_data' ) ) ) {
				$data   = get_userdata($current_user->ID);
				$result = "\n 						user_id : $current_user->ID,";

				foreach ($data->allcaps as $cap => $val) {
					$cap = sanitize_title($cap);
					$cap = str_replace('-', '_', $cap);
					if (!$val) $val = 0;
					$result .= "\n 						cap_{$cap} : $val,";
				}
				set_transient( 'sk_get_user_data', $result, $this->cache_time );
			}

			return $result;
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

			if ( false === ( $result = get_transient( 'sk_get_plugins' ) ) ) {
				$active_plugins = wp_get_active_and_valid_plugins();
				$mu_plugins     = get_mu_plugins();
				$result         = array();

				if (is_array($active_plugins)) {
					foreach ($active_plugins as $plugins_key => $plugin) {
						$data          = get_plugin_data( $plugin, false, false );
						$slug          = explode('/',plugin_basename($plugin));
						$slug          = str_replace('.php', '', $slug[1]);
						$result[$slug] = $data['Version'];
					}
				}

				if (is_array($mu_plugins)) {
					foreach ($mu_plugins as $plugins_key => $plugin) {
						$slug          = str_replace('.php', '', $plugins_key);
						$result[$slug] = '1.0.0';
					}
				}
				set_transient( 'sk_get_plugins', $result, $this->cache_time );
			}

			return $result;
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
