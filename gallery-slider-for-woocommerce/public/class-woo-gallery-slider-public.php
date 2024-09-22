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
 * WooGallery Public class
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
	private $json_data;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string $plugin_name       The name of the plugin.
	 * @param      string $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
		$this->settings    = get_option( 'wcgs_settings' );

		spl_autoload_register( array( $this, 'autoload_class' ) );
		spl_autoload_register( array( $this, 'autoload_trait' ) );

		new WCGS_Public_Style( $this->settings );
		add_action( 'wp_enqueue_scripts', array( 'WCGS_Public_Style', 'wcgs_stylesheet_include' ) );
		add_action( 'wp_print_scripts', array( $this, 'dequeue_script' ), 100 );
		add_filter( 'blocksy:woocommerce:product-view:use-default', array( $this, 'wcgs_product_slider_view' ) );
		add_action( 'activated_plugin', array( $this, 'redirect_help_page' ) );

		// Add specific CSS class by filter .
		add_filter( 'body_class', array( $this, 'wcgs_body_class' ), 100 );
		add_shortcode( 'wcgs_gallery_slider', array( $this, 'wcgs_woocommerce_show_product_images' ) );
	}

	/**
	 * Woo-gallery-slider main class.
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
	 * This function has been used for doing compatible with Blocksy Theme.
	 *
	 * @return true
	 */
	public function wcgs_product_slider_view() {
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
	 * Remove woocommerce_show_product_images and add wcgs function
	 *
	 * @since 1.0.0
	 */
	public function remove_gallery_and_product_images() {
		if ( is_product() ) {
			add_filter( 'wc_get_template', array( $this, 'wpgs_gallery_template_part_override' ), 99, 2 );
		}
	}

	/**
	 * Gallery template part override
	 *
	 * @param  string $template template.
	 * @param  string $template_name template name.
	 * @return string
	 */
	public function wpgs_gallery_template_part_override( $template, $template_name ) {
		if ( 'single-product/product-image.php' !== $template_name ) {
			return $template;
		}
		global $product;
		$old_template = $template;
		if ( 'single-product/product-image.php' === $template_name && $product && ( has_post_thumbnail( $product->get_id() ) || count( $product->get_gallery_image_ids() ) > 0 ) ) {
			$template = WOO_GALLERY_SLIDER_PATH . '/public/partials/product-images.php';
		}
		return $template;
	}
	/**
	 * Redirect after active
	 *
	 * @param string $plugin The plugin help page.
	 */
	public function redirect_help_page( $plugin ) {
		if ( WOO_GALLERY_SLIDER_BASENAME === $plugin && ! ( defined( 'DOING_AJAX' ) && DOING_AJAX ) && ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			wp_safe_redirect( admin_url( 'admin.php?page=wpgs-settings#tab=help' ) );
			exit();
		}
	}

	/**
	 * When variation change this method do the work
	 *
	 * @param string $product_id product id.
	 * @since 1.0.0
	 */
	public function wcgs_json_data( $product_id ) {
		$gallery = array();
		$product = wc_get_product( $product_id );

		$product_type = $product->get_type();
		if ( 'variable' === $product_type ) {
			$product_attributes  = $product->get_attributes();
			$variation_array_raw = array();
			if ( ! empty( $product_attributes ) && is_array( $product_attributes ) ) {
				foreach ( $product_attributes as $attribute_name => $options ) {
					if ( isset( $options['variation'] ) && $options['variation'] ) {
						$selected_keys[] = array( 'attribute_' . sanitize_title( $attribute_name ), $options->get_slugs() );
					}
				}
			}

			// This "POST" requests is sanitizing in the below foreach.
			$variation_array_raw = isset( $selected_keys ) ? wp_unslash( $selected_keys ) : null;

			if ( is_array( $variation_array_raw ) && $variation_array_raw ) {
				$combinations_artr_name = array();
				$combinations_artr      = array();
				foreach ( $variation_array_raw as $key => $variation_array_raw_single ) {
					$combinations_artr_name[ $key ] = isset( $variation_array_raw_single[0] ) ? $variation_array_raw_single[0] : null;
					$combinations_artr[ $key ]      = isset( $variation_array_raw_single[1] ) ? $variation_array_raw_single[1] : null;
				}

				if ( count( $variation_array_raw ) > 1 ) {
					$variation_array_raw = array( $combinations_artr_name, self::combinations( $combinations_artr ) );
				}

				$variation_arrays = array();
				if ( ! isset( $variation_array_raw[1] ) ) {
					foreach ( $variation_array_raw[0][1] as $key => $variation_array_raw_1 ) {
						$variation_arrays[ $key ][ $variation_array_raw[0][0] ] = $variation_array_raw_1;
					}
				} elseif ( isset( $variation_array_raw[1] ) ) {
					foreach ( $variation_array_raw[1] as $key => $variation_array_raw_1 ) {
						$variation_array_raw_1_new = array();
						if ( is_array( $variation_array_raw_1 ) ) {
							foreach ( $variation_array_raw_1 as $key1 => $variation_array_raw_1_child ) {
								if ( $variation_array_raw_1_child ) {
									$variation_array_raw_1_new[ $variation_array_raw[0] [ $key1 ] ] = $variation_array_raw_1_child;
								}
							}
						}
						if ( $variation_array_raw_1_new ) {
							$variation_arrays[ $key ] = $variation_array_raw_1_new;
						}
					}
				}
				$variation_array_raw = $variation_arrays;
			}
			$settings                      = get_option( 'wcgs_settings' );
			$include_feature_image         = isset( $settings['include_feature_image_to_gallery'] ) ? $settings['include_feature_image_to_gallery'] : array( 'default_gl' );
			$include_variation_and_default = isset( $settings['include_variation_and_default_gallery'] ) ? $settings['include_variation_and_default_gallery'] : false;
			if ( empty( $include_feature_image ) ) {
				$include_feature_image = array();
			}

			$gallery_arrays  = array();
			$variation_array = array();
			if ( $variation_array_raw ) {
				foreach ( $variation_array_raw as $key1 => $variation_array ) {
					$gallery          = array();
					$feature_image_id = $product->get_image_id();
					if ( is_array( $include_feature_image ) && in_array( 'variable_gl', $include_feature_image, true ) && $feature_image_id ) {
						array_push( $gallery, wcgs_image_meta( $feature_image_id ) );
					}
					$data_store = WC_Data_Store::load( 'product' );
					// Get variation id.
					$variation = $data_store->find_matching_product_variation( $product, $variation_array );
					if ( ! $variation ) {
						continue;
					}
					$image_id = get_post_thumbnail_id( $variation );
					if ( $image_id ) {
						array_push( $gallery, wcgs_image_meta( $image_id ) );
					}
					$woo_gallery_slider = get_post_meta( $variation, 'woo_gallery_slider', true );
					$gallery_arr        = substr( $woo_gallery_slider, 1, -1 );
					$gallery_multiple   = strpos( $gallery_arr, ',' ) ? true : false;
					if ( $gallery_multiple ) {
						$gallery_array = explode( ',', $gallery_arr );
						$count         = 1;
						foreach ( $gallery_array as $gallery_item ) {
							if ( 2 >= $count ) {
								array_push(
									$gallery,
									wcgs_image_meta( $gallery_item )
								);
							}
							++$count;
						}
					} else {
						$gallery_array = $gallery_arr;
						if ( $gallery_array ) {
							array_push( $gallery, wcgs_image_meta( $gallery_array ) );
						}
					}
					if ( $include_variation_and_default ) {
						$gallery_ids = $product->get_gallery_image_ids();
						$image_id    = $product->get_image_id();
						foreach ( $gallery_ids as $key => $gallery_image_id ) {
							array_push(
								$gallery,
								wcgs_image_meta( $gallery_image_id )
							);
						}
						if ( empty( $gallery ) ) {
							array_push( $gallery, wcgs_image_meta( $image_id ) );
						}
					}
					if ( $gallery ) {
						array_push( $gallery_arrays, array( $variation_array, $gallery ) );
					}
				}

				$gallery         = array();
				$variation_array = array();
				$gallery_ids     = $product->get_gallery_image_ids();
				$image_id        = $product->get_image_id();
				if ( is_array( $include_feature_image ) && in_array( 'default_gl', $include_feature_image, true ) && $image_id ) {
					array_push( $gallery, wcgs_image_meta( $image_id ) );
				} elseif ( 'default_gl' === $include_feature_image && $image_id ) {
					array_push( $gallery, wcgs_image_meta( $image_id ) );
				}
				foreach ( $gallery_ids as $key => $gallery_image_id ) {
					array_push(
						$gallery,
						wcgs_image_meta( $gallery_image_id )
					);
				}
				if ( empty( $gallery ) ) {
					array_push( $gallery, wcgs_image_meta( $image_id ) );
				}
				if ( $gallery ) {
					array_push( $gallery_arrays, array( $variation_array, $gallery ) );
				}
			}
			return $gallery_arrays;
		}
	}

	/**
	 * Combinations array.
	 *
	 * @param  array $arrays array.
	 * @param  int   $i count number.
	 * @return array
	 */
	public static function combinations( $arrays, $i = 0 ) {
		if ( ! isset( $arrays[ $i ] ) ) {
			return array();
		}
		if ( count( $arrays ) - 1 === $i ) {
			return $arrays[ $i ];
		}

		// get combinations from subsequent arrays.
		$tmp = self::combinations( $arrays, $i + 1 );

		$result = array();

		// concat each array from tmp with each element from $arrays[$i].
		foreach ( $arrays[ $i ] as $v ) {
			foreach ( $tmp as $key => $t ) {
				$result[] = is_array( $t ) ?
				array_merge( array( $v ), $t ) :
				array( $v, $t );
			}
		}

		return $result;
	}

	/**
	 * WCGS product image area method.
	 *
	 * @since 1.0.0
	 */
	public function wcgs_woocommerce_show_product_images() {
		ob_start();
		include WOO_GALLERY_SLIDER_PATH . '/public/partials/product-images.php';
		return ob_get_clean();
	}

	/**
	 * Dequeue scripts for oceanwp theme support.
	 *
	 * @return void
	 */
	public function dequeue_script() {
		if ( is_singular( 'product' ) ) {
			wp_dequeue_script( 'oceanwp-lightbox' );
			if ( apply_filters( 'wcgs_dequeue_magnific_popup', true ) ) {
				wp_dequeue_script( 'magnific-popup' );
			}
		}
	}

	/**
	 * Custom set transient
	 *
	 * @param  mixed $cache_key Key.
	 * @param  mixed $data json data.
	 * @param  mixed $time expiration time.
	 * @return void
	 */
	public function spwg_set_transient( $cache_key, $data, $time ) {
		if ( ! is_admin() ) {
			if ( is_multisite() ) {
				set_site_transient( 'site_' . get_current_blog_id() . $cache_key, $data, $time );
			} else {
				set_transient( $cache_key, $data, $time );
			}
		}
	}

	/**
	 * Custom set transient
	 *
	 * @param  mixed $cache_key Key.
	 * @return json
	 */
	public function spwg_get_transient( $cache_key ) {
		$cached_data = '';
		if ( is_multisite() ) {
			$cached_data = get_site_transient( 'site_' . get_current_blog_id() . $cache_key );
		} else {
			$cached_data = get_transient( $cache_key );
		}
		return $cached_data;
	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
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
			$settings             = get_option( 'wcgs_settings' );
			$enqueue_fancybox_js  = isset( $settings['enqueue_fancybox_js'] ) ? $settings['enqueue_fancybox_js'] : true;
			$enqueue_swiper_js    = isset( $settings['enqueue_swiper_js'] ) ? $settings['enqueue_swiper_js'] : true;
			$enqueue_fancybox_css = isset( $settings['enqueue_fancybox_css'] ) ? $settings['enqueue_fancybox_css'] : true;
			$enqueue_swiper_css   = isset( $settings['enqueue_swiper_css'] ) ? $settings['enqueue_swiper_css'] : true;
			$custom_js            = isset( $settings['wcgs_additional_js'] ) ? $settings['wcgs_additional_js'] : '';

			wp_enqueue_style( 'sp_wcgs-fontello-fontende-icons', plugin_dir_url( __FILE__ ) . 'css/fontello.min.css', array(), $this->version, 'all' );
			if ( $enqueue_swiper_css ) {
				wp_enqueue_style( 'wcgs-swiper', plugin_dir_url( __FILE__ ) . 'css/swiper-bundle.min.css', array(), $this->version, 'all' );
			}
			if ( $enqueue_fancybox_css ) {
				wp_enqueue_style( 'wcgs-fancybox', plugin_dir_url( __FILE__ ) . 'css/jquery.fancybox.min.css', array(), $this->version, 'all' );
			}
			wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/woo-gallery-slider-public.min.css', array(), $this->version, 'all' );
			if ( $enqueue_swiper_js ) {
				wp_enqueue_script( 'wcgs-swiper', plugin_dir_url( __FILE__ ) . 'js/swiper-bundle.min.js', array(), $this->version, 'all' );
			}
			if ( $enqueue_fancybox_js ) {
				wp_enqueue_script( 'wcgs-fancybox', plugin_dir_url( __FILE__ ) . 'js/jquery.fancybox.min.js', array( 'jquery' ), $this->version, true );
			}
			wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/woo-gallery-slider-public.min.js', array( 'jquery' ), $this->version, true );
			if ( ! empty( $custom_js ) ) {
				wp_add_inline_script( $this->plugin_name, $custom_js );
			}
			global $post;
			$product_id     = $post->ID;
			$variation_data = $this->spwg_get_transient( 'spwg_product_variation_' . $product_id );
			if ( ! $variation_data ) {
				$variation_data = $this->wcgs_json_data( $product_id );
				$this->spwg_set_transient( 'spwg_product_variation_' . $product_id, $variation_data, SPWG_TRANSIENT_EXPIRATION );
			}

			$this->json_data = $variation_data;

			wp_localize_script(
				$this->plugin_name,
				'wcgs_object',
				array(
					'wcgs_data'            => $this->json_data,
					'wcgs_settings'        => get_option( 'wcgs_settings' ),
					'wcgs_product_wrapper' => apply_filters( 'wcgs_product_wrapper', '.single-product .product' ),
					'wcgs_body_font_size'  => apply_filters( 'wcgs_body_font_size', '14' ),
				)
			);
		}
	}
}

