<?php
/**
 * This file is used to update the plugin to version 4.0.0
 *
 * 4.0.0 replaces the 3.x settings framework with the React dashboard, whose
 * REST APIs and frontend read the stored values in fixed shapes. This brings
 * the data saved by 3.x into those shapes; every value the user set is kept,
 * and a setting 3.x never stored gets the value 3.x used for it, so the
 * store looks the same after the upgrade. Running it again changes nothing.
 *
 * @since      4.0.0
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes/updates
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}  // if direct access.

update_option( 'woo_gallery_slider_version', '4.0.0' );
update_option( 'woo_gallery_slider_db_version', '4.0.0' );

if ( ! function_exists( 'wcgs_update_4_0_0_normalize_settings' ) ) {
	/**
	 * Normalize a settings array saved by the 3.x framework (`wcgs_settings`
	 * or a layout's `wcgs_metabox`).
	 *
	 * - Switches: the framework saved off as "0" and never-saved defaults as
	 *   PHP booleans; the frontend and the dashboard expect "1" / "".
	 * - Drops the `''` key (id-less framework fields) and display-only keys.
	 * - `include_feature_image_to_gallery`: a checkbox list, stored as an array.
	 *
	 * @since 4.0.0
	 * @param mixed $settings Stored settings.
	 * @return mixed The normalized settings, or the value unchanged when it is not an array.
	 */
	function wcgs_update_4_0_0_normalize_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return $settings;
		}

		$switch_keys = array(
			// General, Product Gallery and Lightbox.
			'show_caption',
			'autoplay',
			'infinite_loop',
			'accessibility',
			'slider_dir',
			'free_mode',
			'mouse_wheel',
			'navigation',
			'pagination',
			'thumbnailnavigation',
			'preloader',
			'zoom',
			'mobile_zoom',
			'video_gallery',
			'lightbox',
			'lightbox_caption',
			'l_img_counter',
			'gallery_fs_btn',
			// Advanced (global settings only).
			'wcgs_data_remove',
			'enqueue_fancybox_css',
			'enqueue_fancybox_js',
			'enqueue_swiper_css',
			'enqueue_swiper_js',
			'enqueue_video_css',
			'enqueue_video_js',
			'lazy_load_gallery',
			'gallery_cache',
		);
		foreach ( $switch_keys as $key ) {
			if ( ! array_key_exists( $key, $settings ) ) {
				continue;
			}
			$value            = $settings[ $key ];
			$is_on            = is_string( $value ) ? ! in_array( strtolower( trim( $value ) ), array( '', '0', 'false' ), true ) : ( is_scalar( $value ) && (bool) $value );
			$settings[ $key ] = $is_on ? '1' : '';
		}

		// Id-less and display-only framework fields, and the 3.x Migration tab
		// buttons and Export button (the Migration tab runs from the dashboard now).
		foreach ( array( '', 'shortcode', 'optimize_notice', 'shop_page_video_notice', 'wcgs_what_export', 'export', 'woo-variation-gallery', 'woo-product-gallery-slider', 'woo-product-variation-gallery', 'iconic-woothumbs', 'woocommerce-additional-variation-images' ) as $key ) {
			unset( $settings[ $key ] );
		}

		if ( array_key_exists( 'include_feature_image_to_gallery', $settings ) && ! is_array( $settings['include_feature_image_to_gallery'] ) ) {
			$value = (string) $settings['include_feature_image_to_gallery'];
			$settings['include_feature_image_to_gallery'] = '' === $value ? array() : array_map( 'trim', explode( ',', $value ) );
		}

		// 3.x drew the Inner Line (`top_line`) active thumbnail style with the
		// active thumbnail border; 4.0.0 reads its own line setting.
		if ( ! array_key_exists( 'border_bottom_for_active_thumbnail', $settings ) && isset( $settings['border_width_for_active_thumbnail'] ) && is_array( $settings['border_width_for_active_thumbnail'] ) ) {
			$settings['border_bottom_for_active_thumbnail'] = $settings['border_width_for_active_thumbnail'];
		}

		return $settings;
	}
}

