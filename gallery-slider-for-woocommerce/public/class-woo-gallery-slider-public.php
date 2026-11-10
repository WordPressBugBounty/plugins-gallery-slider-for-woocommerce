<?php
/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @link       https://shapedplugin.com/
 * @since      1.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/public
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

/**
 * Woo_Gallery_Slider_Public
 */
class Woo_Gallery_Slider_Public {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Slider settings
	 *
	 * @since 1.0.0
	 * @access private
	 * @var array $settings The settings of Slider
	 */
	private $settings;

	/**
	 * Slider settings
	 *
	 * @since 1.0.0
	 * @access private
	 * @var array $settings The settings of Slider
	 */
	private $json_data = array();
	/**
	 * Is settings updated.
	 *
	 * @var array
	 */
	private $is_settings_updated = false;
	/**
	 * Global settings, before any layout is applied.
	 *
	 * @since 4.0.0
	 * @var array
	 */
	private $base_settings = array();
	/**
	 * Helper functions.
	 *
	 * @var function
	 */
	private $helper;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param    string $plugin_name The name of the plugin.
	 * @param    string $version The version of this plugin.
	 * @param    array  $settings plugin settings.
	 */
	public function __construct( $plugin_name, $version, $settings = array() ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
		spl_autoload_register( array( $this, 'autoload_class' ) );
		spl_autoload_register( array( $this, 'autoload_trait' ) );

		$this->helper = new WCGS_Public_Helper();
		// Settings in the runtime shape (any device map split), free features only.
		$this->settings      = WCGS_Public_Helper::free_settings( Woo_Gallery_Slider_Responsive::to_runtime( $settings ) );
		$this->base_settings = $this->settings;

		// Register shortcode for the plugin.
		// Deprecated shortcode [wcgs_gallery_slider] since version 3.1.1 (use [woogallery] instead).
		add_shortcode(
			'wcgs_gallery_slider',
			function () {
				return do_shortcode( '[woogallery]' );
			}
		);
		// Add specific CSS class by filter.
		add_filter( 'body_class', array( $this, 'wcgs_body_class' ), 100 );
		add_action( 'wp_enqueue_scripts', array( $this, 'dequeue_script' ), 100 );
		add_filter( 'blocksy:woocommerce:product-view:use-default', array( $this, 'wcgs_single_product_slider_view' ) );
		// Register primary shortcode [reno_product_gallery] since rebrand to Reno Product Gallery.
		add_shortcode( 'reno_product_gallery', array( $this, 'wcgs_woocommerce_show_product_images' ) );
		// Register legacy shortcode [woogallery] as an alias for backward compatibility (deprecated, use [reno_product_gallery] instead).
		add_shortcode( 'woogallery', array( $this, 'wcgs_woocommerce_show_product_images' ) );
		add_action( 'save_post', array( $this, 'update_product_variation_json_cache_on_save' ) );
		// Variation saves, imports and gallery/video meta changes don't fire the
		// product's save_post, so its cached gallery data is dropped here.
		add_action( 'woocommerce_save_product_variation', array( $this, 'purge_variation_parent_cache' ) );
		add_action( 'woocommerce_ajax_save_product_variations', array( 'Woo_Gallery_Slider_Cache', 'purge_product' ) );
		add_action( 'woocommerce_product_import_inserted_product_object', array( $this, 'purge_imported_product_cache' ) );
		add_action( 'added_post_meta', array( $this, 'purge_cache_on_meta_change' ), 10, 3 );
		add_action( 'updated_post_meta', array( $this, 'purge_cache_on_meta_change' ), 10, 3 );
		add_action( 'deleted_post_meta', array( $this, 'purge_cache_on_meta_change' ), 10, 3 );
		// The cached gallery HTML and variation JSON hold each image's caption and alt text.
		add_action( 'edit_attachment', array( 'Woo_Gallery_Slider_Cache', 'purge_attachment_products' ) );
		add_action( 'wp', array( $this, 'wcgs_remove_wc_gallery' ) );
		add_action(
			'elementor/preview/enqueue_styles',
			function () {
				wp_enqueue_style( 'wcgs-elementor', WOO_GALLERY_SLIDER_URL . 'public/css/elementor-widget.min.css', array(), WOO_GALLERY_SLIDER_VERSION, 'all' );
			}
		);
	}
	/**
	 * Remove Product gallery lightbox zoom slider.
	 *
	 * @return void
	 */
	public function wcgs_remove_wc_gallery() {
		global $post;
		$product_id = is_object( $post ) ? $post->ID : '';
		if ( apply_filters( 'wcgs_disable_gallery_slider', false, $product_id ) ) {
			return;
		}
		$remove_default_wc_gallery = isset( $this->settings['remove_default_wc_gallery'] ) ? $this->settings['remove_default_wc_gallery'] : array( 'lightbox', 'zoom', 'slider' );
		// Remove default WooCommerce gallery lightbox,zoom,slider.
		if ( is_array( $remove_default_wc_gallery ) ) {
			if ( in_array( 'lightbox', $remove_default_wc_gallery, true ) ) {
				remove_theme_support( 'wc-product-gallery-lightbox' );
			}
			if ( in_array( 'zoom', $remove_default_wc_gallery, true ) ) {
				remove_theme_support( 'wc-product-gallery-zoom' );
			}
			if ( in_array( 'slider', $remove_default_wc_gallery, true ) ) {
				remove_theme_support( 'wc-product-gallery-slider' );
			}
		}
	}

