<?php
/**
 * The Helper class for Public functionality.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/public
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

/**
 * Helper class for Public functionality.
 *
 * This class contains methods for handling frontend operations.
 *
 * @since 3.0.4
 */
class WCGS_Public_Helper {

	/**
	 * Translated labels for the Fancybox lightbox (its `l10n` option).
	 *
	 * Fancybox ships English labels for its toolbar buttons, arrows and error
	 * messages. The keys are Fancybox's own; the product gallery passes this
	 * map to `Fancybox.bind()` and `Fancybox.show()`. Only the labels of what
	 * the free lightbox shows (arrows, fullscreen and close buttons, error
	 * messages); Pro's extra toolbar buttons (zoom, thumbnails, slideshow,
	 * download) are not available here.
	 *
	 * @since 4.0.0
	 * @return array<string, string>
	 */
	public static function lightbox_l10n() {
		return array(
			'CLOSE'             => __( 'Close', 'gallery-slider-for-woocommerce' ),
			'NEXT'              => __( 'Next', 'gallery-slider-for-woocommerce' ),
			'PREV'              => __( 'Previous', 'gallery-slider-for-woocommerce' ),
			'MODAL'             => __( 'You can close this modal content with the ESC key', 'gallery-slider-for-woocommerce' ),
			'ERROR'             => __( 'Something went wrong. Please try again later.', 'gallery-slider-for-woocommerce' ),
			'IMAGE_ERROR'       => __( 'Image not found', 'gallery-slider-for-woocommerce' ),
			'ELEMENT_NOT_FOUND' => __( 'HTML element not found', 'gallery-slider-for-woocommerce' ),
			'AJAX_NOT_FOUND'    => __( 'Error loading content: not found', 'gallery-slider-for-woocommerce' ),
			'AJAX_FORBIDDEN'    => __( 'Error loading content: forbidden', 'gallery-slider-for-woocommerce' ),
			'IFRAME_ERROR'      => __( 'Error loading page', 'gallery-slider-for-woocommerce' ),
			'TOGGLE_FULLSCREEN' => __( 'Toggle full-screen mode', 'gallery-slider-for-woocommerce' ),
			'TOGGLEFS'          => __( 'Toggle full-screen mode', 'gallery-slider-for-woocommerce' ),
		);
	}

	/**
	 * Settings of features the free plugin does not have. free_settings()
	 * drops them (and every `shop*` / `playlist_*` key), so the gallery runs on
	 * the free defaults whatever is stored. Kept in step with FREE_REMOVED_KEYS
	 * in src/admin/pages/globalSettings/LivePreview/engine/settings.js.
	 *
	 * @since 4.0.0
	 * @var string[]
	 */
	const REMOVED_KEYS = array(
		// General.
		'grid_orientation',
		'columns',
		'gallery_item',
		'gallery_item_to_show',
		'gallery_expansion',
		'gallery_image_space',
		'slider_layout_on_mobile',
		'gallery_layout_on_mobile',
		'thumbnails_item_show_type',
		'thumb_crop_size',
		'thumbnails_load_2x_image',
		'active_thumb_opacity',
		'inactive_thumb_opacity',
		'inactive_thumb_grayscale',
		'include_variation_and_default_gallery',
		// Gallery slider, thumbnails navigation, product image.
		'slider_height',
		'adaptive_height',
		'thumbnail_navi_box_size',
		'thumbnailIcon_box_size',
		'thumbnailnavigation_outer_color_group',
		'image_crop_size',
		'load_2x_image',
		// Show more button.
		'expand_collapse',
		'show_more_font_size',
		'show_more_font_color',
		'button_border',
		'bottom_box_shadow',
		'show_more_padding',
		'bottom_margine',
		// Zoom.
		'zoom_level',
		'mouse_wheel_zoom',
		'cursor_type',
		'lens_shape',
		'lens_color',
		'lens_border',
		'product_image_overlay',
		'overlay_color',
		'lens_opacity',
		'zoom_size_type',
		'zoom_size',
		'zoom_window_distance',
		'zoom_border_right_side',
		'zoom_boxshadow_right_side',
		'exclude_zoom_by_products_type',
		'exclude_zoom_by_products',
		'exclude_zoom_by_category',
		// Video.
		'video_presentation',
		'video_image_icon',
		'video_icon_position_for',
		'video_icon_size',
		'video_icon_color',
		'autoplay_video_on_sliding',
		'video_looping',
		'video_controls',
		'video_volume',
		'player_style',
		'video_font_color',
		'video_control_bgcolor',
		'video_progress_color',
		'video_progress_bg',
		'yt_video_controls',
		'yt_related_video',
		'autoplay_video_shop',
		'video_play_event',
		'wcgs_video_shop',
		// Lightbox.
		'lightbox_bg',
		'lightbox_icon_visibility',
		'lightbox_icon_visibility_slider',
		'slide_play_btn',
		'thumb_gallery_show',
		'side_gallery_btn',
		'lightbox_thumb_style',
		'gallery_dl_btn',
		'gallery_middle_btn',
		// Advanced.
		'disable_gallery',
		'disable_specific_product_type',
		'disable_product_terms',
		'disable_specific_product',
		'wcgs_ajax_variation_threshold',
		'license_key',
	);