if ( ! function_exists( 'wcgs_update_4_0_0_fill_missing' ) ) {
	/**
	 * Add the settings 3.x had but this store never saved (an install made
	 * before the setting existed), with the default 3.x used for them. 4.0.0
	 * defaults differ for some (e.g. navigation, pagination colors, the
	 * thumbnail border), so without this the store would change on upgrade.
	 * Settings that are new in 4.0.0 keep the 4.0.0 defaults.
	 *
	 * @since 4.0.0
	 * @param array $settings Stored global settings.
	 * @return array
	 */
	function wcgs_update_4_0_0_fill_missing( $settings ) {
		$defaults = array(
			// General.
			'gallery_layout'                       => 'horizontal',
			'thumbnails_item_to_show'              => '4',
			'vertical_thumbs_width'                => '20',
			'thumbnails_sliders_space'             => array(
				'width'  => '6',
				'height' => '6',
			),
			'thumbnails_sizes'                     => 'shop_thumbnail',
			'border_normal_width_for_thumbnail'    => array(
				'color'  => '#dddddd',
				'color3' => '#0085BA',
				'all'    => '2',
				'radius' => '0',
			),
			'thumbnails_hover_effect'              => 'none',
			'thumb_active_on'                      => 'click',
			'thumbnail_style'                      => 'border_around',
			'border_width_for_active_thumbnail'    => array(
				'color2' => '#0085BA',
				'all'    => '2',
			),
			'inactive_thumbnails_effect'           => 'none',
			'gallery_width'                        => '50',
			'gallery_responsive_width'             => array(
				'width'   => '0',
				'height'  => '720',
				'height2' => '480',
				'unit'    => 'px',
			),
			'gallery_bottom_gap'                   => '30',
			'gallery_image_source'                 => 'uploaded',
			'include_feature_image_to_gallery'     => array( 'default_gl' ),
			// Product Gallery.
			'autoplay'                             => '',
			'autoplay_interval'                    => '3000',
			'autoplay_speed'                       => '300',
			'slide_orientation'                    => 'horizontal',
			'infinite_loop'                        => '1',
			'fade_slide'                           => 'slide',
			'slider_height_type'                   => 'max_image',
			'accessibility'                        => '1',
			'slider_dir'                           => '',
			'free_mode'                            => '1',
			'mouse_wheel'                          => '',
			'navigation'                           => '1',
			'navigation_icon'                      => 'angle',
			'navigation_position'                  => 'center_center',
			'navigation_icon_size'                 => '16',
			'navigation_icon_color_group'          => array(
				'color'          => '#fff',
				'hover_color'    => '#fff',
				'bg_color'       => 'rgba(0, 0, 0, .5)',
				'hover_bg_color' => 'rgba(0, 0, 0, .85)',
			),
			'navigation_icon_radius'               => '0',
			'navigation_visibility'                => 'hover',
			'pagination'                           => '',
			'pagination_type'                      => 'bullets',
			'pagination_icon_color_group'          => array(
				'color'        => 'rgba(115, 119, 121, 0.5)',
				'active_color' => 'rgba(115, 119, 121, 0.8)',
			),
			'pagination_visibility'                => 'always',
			'thumbnailnavigation'                  => '1',
			'thumb_nav_visibility'                 => 'hover',
			'thumbnailnavigation_style'            => 'custom',
			'thumbnailnavigation_icon'             => 'angle',
			'thumbnailnavigation_icon_size'        => '12',
			'thumbnailnavigation_icon_color_group' => array(
				'color'          => '#fff',
				'hover_color'    => '#fff',
				'bg_color'       => 'rgba(0, 0, 0, 0.5)',
				'hover_bg_color' => 'rgba(0, 0, 0, 0.8)',
			),
			'image_sizes'                          => 'woocommerce_single',
			'wcgs_image_lazy_load'                 => 'ondemand',
			'preloader'                            => '1',
			'preloader_style'                      => 'normal',
			'image_border_radius'                  => '0',
			'grayscale'                            => 'gray_off',
			'zoom'                                 => '1',
			'zoom_type'                            => 'in_side',
			'mobile_zoom'                          => '',
			'video_popup_place'                    => 'popup',
			'video_icon'                           => 'play-01',
			'video_order'                          => 'usual',
			// Lightbox.
			'lightbox'                             => '1',
			'lightbox_sliding_effect'              => 'slide',
			'lightbox_icon_position'               => 'top_right',
			'lightbox_icon'                        => 'search',
			'lightbox_icon_size'                   => '13',
			'lightbox_icon_color_group'            => array(
				'color'          => '#fff',
				'hover_color'    => '#fff',
				'bg_color'       => 'rgba(0, 0, 0, 0.5)',
				'hover_bg_color' => 'rgba(0, 0, 0, 0.8)',
			),
			'lightbox_caption'                     => '1',
			'lightbox_caption_size'                => '14',
			'caption_color'                        => '#ffffff',
			'l_img_counter'                        => '1',
			'gallery_fs_btn'                       => '',
			// Advanced.
			'enqueue_fancybox_css'                 => '1',
			'enqueue_fancybox_js'                  => '1',
			'enqueue_swiper_css'                   => '1',
			'enqueue_swiper_js'                    => '1',
			'lazy_load_gallery'                    => '1',
			'remove_default_wc_gallery'            => array( 'lightbox', 'zoom', 'slider' ),
			'dequeue_single_product_css'           => '',
			'dequeue_single_product_js'            => '',
		);
		foreach ( $defaults as $key => $value ) {
			if ( ! array_key_exists( $key, $settings ) ) {
				$settings[ $key ] = $value;
			}
		}
		return $settings;
	}
}