	/**
	 * Update with Assigned Layout data.
	 *
	 * @param  object $product product.
	 * @return void
	 */
	private function assigns_layout( $product ) {
		$this->is_settings_updated = true;
		$assigned_layout           = $this->helper->get_assigns_layout( $product );
		// Apply first matching layout.
		if ( ! empty( $assigned_layout ) ) {
			$this->apply_assigned_layout( $assigned_layout[0] );
			// The layout's values can hold choices of the Pro plugin too.
			$this->settings = WCGS_Public_Helper::free_settings( $this->settings );
		}
	}

	/**
	 * Apply the assigned layout settings.
	 *
	 * @param int $layout_id Layout post ID.
	 */
	private function apply_assigned_layout( $layout_id ) {
		$assigned_options = get_post_meta( $layout_id, 'wcgs_metabox', true );
		if ( ! empty( $assigned_options ) ) {
			$assigned_options = Woo_Gallery_Slider_Responsive::to_runtime( $assigned_options );
			$this->settings   = Woo_Gallery_Slider_Responsive::from_layout( $this->helper->wp_parse_args_recursive( $assigned_options, $this->settings ), $assigned_options );
		}
	}

	/**
	 * WCGS product image area method.
	 *
	 * @since 1.0.0
	 */
	public function wcgs_woocommerce_show_product_images() {
		global $product;
		ob_start();
		// The same product the gallery template picks (WCGS_Product_Gallery::get_product()).
		$the_product = $product ? $product : wc_get_product( get_the_ID() );
		// Honor the opt-out filter: show WooCommerce's own gallery instead.
		if ( $the_product && apply_filters( 'wcgs_disable_gallery_slider', false, $the_product->get_id() ) ) {
			if ( function_exists( 'woocommerce_show_product_images' ) ) {
				$product = $the_product; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- WooCommerce's template reads the global, as ours does.
				woocommerce_show_product_images();
			}
			return ob_get_clean();
		}
		include WOO_GALLERY_SLIDER_PATH . '/public/partials/product-images.php';
		return ob_get_clean();
	}

	/**
	 * Woo-gallery-slider body class.
	 *
	 * @param  mixed $classes class name.
	 * @return string
	 */
	public function wcgs_body_class( $classes ) {
		if ( is_product() ) {
			$classes = array_merge( $classes, array( 'wcgs-gallery-slider' ) );
		}
		return $classes;
	}

	/**
	 * This function has been added for doing compatible with Blocksy Theme.
	 *
	 * @return true
	 */
	public function wcgs_single_product_slider_view() {
		if ( is_singular( 'product' ) ) {
			return true;
		}
	}
	/**
	 * Autoload class files on demand
	 *
	 * @since 1.0.0
	 * @access private
	 * @param string $class requested class name.
	 */
	private function autoload_class( $class ) {
		$name = explode( '_', $class );
		if ( isset( $name[2] ) ) {
			$class_name        = strtolower( $name[2] );
			$spto_config_paths = array( 'partials' );
			foreach ( $spto_config_paths as $sptp_path ) {
				$filename = plugin_dir_path( __FILE__ ) . '/' . $sptp_path . '/class/class-public-' . $class_name . '.php';
				if ( file_exists( $filename ) ) {
					require_once $filename;
				}
			}
		}
	}

