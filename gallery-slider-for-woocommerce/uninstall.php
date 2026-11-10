<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * When populating this file, consider the following flow
 * of control:
 *
 * - This method should be static
 * - Check if the $_REQUEST content actually is the plugin name
 * - Run an admin referrer check to make sure it goes through authentication
 * - Verify the output of $_GET makes sense
 * - Repeat with other user roles. Best directly by using the links/query string parameters.
 * - Repeat things for multisite. Once for a single site in the network, once sitewide.
 *
 * This file may be updated more in future version of the Boilerplate; however, this is the
 * general skeleton and outline for how the file should work.
 *
 * For more information, see the following discussion:
 * https://github.com/tommcfarlin/WordPress-Plugin-Boilerplate/pull/123#issuecomment-28541913
 *
 * @link       https://shapedplugin.com/
 * @since      1.0.0
 *
 * @package    Woo_Gallery_Slider
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Delete plugin data function.
 *
 * @return void
 */
function wcgs_delete_plugin_data() {

	// Delete plugin option settings.
	$option_name = 'wcgs_settings';
	delete_option( $option_name );
	delete_site_option( $option_name ); // For site options in Multisite.

	// Delete offer banner related option keys.
	delete_option( 'shapedplugin_offer_banner_dismissed_black_friday_2025' );
	delete_option( 'shapedplugin_offer_banner_dismissed_new_year_2026' );
	delete_option( 'shapedplugin_bfcm_2026_dismissed' );
}

/**
 * Remove what the plugin keeps running or cached: the weekly cache sweep
 * and the cached gallery data (always, it is not user data).
 *
 * @return void
 */
function wcgs_delete_plugin_cache() {
	wp_clear_scheduled_hook( 'woo_gallery_slider_weekly_scheduled_events' );

	if ( ! class_exists( 'Woo_Gallery_Slider_Cache' ) ) {
		require_once plugin_dir_path( __FILE__ ) . 'includes/class-woo-gallery-slider-cache.php';
	}
	Woo_Gallery_Slider_Cache::purge_product_transients();
	delete_transient( 'wcgs_wporg_changelog' );
}

wcgs_delete_plugin_cache();

$wcgs_plugin_settings = get_option( 'wcgs_settings' );
$wcgs_data_delete     = isset( $wcgs_plugin_settings['wcgs_data_remove'] ) ? $wcgs_plugin_settings['wcgs_data_remove'] : false;

// The 3.x framework saved an unchecked box as "0".
if ( $wcgs_data_delete && '0' !== $wcgs_data_delete ) {
	wcgs_delete_plugin_data();
}
