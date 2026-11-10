<?php
/**
 * Tablet and mobile values of the responsive settings.
 *
 * @link       https://shapedplugin.com/
 * @since      4.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Per-device values of the settings the dashboard marks as responsive.
 *
 * Runtime shape. Everything that renders or edits the gallery (the dynamic
 * CSS, the template, the frontend script, the dashboard and its preview)
 * works on one shape: each responsive setting's legacy key holds the desktop
 * value, and one extra key holds what differs per device:
 *
 *     'device_overrides' => array(
 *         'tablet' => array( 'gallery_bottom_gap' => '20', 'thumbnails_sliders_space' => array( 'width' => '4' ) ),
 *         'mobile' => array( 'navigation_icon_size' => '14' ),
 *     )
 *
 * A missing key (or sub key of a nested value) inherits the next larger
 * device: mobile → tablet → desktop.
 *
 * Storage. Each responsive key stores a device map, its old value being
 * the desktop one, plus the key's unit (UNITS) where its value has none:
 * a number's in the map, a nested value's in each device object.
 *
 *     'gallery_bottom_gap'       => array( 'desktop' => '30', 'tablet' => '20', 'mobile' => '', 'unit' => 'px' ),
 *     'thumbnails_sliders_space' => array( 'desktop' => array( 'width' => '6', 'height' => '6', 'unit' => 'px' ), 'tablet' => array( 'width' => '4', 'height' => '', 'unit' => 'px' ), 'mobile' => array( 'width' => '', 'height' => '', 'unit' => 'px' ) ),
 *
 * A nested value stores every device with the same sub keys; an empty sub
 * key inherits, and a `unit` sub key holds the device's effective unit.
 *
 * A fresh install stores its defaults as maps. Nothing is migrated: values
 * saved before 4.0.0 stay plain until the next dashboard save of the global
 * settings or that layout writes them as maps. to_runtime() reads both (and
 * plain defaults saved by 3.x, imports from older versions), and to_stored()
 * writes maps; read and write only through them.
 *
 * Tablet values apply at a viewport of TABLET_MAX px and below, mobile values
 * at MOBILE_MAX px and below (the frontend script's own mobile check is
 * `width < 768`).
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Responsive {

	/**
	 * Settings key that holds the tablet and mobile values.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const KEY = 'device_overrides';

	/**
	 * Largest viewport width, in px, that gets the tablet values.
	 *
	 * @since 4.0.0
	 * @var int
	 */
	const TABLET_MAX = 1024;

	/**
	 * Largest viewport width, in px, that gets the mobile values.
	 *
	 * @since 4.0.0
	 * @var int
	 */
	const MOBILE_MAX = 767;

	/**
	 * Settings that can differ per device. A nested value (e.g. a spacing
	 * group) can differ per sub key.
	 *
	 * @since 4.0.0
	 * @var string[]
	 */
	const KEYS = array(
		'gallery_bottom_gap',
		'thumbnails_item_to_show',
		'vertical_thumbs_width',
		'thumbnails_sliders_space',
		'thumbnails_inner_padding',
		'navigation_icon_size',
		'lightbox_icon_size',
	);

	/**
	 * CSS unit of the responsive settings whose value carries none (the 3.x
	 * field's unit). Stored only: a number's as the device map's `unit`, a
	 * nested value's as a `unit` sub key of each device, which to_runtime()
	 * drops again. Spacing groups keep their own editable `unit` sub key;
	 * counts have no unit.
	 *
	 * @since 4.0.0
	 * @var string[]
	 */
	const UNITS = array(
		'gallery_bottom_gap'       => 'px',
		'vertical_thumbs_width'    => '%',
		'thumbnails_sliders_space' => 'px',
		'thumbnails_inner_padding' => 'px',
		'navigation_icon_size'     => 'px',
		'lightbox_icon_size'       => 'px',
	);

	/**
	 * Devices that can override the desktop value, largest first, with the
	 * largest viewport width each one covers.
	 *
	 * @since 4.0.0
	 * @return int[] Max width keyed by device.
	 */
	public static function devices() {
		return array(
			'tablet' => self::TABLET_MAX,
			'mobile' => self::MOBILE_MAX,
		);
	}

	/**
	 * Whether a stored value is a device map (`array( 'desktop' => …, 'tablet' => …, 'mobile' => … )`).
	 * No legacy value of a responsive key has a `desktop` sub key.
	 *
	 * @since 4.0.0
	 * @param mixed $value Stored value.
	 * @return bool
	 */
	public static function is_device_map( $value ) {
		return is_array( $value ) && array_key_exists( 'desktop', $value );
	}

	/**
	 * Stored or imported settings → the runtime shape. Device maps give their
	 * desktop value to the key and their other values to `device_overrides`;
	 * plain values pass through unchanged.
	 *
	 * @since 4.0.0
	 * @param mixed $settings Stored settings (`wcgs_settings` or a layout's meta).
	 * @return mixed
	 */
	public static function to_runtime( $settings ) {
		if ( ! is_array( $settings ) ) {
			return $settings;
		}
		$overrides = null;
		foreach ( self::KEYS as $key ) {
			if ( ! isset( $settings[ $key ] ) || ! self::is_device_map( $settings[ $key ] ) ) {
				continue;
			}
			if ( null === $overrides ) {
				$overrides = self::get( $settings );
			}
			$map = $settings[ $key ];
			if ( isset( self::UNITS[ $key ] ) ) {
				// The fixed unit of a nested value is stored per device, never read.
				foreach ( array( 'desktop', 'tablet', 'mobile' ) as $device ) {
					if ( isset( $map[ $device ] ) && is_array( $map[ $device ] ) ) {
						unset( $map[ $device ]['unit'] );
					}
				}
			}
			if ( null === $map['desktop'] ) {
				// No desktop value: the key falls back to its default.
				unset( $settings[ $key ] );
			} else {
				$settings[ $key ] = $map['desktop'];
			}
			$unit = is_array( $map['desktop'] ) && isset( $map['desktop']['unit'] ) ? (string) $map['desktop']['unit'] : '';
			foreach ( array_keys( self::devices() ) as $device ) {
				$value = isset( $map[ $device ] ) ? $map[ $device ] : null;
				if ( is_array( $value ) ) {
					$value = array_filter(
						$value,
						function ( $sub ) {
							return is_scalar( $sub ) && '' !== (string) $sub;
						}
					);
					// A stored device unit is its effective one: only a change of unit overrides.
					if ( isset( $value['unit'] ) ) {
						$own = (string) $value['unit'];
						if ( $own === $unit ) {
							unset( $value['unit'] );
						}
						$unit = $own;
					}
					if ( $value ) {
						$overrides[ $device ][ $key ] = $value;
					}
				} elseif ( is_scalar( $value ) && '' !== (string) $value ) {
					$overrides[ $device ][ $key ] = $value;
				}
			}
		}
		if ( null !== $overrides ) {
			$settings[ self::KEY ] = $overrides;
		}
		return $settings;
	}

	/**
	 * Settings (runtime shape, plain values or device maps) → the stored
	 * shape: each responsive key a device map with its UNITS unit, no
	 * `device_overrides`. A device with no value of its own is stored empty:
	 * '' or, for a nested value, the same sub keys as desktop, each '' except
	 * a `unit`, which holds the unit the device inherits. A key with device
	 * values but no desktop value (e.g. from an import) stores a null desktop,
	 * which reads as the default.
	 *
	 * @since 4.0.0
	 * @param mixed $settings Settings to store.
	 * @return mixed
	 */
	public static function to_stored( $settings ) {
		if ( ! is_array( $settings ) ) {
			return $settings;
		}
		$settings  = self::to_runtime( $settings );
		$overrides = self::get( $settings );
		foreach ( self::KEYS as $key ) {
			$has_desktop = array_key_exists( $key, $settings );
			$has_device  = isset( $overrides['tablet'][ $key ] ) || isset( $overrides['mobile'][ $key ] );
			if ( ! $has_desktop && ! $has_device ) {
				continue;
			}
			$desktop   = $has_desktop ? $settings[ $key ] : null;
			$map       = array( 'desktop' => $desktop );
			$nested    = is_array( $desktop ) || ( isset( $overrides['tablet'][ $key ] ) && is_array( $overrides['tablet'][ $key ] ) ) || ( isset( $overrides['mobile'][ $key ] ) && is_array( $overrides['mobile'][ $key ] ) );
			$unit      = $nested && isset( self::UNITS[ $key ] ) ? self::UNITS[ $key ] : null;
			$inherited = is_array( $desktop ) ? $desktop : array();
			if ( null !== $unit && is_array( $desktop ) ) {
				$map['desktop']['unit'] = $unit;
			}
			foreach ( array_keys( self::devices() ) as $device ) {
				$own = isset( $overrides[ $device ][ $key ] ) ? $overrides[ $device ][ $key ] : null;
				if ( ! $nested || ( null !== $own && ! is_array( $own ) ) ) {
					$map[ $device ] = null === $own ? '' : $own;
					continue;
				}
				// Same sub keys on every device, so each one is stored as an object.
				$own   = is_array( $own ) ? $own : array();
				$value = array();
				foreach ( array_unique( array_merge( array_keys( $inherited ), array_keys( $own ) ) ) as $sub_key ) {
					if ( isset( $own[ $sub_key ] ) ) {
						$value[ $sub_key ] = $own[ $sub_key ];
					} elseif ( 'unit' === $sub_key && isset( $inherited['unit'] ) ) {
						$value[ $sub_key ] = $inherited['unit'];
					} else {
						$value[ $sub_key ] = '';
					}
				}
				if ( null !== $unit ) {
					$value['unit'] = $unit;
				}
				$inherited      = array_merge( $inherited, $own );
				$map[ $device ] = $value;
			}
			if ( ! $nested && isset( self::UNITS[ $key ] ) ) {
				$map['unit'] = self::UNITS[ $key ];
			}
			$settings[ $key ] = $map;
		}
		unset( $settings[ self::KEY ] );
		return $settings;
	}

	/**
	 * Imported settings (plain values, `device_overrides` or device maps) →
	 * the stored shape, with the device values sanitized.
	 *
	 * @since 4.0.0
	 * @param array $settings Imported settings (other keys already sanitized).
	 * @return array
	 */
	public static function normalize_import( $settings ) {
		$settings = self::to_runtime( $settings );
		if ( is_array( $settings ) && isset( $settings[ self::KEY ] ) ) {
			$settings[ self::KEY ] = self::sanitize( $settings[ self::KEY ] );
		}
		return self::to_stored( $settings );
	}

	/**
	 * The device values of a settings array, cleaned: only the two devices
	 * and the keys in KEYS, scalars or arrays of scalars.
	 *
	 * @since 4.0.0
	 * @param array $settings Settings (`wcgs_settings` or a layout's meta).
	 * @return array `array( 'tablet' => array, 'mobile' => array )`.
	 */
	public static function get( $settings ) {
		$overrides = is_array( $settings ) && isset( $settings[ self::KEY ] ) && is_array( $settings[ self::KEY ] ) ? $settings[ self::KEY ] : array();
		$result    = array();
		foreach ( array_keys( self::devices() ) as $device ) {
			$result[ $device ] = array();
			if ( empty( $overrides[ $device ] ) || ! is_array( $overrides[ $device ] ) ) {
				continue;
			}
			foreach ( self::KEYS as $key ) {
				if ( ! array_key_exists( $key, $overrides[ $device ] ) ) {
					continue;
				}
				$value = $overrides[ $device ][ $key ];
				if ( is_array( $value ) ) {
					$value = array_filter( $value, 'is_scalar' );
					if ( $value ) {
						$result[ $device ][ $key ] = $value;
					}
				} elseif ( is_scalar( $value ) && '' !== (string) $value ) {
					$result[ $device ][ $key ] = $value;
				}
			}
		}
		return $result;
	}

	/**
	 * Whether a settings array has any tablet or mobile value.
	 *
	 * @since 4.0.0
	 * @param array $settings Settings.
	 * @return bool
	 */
	public static function has_overrides( $settings ) {
		return (bool) array_filter( self::get( $settings ) );
	}

	/**
	 * The settings as a device sees them: the desktop values with the tablet
	 * values, and on mobile the mobile values too, put in.
	 *
	 * @since 4.0.0
	 * @param array  $settings Settings.
	 * @param string $device   'desktop', 'tablet' or 'mobile'.
	 * @return array
	 */
	public static function for_device( $settings, $device ) {
		if ( ! array_key_exists( $device, self::devices() ) ) {
			return $settings;
		}
		$overrides = self::get( $settings );
		foreach ( array_keys( self::devices() ) as $step ) {
			foreach ( $overrides[ $step ] as $key => $value ) {
				if ( is_array( $value ) ) {
					$base             = isset( $settings[ $key ] ) && is_array( $settings[ $key ] ) ? $settings[ $key ] : array();
					$settings[ $key ] = array_merge( $base, $value );
				} else {
					$settings[ $key ] = $value;
				}
			}
			if ( $step === $device ) {
				break;
			}
		}
		return $settings;
	}

	/**
	 * The settings a product gets from an assigned layout: the global settings
	 * with the layout's values over them, as before, except the device values.
	 * Those belong to the layout's own desktop values, so the layout's set
	 * replaces the global one whole, and a layout saved without any (or before
	 * 4.0.0) has none.
	 *
	 * @since 4.0.0
	 * @param array $merged Global settings overlaid with the layout's values (runtime shape).
	 * @param array $layout The layout's `wcgs_metabox` meta (runtime shape).
	 * @return array
	 */
	public static function from_layout( $merged, $layout ) {
		$merged[ self::KEY ] = self::get( $layout );
		return $merged;
	}

	/**
	 * Sanitize device values from an untrusted source (a settings or layout
	 * import): numbers clamped to their setting's limits and kept as strings,
	 * as the framework stores them; a spacing `unit` must be one of its options.
	 * Limits come from the dashboard's field definitions
	 * (Woo_Gallery_Slider_Global_Settings_API::fields()).
	 *
	 * @since 4.0.0
	 * @param mixed $overrides Device values.
	 * @return array
	 */
	public static function sanitize( $overrides ) {
		$clean  = self::get( array( self::KEY => $overrides ) );
		$fields = Woo_Gallery_Slider_Global_Settings_API::fields();
		$fields = isset( $fields[ self::KEY ]['fields'] ) ? $fields[ self::KEY ]['fields'] : array();
		$scalar = function ( $value, $field ) {
			if ( isset( $field['type'] ) && 'enum' === $field['type'] ) {
				return in_array( (string) $value, $field['options'], true ) ? (string) $value : null;
			}
			if ( ! isset( $field['type'] ) || 'number' !== $field['type'] || ! is_numeric( $value ) ) {
				return null;
			}
			return (string) round( min( max( 0 + $value, $field['min'] ), $field['max'] ), 2 );
		};
		foreach ( $clean as $device => $values ) {
			foreach ( $values as $key => $value ) {
				$field = isset( $fields[ $key ] ) ? $fields[ $key ] : array();
				if ( is_array( $value ) ) {
					$result = array();
					foreach ( $value as $sub_key => $sub_value ) {
						if ( isset( $field['fields'][ $sub_key ] ) ) {
							$sub_value = $scalar( $sub_value, $field['fields'][ $sub_key ] );
							if ( null !== $sub_value ) {
								$result[ $sub_key ] = $sub_value;
							}
						}
					}
					$value = $result ? $result : null;
				} else {
					$value = $scalar( $value, $field );
				}
				if ( null === $value ) {
					unset( $clean[ $device ][ $key ] );
				} else {
					$clean[ $device ][ $key ] = $value;
				}
			}
		}
		return $clean;
	}
}
