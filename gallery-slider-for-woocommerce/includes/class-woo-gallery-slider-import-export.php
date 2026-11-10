<?php
/**
 * Custom import export.
 *
 * @link http://shapedplugin.com
 * @since 3.0.0
 *
 * @package Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Custom import export.
 */
class Woo_Gallery_Slider_Import_Export {
	/**
	 * Global Settings API, whose sanitizers an imported layout goes through.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Global_Settings_API|null
	 */
	private $global_settings_api;

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 * @param Woo_Gallery_Slider_Global_Settings_API|null $global_settings_api Global Settings API.
	 */
	public function __construct( $global_settings_api = null ) {
		$this->global_settings_api = $global_settings_api;
	}

	/**
	 * Export
	 *
	 * @param  mixed $layout_ids Export shortcode ids.
	 * @return object
	 */
	public function export( $layout_ids ) {
		$export = array();
		if ( 'global_settings' === $layout_ids ) {
			$export['global_settings'] = get_option( 'wcgs_settings' );
			$export['metadata']        = array(
				'version' => WOO_GALLERY_SLIDER_VERSION,
				'date'    => gmdate( 'Y/m/d' ),
			);
			return $export;
		} elseif ( ! empty( $layout_ids ) ) {
			$post_in    = 'all_layouts' === $layout_ids ? '' : $layout_ids;
			$args       = array(
				'post_type'        => 'wcgs_layouts',
				// Inactive layouts are drafts since 4.0.0.
				'post_status'      => array( 'inherit', 'publish', 'draft' ),
				'orderby'          => 'modified',
				'suppress_filters' => 1, // wpml, ignore language filter.
				'posts_per_page'   => -1,
				'post__in'         => $post_in,
			);
			$shortcodes = get_posts( $args );
			if ( ! empty( $shortcodes ) ) {
				foreach ( $shortcodes as $shortcode ) {
					$accordion_export = array(
						'title'       => $shortcode->post_title,
						'original_id' => $shortcode->ID,
						'meta'        => array(),
					);
					foreach ( get_post_meta( $shortcode->ID ) as $metakey => $value ) {
						$accordion_export['meta'][ $metakey ] = $value[0];
					}
					$export['layout'][] = $accordion_export;

					unset( $accordion_export );
				}
				$export['metadata'] = array(
					'version' => WOO_GALLERY_SLIDER_VERSION,
					'date'    => gmdate( 'Y/m/d' ),
				);
			}
			return $export;
		}
	}
	/**
	 * Field ids a layout's `wcgs_metabox` holds, with their sanitize callbacks.
	 * The tablet and mobile values (`device_overrides`) are left out: import()
	 * keeps them as they are and stores them as device maps.
	 *
	 * @param string $metabox_id The ID of the metabox.
	 * @return array List of field ID and sanitize callback pairs.
	 */
	public function sp_get_metabox_field_ids_with_sanitizers( $metabox_id ) {
		if ( 'wcgs_metabox' !== $metabox_id ) {
			return array();
		}
		$field_data = array();
		foreach ( array_keys( Woo_Gallery_Slider_Layouts_API::fields() ) as $field_id ) {
			if ( Woo_Gallery_Slider_Responsive::KEY !== $field_id ) {
				$field_data[] = array(
					'id'       => $field_id,
					'sanitize' => null,
				);
			}
		}
		return $field_data;
	}
	/**
	 * Import layouts. The free version has one per-product layout, so only
	 * the first layout of the file is imported, and only while no layout
	 * exists (as 3.x did).
	 *
	 * @param  array $shortcodes Import shortcode array.
	 * @throws \Exception Error massage.
	 * @return array|WP_Error
	 */
	public function import( $shortcodes ) {
		$errors      = array();
		$new_tabs_id = 0;
		if ( Woo_Gallery_Slider_Layouts_API::count_layouts() > 0 ) {
			return Woo_Gallery_Slider_Layouts_API::limit_error();
		}
		$shortcodes = array_slice( array_values( (array) $shortcodes ), 0, 1 );
		foreach ( $shortcodes as $index => $shortcode ) {
			$errors[ $index ] = array();
			$new_tabs_id      = 0;
			try {
				$new_tabs_id = wp_insert_post(
					array(
						'post_title'  => isset( $shortcode['title'] ) ? sanitize_text_field( $shortcode['title'] ) : '',
						'post_status' => 'publish',
						'post_type'   => 'wcgs_layouts',
					),
					true
				);

				if ( is_wp_error( $new_tabs_id ) ) {
					throw new Exception( $new_tabs_id->get_error_message() );
				}

				if ( isset( $shortcode['meta'] ) && is_array( $shortcode['meta'] ) ) {
					foreach ( $shortcode['meta'] as $key => $value ) {
						if ( 'wcgs_metabox' === $key ) {
							// Exports carry the meta serialized; a hand-made file may carry it as an object.
							if ( is_string( $value ) && is_serialized( $value ) ) {
								$value = unserialize( $value, array( 'allowed_classes' => false ) ); // phpcs:ignore -- disallowed any classes.
							}
							// Replace the placeholder inside the values: on the serialized string it
							// broke the string lengths.
							if ( is_array( $value ) ) {
								array_walk_recursive(
									$value,
									function ( &$item ) use ( $new_tabs_id ) {
										if ( is_string( $item ) ) {
											$item = str_replace( '{#ID#}', (string) $new_tabs_id, $item );
										}
									}
								);
							}
							$sanitize_value = $this->sanitize_and_collect_metabox_data( $key, $value );
							// Tablet and mobile values are not in the field list: keep them, then store them as device maps.
							if ( is_array( $value ) && isset( $value[ Woo_Gallery_Slider_Responsive::KEY ] ) ) {
								$sanitize_value[ Woo_Gallery_Slider_Responsive::KEY ] = $value[ Woo_Gallery_Slider_Responsive::KEY ];
							}
							$sanitize_value = Woo_Gallery_Slider_Responsive::normalize_import( $sanitize_value );
							$sanitize_value = $this->sanitize_layout_settings( $sanitize_value );

							update_post_meta(
								$new_tabs_id,
								$key,
								$sanitize_value
							);

						}
					}
				}
			} catch ( Exception $e ) {
				array_push( $errors[ $index ], $e->getMessage() );
				// If there was a failure somewhere, clean up.
				wp_trash_post( $new_tabs_id );
			}
			// If no errors, remove the index.
			if ( ! count( $errors[ $index ] ) ) {
				unset( $errors[ $index ] );
			}
		}
		// External modules manipulate data here.
		do_action( 'sp_wcgs_imported', $new_tabs_id );
		$errors = reset( $errors );
		return isset( $errors[0] ) ? new WP_Error( 'import_wcgs_error', $errors[0] ) : $shortcodes;
	}