	/**
	 * Autoload trait files on demand
	 *
	 * @since 1.0.0
	 * @access private
	 * @param string $trait requested class name.
	 */
	private function autoload_trait( $trait ) {
		$name = explode( '_', $trait );
		if ( isset( $name[2] ) ) {
			$trait_name        = strtolower( $name[2] );
			$spto_config_paths = array( 'partials' );
			foreach ( $spto_config_paths as $sptp_path ) {
				$filename = plugin_dir_path( __FILE__ ) . '/' . $sptp_path . '/trait/trait-public-' . $trait_name . '.php';
				if ( file_exists( $filename ) ) {
					require_once $filename;
				}
			}
		}
	}

	/**
	 * Gallery default template override
	 *
	 * @param  mixed $template Template.
	 * @param  mixed $template_name Template.
	 * @return string
	 */
	public function wpgsp_gallery_template_override( $template, $template_name ) {
		// Check for quick view parameter.
		if ( isset( $_GET['product_quickfix'] ) ) {
			return $template; // Return the original template if in quick view.
		}

		if ( is_product() ) {
			global $product;
			$old_template = $template;
			if ( 'single-product/product-image.php' === $template_name && $product && ( has_post_thumbnail( $product->get_id() ) || count( $product->get_gallery_image_ids() ) > 0 ) ) {
				// Check for disable gallery slider filter hook.
				if ( apply_filters( 'wcgs_disable_gallery_slider', false, $product->get_id() ) ) {
					return $old_template;
				}
				// WooCommerce's gallery HTML snippets for its own variation swap: print nothing.
				if ( $this->is_core_gallery_html_render() ) {
					return WOO_GALLERY_SLIDER_PATH . 'public/partials/product-images-empty.php';
				}
				$template = WOO_GALLERY_SLIDER_PATH . '/public/partials/product-images.php';
			}
		}
		return $template;
	}

	/**
	 * Whether the product image template is rendered by
	 * `wc_get_product_gallery_html()` (WooCommerce 10.8+): the gallery
	 * snapshot of the variable Add to Cart form (`<template>` and
	 * `wc_variation_gallery_defaults`) and each variation's
	 * `gallery_images_html`, rendered with the parent product and the
	 * variation's images. WooCommerce's script swaps that HTML into a
	 * `.woocommerce-product-gallery`, which the plugin's gallery is not, and
	 * the plugin switches variation images itself. Rendering the full gallery
	 * there only adds its markup once per variation (a duplicate
	 * `#wpgs-gallery` each time) and, with the gallery cache on, stored a
	 * variation's images as the product's cached gallery.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	private function is_core_gallery_html_render() {
		if ( ! function_exists( 'wc_get_product_gallery_html' ) ) {
			return false;
		}
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace -- No hook tells these renders apart.
		foreach ( debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS, 12 ) as $frame ) {
			if ( isset( $frame['function'] ) && empty( $frame['class'] ) && in_array( $frame['function'], array( 'wc_get_product_gallery_html', 'wc_render_product_image_template_for' ), true ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Update product variation json cache on save.
	 *
	 * @param  int $post_ID current post id.
	 * @return void
	 */
	public function update_product_variation_json_cache_on_save( $post_ID ) {
		if ( 'product' === get_post_type( $post_ID ) ) {
			Woo_Gallery_Slider_Cache::purge_product( $post_ID );
			$product = wc_get_product( $post_ID );
			if ( ! $product ) {
				return;
			}
			// Rebuild with this product's own layout: several products can be
			// saved in one request (bulk edit, import), and the settings a
			// previous product's layout resolved must not carry over.
			$state                     = array( $this->settings, $this->is_settings_updated, $this->json_data );
			$this->settings            = $this->base_settings;
			$this->is_settings_updated = false;
			$this->json_data           = array();
			$this->wcgs_json_data( $product, true );
			list( $this->settings, $this->is_settings_updated, $this->json_data ) = $state;
		}
	}

