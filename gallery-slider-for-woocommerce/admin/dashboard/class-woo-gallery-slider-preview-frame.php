<?php
/**
 * The product page as the dashboard's live preview frames it.
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
 * The dashboard's live preview loads the product's own page in an iframe
 * (`?wcgs_preview=<nonce>`), so the theme's single product template, styles
 * and scripts show as on the store. On that request the page has no gallery:
 * the template prints an empty slot instead, and the dashboard mounts the
 * gallery of the unsaved settings into it (`LivePreview/Product/`). The
 * admin bar and the site header and footer are left out, and the gallery
 * script doesn't load (the dashboard runs its own engine on the frame); the
 * gallery stylesheets and jQuery do.
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Preview_Frame {

	/**
	 * Query arg that opens a product page as the live preview; its value is a
	 * `wcgs_preview` nonce.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const QUERY_ARG = 'wcgs_preview';

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 */
	public function __construct() {
		if ( is_admin() ) {
			return;
		}
		add_filter( 'show_admin_bar', array( $this, 'hide_admin_bar' ) );
		add_action( 'template_redirect', array( $this, 'send_headers' ) );
		// After the gallery template override (Woo_Gallery_Slider_Public, 99).
		add_filter( 'wc_get_template', array( $this, 'gallery_slot_template' ), 100, 2 );
		// After the gallery assets are enqueued (Woo_Gallery_Slider_Public, 94).
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ), 100 );
		add_filter( 'render_block_core/template-part', array( $this, 'hide_template_part' ), 10, 2 );
		add_action( 'wp_head', array( $this, 'print_styles' ) );
	}

	/**
	 * The frame URL of a product.
	 *
	 * @since 4.0.0
	 * @param int $product_id Product ID.
	 * @return string
	 */
	public static function url( $product_id ) {
		return add_query_arg( self::QUERY_ARG, wp_create_nonce( 'wcgs_preview' ), get_permalink( $product_id ) );
	}

	/**
	 * Whether this request is the live preview: a single product page opened
	 * with a valid preview nonce by a user who may use the dashboard.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public static function is_preview() {
		static $is_preview = null;
		if ( null === $is_preview ) {
			$is_preview = ! is_admin()
				&& isset( $_GET[ self::QUERY_ARG ] )
				&& wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET[ self::QUERY_ARG ] ) ), 'wcgs_preview' )
				&& current_user_can( apply_filters( 'wcgs_ui_permission', 'manage_options' ) );
		}
		return $is_preview && is_singular( 'product' );
	}

	/**
	 * No admin bar in the frame, so the page is the one a shopper sees.
	 *
	 * @since 4.0.0
	 * @param bool $show Whether to show the admin bar.
	 * @return bool
	 */
	public function hide_admin_bar( $show ) {
		return self::is_preview() ? false : $show;
	}

	/**
	 * Keep page caches away from the frame: it depends on the user and on
	 * settings that are not saved.
	 *
	 * @since 4.0.0
	 */
	public function send_headers() {
		if ( self::is_preview() ) {
			nocache_headers();
		}
	}

	/**
	 * The gallery's place in the single product template: an empty slot for
	 * the dashboard's gallery, for every product (with or without images,
	 * whatever the opt-out filter says; the dashboard shows notices for those).
	 *
	 * @since 4.0.0
	 * @param string $template      Template path.
	 * @param string $template_name Template name.
	 * @return string
	 */
	public function gallery_slot_template( $template, $template_name ) {
		if ( 'single-product/product-image.php' === $template_name && self::is_preview() ) {
			return WOO_GALLERY_SLIDER_PATH . 'admin/dashboard/partials/preview-gallery-slot.php';
		}
		return $template;
	}

	/**
	 * The frame loads the gallery stylesheets, not the gallery script: the
	 * dashboard fills the dynamic CSS and runs the gallery itself, and loads
	 * the store's SPSwiper and Fancybox into the frame. The Swiper and
	 * Fancybox stylesheets follow Speed Optimization, as on the store.
	 *
	 * @since 4.0.0
	 */
	public function enqueue_assets() {
		if ( ! self::is_preview() ) {
			return;
		}
		wp_dequeue_script( 'gallery-slider-for-woocommerce' );
		wp_enqueue_script( 'jquery' );

		$settings = get_option( 'wcgs_settings', array() );
		$enabled  = function ( $key ) use ( $settings ) {
			return ! is_array( $settings ) || ! isset( $settings[ $key ] ) || ! in_array( $settings[ $key ], array( false, '', '0', 0 ), true );
		};
		wp_enqueue_style( 'gallery-slider-for-woocommerce-fontello' );
		if ( $enabled( 'enqueue_swiper_css' ) ) {
			wp_enqueue_style( 'wcgs-swiper' );
		}
		wp_enqueue_style( 'gallery-slider-for-woocommerce' );
		if ( $enabled( 'enqueue_fancybox_css' ) ) {
			// Loaded by the gallery script when the lightbox opens on the store.
			wp_enqueue_style( 'wcgs-fancybox' );
		}
	}

	/**
	 * Leave the site header and footer out of the frame. Block themes: their
	 * header and footer template parts, by area, tag or slug.
	 *
	 * @since 4.0.0
	 * @param string $block_content Template part output.
	 * @param array  $block         Parsed block.
	 * @return string
	 */
	public function hide_template_part( $block_content, $block ) {
		if ( ! self::is_preview() ) {
			return $block_content;
		}
		$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
		foreach ( array( 'area', 'tagName', 'slug' ) as $key ) {
			if ( isset( $attrs[ $key ] ) && in_array( $attrs[ $key ], array( 'header', 'footer' ), true ) ) {
				return '';
			}
		}
		// A part whose area is set on the part itself prints its area's tag.
		return preg_match( '/^\s*<(header|footer)[\s>]/i', $block_content ) ? '' : $block_content;
	}

	/**
	 * Frame styles. Classic themes print their header with the document head
	 * (`header.php`), so their usual header and footer elements are hidden.
	 * Without them the content would touch the frame's edges, so 24px of
	 * space comes before and after it, as pseudo-elements that theme body
	 * padding can't undo.
	 *
	 * @since 4.0.0
	 */
	public function print_styles() {
		if ( ! self::is_preview() ) {
			return;
		}
		echo '<style id="wcgs-preview-frame-css">body>header,body>footer,#masthead,#colophon,.site-header,.site-footer,.woocommerce-store-notice{display:none!important}body::before,body::after{content:"";display:block;clear:both;height:24px}</style>' . "\n";
	}
}