if ( ! function_exists( 'wcgs_image_meta' ) ) {
	/**
	 * Image meta
	 *
	 * @param  int $image_id image.
	 * @return array
	 */
	function wcgs_image_meta( $image_id ) {
		$settings      = get_option( 'wcgs_settings' );
		$image_size    = isset( $settings['image_sizes'] ) ? $settings['image_sizes'] : 'full';
		$thumb_size    = isset( $settings['thumbnails_sizes'] ) ? $settings['thumbnails_sizes'] : 'thumbnail';
		$image_url     = wp_get_attachment_url( $image_id );
		$image_caption = wp_get_attachment_caption( $image_id );
		$image_alt     = get_post_meta( $image_id, '_wp_attachment_image_alt', true );

		// Thumb crop size.
		$thumb_width    = isset( $settings['thumb_crop_size']['width'] ) ? $settings['thumb_crop_size']['width'] : '';
		$image_full_src = wp_get_attachment_image_src( $image_id, 'full' );
		$sized_thumb    = wp_get_attachment_image_src( $image_id, $thumb_size );
		$sized_image    = wp_get_attachment_image_src( $image_id, $image_size );
		$video_url      = get_post_meta( $image_id, 'wcgs_video', true );
		if ( ! empty( $image_url ) ) {

				$result = array(
					'url'         => $sized_image[0],
					'full_url'    => $image_url,
					'thumb_url'   => ! empty( $sized_thumb[0] ) && $sized_thumb[0] ? $sized_thumb[0] : '',
					'cap'         => isset( $image_caption ) && ! empty( $image_caption ) ? $image_caption : '',
					'thumbWidth'  => $sized_thumb[1],
					'thumbHeight' => $sized_thumb[2],
					'imageWidth'  => $sized_image[1],
					'imageHeight' => $sized_image[2],
					'alt_text'    => $image_alt,
				);
				if ( ! empty( $video_url ) ) {
					$result['video'] = $video_url;
				}

				return $result;
		}
	}
}
