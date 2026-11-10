<?php
/**
 * REST API endpoints of the dashboard Global Settings panel.
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
 * Reads and writes the General, Product Gallery and Lightbox keys of
 * `wcgs_settings` for the React Global Settings panel.
 *
 * Only the free settings are fields. The enum options are the free values,
 * so a Pro-only value sent by a request (or found in an imported or stored
 * value) is never stored: it falls back to the field default, the free value
 * the frontend forces for it too (`WCGS_Public_Helper::free_settings()`).
 *
 * Values are stored in the shapes the legacy settings framework wrote
 * (switchers "1"/"", numbers as strings, colors as hex or rgba(), nested
 * fields as arrays), so the frontend and settings saved by 3.x read them
 * unchanged. Field ids and defaults are those of the 3.x settings pages.
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Global_Settings_API {

	/**
	 * REST API namespace.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const REST_NAMESPACE = 'wcgs/v1';

	/**
	 * Option that holds the global settings.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const OPTION = 'wcgs_settings';

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 * @param bool $register Register the REST routes and store the defaults; false for a plain value converter.
	 */
	public function __construct( $register = true ) {
		if ( ! $register ) {
			return;
		}
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		// Right away, not on a later hook: the frontend reads `wcgs_settings` when the plugin loads.
		$this->save_defaults();
	}

	/**
	 * Defaults of the panel fields in the stored shape, without the device
	 * values (no device override means none). The frontend fills keys missing
	 * from `wcgs_settings` (a partial import, a store not saved since 3.x) with
	 * them, so it renders what the panel and its preview show.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public static function stored_defaults() {
		static $defaults = null;
		if ( null === $defaults ) {
			$api      = new self( false );
			$defaults = array();
			foreach ( self::fields() as $key => $field ) {
				if ( 'responsive' !== $field['type'] ) {
					$defaults[ $key ] = $api->to_storage( $api->default_value( $field ), $field );
				}
			}
		}
		return $defaults;
	}

	/**
	 * Store the defaults of every panel field while `wcgs_settings` is empty
	 * (a fresh install). The classic framework left the Product Gallery keys
	 * unsaved, so a new store rendered the frontend fallbacks (no zoom,
	 * preloader, lazy load or thumbnail arrows) while the settings showed
	 * these defaults; they are stored too since 4.0.0. Existing installs keep
	 * what they have until their next save. The responsive keys are stored as
	 * device maps (Woo_Gallery_Slider_Responsive::to_stored()), as a dashboard
	 * save writes them.
	 *
	 * It runs on a fresh install only (no version of the plugin ran before),
	 * and also asks the dashboard to open the Setup Wizard once (`show_setup_wizard`). The
	 * flag is set here, not earlier: any key in the option would skip these
	 * defaults.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function save_defaults() {
		// Not on an upgrade: the 4.0.0 update fills a 3.x store with the 3.x defaults.
		if ( ! empty( get_option( self::OPTION ) ) || false !== get_option( 'woo_gallery_slider_version' ) ) {
			return;
		}
		$groups   = self::field_groups();
		$defaults = array();
		foreach ( array_merge( ...array_values( $groups ) ) as $key => $field ) {
			$defaults[ $key ] = $this->to_storage( $this->default_value( $field ), $field );
		}
		$defaults[ Woo_Gallery_Slider_Dashboard_API::WIZARD_KEY ] = '1';
		update_option( self::OPTION, Woo_Gallery_Slider_Responsive::to_stored( $defaults ) );
	}

	/**
	 * Settings fields the panel edits, with their type, default and limits.
	 *
	 * Types: switch, enum, number, color, multi, image_size,
	 * group (a nested array whose `fields` are typed the same way), and
	 * responsive (`device_overrides`: per device, the values of its `fields`
	 * that differ from the larger device; a group holds only the sub keys it
	 * sets, see Woo_Gallery_Slider_Responsive).
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public static function fields() {
		$fields = array_merge( ...array_values( self::field_groups() ) );

		// Tablet and mobile values of the responsive settings, typed like the settings themselves.
		$responsive = array();
		foreach ( Woo_Gallery_Slider_Responsive::KEYS as $key ) {
			if ( isset( $fields[ $key ] ) ) {
				$responsive[ $key ] = $fields[ $key ];
			}
		}
		$fields[ Woo_Gallery_Slider_Responsive::KEY ] = array(
			'type'    => 'responsive',
			'fields'  => $responsive,
			'default' => array_fill_keys( array_keys( Woo_Gallery_Slider_Responsive::devices() ), array() ),
		);

		return $fields;
	}

	/**
	 * The fields of fields(), grouped by the panel section they belong to:
	 * `general`, `gallery` (every Product Gallery sub-section) and `lightbox`.
	 * Shop Page Video is a Pro feature: the panel shows only its upsell card.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private static function field_groups() {
		$switch = function ( $default_value ) {
			return array(
				'type'    => 'switch',
				'default' => $default_value,
			);
		};
		$enum   = function ( $options, $default_value ) {
			return array(
				'type'    => 'enum',
				'options' => $options,
				'default' => $default_value,
			);
		};
		$number = function ( $default_value, $min = 0, $max = 9999 ) {
			return array(
				'type'    => 'number',
				'default' => $default_value,
				'min'     => $min,
				'max'     => $max,
			);
		};
		$color  = function ( $default_value ) {
			return array(
				'type'    => 'color',
				'default' => $default_value,
			);
		};
		$group  = function ( $fields ) {
			return array(
				'type'   => 'group',
				'fields' => $fields,
			);
		};
		$colors = function ( $defaults ) use ( $group, $color ) {
			return $group( array_map( $color, $defaults ) );
		};

		$arrow_icons = array( 'angle', 'chevron', 'right_open', 'right_open_1', 'right_open_3', 'right_open_outline', 'angle_double', 'chevron_circle', 'arrow', 'long_arrow', 'right_outline' );
		$visibility  = array( 'always', 'hover' );

		// Enums list only the free values: a locked (Pro) value is never stored,
		// it falls back to the field default, which is the free fallback value.
		$general = array(
			// General.
			'gallery_layout'                       => $enum( array( 'horizontal', 'vertical', 'vertical_right', 'horizontal_top', 'hide_thumb' ), 'horizontal' ),
			'thumbnails_item_to_show'              => $number( 4, 1, 10 ),
			'vertical_thumbs_width'                => $number( 20, 1, 100 ),
			'thumbnails_sliders_space'             => $group(
				array(
					'width'  => $number( 6 ),
					'height' => $number( 6 ),
				)
			),
			'thumbnails_inner_padding'             => $number( 0 ),
			'thumbnails_sizes'                     => array(
				'type'    => 'image_size',
				'default' => 'shop_thumbnail',
			),
			'border_normal_width_for_thumbnail'    => $group(
				array(
					'all'    => $number( 1, 0, 100 ),
					'radius' => $number( 0, 0, 999 ),
					'color'  => $color( '#dddddd' ),
					'color3' => $color( '#0085BA' ),
				)
			),
			'thumbnails_hover_effect'              => $enum( array( 'none', 'zoom_out', 'slide_down' ), 'none' ),
			'thumb_active_on'                      => $enum( array( 'click' ), 'click' ),
			'thumbnail_style'                      => $enum( array( 'border_around', 'top_line' ), 'border_around' ),
			'border_width_for_active_thumbnail'    => $group(
				array(
					'all'    => $number( 2, 0, 100 ),
					'color2' => $color( '#0085BA' ),
				)
			),
			'border_bottom_for_active_thumbnail'   => $group(
				array(
					'all'    => $number( 2, 0, 100 ),
					'color2' => $color( '#237c92' ),
				)
			),
			'active_thumb_shadow'                  => $group(
				array(
					'horizontal' => $number( 0, -999 ),
					'vertical'   => $number( 0, -999 ),
					'blur'       => $number( 0 ),
					'spread'     => $number( 0, -999 ),
					'color'      => $color( 'rgba(0,0,0,0.50)' ),
				)
			),
			'inactive_thumbnails_effect'           => $enum( array( 'grayscale', 'none' ), 'none' ),
			'gallery_width'                        => $number( 50, 1 ),
			'gallery_responsive_width'             => $group(
				array(
					'width'   => $number( 0 ),
					'height'  => $number( 720 ),
					'height2' => $number( 480 ),
					'unit'    => $enum( array( 'px', '%', 'em' ), 'px' ),
				)
			),
			'gallery_bottom_gap'                   => $number( 30 ),
			'gallery_image_source'                 => $enum( array( 'attached', 'uploaded' ), 'uploaded' ),
			'include_feature_image_to_gallery'     => array(
				'type'    => 'multi',
				'options' => array( 'default_gl', 'variable_gl' ),
				'default' => array( 'default_gl' ),
			),
			'show_caption'                         => $switch( false ),
		);

		$gallery = array(
			// Product Gallery: Gallery Slider.
			'autoplay'                             => $switch( false ),
			'autoplay_interval'                    => $number( 3000, 0, 12000 ),
			'autoplay_speed'                       => $number( 300, 0, 2000 ),
			'slide_orientation'                    => $enum( array( 'horizontal', 'vertical' ), 'horizontal' ),
			'infinite_loop'                        => $switch( true ),
			'fade_slide'                           => $enum( array( 'slide', 'flip', 'cube' ), 'slide' ),
			'slider_height_type'                   => $enum( array( 'adaptive', 'max_image' ), 'max_image' ),
			'accessibility'                        => $switch( true ),
			'slider_dir'                           => $switch( false ),
			'free_mode'                            => $switch( true ),
			'mouse_wheel'                          => $switch( false ),

			// Product Gallery: Navigation & Pagination.
			'navigation'                           => $switch( false ),
			'navigation_icon'                      => $enum( $arrow_icons, 'angle' ),
			'navigation_visibility'                => $enum( $visibility, 'always' ),
			'navigation_position'                  => $enum( array( 'center_center', 'bottom_left' ), 'center_center' ),
			'navigation_icon_size'                 => $number( 18 ),
			'navigation_icon_color_group'          => $colors(
				array(
					'color'          => '#fff',
					'hover_color'    => '#fff',
					'bg_color'       => 'rgba(0, 0, 0, .5)',
					'hover_bg_color' => 'rgba(0, 0, 0, .85)',
				)
			),
			'navigation_icon_radius'               => $number( 0 ),
			'pagination'                           => $switch( false ),
			'pagination_type'                      => $enum( array( 'bullets', 'dynamic', 'strokes' ), 'bullets' ),
			'pagination_icon_color_group'          => $colors(
				array(
					'color'        => '#CCCCCC',
					'active_color' => '#7A8184',
					'bg_color'     => '#fffFFF80',
				)
			),
			'pagination_visibility'                => $enum( $visibility, 'hover' ),
			'pagination_margin'                    => $group(
				array(
					'top'    => $number( 0, -999 ),
					'right'  => $number( 0, -999 ),
					'bottom' => $number( 0, -999 ),
					'left'   => $number( 0, -999 ),
				)
			),

			// Product Gallery: Thumbnails Navigation.
			'thumbnailnavigation'                  => $switch( true ),
			'thumb_nav_visibility'                 => $enum( $visibility, 'hover' ),
			'thumbnailnavigation_style'            => $enum( array( 'custom', 'inner_right' ), 'custom' ),
			'thumbnailnavigation_icon'             => $enum( $arrow_icons, 'angle' ),
			'thumbnailnavigation_icon_size'        => $number( 16 ),
			'thumbnailnavigation_icon_color_group' => $colors(
				array(
					'color'          => '#fff',
					'hover_color'    => '#fff',
					'bg_color'       => 'rgba(0, 0, 0, 0.5)',
					'hover_bg_color' => 'rgba(0, 0, 0, 0.8)',
				)
			),
			'thumbnail_navi_border'                => $group(
				array(
					'all'    => $number( 0, 0, 100 ),
					'radius' => $number( 0, 0, 999 ),
					'color'  => $color( '#dddddd' ),
					'color3' => $color( '#dddddd' ),
				)
			),

			// Product Gallery: Product Image.
			'image_sizes'                          => array(
				'type'    => 'image_size',
				'default' => 'woocommerce_single',
			),
			'wcgs_image_lazy_load'                 => $enum( array( 'false', 'ondemand' ), 'ondemand' ),
			'preloader'                            => $switch( true ),
			'preloader_style'                      => $enum( array( 'normal', 'fade', 'gray', 'blur' ), 'normal' ),
			'image_border_radius'                  => $number( 0 ),
			'grayscale'                            => $enum( array( 'gray_off', 'gray_always', 'gray_onhover' ), 'gray_off' ),

			// Product Gallery: Product Image Zoom.
			'zoom'                                 => $switch( true ),
			'zoom_type'                            => $enum( array( 'in_side', 'zoom_2x' ), 'in_side' ),
			'mobile_zoom'                          => $switch( false ),

			// Product Gallery: Product Video Gallery.
			'video_gallery'                        => $switch( true ),
			'video_presentation'                   => $enum( array( 'in_gallery' ), 'in_gallery' ),
			'video_popup_place'                    => $enum( array( 'inline', 'popup' ), 'popup' ),
			'video_icon'                           => $enum( array( 'play-01', 'play-02', 'play-03', 'play-04', 'play-05', 'play-06', 'play-07', 'play-08', 'play-09', 'native' ), 'play-01' ),
			'video_order'                          => $enum( array( 'usual', 'video_come_last' ), 'usual' ),
		);

		$lightbox = array(
			// Lightbox.
			'lightbox'                             => $switch( true ),
			'lightbox_sliding_effect'              => $enum( array( 'slide', 'classic', 'crossfade', 'no_animation' ), 'slide' ),
			'lightbox_icon_position'               => $enum( array( 'top_right', 'top_left', 'bottom_right', 'bottom_left', 'middle' ), 'top_right' ),
			'lightbox_icon'                        => $enum( array( 'search', 'search-plus', 'plus', 'info' ), 'search' ),
			'lightbox_icon_size'                   => $number( 13 ),
			'lightbox_icon_color_group'            => $colors(
				array(
					'color'          => '#fff',
					'hover_color'    => '#fff',
					'bg_color'       => 'rgba(0, 0, 0, 0.5)',
					'hover_bg_color' => 'rgba(0, 0, 0, 0.8)',
				)
			),
			'lightbox_caption'                     => $switch( true ),
			'lightbox_caption_size'                => $number( 14 ),
			'caption_color'                        => $color( '#ffffff' ),
			'l_img_counter'                        => $switch( true ),
			'gallery_fs_btn'                       => $switch( true ),
		);

		return array(
			'general'  => $general,
			'gallery'  => $gallery,
			'lightbox' => $lightbox,
		);
	}

	/**
	 * Register REST API routes.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/global-settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'save_settings' ),
					'permission_callback' => array( $this, 'check_permission' ),
				),
			)
		);
	}

	/**
	 * Only users who can manage the plugin may use these endpoints.
	 * The REST nonce (X-WP-Nonce, sent by apiFetch) authenticates the cookie.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( apply_filters( 'wcgs_ui_permission', 'manage_options' ) );
	}

	/**
	 * REST API: the panel values, defaults and choices.
	 *
	 * @since 4.0.0
	 * @return WP_REST_Response
	 */
	public function get_settings() {
		$values   = $this->read_values();
		$defaults = array();
		foreach ( self::fields() as $key => $field ) {
			$defaults[ $key ] = $this->default_value( $field );
		}

		return rest_ensure_response(
			array(
				'values'   => $values,
				'defaults' => $defaults,
				'choices'  => array(
					'imageSizes' => $this->get_image_sizes(),
				),
			)
		);
	}

	/**
	 * REST API: save the panel values into `wcgs_settings`.
	 *
	 * Only the keys in fields() are written; every other key is kept.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_settings( WP_REST_Request $request ) {
		$values = $request->get_param( 'values' );
		if ( ! is_array( $values ) ) {
			return new WP_Error( 'wcgs_invalid_settings', __( 'No settings to save.', 'gallery-slider-for-woocommerce' ), array( 'status' => 400 ) );
		}

		update_option( self::OPTION, Woo_Gallery_Slider_Responsive::to_stored( $this->merge_values( $values ) ) );
		// The framework save clears the cached galleries too, so changes show at once.
		Woo_Gallery_Slider_Cache::purge_product_transients();

		return rest_ensure_response(
			array(
				'values'  => $this->read_values(),
				'message' => __( 'Settings saved.', 'gallery-slider-for-woocommerce' ),
			)
		);
	}

	/**
	 * The stored `wcgs_settings` with the panel values put in, sanitized into
	 * the stored shapes. Nothing is saved; the live preview renders with it.
	 *
	 * @since 4.0.0
	 * @param array $values Panel values (app shapes), keyed by field id.
	 * @return array
	 */
	public function merge_values( $values ) {
		$stored = $this->get_stored();
		foreach ( self::fields() as $key => $field ) {
			if ( array_key_exists( $key, $values ) ) {
				$stored[ $key ] = $this->to_storage( $values[ $key ], $field, isset( $stored[ $key ] ) ? $stored[ $key ] : null );
			}
		}
		return $stored;
	}

	/**
	 * The stored global settings array.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public function get_stored() {
		$stored = Woo_Gallery_Slider_Responsive::to_runtime( get_option( self::OPTION, array() ) );
		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * Stored values of fields(), in the shapes the React app edits.
	 * Keys that were never saved (the tabbed Gallery fields) get their default.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public function read_values() {
		$stored = $this->get_stored();
		$values = array();
		foreach ( self::fields() as $key => $field ) {
			$values[ $key ] = array_key_exists( $key, $stored )
				? $this->from_storage( $stored[ $key ], $field )
				: $this->default_value( $field );
		}
		return $values;
	}

	/**
	 * Default of a field, in the app shape.
	 *
	 * @since 4.0.0
	 * @param array $field Field definition.
	 * @return mixed
	 */
	public function default_value( $field ) {
		if ( 'group' === $field['type'] ) {
			$value = array();
			foreach ( $field['fields'] as $sub_key => $sub_field ) {
				$value[ $sub_key ] = $this->default_value( $sub_field );
			}
			return $value;
		}
		return $this->from_storage( $field['default'], $field );
	}

	/**
	 * Convert a stored value to the app shape.
	 *
	 * @since 4.0.0
	 * @param mixed $value Stored value.
	 * @param array $field Field definition.
	 * @return mixed
	 */
	public function from_storage( $value, $field ) {
		switch ( $field['type'] ) {
			case 'switch':
				// The 3.x framework saved a switch that was off as "0".
				return (bool) $value && '0' !== $value;
			case 'number':
				return is_numeric( $value ) ? 0 + $value : $this->from_storage( $field['default'], $field );
			case 'enum':
				return in_array( (string) $value, $field['options'], true ) ? (string) $value : $field['default'];
			case 'image_size':
				// A stored Pro `custom` size (or a size no longer registered) reads as the default.
				$value = $this->modern_image_size( is_scalar( $value ) ? (string) $value : '' );
				return $value === $field['default'] || $this->image_size_exists( $value ) ? $value : (string) $field['default'];
			case 'color':
				$hex = $this->color_to_hex( $value );
				return null !== $hex ? $hex : (string) $this->color_to_hex( $field['default'] );
			case 'multi':
				return array_values( array_intersect( $field['options'], array_map( 'strval', (array) $value ) ) );
			case 'group':
				$result = array();
				foreach ( $field['fields'] as $sub_key => $sub_field ) {
					if ( is_array( $value ) && array_key_exists( $sub_key, $value ) ) {
						$result[ $sub_key ] = $this->from_storage( $value[ $sub_key ], $sub_field );
					} elseif ( is_string( $value ) && '' !== $value ) {
						// A never-saved default stored as one scalar ('middle' for every position).
						$result[ $sub_key ] = $this->from_storage( $value, $sub_field );
					} else {
						$result[ $sub_key ] = $this->default_value( $sub_field );
					}
				}
				return $result;
			case 'responsive':
				$result = array();
				foreach ( Woo_Gallery_Slider_Responsive::get( array( Woo_Gallery_Slider_Responsive::KEY => $value ) ) as $device => $values ) {
					$device_values = array();
					foreach ( $field['fields'] as $key => $sub_field ) {
						if ( ! array_key_exists( $key, $values ) ) {
							continue;
						}
						if ( 'group' === $sub_field['type'] ) {
							$group = array();
							foreach ( $sub_field['fields'] as $sub_key => $group_field ) {
								if ( is_array( $values[ $key ] ) && array_key_exists( $sub_key, $values[ $key ] ) ) {
									$group[ $sub_key ] = $this->from_storage( $values[ $key ][ $sub_key ], $group_field );
								}
							}
							if ( $group ) {
								$device_values[ $key ] = $group;
							}
						} elseif ( ! is_array( $values[ $key ] ) ) {
							$device_values[ $key ] = $this->from_storage( $values[ $key ], $sub_field );
						}
					}
					// An object, so an empty device is `{}` in JSON.
					$result[ $device ] = (object) $device_values;
				}
				return $result;
			default:
				return is_scalar( $value ) ? (string) $value : '';
		}
	}

	/**
	 * Sanitize an app value into the stored shape of the legacy framework.
	 *
	 * @since 4.0.0
	 * @param mixed $value  Value from the request.
	 * @param array $field  Field definition.
	 * @param mixed $stored Value stored now, or null.
	 * @return mixed
	 */
	public function to_storage( $value, $field, $stored = null ) {
		switch ( $field['type'] ) {
			case 'switch':
				return rest_sanitize_boolean( $value ) ? '1' : '';
			case 'number':
				if ( ! is_numeric( $value ) ) {
					return (string) $field['default'];
				}
				$number = min( max( 0 + $value, $field['min'] ), $field['max'] );
				return (string) round( $number, 2 );
			case 'enum':
				return in_array( (string) $value, $field['options'], true ) ? (string) $value : (string) $field['default'];
			case 'image_size':
				$value = $this->modern_image_size( (string) $value );
				return $value === $field['default'] || $this->image_size_exists( $value ) ? $value : (string) $field['default'];
			case 'color':
				$hex = $this->color_to_hex( $value );
				if ( null === $hex ) {
					return null !== $stored && null !== $this->color_to_hex( $stored ) ? $stored : $field['default'];
				}
				// Keep the stored notation ('#fff', 'rgba(0, 0, 0, .5)') when the color did not change.
				if ( null !== $stored && $this->color_to_hex( $stored ) === $hex ) {
					return $stored;
				}
				return $this->hex_to_storage( $hex );
			case 'multi':
				return array_values( array_intersect( $field['options'], array_map( 'strval', (array) $value ) ) );
			case 'group':
				// Keep sub keys the panel does not edit (e.g. a border's unused colors).
				$result = is_array( $stored ) ? $stored : array();
				$value  = is_array( $value ) ? $value : array();
				foreach ( $field['fields'] as $sub_key => $sub_field ) {
					if ( array_key_exists( $sub_key, $value ) ) {
						$result[ $sub_key ] = $this->to_storage( $value[ $sub_key ], $sub_field, isset( $result[ $sub_key ] ) ? $result[ $sub_key ] : null );
					} elseif ( ! array_key_exists( $sub_key, $result ) ) {
						$result[ $sub_key ] = $this->to_storage( $this->default_value( $sub_field ), $sub_field );
					}
				}
				return $result;
			case 'responsive':
				// Only the values a device sets; an empty or missing one inherits.
				$result = array();
				// from_storage() returns each device (and a group value) as an object.
				$value = is_object( $value ) ? (array) $value : $value;
				$value = is_array( $value ) ? $value : array();
				foreach ( array_keys( Woo_Gallery_Slider_Responsive::devices() ) as $device ) {
					$result[ $device ] = array();
					$values            = isset( $value[ $device ] ) && ( is_array( $value[ $device ] ) || is_object( $value[ $device ] ) ) ? (array) $value[ $device ] : array();
					foreach ( $field['fields'] as $key => $sub_field ) {
						if ( ! array_key_exists( $key, $values ) || null === $values[ $key ] || '' === $values[ $key ] ) {
							continue;
						}
						if ( is_object( $values[ $key ] ) ) {
							$values[ $key ] = (array) $values[ $key ];
						}
						if ( 'group' === $sub_field['type'] ) {
							$group = array();
							foreach ( $sub_field['fields'] as $sub_key => $group_field ) {
								if ( is_array( $values[ $key ] ) && array_key_exists( $sub_key, $values[ $key ] ) && null !== $values[ $key ][ $sub_key ] && '' !== $values[ $key ][ $sub_key ] ) {
									$group[ $sub_key ] = $this->to_storage( $values[ $key ][ $sub_key ], $group_field );
								}
							}
							if ( $group ) {
								$result[ $device ][ $key ] = $group;
							}
						} elseif ( ! is_array( $values[ $key ] ) ) {
							$result[ $device ][ $key ] = $this->to_storage( $values[ $key ], $sub_field );
						}
					}
				}
				return $result;
			default:
				return sanitize_text_field( (string) $value );
		}
	}

	/**
	 * Normalize a CSS color (#rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), transparent)
	 * to `#RRGGBB`, or `#RRGGBBAA` when it is not opaque.
	 *
	 * @since 4.0.0
	 * @param mixed $value Color.
	 * @return string|null Hex color, or null when the value is not a color.
	 */
	private function color_to_hex( $value ) {
		if ( ! is_string( $value ) ) {
			return null;
		}
		// The framework kept a stray ';' in one default ('#444444;').
		$value = strtolower( trim( rtrim( trim( $value ), ';' ) ) );

		if ( 'transparent' === $value ) {
			return '#00000000';
		}
		if ( preg_match( '/^#([0-9a-f]{3,4})$/', $value, $match ) ) {
			$value = '#' . implode( '', array_map( 'str_repeat', str_split( $match[1] ), array_fill( 0, strlen( $match[1] ), 2 ) ) );
		}
		if ( preg_match( '/^#([0-9a-f]{6})([0-9a-f]{2})?$/', $value, $match ) ) {
			$alpha = isset( $match[2] ) ? $match[2] : 'ff';
			return '#' . strtoupper( $match[1] . ( 'ff' === $alpha ? '' : $alpha ) );
		}
		if ( preg_match( '/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/', $value, $match ) ) {
			$rgb   = array_map( 'intval', array_slice( $match, 1, 3 ) );
			$alpha = isset( $match[4] ) && '' !== $match[4] ? (float) $match[4] : 1;
			if ( max( $rgb ) > 255 || $alpha > 1 ) {
				return null;
			}
			$hex = vsprintf( '#%02X%02X%02X', $rgb );
			return $alpha < 1 ? $hex . sprintf( '%02X', (int) round( $alpha * 255 ) ) : $hex;
		}
		return null;
	}

	/**
	 * Hex color from the app in the notation the legacy color picker stores:
	 * `#rrggbb` when opaque, otherwise `rgba(r, g, b, a)`.
	 *
	 * @since 4.0.0
	 * @param string $hex `#RRGGBB` or `#RRGGBBAA`.
	 * @return string
	 */
	private function hex_to_storage( $hex ) {
		if ( 7 === strlen( $hex ) ) {
			return strtolower( $hex );
		}
		$channels = array_map( 'hexdec', str_split( substr( $hex, 1 ), 2 ) );
		return sprintf( 'rgba(%d, %d, %d, %s)', $channels[0], $channels[1], $channels[2], round( $channels[3] / 255, 2 ) );
	}

	/**
	 * The registered size a legacy WooCommerce image size name resolves to on
	 * the frontend (`shop_thumbnail`, the thumbnails default, is no longer
	 * registered), so the panel shows and stores the size actually used.
	 *
	 * @since 4.0.0
	 * @param string $size Image size name.
	 * @return string
	 */
	private function modern_image_size( $size ) {
		return class_exists( 'WCGS_Public_Helper' ) ? WCGS_Public_Helper::image_size( $size ) : $size;
	}

	/**
	 * Whether an image size is one of the choices (a registered size or
	 * `full`). No labels: they are translated, and the defaults are stored
	 * when the plugin loads, before translations may load.
	 *
	 * @since 4.0.0
	 * @param string $size Image size slug.
	 * @return bool
	 */
	private function image_size_exists( $size ) {
		return 'full' === $size || in_array( $size, get_intermediate_image_sizes(), true );
	}

	/**
	 * Image sizes of the legacy `image_sizes` field (slug => label).
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_image_size_labels() {
		global $_wp_additional_image_sizes;
		$sizes = array();

		foreach ( get_intermediate_image_sizes() as $size ) {
			if ( in_array( $size, array( 'thumbnail', 'medium', 'medium_large', 'large' ), true ) ) {
				$width  = get_option( "{$size}_size_w" );
				$height = get_option( "{$size}_size_h" );
				$crop   = (bool) get_option( "{$size}_crop" ) ? 'hard' : 'soft';
			} elseif ( isset( $_wp_additional_image_sizes[ $size ] ) ) {
				$width  = $_wp_additional_image_sizes[ $size ]['width'];
				$height = $_wp_additional_image_sizes[ $size ]['height'];
				$crop   = $_wp_additional_image_sizes[ $size ]['crop'] ? 'hard' : 'soft';
			} else {
				continue;
			}
			$sizes[ $size ] = ucfirst( "{$size} - {$crop}:{$width}x{$height}" );
		}

		// No `custom` size: a custom crop is a Pro feature (the panel shows it locked).
		$sizes['full'] = __( 'Original uploaded image', 'gallery-slider-for-woocommerce' );
		return $sizes;
	}

	/**
	 * Image size choices.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public function get_image_sizes() {
		$choices = array();
		foreach ( $this->get_image_size_labels() as $value => $label ) {
			$choices[] = array(
				'value' => $value,
				'label' => $label,
			);
		}
		return $choices;
	}
}
