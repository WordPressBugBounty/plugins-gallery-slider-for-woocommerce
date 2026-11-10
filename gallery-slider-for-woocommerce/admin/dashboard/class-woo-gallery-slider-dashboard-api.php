<?php
/**
 * REST API endpoints of the admin dashboard.
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
 * Handles the REST API endpoints used by the React dashboard.
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Dashboard_API {

	/**
	 * REST API namespace.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const REST_NAMESPACE = 'wcgs/v1';

	/**
	 * Transient holding the fetched changelog HTML.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const CHANGELOG_TRANSIENT = 'wcgs_wporg_changelog';

	/**
	 * `wcgs_settings` key set on a fresh install (`'1'`): the dashboard opens
	 * the Setup Wizard until it is dismissed.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const WIZARD_KEY = 'show_setup_wizard';

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register REST API routes.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/dashboard',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dashboard_data' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/cache/clear',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'clear_gallery_cache' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/changelog',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_changelog' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/wizard/dismiss',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'dismiss_wizard' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * Only users who can manage the plugin may use the dashboard endpoints.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( apply_filters( 'wcgs_ui_permission', 'manage_options' ) );
	}

	/**
	 * REST API: dashboard overview data.
	 *
	 * @since 4.0.0
	 * @return WP_REST_Response
	 */
	public function get_dashboard_data() {
		return rest_ensure_response(
			array(
				'dashboardInfo' => array(
					'pluginVersion'     => WOO_GALLERY_SLIDER_VERSION,
					'pluginUrl'         => WOO_GALLERY_SLIDER_URL,
					'logoUrl'           => WOO_GALLERY_SLIDER_URL . 'admin/img/reno-product-gallery.svg',
					'proUrl'            => WOO_GALLERY_SLIDER_PRO_LINK,
					'isPro'             => false,
					// Open the Setup Wizard once on a fresh install.
					'showWizard'        => self::is_wizard_pending(),
					// The Setup Wizard and the Variation Swatches page install and activate add-ons.
					'canInstallPlugins' => current_user_can( 'install_plugins' ) && current_user_can( 'activate_plugins' ),
				),
				'stats'         => $this->get_stats(),
			)
		);
	}

	/**
	 * REST API: the Setup Wizard was finished or closed; don't open it again.
	 *
	 * @since 4.0.0
	 * @return WP_REST_Response
	 */
	public function dismiss_wizard() {
		$settings = get_option( 'wcgs_settings' );
		if ( is_array( $settings ) && isset( $settings[ self::WIZARD_KEY ] ) ) {
			unset( $settings[ self::WIZARD_KEY ] );
			update_option( 'wcgs_settings', $settings );
		}
		return rest_ensure_response( array( 'showWizard' => false ) );
	}

	/**
	 * Whether the Setup Wizard is still to be shown (a fresh install that
	 * hasn't finished or closed it).
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public static function is_wizard_pending() {
		$settings = get_option( 'wcgs_settings' );
		return is_array( $settings ) && ! empty( $settings[ self::WIZARD_KEY ] );
	}

	/**
	 * REST API: delete the cached product gallery transients.
	 *
	 * @since 4.0.0
	 * @return WP_REST_Response
	 */
	public function clear_gallery_cache() {
		$deleted = Woo_Gallery_Slider_Cache::purge_product_transients();
		// With an external object cache the entries are dropped by bumping the cache generation, not counted.
		if ( wp_using_ext_object_cache() ) {
			return rest_ensure_response(
				array(
					'deleted' => 0,
					'message' => __( 'Gallery cache cleared.', 'gallery-slider-for-woocommerce' ),
				)
			);
		}

		return rest_ensure_response(
			array(
				'deleted' => $deleted,
				'message' => sprintf(
					/* translators: %d: number of deleted cache entries. */
					_n( 'Cleared %d cached entry.', 'Cleared %d cached entries.', $deleted, 'gallery-slider-for-woocommerce' ),
					$deleted
				),
			)
		);
	}

	/**
	 * REST API: the plugin changelog, for the header's version drawer.
	 *
	 * Returns `{changelog}`: sanitized HTML from the plugin's WordPress.org
	 * page, or `''` when WordPress.org can't be reached. Cached for a day in
	 * the `wcgs_wporg_changelog` transient.
	 *
	 * @since 4.0.0
	 * @return WP_REST_Response
	 */
	public function get_changelog() {
		$changelog = get_transient( self::CHANGELOG_TRANSIENT );

		if ( false === $changelog ) {
			$changelog = $this->fetch_changelog();
		}

		return rest_ensure_response( array( 'changelog' => $changelog ) );
	}

	/**
	 * Fetch the changelog section of the plugin's WordPress.org page and
	 * cache it. Inline styles and `data-*` attributes are dropped so the
	 * drawer's own styles apply.
	 *
	 * A failed request is cached as `''` for an hour, so an outage doesn't
	 * cost a slow request on every open.
	 *
	 * @since 4.0.0
	 * @return string Sanitized changelog HTML, or '' on failure.
	 */
	private function fetch_changelog() {
		if ( ! function_exists( 'plugins_api' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		}

		$info = plugins_api(
			'plugin_information',
			array(
				'slug'   => 'gallery-slider-for-woocommerce',
				'fields' => array(
					'sections'     => true,
					'reviews'      => false,
					'banners'      => false,
					'icons'        => false,
					'screenshots'  => false,
					'contributors' => false,
					'ratings'      => false,
					'versions'     => false,
				),
			)
		);

		$changelog = '';
		if ( ! is_wp_error( $info ) && ! empty( $info->sections['changelog'] ) && is_string( $info->sections['changelog'] ) ) {
			$allowed = wp_kses_allowed_html( 'post' );
			foreach ( $allowed as $tag => $attributes ) {
				unset( $allowed[ $tag ]['style'] );
				foreach ( array_keys( $attributes ) as $attribute ) {
					if ( 0 === strpos( $attribute, 'data-' ) ) {
						unset( $allowed[ $tag ][ $attribute ] );
					}
				}
			}
			$changelog = wp_kses( $info->sections['changelog'], $allowed );
		}

		set_transient( self::CHANGELOG_TRANSIENT, $changelog, '' === $changelog ? HOUR_IN_SECONDS : DAY_IN_SECONDS );

		return $changelog;
	}

	/**
	 * Plugin usage stats.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_stats() {
		global $wpdb;

		$layouts      = wp_count_posts( 'wcgs_layouts' );
		$assigns      = get_option( 'wcgs_assigns', array() );
		$assign_rules = ! empty( $assigns['assign_layout_data'] ) && is_array( $assigns['assign_layout_data'] ) ? count( $assigns['assign_layout_data'] ) : 0;
		$settings     = get_option( 'wcgs_settings', array() );

		// With the WooCommerce core variation gallery, its galleries count too.
		$gallery_key = Woo_Gallery_Slider_Variation_Gallery::core_enabled() ? '_product_image_gallery' : 'woo_gallery_slider';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$variation_galleries = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT( DISTINCT pm.post_id ) FROM {$wpdb->postmeta} pm
				INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
				WHERE pm.meta_key IN ( %s, %s ) AND pm.meta_value NOT IN ( '', '[]' ) AND p.post_type = %s AND p.post_status <> 'trash'",
				'woo_gallery_slider',
				$gallery_key,
				'product_variation'
			)
		);

		return array(
			'layouts'            => isset( $layouts->publish ) ? (int) $layouts->publish : 0,
			'assignRules'        => $assign_rules,
			'variationGalleries' => $variation_galleries,
			'galleryCache'       => ! empty( $settings['gallery_cache'] ),
		);
	}
}
