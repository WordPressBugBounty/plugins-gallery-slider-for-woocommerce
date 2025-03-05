<?php
/**
 * The advance tab functionality of this plugin.
 *
 * Defines the sections of advance tab.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/admin
 * @author     Shapedplugin <support@shapedplugin.com>
 */

/**
 * WCGS Advance class
 */
class WCGS_Advance {
	/**
	 * Specify the Advance tab for the WooGallery.
	 *
	 * @since    1.0.0
	 * @param string $prefix Define prefix wcgs_settings.
	 */
	public static function section( $prefix ) {
		WCGS::createSection(
			$prefix,
			array(
				'name'   => 'advance',
				'icon'   => 'sp_wgs-icon-advanced-tab',
				'title'  => __( 'Advanced', 'gallery-slider-for-woocommerce' ),
				'fields' => array(
					array(
						'type' => 'tabbed',
						'tabs' => array(
							array(
								'title'  => __( 'Advanced Controls', 'gallery-slider-for-woocommerce' ),
								'icon'   => 'sp_wgs-icon-advanced-2',
								'fields' => array(
									array(
										'id'         => 'wcgs_data_remove',
										'type'       => 'checkbox',
										'title'      => __( 'Clean-up Data on Deletion', 'gallery-slider-for-woocommerce' ),
										'title_help' => __( 'Check this box if you would like WooGallery plugin to completely remove all of its data when the plugin is deleted.', 'gallery-slider-for-woocommerce' ),
									),
									array(
										'id'         => 'shortcode',
										'class'      => 'spwg_shortcode',
										'type'       => 'text',
										'shortcode'  => true,
										'title'      => __( 'Shortcode', 'gallery-slider-for-woocommerce' ),
										'desc'       => sprintf(
											/* translators: 1: start bold tag, 2: close bold tag, 3: start link tag, 4: close link tag. */
											__(
												'If the Product Gallery is not displaying automatically on your product pages when edited using page builders (%1$sDivi, Elementor, Bricks%2$s Builder, etc.), use this shortcode manually to render the Product Gallery. %3$sSee Instructions.%4$s',
												'gallery-slider-for-woocommerce'
											),
											'<b>',
											'</b>',
											'<a href="https://docs.shapedplugin.com/docs/gallery-slider-for-woocommerce-pro/troubleshooting/how-to-fix-gallery-slider-display-issues-in-different-page-builders/" target="_blank"><b>',
											'</b></a>'
										),
										'attributes' => array(
											'readonly' => '',
										),
										'default'    => '[wcgs_gallery_slider]',
									),
									array(
										'type'    => 'subheading',
										'content' => __( 'Assets (Styles and Scripts)', 'gallery-slider-for-woocommerce' ),
									),
									array(
										'id'         => 'enqueue_fancybox_css',
										'type'       => 'switcher',
										'title'      => __( 'FancyBox CSS', 'gallery-slider-for-woocommerce' ),
										'text_on'    => __( 'Enqueued', 'gallery-slider-for-woocommerce' ),
										'text_off'   => __( 'Dequeued', 'gallery-slider-for-woocommerce' ),
										'text_width' => 100,
										'default'    => true,
									),
									array(
										'id'         => 'enqueue_fancybox_js',
										'type'       => 'switcher',
										'title'      => __( 'FancyBox JS', 'gallery-slider-for-woocommerce' ),
										'text_on'    => __( 'Enqueued', 'gallery-slider-for-woocommerce' ),
										'text_off'   => __( 'Dequeued', 'gallery-slider-for-woocommerce' ),
										'text_width' => 100,
										'default'    => true,
									),
									array(
										'id'         => 'enqueue_swiper_css',
										'type'       => 'switcher',
										'title'      => __( 'Swiper CSS', 'gallery-slider-for-woocommerce' ),
										'text_on'    => __( 'Enqueued', 'gallery-slider-for-woocommerce' ),
										'text_off'   => __( 'Dequeued', 'gallery-slider-for-woocommerce' ),
										'text_width' => 100,
										'default'    => true,
									),
									array(
										'id'         => 'enqueue_swiper_js',
										'type'       => 'switcher',
										'title'      => __( 'Swiper JS', 'gallery-slider-for-woocommerce' ),
										'text_on'    => __( 'Enqueued', 'gallery-slider-for-woocommerce' ),
										'text_off'   => __( 'Dequeued', 'gallery-slider-for-woocommerce' ),
										'text_width' => 100,
										'default'    => true,
									),
								),
							),
							array(
								'title'  => __( 'Additional CSS & JS', 'gallery-slider-for-woocommerce' ),
								'icon'   => 'dashicons dashicons-editor-code',
								'fields' => array(
									array(
										'id'       => 'wcgs_additional_css',
										'type'     => 'code_editor',
										'title'    => __( 'Additional CSS', 'gallery-slider-for-woocommerce' ),
										'settings' => array(
											'theme' => 'mbo',
											'mode'  => 'css',
										),
									),
									array(
										'id'       => 'wcgs_additional_js',
										'type'     => 'code_editor',
										'title'    => __( 'Additional JS', 'gallery-slider-for-woocommerce' ),
										'settings' => array(
											'theme' => 'mbo',
											'mode'  => 'js',
										),
									),
								),
							),
							array(
								'title'  => __( 'Speed Optimization', 'gallery-slider-for-woocommerce' ),
								'icon'   => 'sp_wgs-icon-gauge',
								'fields' => array(
									array(
										'id'      => 'optimize_notice',
										'type'    => 'notice',
										'style'   => 'normal',
										'class'   => 'wcgs-light-notice',
										'content' => sprintf(
											// translators: 1: start bold tag, 2: close bold tag, 3: start link tag, 4: close link tag.
											__( 'To improve the loading speed of your single product page with %3$sWooGallery%4$s, please follow these %1$sguidelines%2$s. Additionally, you may refer to your caching plugin\'s recommendations for further optimization.', 'gallery-slider-for-woocommerce' ),
											'<a href="https://docs.shapedplugin.com/docs/gallery-slider-for-woocommerce-pro/configurations/how-to-speed-up-your-single-product-page" target="_blank"><b>',
											'</b></a>',
											'<b>',
											'</b>',
										),
									),
									array(
										'id'         => 'lazy_load_gallery',
										'type'       => 'checkbox',
										'title'      => __( 'Load the Product Gallery on the Visible Viewport', 'gallery-slider-for-woocommerce' ),
										'title_help' => __( 'Check this box if you would like WooGallery plugin to ensure the product gallery loads automatically when it enters the visible viewport', 'gallery-slider-for-woocommerce' ),
										'default'    => true,
									),
									array(
										'id'         => 'remove_default_wc_gallery',
										'type'       => 'checkbox',
										'title'      => __( 'Remove Default WooCommerce Gallery Scripts', 'gallery-slider-for-woocommerce' ),
										'title_help' => __( 'WooCommerce gallery assets are disabled because WooGallery is handling those functions.', 'gallery-slider-for-woocommerce' ),
										'default'    => array( 'lightbox', 'zoom', 'slider' ),
										'options'    => array(
											'lightbox' => __( 'Lightbox(PhotoSwipe) ', 'gallery-slider-for-woocommerce' ),
											'zoom'     => __( 'Zoom (Zoom)', 'gallery-slider-for-woocommerce' ),
											'slider'   => __( 'Slider(FlexSlider)', 'gallery-slider-for-woocommerce' ),
										),
									),
									array(
										'id'         => 'dequeue_single_product_css',
										'type'       => 'text',
										'title'      => __( 'Add handler to Dequeue Unnecessary CSS files', 'gallery-slider-for-woocommerce' ),
										'desc'       => __( 'Enter the CSS file handlers separated by comma. e.g., theme-style, plugin-style-xyz', 'gallery-slider-for-woocommerce' ),
										'title_help' => __( 'Enter the CSS file handles to remove, separated by commas. Caution: Incorrectly removing CSS files can break site styling. Only use this if you understand CSS handles.', 'gallery-slider-for-woocommerce' ),
										'default'    => '',
									),
									array(
										'id'         => 'dequeue_single_product_js',
										'type'       => 'text',
										'title'      => __( 'Add handler to Dequeue Unnecessary JS files ', 'gallery-slider-for-woocommerce' ),
										'desc'       => __( 'Enter the JS file handlers, separated by comma. e.g., theme-script, plugin-script-xyz', 'gallery-slider-for-woocommerce' ),
										'title_help' => __( 'Enter the JS file handles to remove, separated by commas. Caution: Incorrectly removing JS files can break site styling. Only use this if you understand JS handles.', 'gallery-slider-for-woocommerce' ),
										'default'    => '',
									),
								),
							),
							array(
								'title'  => __( 'License Key', 'gallery-slider-for-woocommerce' ),
								'icon'   => 'sp_wgs-icon-license-tab',
								'fields' => array(
									array(
										'id'      => 'license_notice',
										'type'    => 'notice',
										'style'   => 'normal',
										'class'   => 'wcgs-light-notice align-center',
										'content' => __( 'Premium license key provides you access to regular updates and expert support 👨🏻‍💻', 'gallery-slider-for-woocommerce' ),
									),
									array(
										'id'   => 'license_key',
										'type' => 'license',
									),
								),
							),

						),
					),

				),
			)
		);
	}
}
