<?php
/**
 * The admin settings page of this plugin.
 *
 * Defines various settings of WooGallery.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/admin
 * @author     Shapedplugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	die;
} // Cannot access directly.

if ( ! function_exists( 'wcgs_reset_ajax' ) ) {
	/**
	 *
	 * Reset Ajax
	 *
	 * @since 1.0.0
	 * @version 1.0.0
	 */
	function wcgs_reset_ajax() {
		$capability      = apply_filters( 'wcgs_ui_permission', 'manage_options' );
		$is_user_capable = current_user_can( $capability ) ? true : false;

		$nonce  = ( ! empty( $_POST['nonce'] ) ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';
		$unique = ( ! empty( $_POST['unique'] ) ) ? sanitize_text_field( wp_unslash( $_POST['unique'] ) ) : '';

		if ( ! wp_verify_nonce( $nonce, 'wcgs_backup_nonce' ) || ! $is_user_capable ) {
			wp_send_json_error( array( 'error' => esc_html__( 'Error: Invalid nonce verification.', 'gallery-slider-for-woocommerce' ) ) );
		}

		// Success.
		delete_option( $unique );

		wp_send_json_success();

	}
	add_action( 'wp_ajax_wcgs-reset', 'wcgs_reset_ajax' );
}
