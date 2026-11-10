<?php
/**
 * Reno Product Gallery Custom variation images import/export functionality.
 *
 * This class handles the import and export of custom gallery images for WooCommerce products.
 * It integrates with WooCommerce's native CSV import/export system to include gallery images.
 *
 * @since      3.1.2
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Woo_Gallery_Slider_Variation_Image_Import' ) ) {
	/**
	 * Woo_Gallery_Slider_Variation_Image_Import Class
	 *
	 * Handles the import and export of custom gallery images for WooCommerce products.
	 *
	 * @since 3.1.2
	 */
	class Woo_Gallery_Slider_Variation_Image_Import {

		/**
		 * Export type for WooCommerce product export.
		 *
		 * @since 3.1.2
		 * @var string
		 */
		private $export_type = 'product';

		/**
		 * Column identifier for WooCommerce product export/import.
		 *
		 * @since 3.1.2
		 * @var string
		 */
		private $column_id = 'woo_gallery_slider';

		/**
		 * Singleton instance of the class.
		 *
		 * @since 3.1.2
		 * @var Woo_Gallery_Slider_Variation_Image_Import
		 */
		protected static $_instance = null;

		/**
		 * Constructor for the class.
		 *
		 * Sets up the necessary hooks and initializes the class.
		 *
		 * @since 3.1.2
		 * @return void
		 */
		protected function __construct() {
			$this->import_export_hooks();
		}

		/**
		 * Get the singleton instance of the class.
		 *
		 * @since 3.1.2
		 * @return Woo_Gallery_Slider_Variation_Image_Import The singleton instance.
		 */
		public static function instance() {
			if ( is_null( self::$_instance ) ) {
				self::$_instance = new self();
			}
			return self::$_instance;
		}

		/**
		 * This function will be override the hook `woocommerce_product_export_skip_meta_keys`
		 *
		 * @param string $meta_keys meta keys to skip.
		 * @return array
		 */
		public function skip_woo_gallery_slider_meta_in_export( $meta_keys ) {
			$meta_keys[] = 'woo_gallery_slider';
			return $meta_keys;
		}
		/**
		 * Set up the necessary hooks for the class.
		 *
		 * @since 3.1.2
		 * @return void
		 */
		public function import_export_hooks() {
			// Export hooks.
			add_filter(
				"woocommerce_product_export_{$this->export_type}_default_columns",
				array( $this, 'export_column_name' )
			);
			// Remove the column.
			add_filter( 'woocommerce_product_export_skip_meta_keys', array( $this, 'skip_woo_gallery_slider_meta_in_export' ), 10, 1 );
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
				array( $this, 'process_product_gallery_image_import' ),
				10,
				2
			);

			// Make sure the Custom Gallery Image are compatible with the Import Export for WooCommerce Wrapper by WebToffee.
			add_filter( 'wt_batch_product_export_row_data', array( $this, 'wt_iew_exporter_product_gallery_slider' ), 19, 2 );
			// Change the action hook name to match the new plugin's hook
			add_action(
				'wt_woocommerce_product_import_inserted_product_object',
				array( $this, 'process_wt_product_gallery_image_import' ), // Using a slightly different method name to distinguish, or you can keep the old one if preferred.
				10,
				2
			);

			/**
			 * Action hook that fires after the export/import class is loaded.
			 *
			 * @since 3.1.2
			 * @param Woo_Gallery_Slider_Variation_Image_Import $this The class instance.
			 */
			do_action( 'woo_gallery_export_import_loaded', $this );
		}


		/**
		 * Add the gallery images column to the WooCommerce product export.
		 *
		 * @since 3.1.2
		 * @param array $columns The existing columns.
		 * @return array The modified columns.
		 */
		public function export_column_name( $columns ) {
			// Add our custom column to the export columns.
			$columns[ $this->column_id ] = esc_html__( 'Reno Product Gallery Variation Images', 'gallery-slider-for-woocommerce' );
			return $columns;
		}

		/**
		 * Provide the data for the gallery images column in the export.
		 *
		 * @since 3.1.2
		 * @since 3.2.0 Added video export support.
		 * @param string     $value      The column value.
		 * @param WC_Product $product    The product being exported.
		 * @param string     $column_id  The column identifier.
		 * @return string The formatted gallery images data.
		 */
		public function export_column_data( $value, $product, $column_id ) {
			$product_id = $product->get_id();
			// Get the gallery images for this product. A variation exports the images it shows
			// (WooCommerce core's gallery once migrated), so a re-import doesn't bring back
			// woo_gallery_slider images replaced in core's field.
			if ( $product->is_type( 'variation' ) && class_exists( 'Woo_Gallery_Slider_Variation_Gallery' ) ) {
				$gallery_images = Woo_Gallery_Slider_Variation_Gallery::ids( $product_id );
			} else {
				$gallery_images = get_post_meta( $product_id, 'woo_gallery_slider', true );
			}

			// If there are no gallery images, return an empty string.
			if ( empty( $gallery_images ) ) {
				return '';
			}

			// Stored as "[12,34]" or, by the removed product-editor block, "12,34".
			if ( is_string( $gallery_images ) ) {
				$gallery_images = array_filter( array_map( 'absint', explode( ',', trim( $gallery_images, '[]' ) ) ) );
			}

			// Ensure we have an array of image IDs.
			if ( is_array( $gallery_images ) ) {
				/**
				 * Filter the raw gallery images before processing.
				 *
				 * @since 3.1.2
				 * @param array     $gallery_images  The gallery image IDs.
				 * @param WC_Product $product        The product being exported.
				 */
				$gallery_images = (array) apply_filters( 'sp_woo_gallery_raw_exported_images', $gallery_images, $product );

				// Remove any empty values and reset array keys.
				$gallery_images = array_values( array_filter( $gallery_images ) );
			} else {
				// If we don't have an array, initialize an empty one.
				$gallery_images = array();
			}

			/**
			 * Build paired image-video entries
			 *
			 * @since 3.2.0
			 */
			$entries = array();
			foreach ( $gallery_images as $image_id ) {
				$image = wp_get_attachment_image_src( $image_id, 'full' );
				if ( ! $image ) {
					continue;
				}

				$entry = array( 'image' => $image[0] );

				// Get video URL for this image.
				$video_url = get_post_meta( $image_id, 'wcgs_video', true );
				if ( ! empty( $video_url ) ) {
					$entry['video'] = $video_url;
				}

				$entries[] = $entry;
			}

			/**
			 * Filter entries before export.
			 *
			 * @since 3.2.0
			 * @param array $entries Array of {image, video} pairs.
			 * @param int   $product_id Product ID.
			 */
			$entries = apply_filters( 'sp_woo_gallery_exported_entries', $entries, $product_id );

			// The image-only filter of 3.x: keep it working, each kept image with its video.
			if ( has_filter( 'sp_woo_gallery_exported_images' ) ) {
				$videos = array();
				foreach ( $entries as $entry ) {
					if ( ! empty( $entry['video'] ) ) {
						$videos[ $entry['image'] ] = $entry['video'];
					}
				}
				$images  = (array) apply_filters_deprecated( 'sp_woo_gallery_exported_images', array( array_column( $entries, 'image' ), $product_id ), '4.0.0', 'sp_woo_gallery_exported_entries' );
				$entries = array();
				foreach ( $images as $image ) {
					$entry = array( 'image' => $image );
					if ( isset( $videos[ $image ] ) ) {
						$entry['video'] = $videos[ $image ];
					}
					$entries[] = $entry;
				}
			}

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
			$formatted = apply_filters( 'sp_woo_gallery_exported_string', $formatted, $entries, $product_id );

			// Join the entries with commas.
			return implode( ',', array_values( array_filter( $formatted ) ) );
		}

		/**
		 * Add the gallery images column to the import mapping options.
		 *
		 * @since 3.1.2
		 * @param array $columns The existing columns.
		 * @return array The modified columns.
		 */
		public function import_column_name( $columns ) {
			// Add our custom column to the import mapping options.
			$columns[ $this->column_id ] = esc_html__( 'Reno Product Gallery Variation Images', 'gallery-slider-for-woocommerce' );
			return $columns;
		}

		/**
		 * Define the default column name for import mapping.
		 *
		 * @since 3.1.2
		 * @param array $columns The existing default columns.
		 * @return array The modified default columns.
		 */
		public function default_import_column_name( $columns ) {
			// Map the human-readable column name to our column ID.
			$columns[ esc_html__( 'Reno Product Gallery Variation Images', 'gallery-slider-for-woocommerce' ) ] = $this->column_id;
			return $columns;
		}

		/**
		 * Process the import data for a product.
		 *
		 * @since 3.1.2
		 * @since 3.2.0 Added video import support.
		 * @param WC_Product $product The product being imported.
		 * @param array      $data    The import data.
		 * @return void
		 */
		public function process_product_gallery_image_import( $product, $data ) {
			$product_id = $product->get_id();
			// Check if our column exists in the import data.
			if ( isset( $data[ $this->column_id ] ) && ! empty( $data[ $this->column_id ] ) ) {
				$woo_variation_images = array();
				// Split the comma-separated list of image URLs.
				$raw_gallery_images = (array) explode( ',', $data[ $this->column_id ] );
				// Remove any empty values and reset array keys.
				$raw_gallery_images = array_values( array_filter( $raw_gallery_images ) );

				/**
				 * Filter the raw gallery entries (image URLs, or image|video pairs) before parsing.
				 *
				 * @since 2.2.1
				 * @param array  $raw_gallery_images Raw entries.
				 * @param int    $product_id         Product ID.
				 * @param array  $data               Import data.
				 * @param string $column_id          Column identifier.
				 */
				$raw_gallery_images = (array) apply_filters(
					'sp_woo_gallery_raw_imported_images',
					$raw_gallery_images,
					$product_id,
					$data,
					$this->column_id
				);

				/**
				 * Parse paired image|video entries
				 *
				 * @since 3.2.0
				 */
				$parsed_entries = array();
				foreach ( $raw_gallery_images as $entry ) {
					$parsed_entries[] = $this->parse_entry( $entry );
				}

				/**
				 * Filter parsed entries before processing.
				 *
				 * @since 3.2.0
				 * @param array  $parsed_entries Parsed {image, video} pairs.
				 * @param int    $product_id Product ID.
				 * @param array  $data Full import data.
				 * @param string $column_id Column identifier.
				 */
				$parsed_entries = (array) apply_filters(
					'sp_woo_gallery_parsed_import_entries',
					$parsed_entries,
					$product_id,
					$data,
					$this->column_id
				);

				// Convert URLs to attachment IDs.
				foreach ( $parsed_entries as $entry ) {
					if ( empty( $entry['image'] ) ) {
						continue;
					}

					$attachment_id = $this->get_attachment_id_from_url( $entry['image'], $product_id );
					if ( ! $attachment_id ) {
						continue;
					}

					$woo_variation_images[] = $attachment_id;

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
								'sp_woo_gallery_video_imported',
								$attachment_id,
								$video_url,
								$product_id
							);
						}
					}
				}

				// Save the gallery images: a variation's go to WooCommerce core's gallery while it is enabled.
				// When none resolved (unreachable URLs), keep the current gallery instead of emptying it,
				// as the WebToffee import does: it may hold the images core's own Images column just set.
				$woo_variation_images = array_values( array_filter( $woo_variation_images ) );
				if ( ! empty( $woo_variation_images ) ) {
					$this->save_gallery( $product, $woo_variation_images );
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
		 * @since 3.1.2
		 * @param string $url        The image URL.
		 * @param int    $product_id The product ID.
		 * @return int The attachment ID or 0 on failure.
		 */
		public function get_attachment_id_from_url( $url, $product_id ) {
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
			// If we still don't have an ID, log it and skip the image: the callers
			// don't catch exceptions, and one bad URL must not abort the import.
			if ( ! $id ) {
				/* translators: %s: image URL */
				error_log( 'Reno Product Gallery Import Error: ' . sprintf( __( 'Unable to use image "%s".', 'gallery-slider-for-woocommerce' ), $url ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				return 0;
			}
			return $id;
		}

		/**
		 * Exporter function to handle the product gallery slider images.
		 *
		 * @param array      $row The row data being exported.
		 * @param WC_Product $product The product object.
		 * @return array The modified row data with gallery slider images.
		 */
		public function wt_iew_exporter_product_gallery_slider( $row, $product ) {
			// A variation exports the images it shows (WooCommerce core's gallery once migrated).
			$is_variation = is_a( $product, 'WC_Product' ) && $product->is_type( 'variation' ) && class_exists( 'Woo_Gallery_Slider_Variation_Gallery' );
			if ( $is_variation && array_key_exists( 'meta:woo_gallery_slider', $row ) ) {
				$row['meta:woo_gallery_slider'] = implode( ',', Woo_Gallery_Slider_Variation_Gallery::ids( $product->get_id() ) );
			}
			if ( ! empty( $row['meta:woo_gallery_slider'] ) ) {
				$woo_gallery_slider = $row['meta:woo_gallery_slider'];
				// Stored as "[12,34]" or, by the removed product-editor block, "12,34".
				$woo_gallery_slider = array_filter( array_map( 'absint', explode( ',', trim( (string) $woo_gallery_slider, '[]' ) ) ) );
				$image_file_names   = array();
				if ( $woo_gallery_slider ) {
					foreach ( $woo_gallery_slider as $image_id ) {

						$attached_file_path = wp_get_attachment_url( $image_id );

						if ( ! empty( $attached_file_path ) ) {
							$image_file_names[] = $attached_file_path;
						}
					}
					if ( ! empty( $image_file_names ) ) {
						$image_file_names = implode( ',', $image_file_names );
					} else {
						$image_file_names = '';
					}
					$row['meta:woo_gallery_slider'] = $image_file_names;
				} else {
					$row['meta:woo_gallery_slider'] = '';
				}
			}

			return $row;
		}

		/**
		 * Process custom variation gallery image data during product import by webtoffee.
		 *
		 * This method hooks into the 'wt_woocommerce_product_import_inserted_product_object' action
		 * to save the 'woo_gallery_slider' meta key for variation products based on
		 * the image URLs provided in the import data.
		 *
		 * @since 3.1.2 // Update if this is a new version of your code
		 * @param WC_Product $product The product being imported (can be parent or variation).
		 * @param array      $data    The import data for this specific product/variation.
		 * @return void
		 */
		public function process_wt_product_gallery_image_import( $product, $data ) {

			$product_id   = $product->get_id();
			$meta_key     = 'woo_gallery_slider';
			$meta_value   = null;
			$meta_present = false;

			// Look for the 'woo_gallery_slider' meta value in the import data.
			if ( ! empty( $data['meta_data'] ) && is_array( $data['meta_data'] ) ) {
				foreach ( $data['meta_data'] as $meta ) {
					if ( isset( $meta['key'] ) && $meta['key'] === $meta_key ) {
						$meta_value   = isset( $meta['value'] ) ? $meta['value'] : '';
						$meta_present = true;
						break;
					}
				}
			}

			// Gallery column not part of this import: keep the existing gallery untouched.
			if ( ! $meta_present ) {
				return;
			}

			// Gallery column present but empty: leave the existing gallery untouched
			// to prevent recurring imports with an empty column from wiping galleries.
			if ( '' === trim( (string) $meta_value ) ) {
				return;
			}

			// Process raw URLs into cleaned list.
			$raw_urls = array_filter( array_map( 'trim', explode( ',', $meta_value ) ) );

			// Allow filtering of image URLs.
			$raw_urls = apply_filters(
				'sp_woo_gallery_raw_imported_images',
				$raw_urls,
				$product_id,
				$data,
				$meta_key
			);

			// Convert to attachment IDs.
			$attachment_ids = array();
			foreach ( $raw_urls as $url ) {
				$id = $this->get_attachment_id_from_url( $url, $product_id );
				if ( $id ) {
					$attachment_ids[] = $id;
				}
			}

			$attachment_ids = array_values( array_filter( $attachment_ids ) );

			// Save meta when at least one attachment ID resolved.
			if ( ! empty( $attachment_ids ) ) {
				$this->save_gallery( $product, $attachment_ids );
			}
		}

		/**
		 * Save imported gallery images. A variation's gallery goes through
		 * Woo_Gallery_Slider_Variation_Gallery::set_ids(), which writes
		 * WooCommerce core's variation gallery while it is enabled; anything
		 * else keeps the plugin's meta.
		 *
		 * @since 4.0.0
		 * @param WC_Product $product        Imported product or variation.
		 * @param int[]      $attachment_ids Image IDs, in order.
		 * @return void
		 */
		private function save_gallery( $product, array $attachment_ids ) {
			if ( $product->is_type( 'variation' ) && class_exists( 'Woo_Gallery_Slider_Variation_Gallery' ) ) {
				Woo_Gallery_Slider_Variation_Gallery::set_ids( $product->get_id(), $attachment_ids );
				return;
			}
			update_post_meta( $product->get_id(), 'woo_gallery_slider', wp_json_encode( $attachment_ids ) );
		}
	}

	// Initialize the class.
	Woo_Gallery_Slider_Variation_Image_Import::instance();
}
