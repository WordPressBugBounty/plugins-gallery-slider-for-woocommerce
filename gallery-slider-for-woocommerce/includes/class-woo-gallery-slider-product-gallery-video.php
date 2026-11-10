<?php
/**
 * Reno Product Gallery Product Gallery Video Import/Export functionality.
 *
 * This class handles the import and export of videos for main product gallery
 * and featured images. It creates a separate column to avoid conflicts with
 * WooCommerce's native images column.
 *
 * @since      3.2.0
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Woo_Gallery_Slider_Product_Gallery_Video' ) ) {
	/**
	 * Woo_Gallery_Slider_Product_Gallery_Video Class
	 *
	 * Handles the import and export of videos for main product gallery and featured images.
	 *
	 * @since 3.2.0
	 */
	class Woo_Gallery_Slider_Product_Gallery_Video {

		/**
		 * Export type for WooCommerce product export.
		 *
		 * @since 3.2.0
		 * @var string
		 */
		private $export_type = 'product';

		/**
		 * Column identifier for WooCommerce product export/import.
		 *
		 * @since 3.2.0
		 * @var string
		 */
		private $column_id = 'woo_gallery_videos';

		/**
		 * Singleton instance of the class.
		 *
		 * @since 3.2.0
		 * @var Woo_Gallery_Slider_Product_Gallery_Video
		 */
		protected static $_instance = null;

		/**
		 * Constructor for the class.
		 *
		 * Sets up the necessary hooks and initializes the class.
		 *
		 * @since 3.2.0
		 * @return void
		 */
		protected function __construct() {
			$this->import_export_hooks();
		}

		/**
		 * Get the singleton instance of the class.
		 *
		 * @since 3.2.0
		 * @return Woo_Gallery_Slider_Product_Gallery_Video The singleton instance.
		 */
		public static function instance() {
			if ( is_null( self::$_instance ) ) {
				self::$_instance = new self();
			}
			return self::$_instance;
		}

		/**
		 * Set up the necessary hooks for the class.
		 *
		 * @since 3.2.0
		 * @return void
		 */
		public function import_export_hooks() {
			// Export hooks.
			add_filter(
				"woocommerce_product_export_{$this->export_type}_default_columns",
				array( $this, 'export_column_name' )
			);

			add_filter(
				"woocommerce_product_export_{$this->export_type}_column_{$this->column_id}",
				array( $this, 'export_column_data' ),
				10,
				3
			);

			// Import hooks.
			add_filter(
				'woocommerce_csv_product_import_mapping_options',
				array( $this, 'import_column_name' )
			);

			add_filter(
				'woocommerce_csv_product_import_mapping_default_columns',
				array( $this, 'default_import_column_name' )
			);

			add_action(
				'woocommerce_product_import_inserted_product_object',
				array( $this, 'process_product_video_import' ),
				10,
				2
			);

			/**
			 * Action hook that fires after the export/import class is loaded.
			 *
			 * @since 3.2.0
			 * @param Woo_Gallery_Slider_Product_Gallery_Video $this The class instance.
			 */
			do_action( 'woo_gallery_product_video_export_import_loaded', $this );
		}

		/**
		 * Add the videos column to the WooCommerce product export.
		 *
		 * @since 3.2.0
		 * @param array $columns The existing columns.
		 * @return array The modified columns.
		 */
		public function export_column_name( $columns ) {
			// Add our custom column to the export columns.
			$columns[ $this->column_id ] = esc_html__( 'Reno Product Gallery Videos', 'gallery-slider-for-woocommerce' );
			return $columns;
		}

		/**
		 * Provide the data for the videos column in the export.
		 *
		 * Exports featured image and main gallery images with their associated videos.
		 *
		 * @since 3.2.0
		 * @param string     $value      The column value.
		 * @param WC_Product $product    The product being exported.
		 * @param string     $column_id  The column identifier.
		 * @return string The formatted gallery images data with videos.
		 */
		public function export_column_data( $value, $product, $column_id ) {
			$product_id = $product->get_id();

			// Get featured image.
			$thumbnail_id = $product->get_image_id();

			// Get main gallery images.
			$gallery_image_ids = $product->get_gallery_image_ids();

			// Combine: featured image first, then gallery.
			$image_ids = array();
			if ( $thumbnail_id ) {
				$image_ids[] = $thumbnail_id;
			}
			if ( ! empty( $gallery_image_ids ) ) {
				$image_ids = array_merge( $image_ids, $gallery_image_ids );
			}

			if ( empty( $image_ids ) ) {
				return '';
			}

			/**
			 * Build paired image-video entries (only images with videos)
			 *
			 * @since 3.2.0
			 */
			$entries = array();
			foreach ( $image_ids as $image_id ) {
				// Get video URL first - only include images that have videos.
				$video_url = get_post_meta( $image_id, 'wcgs_video', true );

				if ( empty( $video_url ) ) {
					continue; // Skip images without videos.
				}

				$image = wp_get_attachment_image_src( $image_id, 'full' );
				if ( ! $image ) {
					continue;
				}

				$entry = array(
					'image' => $image[0],
					'video' => $video_url,
				);

				$entries[] = $entry;
			}

			/**
			 * Filter entries before export.
			 *
			 * @since 3.2.0
			 * @param array $entries Array of {image, video} pairs.
			 * @param int   $product_id Product ID.
			 */
			$entries = apply_filters( 'sp_woo_gallery_main_exported_entries', $entries, $product_id );

			// Format: image1.jpg|video1.mp4, image2.jpg, image3.jpg|video2.mp4.
			$formatted = array();
			foreach ( $entries as $entry ) {
				$part = $entry['image'];
				if ( isset( $entry['video'] ) && ! empty( $entry['video'] ) ) {
					$part .= '|' . $entry['video'];
				}
				$formatted[] = $part;
			}

			/**
			 * Filter formatted export string.
			 *
			 * @since 3.2.0
			 * @param string $formatted Comma-separated image|video pairs.
			 * @param array  $entries Original entries array.
			 * @param int    $product_id Product ID.
			 */
			$formatted = apply_filters( 'sp_woo_gallery_main_exported_string', $formatted, $entries, $product_id );

			// Join the entries with commas.
			return implode( ',', array_values( array_filter( $formatted ) ) );
		}

		/**
		 * Add the videos column to the import mapping options.
		 *
		 * @since 3.2.0
		 * @param array $columns The existing columns.
		 * @return array The modified columns.
		 */
		public function import_column_name( $columns ) {
			// Add our custom column to the import mapping options.
			$columns[ $this->column_id ] = esc_html__( 'Reno Product Gallery Videos', 'gallery-slider-for-woocommerce' );
			return $columns;
		}

		/**
		 * Define the default column name for import mapping.
		 *
		 * @since 3.2.0
		 * @param array $columns The existing default columns.
		 * @return array The modified default columns.
		 */
		public function default_import_column_name( $columns ) {
			// Map the human-readable column name to our column ID.
			$columns[ esc_html__( 'Reno Product Gallery Videos', 'gallery-slider-for-woocommerce' ) ] = $this->column_id;
			return $columns;
		}

		/**
		 * Process the video import data for a product.
		 *
		 * @since 3.2.0
		 * @param WC_Product $product The product being imported.
		 * @param array      $data    The import data.
		 * @return void
		 */
		public function process_product_video_import( $product, $data ) {
			// Check if our column exists in the import data.
			if ( ! isset( $data[ $this->column_id ] ) || empty( $data[ $this->column_id ] ) ) {
				return;
			}

			$raw_entries = explode( ',', $data[ $this->column_id ] );
			$raw_entries = array_values( array_filter( $raw_entries ) );

			/**
			 * Parse paired image|video entries
			 *
			 * @since 3.2.0
			 */
			$parsed_entries = array();
			foreach ( $raw_entries as $entry ) {
				$parsed_entries[] = $this->parse_entry( $entry );
			}

			/**
			 * Filter parsed entries before processing.
			 *
			 * @since 3.2.0
			 * @param array  $parsed_entries Parsed {image, video} pairs.
			 * @param int    $product_id Product ID.
			 * @param array  $data Full import data.
			 */
			$parsed_entries = (array) apply_filters(
				'sp_woo_gallery_main_parsed_import_entries',
				$parsed_entries,
				$product->get_id(),
				$data
			);

			foreach ( $parsed_entries as $entry ) {
				if ( empty( $entry['image'] ) ) {
					continue;
				}

				// Get or create attachment.
				$attachment_id = $this->get_attachment_id_from_url( $entry['image'], $product->get_id() );

				if ( ! $attachment_id ) {
					continue;
				}

				// Attach video URL to this image.
				if ( ! empty( $entry['video'] ) ) {
					$video_url = esc_url_raw( $entry['video'] );

					// Validate video URL before saving.
					if ( $this->is_valid_video_url( $video_url ) ) {
						update_post_meta( $attachment_id, 'wcgs_video', $video_url );

						/**
						 * Action after video attached.
						 *
						 * @since 3.2.0
						 * @param int    $attachment_id Attachment ID.
						 * @param string $video_url Video URL.
						 * @param int    $product_id Product ID.
						 */
						do_action(
							'sp_woo_gallery_main_video_imported',
							$attachment_id,
							$video_url,
							$product->get_id()
						);
					}
				}
			}
		}

		/**
		 * Parse a single entry (image or image|video).
		 *
		 * @since 3.2.0
		 * @param string $entry The entry to parse.
		 * @return array Array with 'image' and optionally 'video' keys.
		 */
		protected function parse_entry( $entry ) {
			// Check for pipe separator (new format with video).
			if ( strpos( $entry, '|' ) !== false ) {
				$parts = explode( '|', $entry );
				return array(
					'image' => isset( $parts[0] ) ? trim( $parts[0] ) : '',
					'video' => isset( $parts[1] ) ? trim( $parts[1] ) : '',
				);
			}

			// Legacy format (image only).
			return array(
				'image' => trim( $entry ),
				'video' => '',
			);
		}

		/**
		 * Validate video URL.
		 *
		 * @since 3.2.0
		 * @param string $url Video URL to validate.
		 * @return bool True if valid video URL.
		 */
		protected function is_valid_video_url( $url ) {
			if ( empty( $url ) ) {
				return false;
			}

			$parsed = wp_parse_url( $url );

			// Must have scheme and host.
			if ( ! isset( $parsed['scheme'] ) || ! isset( $parsed['host'] ) ) {
				return false;
			}

			/**
			 * Filter: Allow custom video URL validation.
			 *
			 * @since 3.2.0
			 * @param bool   $is_valid Whether the URL is valid.
			 * @param string $url The video URL.
			 * @param array  $parsed The parsed URL components.
			 */
			// Defaults to the hosts and file types the gallery can play (stored values are checked the same way).
			return apply_filters( 'sp_woo_gallery_is_valid_video_url', Woo_Gallery_Slider_Video_Url::is_valid( $url ), $url, $parsed );
		}

		/**
		 * Get the attachment ID from a URL.
		 *
		 * If the URL doesn't correspond to an existing attachment, the image will be downloaded and created.
		 *
		 * @since 3.2.0
		 * @param string $url        The image URL.
		 * @param int    $product_id The product ID.
		 * @return int The attachment ID or 0 on failure.
		 */
		protected function get_attachment_id_from_url( $url, $product_id ) {
			// If the URL is empty, return 0.
			if ( empty( $url ) ) {
				return 0;
			}

			$id         = 0;
			$upload_dir = wp_upload_dir( null, false );
			$base_url   = $upload_dir['baseurl'] . '/';

			// Check if the image is already in the WordPress uploads directory.
			if ( false !== strpos( $url, $base_url ) || false === strpos( $url, '://' ) ) {
				// Get the file path relative to the uploads directory.
				$file = str_replace( $base_url, '', $url );

				// Search for the attachment by meta data.
				$args = array(
					'post_type'   => 'attachment',
					'post_status' => 'any',
					'fields'      => 'ids',
					'meta_query'  => array(
						'relation' => 'OR',
						array(
							'key'     => '_wp_attached_file',
							'value'   => '^' . $file,
							'compare' => 'REGEXP',
						),
						array(
							'key'     => '_wp_attached_file',
							'value'   => '/' . $file,
							'compare' => 'LIKE',
						),
						array(
							'key'     => '_wc_attachment_source',
							'value'   => '/' . $file,
							'compare' => 'LIKE',
						),
					),
				);
			} else {
				// This is an external URL, so search by source.
				$args = array(
					'post_type'   => 'attachment',
					'post_status' => 'any',
					'fields'      => 'ids',
					'meta_query'  => array(
						array(
							'value' => $url,
							'key'   => '_wc_attachment_source',
						),
					),
				);
			}

			// Get the matching attachment IDs.
			$ids = get_posts( $args );

			// If there are matches, use the first one.
			if ( $ids ) {
				$id = current( $ids );
			}

			// If no matching attachment was found and this is a remote URL, download it.
			if ( ! $id && stristr( $url, '://' ) ) {
				try {
					// Download the image using WooCommerce's helper function.
					$upload = wc_rest_upload_image_from_url( $url );

					if ( is_wp_error( $upload ) ) {
						throw new Exception( $upload->get_error_message(), 400 );
					}

					// Create an attachment from the uploaded image.
					$id = wc_rest_set_uploaded_image_as_attachment( $upload, $product_id );

					// Verify that the attachment is an image.
					if ( ! wp_attachment_is_image( $id ) ) {
						throw new Exception(
							sprintf(
							/* translators: %s: image URL */
								__( 'Not able to attach "%s".', 'gallery-slider-for-woocommerce' ),
								$url
							),
							400
						);
					}

					// Save the source URL for future reference.
					update_post_meta( $id, '_wc_attachment_source', $url );
				} catch ( Exception $e ) {
					// Log the error but continue with the import.
					error_log( 'Reno Product Gallery Import Error: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					return 0;
				}
			}

			return $id;
		}
	}

	// Initialize the class.
	Woo_Gallery_Slider_Product_Gallery_Video::instance();
}
