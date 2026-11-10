<?php
/**
 * The public settings.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/public
 */

/**
 * Public settings class
 */
class WCGS_Public_Settings {
	use WCGS_Public_Default;
	use WCGS_Public_fontmap;

	/**
	 * __construct
	 *
	 * @param  mixed $settings settings.
	 * @return void
	 */
	public function __construct( $settings ) {

		if ( is_array( $settings ) ) {
			foreach ( $settings as $key => $value ) {

				$this->setData( $key, $value );

			}
		}
		$this->fonts_map_func();
	}

	/**
	 * SetData
	 *
	 * @param  mixed $key array key.
	 * @param  mixed $value array value.
	 * @return void
	 */
	public function setData( $key, $value ) {
		$is_arr = is_array( $value ) ? true : false;
		if ( $is_arr ) {
			$name_arr = explode( '_', $key );
			$name     = isset( $name_arr[1] ) ? $name_arr[0] . '_' . $name_arr[1] : $name_arr[0];
			foreach ( $value as $k => $v ) {
				$variable_name = $name . '_' . $k;
				$default_value = $variable_name;
				if ( property_exists( $this, $name . '_' . $k ) ) {
					$this->{$name . '_' . $k} = isset( $v ) ? $v : $default_value;
				}
			}
		} elseif ( property_exists( $this, $key ) ) {
				$this->{$key} = $value;
		}
	}

	/**
	 * Fonts map func
	 *
	 * @return void
	 */
	public function fonts_map_func() {
		foreach ( $this->fonts_map as $key => $value ) {
			if ( $key === $this->navigation_icon ) {
				$this->navigation_left_icon  = $value[0];
				$this->navigation_right_icon = $value[1];
			}
			if ( $key === $this->thumbnailnavigation_icon ) {
				$this->thumbnailnavigation_left_icon  = $value[0];
				$this->thumbnailnavigation_right_icon = $value[1];
			}
		}
	}
}