	/**
	 * Drop the cached gallery data of a saved variation's product.
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return void
	 */
	public function purge_variation_parent_cache( $variation_id ) {
		Woo_Gallery_Slider_Cache::purge_product( wp_get_post_parent_id( $variation_id ) );
	}

	/**
	 * Drop the cached gallery data of a product (or a variation's product)
	 * updated by the WooCommerce product CSV importer.
	 *
	 * @since 4.0.0
	 * @param WC_Product $product Imported product.
	 * @return void
	 */
	public function purge_imported_product_cache( $product ) {
		if ( is_a( $product, 'WC_Product' ) ) {
			Woo_Gallery_Slider_Cache::purge_product( $product->get_parent_id() ? $product->get_parent_id() : $product->get_id() );
		}
	}

	/**
	 * Drop cached gallery data when a variation gallery or an image's video or alt text changes.
	 *
	 * @since 4.0.0
	 * @param int|array $meta_id   Meta ID(s).
	 * @param int       $object_id Post ID.
	 * @param string    $meta_key  Meta key.
	 * @return void
	 */
	public function purge_cache_on_meta_change( $meta_id, $object_id, $meta_key ) {
		if ( 'woo_gallery_slider' === $meta_key || ( in_array( $meta_key, array( '_product_image_gallery', Woo_Gallery_Slider_Variation_Gallery::MIGRATED_META ), true ) && 'product_variation' === get_post_type( $object_id ) ) ) {
			Woo_Gallery_Slider_Cache::purge_product( wp_get_post_parent_id( $object_id ) );
		} elseif ( 'wcgs_video' === $meta_key || '_wp_attachment_image_alt' === $meta_key ) {
			Woo_Gallery_Slider_Cache::purge_attachment_products( $object_id );
		}
	}
	/**
	 * When variation change this method do the work
	 *
	 * @param object $product product.
	 * @param bool   $update_cache is updated cache.
	 * @since 1.0.0
	 */
	public function wcgs_json_data( $product, $update_cache = false ) {
		if ( apply_filters( 'wcgs_disable_gallery_slider', false, $product->get_id() ) ) {
			return;
		}
		if ( ! $this->is_settings_updated ) {
			$this->assigns_layout( $product );
		}
		if ( $product->is_type( 'variable' ) ) {
			$json_data  = array();
			$product_id = $product->get_id();
			if ( is_multisite() ) {
				$wcgs_json_data_key   = Woo_Gallery_Slider_Cache::key( 'wcgs_json_data' . get_current_blog_id() . $product_id );
				$wcgs_json_data_cache = get_site_transient( $wcgs_json_data_key );
			} else {
				$wcgs_json_data_key   = Woo_Gallery_Slider_Cache::key( 'wcgs_json_data' . $product_id );
				$wcgs_json_data_cache = get_transient( $wcgs_json_data_key );
			}
			if ( ! $wcgs_json_data_cache || $update_cache ) {
				$data            = new WCGS_Public_Variations( $this->settings );
				$this->json_data = $data->wcgs_json_data( $product );
				if ( $this->json_data ) {
					if ( is_multisite() ) {
						set_site_transient( $wcgs_json_data_key, $this->json_data, MONTH_IN_SECONDS );
					} else {
						set_transient( $wcgs_json_data_key, $this->json_data, WOO_GALLERY_SLIDER_TRANSIENT_EXPIRATION );
					}
				}
			} else {
				$this->json_data = $wcgs_json_data_cache;
			}
		}
		return $this->json_data;
	}

