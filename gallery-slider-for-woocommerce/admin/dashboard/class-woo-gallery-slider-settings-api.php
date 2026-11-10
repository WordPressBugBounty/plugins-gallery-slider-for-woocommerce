<?php
/**
 * REST API endpoints of the dashboard Settings tab.
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
 * Reads and writes the Advanced settings of `wcgs_settings` for the React
 * dashboard, and runs the migration and import/export actions.
 *
 * Values are stored in the same shapes the legacy settings framework writes
 * (switchers "1"/"", id lists as string arrays), because the frontend reads
 * those keys directly.
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Settings_API {

	/**
	 * REST API namespace.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const REST_NAMESPACE = 'wcgs/v1';

	/**
	 * Option that holds the global settings.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const OPTION = 'wcgs_settings';

	/**
	 * Variations handled per migration request.
	 *
	 * @since 4.0.0
	 * @var int
	 */
	const MIGRATION_BATCH = 50;

	/**
	 * The Global Settings API, whose sanitizers an imported settings file goes through.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Global_Settings_API|null
	 */
	private $global_settings_api;

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 * @param Woo_Gallery_Slider_Global_Settings_API|null $global_settings_api Global Settings API.
	 */
	public function __construct( $global_settings_api = null ) {
		$this->global_settings_api = $global_settings_api;
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Settings fields the Settings tab edits, with their type and default
	 * (the defaults of the 3.x Advanced tab).
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public static function fields() {
		$switch = function ( $default_value ) {
			return array(
				'type'    => 'switch',
				'default' => $default_value,
			);
		};

		return array(
			// Advanced Controls.
			'wcgs_data_remove'              => $switch( false ),
			'enqueue_fancybox_css'          => $switch( true ),
			'enqueue_fancybox_js'           => $switch( true ),
			'enqueue_swiper_css'            => $switch( true ),
			'enqueue_swiper_js'             => $switch( true ),
			'enqueue_video_css'             => $switch( true ),
			'enqueue_video_js'              => $switch( true ),
			// Speed Optimization.
			'lazy_load_gallery'             => $switch( true ),
			'gallery_cache'                 => $switch( false ),
			'remove_default_wc_gallery'     => array(
				'type'    => 'multi',
				'default' => array( 'lightbox', 'zoom', 'slider' ),
				'options' => array( 'lightbox', 'zoom', 'slider' ),
			),
			'dequeue_single_product_css'    => array(
				'type'    => 'text',
				'default' => '',
			),
			'dequeue_single_product_js'     => array(
				'type'    => 'text',
				'default' => '',
			),
			// Additional CSS & JS.
			'wcgs_additional_css'           => array(
				'type'    => 'css',
				'default' => '',
			),
			'wcgs_additional_js'            => array(
				'type'    => 'js',
				'default' => '',
			),
		);
	}

	/**
	 * Plugins the Migration tab can copy variation galleries from, and the
	 * variation meta key each one uses.
	 *
	 * While WooCommerce core's variation gallery is on, the sources it already
	 * owns are left out: WooThumbs stores variation images in
	 * `_product_image_gallery`, which is core's gallery itself, and core reads
	 * and migrates the Additional Variation Images extension's meta on its own.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public static function migration_sources() {
		$sources = array(
			'woo-variation-gallery'                   => array(
				'name'     => 'Additional Variation Images Gallery for WooCommerce',
				'author'   => 'Emran Ahmed',
				'meta_key' => 'woo_variation_gallery_images',
			),
			'woo-product-gallery-slider'              => array(
				'name'     => 'Product Gallery Slider for WooCommerce',
				'author'   => 'Niloy – Codeixer',
				'meta_key' => 'wavi_value',
			),
			'woo-product-variation-gallery'           => array(
				'name'     => 'Variation Images Gallery for WooCommerce',
				'author'   => 'RadiusTheme',
				'meta_key' => 'rtwpvg_images',
			),
			'iconic-woothumbs'                        => array(
				'name'     => 'WooThumbs for WooCommerce',
				'author'   => 'IconicWP',
				'meta_key' => '_product_image_gallery',
			),
			'woocommerce-additional-variation-images' => array(
				'name'     => 'WooCommerce Additional Variation Images',
				'author'   => 'WooCommerce',
				'meta_key' => '_wc_additional_variation_images',
			),
		);
		if ( class_exists( 'Woo_Gallery_Slider_Variation_Gallery' ) && Woo_Gallery_Slider_Variation_Gallery::core_enabled() ) {
			unset( $sources['iconic-woothumbs'], $sources['woocommerce-additional-variation-images'] );
		}
		return $sources;
	}

	/**
	 * Register REST API routes.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		$routes = array(
			'/settings'           => array(
				array( WP_REST_Server::READABLE, 'get_settings' ),
				array( WP_REST_Server::EDITABLE, 'save_settings' ),
			),
			'/settings/search'    => array( array( WP_REST_Server::READABLE, 'search_items' ) ),
			'/settings/migrate'   => array( array( WP_REST_Server::CREATABLE, 'run_migration' ) ),
			'/settings/export'    => array( array( WP_REST_Server::CREATABLE, 'export_data', 'check_import_export_permission' ) ),
			'/settings/import'    => array( array( WP_REST_Server::CREATABLE, 'import_data', 'check_import_export_permission' ) ),
		);

		foreach ( $routes as $route => $endpoints ) {
			$args = array();
			foreach ( $endpoints as $endpoint ) {
				$args[] = array(
					'methods'             => $endpoint[0],
					'callback'            => array( $this, $endpoint[1] ),
					'permission_callback' => array( $this, isset( $endpoint[2] ) ? $endpoint[2] : 'check_permission' ),
				);
			}
			register_rest_route( self::REST_NAMESPACE, $route, $args );
		}
	}

	/**
	 * Only users who can manage the plugin may use the settings endpoints.
	 * The REST nonce (X-WP-Nonce, sent by apiFetch) authenticates the cookie.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( apply_filters( 'wcgs_ui_permission', 'manage_options' ) );
	}

	/**
	 * Permission check of the import and export endpoints: the dashboard
	 * capability and the import/export one of 3.x.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public function check_import_export_permission() {
		return $this->check_permission() && current_user_can( apply_filters( 'wcgs_import_export_capability', 'manage_options' ) );
	}

	/**
	 * REST API: the Settings tab values, defaults and choices.
	 *
	 * @since 4.0.0
	 * @return WP_REST_Response
	 */
	public function get_settings() {
		$values = $this->read_values();

		return rest_ensure_response(
			array(
				'values'    => $values,
				'defaults'  => wp_list_pluck( self::fields(), 'default' ),
				'choices'   => array(
					'layouts'    => $this->get_layouts(),
					'migrations' => $this->get_migration_choices(),
				),
				'export'    => $this->get_export_defaults(),
				'canEditJs' => current_user_can( 'unfiltered_html' ),
			)
		);
	}

	/**
	 * REST API: save the Settings tab values into `wcgs_settings`.
	 *
	 * Only the keys in fields() are written; every other key is kept.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_settings( WP_REST_Request $request ) {
		$values = $request->get_param( 'values' );
		if ( ! is_array( $values ) ) {
			return new WP_Error( 'wcgs_invalid_settings', __( 'No settings to save.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
		}

		$stored = $this->get_stored();
		foreach ( self::fields() as $key => $field ) {
			if ( ! array_key_exists( $key, $values ) ) {
				continue;
			}
			// Raw JS runs on product pages, so only users allowed to post unfiltered HTML may change it.
			if ( 'js' === $field['type'] && ! current_user_can( 'unfiltered_html' ) ) {
				continue;
			}
			$stored[ $key ] = $this->to_storage( $values[ $key ], $field );
		}

		update_option( self::OPTION, $stored );
		// The framework save clears the cached galleries too, so changes show at once.
		Woo_Gallery_Slider_Cache::purge_product_transients();

		return rest_ensure_response(
			array(
				'values'  => $this->read_values(),
				'message' => __( 'Settings saved.', 'gallery-slider-for-woocommerce' ),
			)
		);
	}

	/**
	 * REST API: search product categories or products for the pickers.
	 * With `per_page` (products only), returns one page as
	 * `{ items, more }` instead of the plain list.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function search_items( WP_REST_Request $request ) {
		$kind     = sanitize_key( (string) $request->get_param( 'kind' ) );
		$search   = sanitize_text_field( (string) $request->get_param( 'search' ) );
		$per_page = min( absint( $request->get_param( 'per_page' ) ), 50 );

		if ( 'category' === $kind ) {
			return rest_ensure_response( self::find_categories( $search ) );
		}
		if ( 'product' === $kind && $per_page ) {
			$page  = max( 1, absint( $request->get_param( 'page' ) ) );
			$items = self::find_products( $search, null, $per_page + 1, ( $page - 1 ) * $per_page );
			return rest_ensure_response(
				array(
					'items' => array_slice( $items, 0, $per_page ),
					'more'  => count( $items ) > $per_page,
				)
			);
		}
		if ( 'product' === $kind ) {
			return rest_ensure_response( self::find_products( $search ) );
		}
		return new WP_Error( 'wcgs_invalid_kind', __( 'Unknown search type.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
	}

	/**
	 * REST API: copy one batch of variation galleries from another plugin.
	 *
	 * Same job as the 3.x AJAX `wcgs_run_migration`, but it reads both
	 * stored formats of `woo_gallery_slider` ("[12,34]" and "12,34").
	 * Returns the migrated variations and products of the batch, and the
	 * total number of variable products for the progress bar.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function run_migration( WP_REST_Request $request ) {
		$sources = self::migration_sources();
		$plugin  = sanitize_key( (string) $request->get_param( 'plugin' ) );
		$offset  = absint( $request->get_param( 'offset' ) );

		if ( ! isset( $sources[ $plugin ] ) ) {
			return new WP_Error( 'wcgs_invalid_plugin', __( 'Unknown plugin to migrate from.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
		}
		$meta_key = $sources[ $plugin ]['meta_key'];

		$query       = new WP_Query(
			array(
				'post_type'        => 'product',
				'post_status'      => 'publish',
				'fields'           => 'ids',
				'posts_per_page'   => self::MIGRATION_BATCH,
				'offset'           => $offset,
				'orderby'          => 'ID',
				'order'            => 'ASC',
				// Like the legacy get_posts() call: no language-plugin filters, so every product is migrated.
				'suppress_filters' => true,
				'tax_query'        => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
					array(
						'taxonomy' => 'product_type',
						'field'    => 'slug',
						'terms'    => 'variable',
					),
				),
			)
		);
		$product_ids = $query->posts;

		$migrated = 0;
		$products = 0;
		foreach ( $product_ids as $product_id ) {
			$before        = $migrated;
			$variation_ids = get_posts(
				array(
					'post_type'      => 'product_variation',
					'post_status'    => array( 'private', 'publish' ),
					'posts_per_page' => -1,
					'post_parent'    => $product_id,
					'fields'         => 'ids',
				)
			);

			foreach ( $variation_ids as $variation_id ) {
				$old_ids = self::parse_id_list( get_post_meta( $variation_id, $meta_key, true ) );
				if ( empty( $old_ids ) ) {
					continue;
				}
				// Into WooCommerce core's variation gallery while it is enabled, otherwise woo_gallery_slider.
				Woo_Gallery_Slider_Variation_Gallery::add_ids( $variation_id, $old_ids );
				++$migrated;
			}
			if ( $migrated > $before ) {
				++$products;
			}
		}

		$done = count( $product_ids ) < self::MIGRATION_BATCH;
		if ( $done ) {
			Woo_Gallery_Slider_Cache::purge_product_transients();
		}

		return rest_ensure_response(
			array(
				'migrated'   => $migrated,
				'products'   => $products,
				'total'      => (int) $query->found_posts,
				'nextOffset' => $offset + count( $product_ids ),
				'done'       => $done,
			)
		);
	}

	/**
	 * REST API: build the export file (same format as the legacy export).
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function export_data( WP_REST_Request $request ) {
		$what          = sanitize_key( (string) $request->get_param( 'what' ) );
		$import_export = new Woo_Gallery_Slider_Import_Export();

		if ( 'global_setting' === $what ) {
			$export = $import_export->export( 'global_settings' );
			// Never put the license key or the Setup Wizard flag in a file that may be shared.
			if ( is_array( $export['global_settings'] ) ) {
				unset( $export['global_settings']['license_key'], $export['global_settings'][ Woo_Gallery_Slider_Dashboard_API::WIZARD_KEY ] );
			}
			return rest_ensure_response( $export );
		}

		if ( 'selected_layouts' === $what ) {
			$layout_ids = array_filter( array_map( 'absint', (array) $request->get_param( 'layouts' ) ) );
			if ( empty( $layout_ids ) ) {
				return new WP_Error( 'wcgs_no_layouts', __( 'Choose at least one layout to export.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
			}
		} elseif ( 'all_layouts' === $what ) {
			$layout_ids = 'all_layouts';
		} else {
			return new WP_Error( 'wcgs_invalid_export', __( 'Unknown export type.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
		}

		$export = $import_export->export( $layout_ids );
		if ( empty( $export['layout'] ) ) {
			return new WP_Error( 'wcgs_no_layouts', __( 'There are no layouts to export.', 'gallery-slider-for-woocommerce' ), array( 'status' => 404 ) );
		}
		return rest_ensure_response( $export );
	}

	/**
	 * REST API: import an exported file (global settings or layouts).
	 *
	 * Free has one per-product layout: a layouts file is imported only while
	 * no layout exists, and only its first layout (as 3.x did).
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function import_data( WP_REST_Request $request ) {
		$data = $request->get_param( 'data' );
		if ( ! is_array( $data ) ) {
			return new WP_Error( 'wcgs_invalid_import', __( 'This file is not a Reno Product Gallery export.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
		}

		if ( ! empty( $data['layout'] ) && is_array( $data['layout'] ) ) {
			$all     = array_values( array_filter( $data['layout'], 'is_array' ) );
			$layouts = array_slice( $all, 0, 1 );
			if ( ! $layouts ) {
				return new WP_Error( 'wcgs_empty_import', __( 'Nothing to import.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
			}
			if ( Woo_Gallery_Slider_Layouts_API::count_layouts() > 0 ) {
				return Woo_Gallery_Slider_Layouts_API::limit_error();
			}
			$result = ( new Woo_Gallery_Slider_Import_Export( $this->global_settings_api ) )->import( $layouts );
			if ( is_wp_error( $result ) ) {
				$result->add_data( array( 'status' => 400 ) );
				return $result;
			}
			Woo_Gallery_Slider_Cache::purge_product_transients();

			return rest_ensure_response(
				array(
					'imported' => 'layouts',
					'skipped'  => count( $all ) - 1,
					'message'  => count( $all ) > 1
						? __( 'Imported the first layout of the file. The free version includes one per-product layout.', 'gallery-slider-for-woocommerce' )
						: __( 'Imported 1 layout.', 'gallery-slider-for-woocommerce' ),
				)
			);
		}

		if ( ! empty( $data['global_settings'] ) && is_array( $data['global_settings'] ) ) {
			update_option( self::OPTION, $this->sanitize_imported_settings( $data['global_settings'] ) );
			Woo_Gallery_Slider_Cache::purge_product_transients();

			return rest_ensure_response(
				array(
					'imported' => 'global_settings',
					'values'   => $this->read_values(),
					'message'  => __( 'Global settings imported.', 'gallery-slider-for-woocommerce' ),
				)
			);
		}

		return new WP_Error( 'wcgs_empty_import', __( 'Nothing to import.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
	}

	/**
	 * The stored global settings array.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_stored() {
		$stored = get_option( self::OPTION, array() );
		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * Stored values of fields(), in the shapes the React app edits.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function read_values() {
		$stored = $this->get_stored();
		$values = array();
		foreach ( self::fields() as $key => $field ) {
			$values[ $key ] = array_key_exists( $key, $stored )
				? $this->from_storage( $stored[ $key ], $field )
				: $field['default'];
		}
		return $values;
	}

	/**
	 * Convert a stored value to the app shape.
	 *
	 * @since 4.0.0
	 * @param mixed $value Stored value.
	 * @param array $field Field definition.
	 * @return mixed
	 */
	private function from_storage( $value, $field ) {
		switch ( $field['type'] ) {
			case 'switch':
				// The 3.x framework saved a switch that was off as "0".
				return (bool) $value && '0' !== $value;
			case 'multi':
				return is_array( $value ) ? array_values( array_intersect( $field['options'], $value ) ) : array();
			case 'css':
				// The framework stored CSS through wp_kses_post; the frontend decodes it the same way.
				// A save breaks every "</" as "<\/" (the same in CSS); show it as typed.
				return is_string( $value ) ? str_replace( '<\/', '</', html_entity_decode( $value ) ) : '';
			default:
				return is_string( $value ) ? $value : '';
		}
	}

	/**
	 * Sanitize an app value into the stored shape of the legacy framework.
	 *
	 * @since 4.0.0
	 * @param mixed $value Value from the request.
	 * @param array $field Field definition.
	 * @return mixed
	 */
	private function to_storage( $value, $field ) {
		switch ( $field['type'] ) {
			case 'switch':
				return rest_sanitize_boolean( $value ) ? '1' : '';
			case 'multi':
				return array_values( array_intersect( $field['options'], array_map( 'strval', (array) $value ) ) );
			case 'css':
				// The frontend entity-decodes the CSS before printing it inline, so decode
				// fully, then break every "</" so nothing can close the <style> tag.
				// No tag strip: it would cut valid CSS such as "@media (width<600px)".
				$css = is_string( $value ) ? $value : '';
				do {
					$previous = $css;
					$css      = html_entity_decode( $css, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
				} while ( $previous !== $css );
				return str_replace( '</', '<\/', $css );
			case 'js':
				return is_string( $value ) ? $value : '';
			default:
				return sanitize_text_field( (string) $value );
		}
	}

	/**
	 * Sanitize imported global settings before they replace `wcgs_settings`.
	 *
	 * The settings fields go through their own sanitizers, so a Pro-only value
	 * of a file exported from Pro falls back to the free value. Keeps the
	 * stored Additional JS for users who may not post unfiltered HTML.
	 *
	 * @since 4.0.0
	 * @param array $imported Imported settings.
	 * @return array
	 */
	private function sanitize_imported_settings( $imported ) {
		$stored   = $this->get_stored();
		$fields   = self::fields();
		$settings = array();

		foreach ( $imported as $key => $value ) {
			// Not sanitize_key(): it lowercases, and some field ids are camelCase (thumbnailIcon_box_size).
			$key = is_string( $key ) ? preg_replace( '/[^A-Za-z0-9_\-]/', '', $key ) : '';
			if ( isset( $fields[ $key ] ) ) {
				$settings[ $key ] = $this->to_storage( $value, $fields[ $key ] );
			} else {
				$settings[ $key ] = is_array( $value ) ? wp_kses_post_deep( $value ) : wp_kses_post( (string) $value );
			}
		}

		// Responsive values of any version (plain, device_overrides or device maps), sanitized, stored as device maps.
		$settings = Woo_Gallery_Slider_Responsive::normalize_import( $settings );

		// The Global Settings keys go through that panel's own sanitizers, in the
		// stored shapes (enums, numbers and colors checked as on a dashboard save).
		if ( $this->global_settings_api ) {
			$settings = Woo_Gallery_Slider_Responsive::to_runtime( $settings );
			foreach ( Woo_Gallery_Slider_Global_Settings_API::fields() as $key => $field ) {
				if ( array_key_exists( $key, $settings ) ) {
					$settings[ $key ] = $this->global_settings_api->to_storage( $this->global_settings_api->from_storage( $settings[ $key ], $field ), $field, $settings[ $key ] );
				}
			}
			$settings = Woo_Gallery_Slider_Responsive::to_stored( $settings );
		}

		// A Pro export may carry a license key: never store it here.
		unset( $settings['license_key'] );
		// The Setup Wizard flag belongs to this site, not the file.
		unset( $settings[ Woo_Gallery_Slider_Dashboard_API::WIZARD_KEY ] );
		if ( isset( $stored[ Woo_Gallery_Slider_Dashboard_API::WIZARD_KEY ] ) ) {
			$settings[ Woo_Gallery_Slider_Dashboard_API::WIZARD_KEY ] = $stored[ Woo_Gallery_Slider_Dashboard_API::WIZARD_KEY ];
		}
		if ( ! current_user_can( 'unfiltered_html' ) ) {
			$settings['wcgs_additional_js'] = isset( $stored['wcgs_additional_js'] ) ? $stored['wcgs_additional_js'] : '';
		}
		return $settings;
	}

	/**
	 * Parse an id list stored as an array, JSON "[1,2]" or "1,2".
	 *
	 * @since 4.0.0
	 * @param mixed $value Stored value.
	 * @return int[]
	 */
	public static function parse_id_list( $value ) {
		if ( is_string( $value ) ) {
			$value = explode( ',', trim( $value, '[] ' ) );
		}
		if ( ! is_array( $value ) ) {
			return array();
		}
		return array_values( array_unique( array_filter( array_map( 'absint', $value ) ) ) );
	}

	/**
	 * Saved layouts, for the export picker.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_layouts() {
		$layouts = get_posts(
			array(
				'post_type'        => 'wcgs_layouts',
				// Inactive layouts are drafts since 4.0.0.
				'post_status'      => array( 'publish', 'draft' ),
				'posts_per_page'   => -1,
				'orderby'          => 'title',
				'order'            => 'ASC',
				'suppress_filters' => true,
			)
		);
		$choices = array();
		foreach ( $layouts as $layout ) {
			$choices[] = array(
				'value' => $layout->ID,
				/* translators: %d: layout ID. */
				'label' => '' !== $layout->post_title ? $layout->post_title : sprintf( __( '(no title) #%d', 'gallery-slider-for-woocommerce' ), $layout->ID ),
			);
		}
		return $choices;
	}

	/**
	 * Migration source plugins, without their meta keys.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_migration_choices() {
		$choices = array();
		foreach ( self::migration_sources() as $slug => $source ) {
			$choices[] = array(
				'value'  => $slug,
				'label'  => $source['name'],
				'author' => $source['author'],
			);
		}
		return $choices;
	}

	/**
	 * Stored export choice of the legacy Import & Export tab.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_export_defaults() {
		$stored = $this->get_stored();
		$what   = isset( $stored['wcgs_what_export'] ) ? $stored['wcgs_what_export'] : 'all_layouts';
		return array(
			'what'    => in_array( $what, array( 'global_setting', 'all_layouts', 'selected_layouts' ), true ) ? $what : 'all_layouts',
			'layouts' => self::parse_id_list( isset( $stored['wcgs_post'] ) ? $stored['wcgs_post'] : array() ),
		);
	}

	/**
	 * Product categories matching a search, or the given ids.
	 *
	 * @since 4.0.0
	 * @param string $search  Search text.
	 * @param int[]  $include Ids to fetch instead of searching.
	 * @return array
	 */
	public static function find_categories( $search = '', $include = null ) {
		if ( is_array( $include ) && empty( $include ) ) {
			return array();
		}
		$args = array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
			'number'     => 50,
		);
		if ( is_array( $include ) ) {
			$args['include'] = $include;
			$args['number']  = 0;
		} elseif ( '' !== $search ) {
			$args['search'] = $search;
		}

		$terms   = get_terms( $args );
		$choices = array();
		if ( is_wp_error( $terms ) ) {
			return $choices;
		}
		foreach ( $terms as $term ) {
			$choices[] = array(
				'value' => (int) $term->term_id,
				'label' => html_entity_decode( $term->name ),
				'hint'  => (string) $term->count,
			);
		}
		return $choices;
	}

	/**
	 * Products matching a search, or the given ids.
	 *
	 * @since 4.0.0
	 * @param string $search   Search text.
	 * @param int[]  $include  Ids to fetch instead of searching.
	 * @param int    $per_page Number of products to return when searching.
	 * @param int    $offset   Number of products to skip when searching.
	 * @return array
	 */
	public static function find_products( $search = '', $include = null, $per_page = 30, $offset = 0 ) {
		if ( is_array( $include ) && empty( $include ) ) {
			return array();
		}
		$args = array(
			'post_type'        => 'product',
			'post_status'      => array( 'publish', 'private', 'draft', 'pending', 'future' ),
			'posts_per_page'   => $per_page,
			'offset'           => $offset,
			'orderby'          => 'title',
			'order'            => 'ASC',
			'suppress_filters' => true,
			'no_found_rows'    => true,
		);
		if ( is_array( $include ) ) {
			$args['post__in']       = $include;
			$args['posts_per_page'] = count( $include );
			$args['offset']         = 0;
		} elseif ( '' !== $search ) {
			$args['s'] = $search;
		}

		$choices = array();
		foreach ( get_posts( $args ) as $product ) {
			$image     = get_the_post_thumbnail_url( $product, 'thumbnail' );
			$choices[] = array(
				'value' => $product->ID,
				'label' => '' !== $product->post_title ? html_entity_decode( $product->post_title ) : '#' . $product->ID,
				'hint'  => '#' . $product->ID,
				'image' => $image ? $image : '',
			);
		}
		return $choices;
	}
}
