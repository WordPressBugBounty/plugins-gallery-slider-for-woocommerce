<?php
/**
 * REST API endpoint of the dashboard live preview.
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
 * Product data for the live preview in the dashboard's main area.
 *
 * The preview frames the product's own page (`frameUrl`, see
 * Woo_Gallery_Slider_Preview_Frame), which has no gallery. The gallery is
 * built in the browser: `src/admin/pages/globalSettings/LivePreview/engine/`
 * ports `product-images.php` (React) and `WCGS_Public_Style` (CSS), so every
 * panel edit re-renders without a request. This endpoint sends what only
 * WordPress knows: the product's raw gallery data, the image URLs and sizes
 * for the image-size settings (the only settings that need a new request),
 * the stored settings, the field definitions and the `WCGS_Public_Settings`
 * defaults.
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Preview_API {

	/**
	 * REST API namespace.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const REST_NAMESPACE = 'wcgs/v1';

	/**
	 * Panel keys the image URLs and sizes depend on. Only a change of one of
	 * these asks the server again.
	 *
	 * @since 4.0.0
	 * @var array
	 */
	const MEDIA_KEYS = array( 'image_sizes', 'thumbnails_sizes' );

	/**
	 * REST API of the Global Settings panel, which merges the panel values.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Global_Settings_API
	 */
	private $global_settings_api;

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 * @param Woo_Gallery_Slider_Global_Settings_API $global_settings_api Global Settings REST API.
	 */
	public function __construct( $global_settings_api ) {
		$this->global_settings_api = $global_settings_api;
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register the REST API route.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/preview',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'get_preview_data' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'values'     => array(
						'type'    => 'object',
						'default' => array(),
					),
					'product_id' => array(
						'type'              => 'integer',
						'default'           => 0,
						'sanitize_callback' => 'absint',
					),
					// Layout being edited in the Per-Product Layouts tab (0 for a new, unsaved one).
					'layout_id'  => array(
						'type'              => 'integer',
						'default'           => 0,
						'sanitize_callback' => 'absint',
					),
					// Whether a layout is being edited at all (false: the Global Settings).
					'is_layout'  => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);
	}

	/**
	 * Only users who can manage the plugin may use this endpoint.
	 * The REST nonce (X-WP-Nonce, sent by apiFetch) authenticates the cookie.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( apply_filters( 'wcgs_ui_permission', 'manage_options' ) );
	}

	/**
	 * REST API: the data the browser renders the preview from.
	 *
	 * `values` are the panel's image-size values (MEDIA_KEYS, app shapes); the
	 * image URLs and sizes in `media` are computed with them.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_preview_data( WP_REST_Request $request ) {
		$product = $this->get_preview_product( (int) $request->get_param( 'product_id' ) );
		if ( ! $product ) {
			return rest_ensure_response( array( 'product' => null ) );
		}

		$this->load_public_classes();

		// The runtime shape, which the preview's settings port works on.
		$stored = Woo_Gallery_Slider_Responsive::to_runtime( get_option( 'wcgs_settings', array() ) );
		$stored = is_array( $stored ) ? $stored : array();
		unset( $stored['license_key'] );
		// The preview applies free_settings() itself (engine/settings.js
		// freeSettings()) after the panel values go in.

		$values   = $request->get_param( 'values' );
		$values   = array_intersect_key( is_array( $values ) ? $values : array(), array_flip( self::MEDIA_KEYS ) );
		$settings = WCGS_Public_Helper::free_settings( $this->global_settings_api->merge_values( $values ) );
		$gallery  = $this->get_gallery_data( $product );

		return rest_ensure_response(
			array(
				'product'       => $this->get_product_data( $product ),
				// The product page the preview frames, without its gallery.
				'frameUrl'      => Woo_Gallery_Slider_Preview_Frame::url( $product->get_id() ),
				'gallery'       => $gallery,
				'media'         => $this->get_media( $gallery['mediaIds'], $settings ),
				'stored'        => $stored,
				'fields'        => Woo_Gallery_Slider_Global_Settings_API::fields(),
				'mediaKeys'     => self::MEDIA_KEYS,
				// Property defaults of WCGS_Public_Settings (WCGS_Public_Default and the font map): the CSS builder reads unset properties from here.
				'styleDefaults' => get_class_vars( 'WCGS_Public_Settings' ),
				'page'          => $this->get_page_data(),
				'notices'       => $this->get_notices( $product, (int) $request->get_param( 'layout_id' ), rest_sanitize_boolean( $request->get_param( 'is_layout' ) ) ),
			)
		);
	}

	/**
	 * The product to preview: the requested one, else the latest published
	 * product with gallery images, else the latest product.
	 *
	 * @since 4.0.0
	 * @param int $product_id Requested product ID, or 0.
	 * @return WC_Product|null
	 */
	private function get_preview_product( $product_id ) {
		$product = $product_id ? wc_get_product( $product_id ) : null;
		if ( $product && 'product' === get_post_type( $product->get_id() ) ) {
			return $product;
		}

		$args = array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'no_found_rows'  => true,
		);
		$ids  = get_posts(
			$args + array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_query_meta_query -- one row, admin preview only.
				'meta_query' => array(
					array(
						'key'     => '_product_image_gallery',
						'value'   => '',
						'compare' => '!=',
					),
				),
			)
		);
		if ( ! $ids ) {
			$ids = get_posts( $args );
		}
		return $ids ? wc_get_product( $ids[0] ) : null;
	}

	/**
	 * The public helper classes autoload only once the public class is set up,
	 * which only happens on the frontend. Set it up here for the REST request.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	private function load_public_classes() {
		if ( ! class_exists( 'WCGS_Public_Helper' ) ) {
			new Woo_Gallery_Slider_Public( 'gallery-slider-for-woocommerce', WOO_GALLERY_SLIDER_VERSION );
		}
	}

	/**
	 * Raw gallery data of the product, which no panel setting changes. The
	 * browser picks and orders the items from it as `product-images.php` does.
	 *
	 * @since 4.0.0
	 * @param WC_Product $product Product.
	 * @return array
	 */
	private function get_gallery_data( $product ) {
		$product_id = $product->get_id();
		$featured   = (int) $product->get_image_id();
		$gallery    = array_map( 'intval', $product->get_gallery_image_ids() );
		$media_ids  = array_merge( array( $featured ), $gallery );

		// "All Images" image source: the gallery plus the description images (WCGS_Public_Helper::gallery_image_ids()).
		$content_ids = array_map( 'intval', ( new WCGS_Public_Helper() )->gallery_image_ids( $product, array( 'gallery_image_source' => 'attached' ) ) );
		$media_ids   = array_merge( $media_ids, $content_ids );

		$data = array(
			'productId'        => $product_id,
			'type'             => $product->get_type(),
			'featuredId'       => $featured,
			'galleryIds'       => $gallery,
			'contentIds'       => $content_ids,
			'categoryIds'      => array_map( 'intval', wp_get_post_terms( $product_id, 'product_cat', array( 'fields' => 'ids' ) ) ),
			'defaultVariation' => null,
		);

		if ( ! $product->is_type( 'variable' ) ) {
			$data['mediaIds'] = $this->unique_ids( $media_ids );
			return $data;
		}

		// The default variation the template opens with (handle_variation_gallery()).
		$default_attributes = $product->get_default_attributes();
		if ( ! empty( $default_attributes ) ) {
			$match = array();
			foreach ( $default_attributes as $key => $value ) {
				$match[ 'attribute_' . $key ] = $value;
			}
			$variation_id             = WC_Data_Store::load( 'product' )->find_matching_product_variation( $product, $match );
			// The variation gallery's images the template shows (all of the plugin's meta or the core gallery).
			$data['defaultVariation'] = array(
				'id'         => (int) $variation_id,
				'imageId'    => $variation_id ? (int) get_post_thumbnail_id( $variation_id ) : 0,
				'galleryIds' => WCGS_Public_Helper::variation_gallery_ids( $variation_id ),
			);
			$media_ids                = array_merge( $media_ids, array( $data['defaultVariation']['imageId'] ), $data['defaultVariation']['galleryIds'] );
		}

		$data['mediaIds'] = $this->unique_ids( $media_ids );
		return $data;
	}

	/**
	 * Positive, unique IDs.
	 *
	 * @since 4.0.0
	 * @param array $ids IDs.
	 * @return array
	 */
	private function unique_ids( $ids ) {
		return array_values( array_unique( array_filter( array_map( 'intval', $ids ) ) ) );
	}

	/**
	 * Image data of each attachment for the given settings, keyed by ID:
	 * `image` as WCGS_Public_Image::get_image_meta() (the template) and the
	 * srcset the template prints.
	 *
	 * @since 4.0.0
	 * @param array $ids      Attachment IDs.
	 * @param array $settings Settings with the panel's image-size values.
	 * @return array
	 */
	private function get_media( $ids, $settings ) {
		$image_meta = new WCGS_Public_Image( $settings );
		$srcset     = isset( $settings['image_sizes'] ) ? $settings['image_sizes'] : 'woocommerce_single';
		$media      = array();
		foreach ( $ids as $id ) {
			$image = $image_meta->get_image_meta( $id );
			if ( empty( $image ) ) {
				continue;
			}
			$media[ $id ] = array(
				'image'  => $image,
				'srcset' => (string) wp_get_attachment_image_srcset( $id, $srcset ),
			);
		}
		// An object in JSON even when empty or keyed 0..n.
		return (object) $media;
	}

	/**
	 * The product as the toolbar and the gallery template show it; the rest
	 * of the page comes with the framed product page.
	 *
	 * @since 4.0.0
	 * @param WC_Product $product Product.
	 * @return array
	 */
	private function get_product_data( $product ) {
		return array(
			'id'        => $product->get_id(),
			'name'      => html_entity_decode( $product->get_name() ),
			'type'      => $product->get_type(),
			'permalink' => get_permalink( $product->get_id() ),
			'image'     => (string) get_the_post_thumbnail_url( $product->get_id(), 'thumbnail' ),
		);
	}

	/**
	 * Values of the framed page the gallery engine needs.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_page_data() {
		$public = WOO_GALLERY_SLIDER_URL . 'public/';

		return array(
			'isRtl'     => is_rtl(),
			// What the gallery script injects on the store, with its element
			// ids. The dashboard loads `wcgs-swiper-js` and `wcgs-fancybox-js`
			// into the frame up front, and its gallery engine loads
			// `wcgs-xzoom-js` and `wcgs-videojs-js` on demand, as the store's
			// script does. jQuery is the frame's own.
			'scripts'   => array(
				array(
					'src' => $public . 'js/swiper.min.js',
					'id'  => 'wcgs-swiper-js',
				),
				array(
					'src' => $public . 'js/fancybox-bundle.min.js',
					'id'  => 'wcgs-fancybox-js',
				),
				array(
					'src' => $public . 'js/zoom.min.js',
					'id'  => 'wcgs-xzoom-js',
				),
				array(
					'src' => $public . 'js/video.min.js',
					'id'  => 'wcgs-videojs-js',
				),
			),
			'publicUrl' => $public,
		);
	}

	/**
	 * Why the store may show something else than the preview.
	 *
	 * @since 4.0.0
	 * @param WC_Product $product   Product.
	 * @param int        $layout_id Layout being edited, or 0 for a new one or the Global Settings.
	 * @param bool       $is_layout Whether a layout is being edited.
	 * @return array List of {id, message}.
	 */
	private function get_notices( $product, $layout_id = 0, $is_layout = false ) {
		$notices = array();
		if ( apply_filters( 'wcgs_disable_gallery_slider', false, $product->get_id() ) ) {
			$notices[] = array(
				'id'      => 'disabled',
				'message' => __( 'The gallery is turned off for this product by custom code (the wcgs_disable_gallery_slider filter), so your store shows the default WooCommerce gallery.', 'gallery-slider-for-woocommerce' ),
			);
		}
		$layouts  = ( new WCGS_Public_Helper() )->get_assigns_layout( $product );
		$assigned = ! empty( $layouts ) ? (int) $layouts[0] : 0;
		if ( $layout_id || $is_layout ) {
			// Editing a layout: say when this product would not use it on the store.
			if ( $layout_id && 'publish' !== get_post_status( $layout_id ) ) {
				$notices[] = array(
					'id'      => 'layout',
					'message' => __( 'This layout is inactive, so your store does not use it yet. Activate it in the layouts list once it is assigned.', 'gallery-slider-for-woocommerce' ),
				);
			} elseif ( $layout_id && WCGS_Public_Helper::allowed_layout_id() !== $layout_id ) {
				// A layout kept from Pro: the free version applies the first one only.
				$notices[] = array(
					'id'      => 'layout',
					'message' => __( 'The free version applies only your first layout, so your store does not use this one. Upgrade to Pro to use more layouts.', 'gallery-slider-for-woocommerce' ),
				);
			} elseif ( $assigned && $assigned !== $layout_id ) {
				$notices[] = array(
					'id'      => 'layout',
					'message' => sprintf(
						/* translators: %s: layout title. */
						__( 'On your store this product uses the “%s” layout. Assign it to this layout to see this gallery there.', 'gallery-slider-for-woocommerce' ),
						html_entity_decode( get_the_title( $assigned ) )
					),
				);
			} elseif ( ! $assigned ) {
				$notices[] = array(
					'id'      => 'layout',
					'message' => __( 'On your store this product uses the Global Settings. Assign it to this layout to see this gallery there.', 'gallery-slider-for-woocommerce' ),
				);
			}
		} elseif ( $assigned && 'publish' === get_post_status( $assigned ) ) {
			$notices[] = array(
				'id'      => 'layout',
				'message' => sprintf(
					/* translators: %s: layout title. */
					__( 'On your store this product uses the “%s” layout, which overrides some of these settings.', 'gallery-slider-for-woocommerce' ),
					html_entity_decode( get_the_title( $assigned ) )
				),
			);
		}
		if ( ! $product->get_image_id() && ! $product->get_gallery_image_ids() ) {
			$notices[] = array(
				'id'      => 'no-images',
				'message' => __( 'This product has no images. Pick another product to preview the gallery.', 'gallery-slider-for-woocommerce' ),
			);
		}
		return $notices;
	}
}