	/**
	 * Dequeue unused scripts.
	 *
	 * @return void
	 */
	public function dequeue_script() {
		if ( is_singular( 'product' ) ) {
			global $product;
			global $post;
			$product_id = is_object( $post ) ? $post->ID : '';
			if ( apply_filters( 'wcgs_disable_gallery_slider', false, $product_id ) ) {
				return;
			}
			// Dequeue single product css files.
			$dequeue_single_product_css = ! empty( $this->settings['dequeue_single_product_css'] ) ? $this->settings['dequeue_single_product_css'] : '';
			if ( ! empty( $dequeue_single_product_css ) ) {
				$disabled_styles = array_map( 'trim', explode( ',', $dequeue_single_product_css ) );
				foreach ( $disabled_styles as $style ) {
					wp_dequeue_style( $style );
				}
			}
			// Dequeue single product js files.
			$dequeue_single_product_js = ! empty( $this->settings['dequeue_single_product_js'] ) ? $this->settings['dequeue_single_product_js'] : '';
			if ( ! empty( $dequeue_single_product_js ) ) {
				$disabled_js = array_map( 'trim', explode( ',', $dequeue_single_product_js ) );
				foreach ( $disabled_js as $js_handle ) {
					wp_dequeue_script( $js_handle );
				}
			}
			// Dequeue OceanWP lightbox.
			wp_dequeue_script( 'oceanwp-lightbox' );
			if ( apply_filters( 'wcgs_dequeue_magnific_popup', true ) ) {
				wp_dequeue_script( 'magnific-popup' );
			}
		}
	}

	/**
	 * Enqueue the JavaScript for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {
		/**
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Woo_Gallery_Slider_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Woo_Gallery_Slider_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */
		if ( is_singular( 'product' ) ) {
			global $post;
			$product_id = is_object( $post ) ? $post->ID : '';
			$product    = wc_get_product( $product_id );
			if ( apply_filters( 'wcgs_disable_gallery_slider', false, $product_id ) ) {
				return;
			}
			if ( ! $this->is_settings_updated ) {
				$this->assigns_layout( $product );
			}
			$settings           = $this->settings;
			$this->json_data    = $this->wcgs_json_data( $product );
			$dynamic_css        = new WCGS_Public_Style( $settings );
			$enqueue_swiper_css = isset( $settings['enqueue_swiper_css'] ) ? $settings['enqueue_swiper_css'] : true;
			$lazy_load_gallery  = isset( $settings['lazy_load_gallery'] ) ? $settings['lazy_load_gallery'] : '1';
			$custom_js          = isset( $settings['wcgs_additional_js'] ) ? $settings['wcgs_additional_js'] : '';
			wp_enqueue_style( $this->plugin_name . '-fontello' );
			if ( $enqueue_swiper_css ) {
				wp_enqueue_style( 'wcgs-swiper' );
			}
			wp_enqueue_style( $this->plugin_name );
			wp_enqueue_script( $this->plugin_name );
			if ( ! empty( $custom_js ) ) {
				wp_add_inline_script( $this->plugin_name, $custom_js );
			}
			wp_add_inline_style( $this->plugin_name, $this->helper->minify_output( $dynamic_css::wcgs_stylesheet_include() ) );
			wp_localize_script(
				$this->plugin_name,
				'wcgs_object',
				array(
					'wcgs_data'            => $this->json_data,
					// Only the keys the public script reads, not the whole option.
					'wcgs_settings'        => $this->helper->public_settings_subset( $this->settings ),
					// Max viewport width per device, for the device values in wcgs_settings.
					'wcgs_breakpoints'     => Woo_Gallery_Slider_Responsive::devices(),
					'wcgs_public_url'      => WOO_GALLERY_SLIDER_URL . 'public/',
					'wcgs_product_wrapper' => apply_filters( 'wcgs_product_wrapper', '.single-product .product' ),
					'wcgs_body_font_size'  => apply_filters( 'wcgs_body_font_size', '14' ),
					'lazy_load_gallery'    => $lazy_load_gallery,
					'wcgs_i18n'            => array(
						/* translators: %s: video host name, e.g. Vimeo. */
						'video_title' => __( '%s video', 'gallery-slider-for-woocommerce' ),
						'lightbox'    => __( 'Open lightbox', 'gallery-slider-for-woocommerce' ),
						'next_slide'  => __( 'Next slide', 'gallery-slider-for-woocommerce' ),
						'prev_slide'  => __( 'Previous slide', 'gallery-slider-for-woocommerce' ),
						'fancybox'    => WCGS_Public_Helper::lightbox_l10n(),
					),
				)
			);
		}
	}
}
