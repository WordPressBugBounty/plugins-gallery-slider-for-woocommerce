<?php
/**
 * The React based admin dashboard page.
 *
 * @link       https://shapedplugin.com/
 * @since      4.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/admin/dashboard
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the Dashboard submenu and loads its React app.
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Dashboard {

	/**
	 * Dashboard submenu page slug.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const PAGE_SLUG = 'wcgs-dashboard';

	/**
	 * REST API manager of the dashboard.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Dashboard_API
	 */
	private $api_manager;

	/**
	 * REST API of the Settings tab.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Settings_API
	 */
	private $settings_api;

	/**
	 * REST API of the Global Settings panel.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Global_Settings_API
	 */
	private $global_settings_api;

	/**
	 * REST API of the live preview.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Preview_API
	 */
	private $preview_api;

	/**
	 * Product page of the live preview's frame.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Preview_Frame
	 */
	private $preview_frame;

	/**
	 * REST API of the Per-Product Layouts tab.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Layouts_API
	 */
	private $layouts_api;

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 */
	public function __construct() {
		// Run after Woo_Gallery_Slider_Admin::admin_menu() has added the parent menu.
		add_action( 'admin_menu', array( $this, 'admin_menu' ), 11 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_dashboard_assets' ) );
		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ) );

		$this->api_manager         = new Woo_Gallery_Slider_Dashboard_API();
		$this->global_settings_api = new Woo_Gallery_Slider_Global_Settings_API();
		$this->settings_api        = new Woo_Gallery_Slider_Settings_API( $this->global_settings_api );
		$this->preview_api         = new Woo_Gallery_Slider_Preview_API( $this->global_settings_api );
		$this->preview_frame       = new Woo_Gallery_Slider_Preview_Frame();
		$this->layouts_api         = new Woo_Gallery_Slider_Layouts_API( $this->global_settings_api );
	}

	/**
	 * URL of the dashboard page, optionally at one of its hash routes
	 * (e.g. `global`, `global/gallery/zoom`, `layouts/12`, `settings/advanced`, `swatches`).
	 *
	 * @since 4.0.0
	 * @param string $route Hash route, without the `#`.
	 * @return string
	 */
	public static function url( $route = '' ) {
		return admin_url( 'admin.php?page=' . self::PAGE_SLUG ) . ( '' !== $route ? '#' . $route : '' );
	}

	/**
	 * Add the Dashboard submenu under the Product Gallery menu, plus links to
	 * its Per-Product Layouts and Settings tabs and its Variation Swatches
	 * page (only while Smart Swatches is inactive). Those are hash routes of the same page, so they have no callback
	 * and WordPress uses the URL as their link; the dashboard app marks the
	 * open route's item as current.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function admin_menu() {
		$capability = apply_filters( 'wcgs_ui_permission', 'manage_options' );

		add_submenu_page(
			'wpgs-settings',
			__( 'Reno Product Gallery Dashboard', 'gallery-slider-for-woocommerce' ),
			__( 'Dashboard', 'gallery-slider-for-woocommerce' ),
			$capability,
			self::PAGE_SLUG,
			array( $this, 'render_page' )
		);
		add_submenu_page(
			'wpgs-settings',
			__( 'Per-Product Layouts', 'gallery-slider-for-woocommerce' ),
			__( 'Per-Product Layouts', 'gallery-slider-for-woocommerce' ),
			$capability,
			self::url( 'layouts' )
		);
		add_submenu_page(
			'wpgs-settings',
			__( 'Settings', 'gallery-slider-for-woocommerce' ),
			__( 'Settings', 'gallery-slider-for-woocommerce' ),
			$capability,
			self::url( 'settings' )
		);
		// The Variation Swatches page only promotes Smart Swatches, so drop its link once that plugin runs.
		if ( ! self::is_smart_swatches_active() ) {
			add_submenu_page(
				'wpgs-settings',
				__( 'Variation Swatches', 'gallery-slider-for-woocommerce' ),
				__( 'Variation Swatches', 'gallery-slider-for-woocommerce' ),
				$capability,
				self::url( 'swatches' )
			);
		}
	}

	/**
	 * Whether Smart Swatches (free or Pro) is active.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public static function is_smart_swatches_active() {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		return is_plugin_active( 'smart-swatches/smart-swatches.php' ) || is_plugin_active( 'smart-swatches-pro/smart-swatches-pro.php' );
	}

	/**
	 * Output the root element the React app mounts on.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function render_page() {
		?>
		<div id="wcgs-admin-dashboard-wrapper" class="wcgs-admin-dashboard-wrapper"></div>
		<?php
	}

	/**
	 * Whether the current admin screen is the dashboard page.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public static function is_dashboard_screen() {
		$current_screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		// The submenu screen base is prefixed with the sanitized parent menu title, so derive it instead of hardcoding it.
		return $current_screen && get_plugin_page_hookname( self::PAGE_SLUG, 'wpgs-settings' ) === $current_screen->base;
	}

	/**
	 * Add a body class on the dashboard page so its full-height layout can drop the admin footer.
	 *
	 * @since 4.0.0
	 * @param string $classes Space-separated admin body classes.
	 * @return string
	 */
	public function admin_body_class( $classes ) {
		if ( self::is_dashboard_screen() ) {
			$classes .= ' wcgs-dashboard-page';
		}
		return $classes;
	}

	/**
	 * Enqueue the dashboard script and style on the dashboard page only.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function enqueue_dashboard_assets() {
		if ( ! self::is_dashboard_screen() ) {
			return;
		}

		$dependencies = array( 'wp-element', 'wp-data', 'wp-api-fetch', 'wp-i18n', 'wp-components' );
		$version      = WOO_GALLERY_SLIDER_VERSION;
		$asset_file   = WOO_GALLERY_SLIDER_PATH . 'build/admin/wcgs-dashboard.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset = require $asset_file;
			if ( ! empty( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ) {
				$dependencies = $asset['dependencies'];
			}
			if ( ! empty( $asset['version'] ) ) {
				$version = $asset['version'];
			}
		}

		// Media library modal for the upload controls.
		wp_enqueue_media();
		wp_enqueue_script( 'wcgs-admin-dashboard', WOO_GALLERY_SLIDER_URL . 'build/admin/wcgs-dashboard.js', $dependencies, $version, true );
		wp_enqueue_style( 'wcgs-admin-dashboard', WOO_GALLERY_SLIDER_URL . 'build/admin/wcgs-dashboard.css', array( 'wp-components' ), $version );
		wp_style_add_data( 'wcgs-admin-dashboard', 'rtl', 'replace' );
		wp_set_script_translations( 'wcgs-admin-dashboard', 'gallery-slider-for-woocommerce', WOO_GALLERY_SLIDER_PATH . 'languages' );
	}
}
