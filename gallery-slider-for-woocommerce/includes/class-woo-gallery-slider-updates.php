<?php
/**
 * Fired during plugin updates
 *
 * @link       https://shapedplugin.com/
 * @since      1.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 */

// don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Fired during plugin updates.
 *
 * This class defines all code necessary to run during the plugin's updates.
 *
 * @since      1.0.0
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */
class Woo_Gallery_Slider_Updates {

	/**
	 * DB updates that need to be run
	 *
	 * @var array
	 */
	private static $updates = array(
		'1.0.0' => 'updates/update-1.0.0.php',
		'2.0.0' => 'updates/update-2.0.0.php',
		'2.2.1' => 'updates/update-2.2.1.php',
		'3.0.0' => 'updates/update-3.0.0.php',
		'4.0.0' => 'updates/update-4.0.0.php',
	);

	/**
	 * Binding all events
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'plugins_loaded', array( $this, 'do_updates' ) );
	}

	/**
	 * The single instance.
	 *
	 * @since 4.0.0
	 * @return Woo_Gallery_Slider_Updates
	 */
	public static function instance() {
		static $instance = null;
		if ( null === $instance ) {
			$instance = new self();
		}
		return $instance;
	}

	/**
	 * Check if need any update
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public function is_needs_update() {
		$installed_version = get_option( 'woo_gallery_slider_version' );
		$first_version     = get_option( 'woo_gallery_slider_first_version' );
		$activation_date   = get_option( 'woo_gallery_slider_activation_date' );

		// Another version (or Pro, which shares the cache keys) rendered the cached
		// galleries: drop them so this version renders its own.
		if ( WOO_GALLERY_SLIDER_VERSION !== $installed_version ) {
			self::purge_gallery_cache();
		}

		if ( false === $installed_version ) {
			update_option( 'woo_gallery_slider_version', WOO_GALLERY_SLIDER_VERSION );
			update_option( 'woo_gallery_slider_db_version', WOO_GALLERY_SLIDER_VERSION );
		}
		if ( false === $first_version ) {
			update_option( 'woo_gallery_slider_first_version', WOO_GALLERY_SLIDER_VERSION );
		}
		if ( false === $activation_date ) {
			update_option( 'woo_gallery_slider_activation_date', current_time( 'timestamp' ) );
		}

		if ( version_compare( $installed_version, WOO_GALLERY_SLIDER_VERSION, '<' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Delete the cached product galleries (variation JSON and gallery HTML).
	 * Pro writes the same transient keys, so a version change or a switch
	 * from Pro must not serve galleries another plugin rendered.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function purge_gallery_cache() {
		if ( ! class_exists( 'Woo_Gallery_Slider_Cache' ) ) {
			require_once __DIR__ . '/class-woo-gallery-slider-cache.php';
		}
		Woo_Gallery_Slider_Cache::purge_product_transients();
	}

	/**
	 * Do updates.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function do_updates() {
		$this->perform_updates();
	}

	/**
	 * Perform all updates
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function perform_updates() {
		if ( ! $this->is_needs_update() ) {
			return;
		}

		$installed_version = get_option( 'woo_gallery_slider_version' );

		foreach ( self::$updates as $version => $path ) {
			if ( version_compare( $installed_version, $version, '<' ) ) {
				include __DIR__ . '/' . $path;
				update_option( 'woo_gallery_slider_version', $version );
			}
		}

		update_option( 'woo_gallery_slider_version', WOO_GALLERY_SLIDER_VERSION );
	}
}
Woo_Gallery_Slider_Updates::instance();