	/**
	 * Free values of the settings that have locked (Pro) choices, with the
	 * value a locked or unknown choice falls back to.
	 *
	 * @since 4.0.0
	 * @var array Setting key => array( free values (null: any but `custom`), fallback ).
	 */
	const FREE_VALUES = array(
		'gallery_layout'             => array( array( 'horizontal', 'vertical', 'vertical_right', 'horizontal_top', 'hide_thumb' ), 'horizontal' ),
		'thumbnails_hover_effect'    => array( array( 'none', 'zoom_out', 'slide_down' ), 'none' ),
		'thumb_active_on'            => array( array( 'click' ), 'click' ),
		'thumbnail_style'            => array( array( 'border_around', 'top_line' ), 'border_around' ),
		'inactive_thumbnails_effect' => array( array( 'grayscale', 'none' ), 'none' ),
		'fade_slide'                 => array( array( 'slide', 'flip', 'cube' ), 'slide' ),
		'slider_height_type'         => array( array( 'adaptive', 'max_image' ), 'max_image' ),
		'navigation_position'        => array( array( 'center_center', 'bottom_left' ), 'center_center' ),
		'pagination_type'            => array( array( 'bullets', 'dynamic', 'strokes' ), 'bullets' ),
		'thumbnailnavigation_style'  => array( array( 'custom', 'inner_right' ), 'custom' ),
		'zoom_type'                  => array( array( 'in_side', 'zoom_2x' ), 'in_side' ),
		'video_order'                => array( array( 'usual', 'video_come_last' ), 'usual' ),
		'lightbox_sliding_effect'    => array( array( 'slide', 'classic', 'crossfade', 'no_animation' ), 'slide' ),
		'lightbox_icon'              => array( array( 'search', 'search-plus', 'plus', 'info' ), 'search' ),
		'video_icon'                 => array( array( 'play-01', 'play-02', 'play-03', 'play-04', 'play-05', 'play-06', 'play-07', 'play-08', 'play-09', 'native' ), 'play-01' ),
		'thumbnails_sizes'           => array( null, 'shop_thumbnail' ),
		'image_sizes'                => array( null, 'woocommerce_single' ),
	);

	/**
	 * Assigns layout based on product and category settings
	 *
	 * @param  object $product Product.
	 * @return array Array of assigned layouts.
	 */
	public function get_assigns_layout( $product ) {
		if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
			return; // or handle the error appropriately.
		}
		$current_product_id = $product->get_id();
		// Retrieve assigns data with a default empty array.
		$assigns_data = get_option( 'wcgs_assigns', array() );