// Global settings.
$wcgs_settings   = get_option( 'wcgs_settings' );
$wcgs_settings   = is_array( $wcgs_settings ) ? $wcgs_settings : array();
$wcgs_normalized = wcgs_update_4_0_0_normalize_settings( wcgs_update_4_0_0_fill_missing( $wcgs_settings ) );
if ( $wcgs_normalized !== $wcgs_settings ) {
	update_option( 'wcgs_settings', $wcgs_normalized );
}

// Every layout's settings, whatever its status.
$wcgs_layouts = get_posts(
	array(
		'post_type'        => 'wcgs_layouts',
		'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future', 'trash' ),
		'posts_per_page'   => -1,
		'fields'           => 'ids',
		'suppress_filters' => true,
	)
);
foreach ( $wcgs_layouts as $wcgs_layout_id ) {
	$wcgs_meta = get_post_meta( $wcgs_layout_id, 'wcgs_metabox', true );
	if ( is_array( $wcgs_meta ) ) {
		$wcgs_normalized = wcgs_update_4_0_0_normalize_settings( $wcgs_meta );
		if ( $wcgs_normalized !== $wcgs_meta ) {
			update_post_meta( $wcgs_layout_id, 'wcgs_metabox', $wcgs_normalized );
		}
	}
}

// Caches of 3.x (variation JSON and gallery HTML), replaced by the `wcgs_json_data` / `wcgs_gallery_html` families.
global $wpdb;
foreach ( array( 'spwg_product_variation_', 'wcgsf_woo_gallery_' ) as $wcgs_family ) {
	$wcgs_like = $wpdb->esc_like( $wcgs_family ) . '%';
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time cleanup.
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s", '\_transient\_' . $wcgs_like, '\_transient\_timeout\_' . $wcgs_like ) );
	if ( is_multisite() ) {
		// 3.x stored them as site transients named `site_{blog id}{key}`.
		$wcgs_site_like = '%' . $wpdb->esc_like( $wcgs_family ) . '%';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time cleanup.
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->sitemeta} WHERE meta_key LIKE %s OR meta_key LIKE %s", '\_site\_transient\_site\_' . $wcgs_site_like, '\_site\_transient\_timeout\_site\_' . $wcgs_site_like ) );
	}
}
delete_transient( 'wcgs_plugins' );

// Galleries cached before the upgrade were rendered by 3.x (or by Pro, which shares the keys).
Woo_Gallery_Slider_Updates::purge_gallery_cache();

// Copy the variation galleries into WooCommerce core's variation gallery. This only queues the
// migration: it runs in Action Scheduler batches once core's gallery is enabled (WooCommerce 11.1+,
// or 10.9+ with its toggle), so a store on an older WooCommerce migrates after updating it.
// Updates run before the plugin loads its classes; Woo_Gallery_Slider::load_dependencies()
// registers the migration's hooks for the next requests.
if ( ! class_exists( 'Woo_Gallery_Slider_Variation_Gallery_Migration' ) ) {
	require_once WOO_GALLERY_SLIDER_PATH . 'includes/class-woo-gallery-slider-variation-gallery.php';
	require_once WOO_GALLERY_SLIDER_PATH . 'includes/class-woo-gallery-slider-variation-gallery-migration.php';
}
Woo_Gallery_Slider_Variation_Gallery_Migration::queue();
