<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @link        http://shapedplugin.com/
 * @since      1.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/admin
 * @author     ShapedPlugin <support@shapedplugin.com>
 */
class Woo_Gallery_Slider_Cron {

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {

		add_filter( 'cron_schedules', array( $this, 'add_schedules' ) );
		add_action( 'wp', array( $this, 'schedule_events' ) );
	}

	/**
	 * Registers new cron schedules.
	 *
	 * @since 1.0.0
	 *
	 * @param array $schedules schedules.
	 * @return array
	 */
	public function add_schedules( $schedules = array() ) {
		// Adds once weekly to the existing schedules.
		$schedules['weekly'] = array(
			'interval' => WEEK_IN_SECONDS,
			'display'  => __( 'Once Weekly', 'gallery-slider-for-woocommerce' ),
		);

		return $schedules;
	}

	/**
	 * Schedules our events
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function schedule_events() {
		$this->weekly_events();
	}

	/**
	 * Schedule weekly events
	 *
	 * @access private
	 * @since 1.0.0
	 * @return void
	 */
	private function weekly_events() {
		if ( ! wp_next_scheduled( 'woo_gallery_slider_weekly_scheduled_events' ) ) {
			wp_schedule_event( time(), 'weekly', 'woo_gallery_slider_weekly_scheduled_events' );
		}
	}
}

new Woo_Gallery_Slider_Cron();
