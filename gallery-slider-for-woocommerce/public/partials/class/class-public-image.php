<?php
/**
 * WooCommerce Gallery Slider Image Meta Handler.
 *
 * @package Woo_Gallery_Slider
 * @since 2.0.0
 */
class WCGS_Public_Image {
	/**
	 * Gallery settings.
	 *
	 * @var array
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @param array $settings Gallery settings.
	 */
	public function __construct( $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Get image meta data.
	 *
	 * @param int $image_id Image ID.
	 * @return array Image meta data.
	 */
	public function get_image_meta( $image_id ) {
		if ( ! $image_id ) {
			return array();
		}

		$image_url = wp_get_attachment_url( $image_id );
		if ( empty( $image_url ) ) {
			return array();
		}

		$image_data = $this->get_sized_image( $image_id, $this->settings['image_sizes'] ?? 'full' );
		$thumb_data = $this->get_sized_image( $image_id, $this->settings['thumbnails_sizes'] ?? 'thumbnail' );
		$video_url  = get_post_meta( $image_id, 'wcgs_video', true );

		$meta = array(
			'image_id'    => $image_id,
			'url'         => $image_data[0],
			'full_url'    => $image_url,
			'thumb_url'   => $thumb_data[0],
			'cap'         => wp_get_attachment_caption( $image_id ),
			'thumbWidth'  => $thumb_data[1],
			'thumbHeight' => $thumb_data[2],
			'imageHeight' => $image_data[2],
			'imageWidth'  => $image_data[1],
			'alt_text'    => $this->get_image_alt( $image_id ),
		);

		if ( ! empty( $video_url ) ) {
			$meta['video'] = $video_url;
		}

		return $meta;
	}

	/**
	 * URL, width and height of an image size.
	 *
	 * @since 4.0.0
	 * @param int    $image_id Image ID.
	 * @param string $size     Image size name.
	 * @return array
	 */
	private function get_sized_image( $image_id, $size ) {
		$image_attr = wp_get_attachment_image_src( $image_id, WCGS_Public_Helper::image_size( $size ) );
		return is_array( $image_attr ) ? $image_attr : array( '', '', '' );
	}

	/**
	 * Get image alt text.
	 *
	 * @param int $image_id Image ID.
	 * @return string Alt text.
	 */
	private function get_image_alt( $image_id ) {
		$alt = get_post_meta( $image_id, '_wp_attachment_image_alt', true );
		return empty( $alt ) ? get_the_title( $image_id ) : $alt;
	}
}