		// return if no assign layout data exists.
		$assign_layout_data = ! empty( $assigns_data['assign_layout_data'] ) ? $assigns_data['assign_layout_data'] : array();

		if ( empty( $assign_layout_data ) ) {
			return;
		}

		// Get current product and its categories.
		$product_categories = wp_get_post_terms( $current_product_id, 'product_cat' );

		// Extract category IDs, handling potential errors.
		$category_ids = is_wp_error( $product_categories ) || empty( $product_categories )
		? array() : wp_list_pluck( $product_categories, 'term_id' );

		// Find assigned layouts.
		$assigned_layout = $this->find_assigned_layouts( $assign_layout_data, $current_product_id, $category_ids );

		return $assigned_layout;
	}
	/**
	 * Minify output
	 *
	 * @param  string $html output.
	 * @return statement
	 */
	public function minify_output( $html ) {
		$html = preg_replace( '/<!--(?!s*(?:[if [^]]+]|!|>))(?:(?!-->).)*-->/s', '', $html );
		$html = str_replace( array( "\r\n", "\r", "\n", "\t" ), '', $html );
		while ( stristr( $html, '  ' ) ) {
			$html = str_replace( '  ', ' ', $html );
		}
		return $html;
	}
	/**
	 * Find assigned layouts based on product and category criteria.
	 *
	 * @param array $assign_layout_data Layout assignment data.
	 * @param int   $current_product_id Current product ID.
	 * @param array $category_ids Current product's category IDs.
	 * @return array Assigned layout IDs
	 */
	public function find_assigned_layouts( $assign_layout_data, $current_product_id, $category_ids ) {
		$assigned_layouts = array();
		$allowed_layout   = self::allowed_layout_id();

		foreach ( $assign_layout_data as $assign_layout ) {
			$assign_product_from = $assign_layout['assign_product_from'] ?? '';
			$layout              = ! empty( $assign_layout['layout'] ) ? $assign_layout['layout'] : '';

			// Skip if no valid layout or assignment method, and the rules of any
			// layout but the one the free plugin allows (rules a Pro install left).
			if ( empty( $layout ) || empty( $assign_product_from ) || (int) $layout !== $allowed_layout ) {
				continue;
			}

			// Check specific products.
			if ( 'specific_products' === $assign_product_from ) {
				$specific_products = ! empty( $assign_layout['specific_product'] ) ? (array) $assign_layout['specific_product'] : array();
				if ( in_array( $current_product_id, $specific_products ) ) {
					$assigned_layouts[] = $layout;
				}
			} elseif ( 'category' === $assign_product_from ) {
				// Check product categories, skipping the products the rule excludes.
				$assign_product_terms = $assign_layout['assign_product_terms'] ?? array();
				$exclude_products     = ! empty( $assign_layout['exclude_products'] ) ? (array) $assign_layout['exclude_products'] : array();
				$common_cat_ids       = array_intersect( $category_ids, (array) $assign_product_terms );
				if ( ! empty( $common_cat_ids ) && ! in_array( (string) $current_product_id, array_map( 'strval', $exclude_products ), true ) ) {
					$assigned_layouts[] = $layout;
				}
			}
		}

		return $assigned_layouts;
	}

	/**
	 * The one per-product layout the free plugin uses: the first layout that is
	 * not trashed, in the order of the dashboard's layouts list (menu order,
	 * then the newest first). Other layouts (from a Pro install) are ignored.
	 *
	 * @since 4.0.0
	 * @return int Layout ID, or 0 when there is none.
	 */
	public static function allowed_layout_id() {
		static $layout_id = null;
		if ( null === $layout_id ) {
			$ids       = get_posts(
				array(
					'post_type'        => 'wcgs_layouts',
					'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
					'orderby'          => array(
						'menu_order' => 'ASC',
						'date'       => 'DESC',
					),
					'posts_per_page'   => 1,
					'fields'           => 'ids',
					'no_found_rows'    => true,
					'suppress_filters' => true,
				)
			);
			$layout_id = $ids ? (int) $ids[0] : 0;
		}
		return $layout_id;
	}

	/**
	 * Recursively merges user-defined arguments with default values.
	 *
	 * @param mixed $args User-defined arguments. Can be an array or a string.
	 * @param mixed $defaults Default values. Can be an array or a string.
	 * @return array The merged array of user-defined arguments and default values.
	 */
	public function wp_parse_args_recursive( $args, $defaults ) {
		// Merge the arrays recursively.
		$parsed_args = $defaults;

		foreach ( $defaults as $key => $default ) {
			// If both the default and the argument value are arrays, merge them recursively.
			if ( isset( $defaults[ $key ] ) && is_array( $default ) && isset( $args[ $key ] ) ) {
				// A list (a checkbox group or a product/category pick) is a whole value:
				// merging it by index would cut it to the length of the global list,
				// and an empty pick (stored as '') must clear the global list.
				if ( empty( $default ) || array_keys( $default ) === range( 0, count( $default ) - 1 ) ) {
					$parsed_args[ $key ] = $args[ $key ];
				} elseif ( is_array( $args[ $key ] ) ) {
					$parsed_args[ $key ] = $this->wp_parse_args_recursive( $args[ $key ], $default );
				}
			} else {
				// Otherwise, override the default with the argument value.
				$parsed_args[ $key ] = isset( $args[ $key ] ) ? $args[ $key ] : $default;
			}
		}
		// Keys only the layout has are kept as well: a setting added after the
		// global settings were last saved would otherwise be dropped from layouts.
		if ( is_array( $args ) ) {
			foreach ( $args as $key => $value ) {
				if ( ! array_key_exists( $key, $parsed_args ) ) {
					$parsed_args[ $key ] = $value;
				}
			}
		}

		return $parsed_args;
	}

	/**
	 * An image size name WordPress can resolve. The legacy WooCommerce names
	 * (`shop_thumbnail` is the thumbnail default) are no longer registered, and
	 * an unknown size returns the full original image.
	 *
	 * @since 4.0.0
	 * @param string $size Image size name.
	 * @return string
	 */
	public static function image_size( $size ) {
		$legacy = array(
			'shop_thumbnail' => 'woocommerce_gallery_thumbnail',
			'shop_catalog'   => 'woocommerce_thumbnail',
			'shop_single'    => 'woocommerce_single',
		);
		if ( isset( $legacy[ $size ] ) && ! has_image_size( $size ) ) {
			return $legacy[ $size ];
		}
		return $size;
	}

	/**
	 * The product's gallery image IDs from the Gallery Image Source setting:
	 * for 'attached' (All Images) the uploaded gallery followed by the images
	 * in the product description, otherwise the uploaded gallery only. The
	 * template and the variation JSON both pick their images here.
	 *
	 * @since 4.0.0
	 * @param WC_Product $product  Product.
	 * @param array      $settings Effective settings.
	 * @return array
	 */
	public function gallery_image_ids( $product, $settings ) {
		$gallery_ids = $product->get_gallery_image_ids();
		if ( ! isset( $settings['gallery_image_source'] ) || 'attached' !== $settings['gallery_image_source'] ) {
			return $gallery_ids;
		}
		if ( ! $product->get_id() ) {
			return $gallery_ids;
		}
		$content = get_post_field( 'post_content', $product->get_id() );
		if ( empty( $content ) || ! preg_match_all( '/<img[^>]*\bclass="[^"]*wp-image-(\d+)[^"]*"[^>]*>/', $content, $matches ) ) {
			return $gallery_ids;
		}
		// An image in both the gallery and the description is shown once.
		return array_values( array_unique( array_map( 'absint', array_merge( $gallery_ids, $matches[1] ) ) ) );
	}

	/**
	 * How the product videos are shown, from the Product Video Gallery settings.
	 *
	 * A missing key (the Gallery tab is not saved until the settings page is)
	 * falls back to the default: the video gallery on.
	 *
	 * @since 4.0.0
	 * @param array $settings Effective settings.
	 * @return string 'none' when the video gallery is off, otherwise 'in_gallery'.
	 */
	public function video_presentation( $settings ) {
		if ( isset( $settings['video_gallery'] ) && ! $settings['video_gallery'] ) {
			return 'none';
		}
		return 'in_gallery';
	}

	/**
	 * The images of a variation gallery: all attachment IDs of the WooCommerce
	 * core gallery or the plugin's `woo_gallery_slider` meta
	 * (Woo_Gallery_Slider_Variation_Gallery::ids()). The free version shows
	 * them all.
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return int[]
	 */
	public static function variation_gallery_ids( $variation_id ) {
		if ( ! $variation_id ) {
			return array();
		}
		return Woo_Gallery_Slider_Variation_Gallery::ids( $variation_id );
	}

	/**
	 * The settings the free gallery runs on.
	 *
	 * Every entry point (the enqueue step, the gallery template, the variation
	 * JSON and the dashboard preview, whose engine/settings.js has the same
	 * function) calls this after the global settings and the layout are
	 * merged. Keys of features the free plugin does not have are dropped, so a
	 * value saved by the Pro plugin (or an import) has no effect, and a locked
	 * choice of a free setting falls back to its free value.
	 *
	 * @since 4.0.0
	 * @param array $settings Effective settings.
	 * @return array
	 */
	public static function free_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}
		// Keys never stored get the panel's defaults, as the panel and its preview show them.
		if ( class_exists( 'Woo_Gallery_Slider_Global_Settings_API' ) ) {
			$settings += Woo_Gallery_Slider_Global_Settings_API::stored_defaults();
		}
		foreach ( self::REMOVED_KEYS as $key ) {
			unset( $settings[ $key ] );
		}
		foreach ( array_keys( $settings ) as $key ) {
			if ( 0 === strpos( (string) $key, 'shop' ) || 0 === strpos( (string) $key, 'playlist_' ) ) {
				unset( $settings[ $key ] );
			}
		}
		// Device values of the responsive settings only.
		if ( isset( $settings[ Woo_Gallery_Slider_Responsive::KEY ] ) ) {
			$settings[ Woo_Gallery_Slider_Responsive::KEY ] = Woo_Gallery_Slider_Responsive::get( $settings );
		}
		foreach ( self::FREE_VALUES as $key => $rule ) {
			if ( ! isset( $settings[ $key ] ) ) {
				continue;
			}
			$value = is_scalar( $settings[ $key ] ) ? (string) $settings[ $key ] : '';
			// No list: any value but the locked custom size.
			$is_free = null === $rule[0] ? 'custom' !== $value && '' !== $value : in_array( $value, $rule[0], true );
			if ( ! $is_free ) {
				$settings[ $key ] = $rule[1];
			}
		}
		return $settings;
	}

	/**
	 * Return only the settings keys the public slider script reads.
	 *
	 * The full `wcgs_settings` option is admin-facing configuration (custom
	 * CSS/JS, dequeue lists, cache and data-removal toggles); the frontend
	 * script reads only a known subset (see public/js/woo-gallery-slider-public.js).
	 * Extend the list only when a new key is actually consumed by the public script.
	 *
	 * @since 3.2.1
	 * @param array $settings Free runtime settings (may already be merged with an assigned layout).
	 * @return array Subset containing only the public-facing keys that are present.
	 */
	public function public_settings_subset( $settings ) {
		if ( ! is_array( $settings ) ) {
			return array();
		}

		$public_keys = array(
			'accessibility',
			'autoplay',
			'autoplay_interval',
			'autoplay_speed',
			'device_overrides',
			'enqueue_fancybox_css',
			'enqueue_swiper_css',
			'enqueue_video_css',
			'fade_slide',
			'free_mode',
			'gallery_fs_btn',
			'gallery_layout',
			'gallery_responsive_width',
			'gallery_width',
			'grayscale',
			'infinite_loop',
			'l_img_counter',
			'lazy_load_gallery',
			'lightbox',
			'lightbox_caption',
			'lightbox_icon',
			'lightbox_icon_position',
			'lightbox_sliding_effect',
			'mobile_zoom',
			'mouse_wheel',
			'navigation',
			'navigation_visibility',
			'pagination',
			'pagination_type',
			'pagination_visibility',
			'preloader',
			'show_caption',
			'slide_orientation',
			'slider_height_type',
			'thumbnail_style',
			'thumbnailnavigation',
			'thumbnails_item_to_show',
			'thumbnails_sliders_space',
			'vertical_thumbs_width',
			'video_gallery',
			'video_icon',
			'video_order',
			'video_popup_place',
			'video_presentation',
			'wcgs_image_lazy_load',
			'zoom',
			'zoom_type',
		);

		/**
		 * Extend the public-facing settings subset.
		 *
		 * Only add keys the public JavaScript actually reads; everything else stays server-side.
		 *
		 * @since 3.2.1
		 * @param array $public_keys Allow-listed setting keys exposed to the frontend.
		 */
		$public_keys = apply_filters( 'wcgs_public_settings_keys', $public_keys );

		$subset = array();
		foreach ( (array) $public_keys as $key ) {
			if ( array_key_exists( $key, $settings ) ) {
				$subset[ $key ] = $settings[ $key ];
			}
		}

		return $subset;
	}

	/**
	 * Comparison function to sort based on any other key's presence within the inner arrays.
	 *
	 * @param  array $a array.
	 * @param  array $b array.
	 * @return array
	 */
	public function wcgs_sort_by_has_key_add_last( $a, $b ) {
		$has_key_a = array_key_exists( 'video', $a );
		$has_key_b = array_key_exists( 'video', $b );

		if ( $has_key_a && ! $has_key_b ) {
			return 1; // $a comes after $b
		} elseif ( ! $has_key_a && $has_key_b ) {
			return -1; // $a comes before $b
		} else {
			return 0; // $a and $b are equal
		}
	}

	/**
	 * Image meta of the variation JSON.
	 *
	 * @param  int   $image_id image id.
	 * @param  array $settings settings.
	 * @return array|null
	 */
	public function wcgs_image_meta( $image_id, $settings ) {
		if ( ! $image_id ) {
			return null;
		}
		$image_url = wp_get_attachment_url( $image_id );
		if ( empty( $image_url ) ) {
			return null;
		}
		$image_size = isset( $settings['image_sizes'] ) ? $settings['image_sizes'] : 'full';
		$thumb_size = isset( $settings['thumbnails_sizes'] ) ? $settings['thumbnails_sizes'] : 'thumbnail';
		$image_alt  = get_post_meta( $image_id, '_wp_attachment_image_alt', true );
		if ( empty( $image_alt ) ) {
			$image_alt = get_the_title( $image_id );
		}
		$thumb_attr = wp_get_attachment_image_src( $image_id, self::image_size( $thumb_size ) );
		$thumb_attr = is_array( $thumb_attr ) ? $thumb_attr : array( '', '', '' );
		$image_attr = wp_get_attachment_image_src( $image_id, self::image_size( $image_size ) );
		$image_attr = is_array( $image_attr ) ? $image_attr : array( '', '', '' );
		$video_url  = get_post_meta( $image_id, 'wcgs_video', true );

		$result = array(
			'url'         => $image_attr[0],
			'full_url'    => $image_url,
			'thumb_url'   => $thumb_attr[0],
			'cap'         => wp_get_attachment_caption( $image_id ),
			'thumbWidth'  => $thumb_attr[1],
			'thumbHeight' => $thumb_attr[2],
			'imageHeight' => $image_attr[2],
			'imageWidth'  => $image_attr[1],
			'alt_text'    => $image_alt,
			'id'          => $image_id,
		);
		if ( ! empty( $video_url ) ) {
			$result['video'] = $video_url;
		}
		return $result;
	}
}
