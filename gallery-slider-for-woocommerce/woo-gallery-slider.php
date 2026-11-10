<?php
/**
 * ProductGallery
 *
 * @link              https://shapedplugin.com/
 * @since             1.0.0
 * @package           Woo_Gallery_Slider
 *
 * Plugin Name:       Reno Product Gallery (formerly WooGallery)
 * Plugin URI:        https://renoproductgallery.com/?ref=143
 * Description:       Reno Product Gallery plugin allows you to insert additional images for each variation to let visitors see different images when product variations are switched. Increase your sales by transforming the WooCommerce default product gallery instantly to a beautiful thumbnails gallery slider on a single product page.
 * Version:           4.0.0
 * Author:            Reno Product Gallery Team, ShapedPlugin LLC
 * Author URI:        https://renoproductgallery.com/
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Requires at least: 6.6
 * Requires PHP: 7.0
 * Requires Plugins: woocommerce
 * WC requires at least: 4.5
 * WC tested up to: 11.2.2
 * Text Domain:       gallery-slider-for-woocommerce
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 */
define( 'WOO_GALLERY_SLIDER_VERSION', '4.0.0' );
define( 'WOO_GALLERY_SLIDER_FILE', __FILE__ );
define( 'WOO_GALLERY_SLIDER_PATH', plugin_dir_path( __FILE__ ) );
define( 'WOO_GALLERY_SLIDER_URL', plugin_dir_url( __FILE__ ) );
define( 'WOO_GALLERY_SLIDER_BASENAME', plugin_basename( __FILE__ ) );
define( 'WOO_GALLERY_SLIDER_PRO_LINK', 'https://renoproductgallery.com/pricing/?ref=143' );
// Lifetime of the cached galleries, in seconds (0: no expiry).
define( 'WOO_GALLERY_SLIDER_TRANSIENT_EXPIRATION', apply_filters( 'sp_gallery_transient_expiration', MONTH_IN_SECONDS ) );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-woo-gallery-slider-updates.php';
require plugin_dir_path( __FILE__ ) . 'includes/class-woo-gallery-slider.php';

/**
 * On activation and deactivation, drop the cached product galleries: Pro
 * writes the same transient keys, so after switching between the two plugins
 * a gallery rendered by the other one must not be served.
 *
 * @since 4.0.0
 */
register_activation_hook( __FILE__, array( 'Woo_Gallery_Slider_Updates', 'purge_gallery_cache' ) );
register_deactivation_hook( __FILE__, 'wcgs_deactivate' );

/**
 * Plugin deactivation: drop the cached galleries and stop the weekly cache sweep.
 *
 * @since 4.0.0
 * @return void
 */
function wcgs_deactivate() {
	Woo_Gallery_Slider_Updates::purge_gallery_cache();
	wp_clear_scheduled_hook( 'woo_gallery_slider_weekly_scheduled_events' );
}

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_woo_gallery_slider() {
	$plugin = new Woo_Gallery_Slider();
	$plugin->run();

	if ( is_admin() ) {
		/**
		 * Shared ShapedPlugin BFCM notice. Only one notice renders even when
		 * several ShapedPlugin free plugins are active.
		 */
		require_once WOO_GALLERY_SLIDER_PATH . 'admin/partials/shapedplugin-bfcm-notice.php';

		ShapedPlugin_BFCM_Notice_2026::register(
			array(
				'slug'       => 'gallery-slider-for-woocommerce',
				'name'       => 'Reno Product Gallery Pro',
				'image'      => WOO_GALLERY_SLIDER_URL . 'admin/img/offer-banner/bfcm-notice-2026.webp',
				'link'       => 'https://renoproductgallery.com/pricing/?utm_source=dashboard&utm_medium=rpg_dealbutton&utm_campaign=bfcm26',
				'post_types' => array( 'wcgs_layouts' ),
				'screen_ids' => array( 'toplevel_page_wpgs-settings', 'product-gallery_page_' ),
			)
		);
	}
}

if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
	include_once ABSPATH . 'wp-admin/includes/plugin.php';
}

if ( ( is_plugin_active( 'woocommerce/woocommerce.php' ) || is_plugin_active_for_network( 'woocommerce/woocommerce.php' ) ) && ! ( is_plugin_active( 'woo-gallery-slider-pro/woo-gallery-slider-pro.php' ) || is_plugin_active_for_network( 'woo-gallery-slider-pro/woo-gallery-slider-pro.php' ) ) ) {
	if ( ! is_network_admin() ) {
		// On an upgrade, migrate the stored settings before the plugin reads them.
		// A fresh install has no version yet: it stores its defaults first.
		if ( false !== get_option( 'woo_gallery_slider_version' ) ) {
			Woo_Gallery_Slider_Updates::instance()->perform_updates();
		}
		run_woo_gallery_slider();
	}
}

/**
* Declare this plugin is compatible with WooCommerce HPOS feature.
*/
add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);

/**
 * Show admin notice if WooCommerce is not activated.
 *
 * @since    1.0.0
 */
function wcgs_wc_admin_notice() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		$link    = esc_url(
			add_query_arg(
				array(
					'tab'       => 'plugin-information',
					'plugin'    => 'woocommerce',
					'TB_iframe' => 'true',
					'width'     => '640',
					'height'    => '500',
				),
				admin_url( 'plugin-install.php' )
			)
		);
		$outline = '<div class="error"><p>' . sprintf(
			/* translators: 1: WooCommerce plugin details link start, 2: link end. */
			__( 'You must install and activate %1$sWooCommerce%2$s plugin to make the <strong>Reno Product Gallery</strong> work.', 'gallery-slider-for-woocommerce' ),
			'<a class="thickbox open-plugin-details-modal" href="' . esc_url( $link ) . '"><strong>',
			'</strong></a>'
		) . '</p></div>';
		echo wp_kses_post( $outline );
	}
}
add_action( 'admin_notices', 'wcgs_wc_admin_notice' );
