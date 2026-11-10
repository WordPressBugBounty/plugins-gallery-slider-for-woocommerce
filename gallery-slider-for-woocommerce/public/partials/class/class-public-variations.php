<?php
/**
 * Class WCGS_Public_Variations
 *
 * Handles gallery image metadata for WooCommerce product variations, including generating image URLs,
 * handling video order sorting, and building JSON data for the variation gallery.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/public
 */
class WCGS_Public_Variations {

	/**
	 * Settings array
	 *
	 * @var array
	 */
	private $settings;

	/**
	 * Helper
	 *
	 * @var mixed
	 */
	private $helper;

	/**
	 * Constructor to initialize settings.
	 *
	 * @param array $settings Plugin settings.
	 */
	public function __construct( $settings = array() ) {
		$this->helper   = new WCGS_Public_Helper();
		$this->settings = $settings;
	}

	/**
	 * Get variation raw.
	 *
	 * @param  object $product Product.
	 * @return array
	 */
	private function get_variation_raw( $product ) {
		$variation_array_raw = array();
		foreach ( $product->get_children() as $k => $variation_id ) {
			$variation_array_raw[ $k ]['id']         = $variation_id;
			$variation_array_raw[ $k ]['attributes'] = wc_get_product_variation_attributes( $variation_id );
		}
		return $variation_array_raw;
	}

	/**
	 * Generates JSON data for product variations' images.
	 *
	 * @param object $product WooCommerce product.
	 * @return array JSON data structure for variation gallery images.
	 */
	public function wcgs_json_data( $product ) {
		$gallery = array();
		if ( ! $product ) {
			return;
		}
		$product_type = $product->get_type();
		$slug_attr    = apply_filters( 'sp_woo_gallery_slider_use_slug_attr', true );
		if ( 'variable' === $product_type && $slug_attr ) {
			$variation_array_raw = $this->get_variation_raw( $product );
			if ( empty( $variation_array_raw ) ) {
				return false;
			}
			$settings              = $this->settings;
			$default_gallery_ids   = $this->helper->gallery_image_ids( $product, $settings );
			$feature_image_id      = $product->get_image_id();
			$include_feature_image = isset( $settings['include_feature_image_to_gallery'] ) ? $settings['include_feature_image_to_gallery'] : array( 'default_gl' );
			// Videos are ordered only when they sit in the gallery.
			$video_order = isset( $settings['video_order'] ) && 'in_gallery' === $this->helper->video_presentation( $settings ) ? $settings['video_order'] : 'usual';
			if ( empty( $include_feature_image ) ) {
				$include_feature_image = array();
			}
			$gallery_arrays = array();
			foreach ( $variation_array_raw as $variation_array ) {
				$gallery = array();
				if ( is_array( $include_feature_image ) && in_array( 'variable_gl', $include_feature_image, true ) && $feature_image_id ) {
					array_push( $gallery, $this->helper->wcgs_image_meta( $feature_image_id, $settings ) );
				}
				$variation = $variation_array['id'];
				$image_id  = get_post_thumbnail_id( $variation );
				if ( $image_id ) {
					array_push( $gallery, $this->helper->wcgs_image_meta( $image_id, $settings ) );
				}
				// The variation gallery: all its images.
				$gallery_ids = WCGS_Public_Helper::variation_gallery_ids( $variation );
				foreach ( $gallery_ids as $gallery_item ) {
					array_push( $gallery, $this->helper->wcgs_image_meta( $gallery_item, $settings ) );
				}
				$gallery = array_values( array_filter( $gallery ) );
				if ( $gallery ) {
					if ( 'video_come_last' === $video_order ) {
						usort( $gallery, array( $this->helper, 'wcgs_sort_by_has_key_add_last' ) );
					}
					array_push( $gallery_arrays, array( $variation_array['attributes'], $gallery ) );
				}
			}
			// The default gallery, shown while no attribute is picked.
			$gallery = array();
			if ( is_array( $include_feature_image ) && in_array( 'default_gl', $include_feature_image, true ) && $feature_image_id ) {
				array_push( $gallery, $this->helper->wcgs_image_meta( $feature_image_id, $settings ) );
			} elseif ( 'default_gl' === $include_feature_image && $feature_image_id ) {
				array_push( $gallery, $this->helper->wcgs_image_meta( $feature_image_id, $settings ) );
			}
			foreach ( $default_gallery_ids as $gallery_image_id ) {
				array_push( $gallery, $this->helper->wcgs_image_meta( $gallery_image_id, $settings ) );
			}
			$gallery = array_values( array_filter( $gallery ) );
			if ( empty( $gallery ) && $feature_image_id ) {
				$gallery = array_values( array_filter( array( $this->helper->wcgs_image_meta( $feature_image_id, $settings ) ) ) );
			}
			if ( $gallery ) {
				if ( 'video_come_last' === $video_order ) {
					usort( $gallery, array( $this->helper, 'wcgs_sort_by_has_key_add_last' ) );
				}
				array_push( $gallery_arrays, array( array(), $gallery ) );
			}
			return $gallery_arrays;
		}
	}
}