	/**
	 * Run an imported layout's settings through the Global Settings sanitizers,
	 * so a Pro-only value (a file exported from Pro) falls back to the free
	 * value instead of being stored.
	 *
	 * @since 4.0.0
	 * @param array $settings Layout settings, responsive keys as device maps.
	 * @return array
	 */
	private function sanitize_layout_settings( $settings ) {
		if ( ! $this->global_settings_api || ! is_array( $settings ) ) {
			return $settings;
		}
		$settings = Woo_Gallery_Slider_Responsive::to_runtime( $settings );
		foreach ( Woo_Gallery_Slider_Layouts_API::fields() as $key => $field ) {
			if ( ! array_key_exists( $key, $settings ) ) {
				continue;
			}
			// A responsive key with device values but no desktop value of its own inherits
			// the global value: the export holds a null desktop, which wp_kses_post_deep()
			// turned into ''. Keep it unset (to_stored() writes the null back) instead of
			// storing the field default.
			if ( ( null === $settings[ $key ] || '' === $settings[ $key ] ) && in_array( $key, Woo_Gallery_Slider_Responsive::KEYS, true ) ) {
				unset( $settings[ $key ] );
				continue;
			}
			$settings[ $key ] = $this->global_settings_api->to_storage( $this->global_settings_api->from_storage( $settings[ $key ], $field ), $field, $settings[ $key ] );
		}
		return Woo_Gallery_Slider_Responsive::to_stored( $settings );
	}

	/**
	 * Sanitize and process metabox form data.
	 *
	 * @param  string $metabox_key Unique metabox identifier.
	 * @param  array  $request_data Data submitted via the form ($_POST or similar).
	 * @return array Sanitized metabox data.
	 */
	public function sanitize_and_collect_metabox_data( $metabox_key, $request_data ) {
		$sanitized_data = array();

		// Retrieve the list of fields with their respective sanitization callbacks.
		$metabox_fields = $this->sp_get_metabox_field_ids_with_sanitizers( $metabox_key );

		foreach ( $metabox_fields as $field ) {
			// Ensure the field has a valid ID.
			if ( empty( $field['id'] ) ) {
				continue;
			}

			// The id comes from the field definitions, not the file. Not sanitize_key(): it lowercases camelCase ids.
			$field_id = $field['id'];
			// A key the file doesn't have stays unset, so the layout uses the
			// Global Settings value for it, as a layout saved before that key existed.
			if ( ! is_array( $request_data ) || ! array_key_exists( $field_id, $request_data ) || null === $request_data[ $field_id ] ) {
				continue;
			}
			$field_value = $request_data[ $field_id ];

			// If a custom sanitizer function is provided, use it.
			if ( ! empty( $field['sanitize'] ) && is_callable( $field['sanitize'] ) ) {
				$sanitized_data[ $field_id ] = call_user_func( $field['sanitize'], $field_value );
			} elseif ( is_array( $field_value ) ) {
				$sanitized_data[ $field_id ] = wp_kses_post_deep( $field_value );
			} else {
				// Keep '' and '0' (switches off, zero sizes) as they are.
				$sanitized_data[ $field_id ] = wp_kses_post( (string) $field_value );
			}
		}

		return $sanitized_data;
	}
}
