<?php
/**
 * The general tab functionality of this plugin.
 *
 * Defines the sections of general tab.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/admin
 * @author     Shapedplugin <support@shapedplugin.com>
 */

/**
 * WCGS General class
 */
class WCGS_General {
	/**
	 * Specify the Generation tab for the WooGallery.
	 *
	 * @since    1.0.0
	 * @param string $prefix Define prefix wcgs_settings.
	 */
	public static function section( $prefix ) {
		WCGS::createSection(
			$prefix,
			array(
				'name'   => 'general',
				'title'  => __( 'General', 'gallery-slider-for-woocommerce' ),
				'icon'   => 'sp_wgs-icon-general-tab',
				'fields' => array(
					array(
						'id'      => 'gallery_layout',
						'type'    => 'image_select',
						'class'   => 'gallery_layout',
						'title'   => __( 'Gallery Layout', 'gallery-slider-for-woocommerce' ),
						'desc'    => sprintf(
							/* translators: 1: start strong tag, 2: close strong tag, 3: start link and strong tag, 4: close link and strong tag. */
							__( 'Boost sales with %1$s16+ premium gallery layouts%2$s — %3$sUpgrade to Pro!%4$s', 'gallery-slider-for-woocommerce' ),
							'<a href="https://woogallery.io/#layout-tab" target="_blank"><strong>',
							'</strong></a>',
							'<a href="' . WOO_GALLERY_SLIDER_PRO_LINK . '" target="_blank"><strong>',
							'</strong></a>'
						),
						'options' => array(
							'horizontal'     => array(
								'image'           => plugin_dir_url( __DIR__ ) . '../img/layout/horizontal_bottom.svg',
								'option_name'     => __( 'Thumbs Bottom', 'gallery-slider-for-woocommerce' ),
								'option_demo_url' => 'https://demo.woogallery.io/product/air-max-plus/',
							),
							'vertical_right' => array(
								'image'           => plugin_dir_url( __DIR__ ) . '../img/layout/vertical_right.svg',
								'option_name'     => __( 'Thumbs Right', 'gallery-slider-for-woocommerce' ),
								'option_demo_url' => 'https://demo.woogallery.io/product/custom-dunk-low/',
								// 'pro_only'        => true,
							),
							'horizontal_top' => array(
								'image'           => plugin_dir_url( __DIR__ ) . '../img/layout/horizontal_top.svg',
								'option_name'     => __( 'Thumbs Top', 'gallery-slider-for-woocommerce' ),
								'option_demo_url' => 'https://demo.woogallery.io/product/elemental-backpack/',
							),
							'hide_thumb'     => array(
								'image'           => plugin_dir_url( __DIR__ ) . '../img/layout/hide_thumbnails.svg',
								'option_name'     => __( 'Slider', 'gallery-slider-for-woocommerce' ),
								'option_demo_url' => 'https://demo.woogallery.io/product/duffel-bag/',
								// 'pro_only'        => true,
							),
						),
						'default' => 'horizontal',
					),
					array(
						'id'         => 'thumbnails_item_to_show',
						'min'        => 1,
						'max'        => 10,
						'step'       => 1,
						'default'    => 4,
						'type'       => 'slider',
						'title'      => __( 'Thumbnail Items Per View', 'gallery-slider-for-woocommerce' ),
						'dependency' => array( 'gallery_layout', 'not-any', 'hide_thumb,vertical_right' ),
					),
					array(
						'id'         => 'vertical_thumbs_width',
						'type'       => 'slider',
						'title'      => __( 'Vertical Thumbnails Width', 'gallery-slider-for-woocommerce' ),
						'title_help' => '<div class="wcgs-img-tag"><img src="' . plugin_dir_url( __DIR__ ) . '/shapedplugin-framework/assets/images/help-visuals/v-thumbnail-width.svg" alt=""></div><div class="wcgs-info-label">' . __( 'Vertical Thumbnails Width', 'gallery-slider-for-woocommerce' ) . '</div>',
						'default'    => 20,
						'unit'       => '%',
						'min'        => 1,
						'step'       => 1,
						'max'        => 100,
						'dependency' => array( 'gallery_layout', 'any', 'vertical_right,vertical' ),
					),
					array(
						'id'          => 'thumbnails_sliders_space',
						'type'        => 'dimensions',
						'title'       => __( 'Thumbnails Space', 'gallery-slider-for-woocommerce' ),
						'title_help'  => '<div class="wcgs-img-tag"><img src="' . plugin_dir_url( __DIR__ ) . '/shapedplugin-framework/assets/images/help-visuals/th_space.svg" alt=""></div> <div class="wcgs-info-label">' . __( 'Thumbnails Space', 'gallery-slider-for-woocommerce' ) . '</div><a class="wcgs-open-docs" href="https://woogallery.io/docs/how-to-set-space-between-thumbnails/" target="_blank">' . __( 'Open Docs', 'gallery-slider-for-woocommerce' ) . '</a><a class="wcgs-open-live-demo" href="https://demo.woogallery.io/thumbnails-space-padding-size-border/" target="_blank">' . __( 'Live Demo', 'gallery-slider-for-woocommerce' ) . '</a>',
						'width_text'  => __( 'Gap', 'gallery-slider-for-woocommerce' ),
						'height_text' => __( 'Vertical Gap', 'gallery-slider-for-woocommerce' ),
						'units'       => array( 'px' ),
						'unit'        => 'px',
						'default'     => array(
							'width'  => '6',
							'height' => '6',
						),
						'attributes'  => array(
							'min' => 0,
						),
						'dependency'  => array( 'gallery_layout', '!=', 'hide_thumb' ),
					),
					array(
						'id'         => 'thumbnails_sizes',
						'type'       => 'image_sizes',
						'title'      => __( 'Thumbnails Size', 'gallery-slider-for-woocommerce' ),
						'title_help' => '<div class="wcgs-info-label">' . __( 'Thumbnails Size', 'gallery-slider-for-woocommerce' ) . '</div><div class="wcgs-short-content">' . __( 'Adjust the thumbnail Size according to your website design.', 'gallery-slider-for-woocommerce' ) . '</div><a class="wcgs-open-docs" href="https://woogallery.io/docs/how-to-set-thumbnails-size/" target="_blank">' . __( 'Open Docs', 'gallery-slider-for-woocommerce' ) . '</a><a class="wcgs-open-live-demo" href="https://demo.woogallery.io/thumbnails-space-padding-size-border/#thumb-size" target="_blank">' . __( 'Live Demo', 'gallery-slider-for-woocommerce' ) . '</a>',
						'default'    => 'shop_thumbnail',
						'dependency' => array( 'gallery_layout', '!=', 'hide_thumb' ),
					),
					array(
						'id'         => 'thumb_crop_size',
						'type'       => 'dimensions',
						'class'      => 'pro_only_field',
						'title'      => __( 'Custom Size', 'gallery-slider-for-woocommerce' ),
						'units'      => array(
							'Soft-crop (Pro)',
							'Hard-crop (Pro)',
						),
						'default'    => array(
							'width'  => '100',
							'height' => '100',
							'unit'   => 'Soft-crop',
						),
						'attributes' => array(
							'min' => 0,
						),
						'dependency' => array( 'thumbnails_sizes|gallery_layout', '==|!=', 'custom|hide_thumb' ),
					),
					array(
						'id'         => 'thumbnails_load_2x_image',
						'type'       => 'switcher',
						'class'      => 'pro_switcher wcgs_show_hide',
						'title'      => __( 'Load 2x Resolution Image in Retina Display', 'gallery-slider-for-woocommerce' ),
						'text_on'    => __( 'Enabled', 'gallery-slider-for-woocommerce' ),
						'text_off'   => __( 'Disabled', 'gallery-slider-for-woocommerce' ),
						'text_width' => 96,
						'default'    => false,
						'dependency' => array( 'thumbnails_sizes|gallery_layout', '==|!=', 'custom|hide_thumb' ),
					),
					array(
						'id'         => 'border_normal_width_for_thumbnail',
						'class'      => 'border_active_thumbnail',
						'type'       => 'border',
						'title'      => __( 'Thumbnails Border', 'gallery-slider-for-woocommerce' ),
						'color'      => true,
						'style'      => false,
						'color2'     => false,
						'all'        => true,
						'radius'     => true,
						'default'    => array(
							'color'  => '#dddddd',
							// 'color2' => '#5EABC1',
							'color3' => '#0085BA',
							'all'    => 2,
							'radius' => 0,
						),
						'dependency' => array( 'gallery_layout', '!=', 'hide_thumb' ),
					),
					array(
						'id'          => 'thumbnails_hover_effect',
						'type'        => 'select',
						'title'       => __( 'Thumbnails Hover Effect', 'gallery-slider-for-woocommerce' ),
						'title_video' => '<div class="wcgs-img-tag"><video autoplay loop muted playsinline><source src="https://plugins.svn.wordpress.org/gallery-slider-for-woocommerce/assets/visuals/thumbnails-hover-effects.webm" type="video/webm"></video></div><div class="wcgs-info-label">' . __( 'Thumbnail Hover Effect', 'gallery-slider-for-woocommerce' ) . '</div>',
						'options'     => array(
							'none'       => __( 'Normal', 'gallery-slider-for-woocommerce' ),
							'zoom_in'    => __( 'Zoom In (Pro)', 'gallery-slider-for-woocommerce' ),
							'zoom_out'   => __( 'Zoom Out (Pro)', 'gallery-slider-for-woocommerce' ),
							'slide_up'   => __( 'Slide Up (Pro)', 'gallery-slider-for-woocommerce' ),
							'slide_down' => __( 'Slide Down (Pro)', 'gallery-slider-for-woocommerce' ),
						),
						'default'     => 'none',
						'dependency'  => array( 'gallery_layout', '!=', 'hide_thumb' ),
					),
					array(
						'id'          => 'thumb_active_on',
						'type'        => 'radio',
						'ignore_db'   => true,
						'class'       => 'thumb_active_on pro_desc',
						'title'       => __( 'Thumbnails Activate On', 'gallery-slider-for-woocommerce' ),
						'title_video' => '<div class="wcgs-img-tag"><video autoplay loop muted playsinline><source src="https://plugins.svn.wordpress.org/gallery-slider-for-woocommerce/assets/visuals/thumbnails-activate-on.webm" type="video/webm"></video></div><div class="wcgs-info-label">' . __( 'Thumbnails Activate on', 'gallery-slider-for-woocommerce' ) . '</div>',
						'desc'        => sprintf(
							/* translators: 1: opening anchor tag with Pro link, 2: closing anchor tag. */
							__( 'This feature is %1$savailable in Pro!%2$s', 'gallery-slider-for-woocommerce' ),
							'<a href="' . WOO_GALLERY_SLIDER_PRO_LINK . '" target="_blank"><strong>',
							'</strong></a>'
						),
						'options'     => array(
							'click'     => __( 'Click', 'gallery-slider-for-woocommerce' ),
							'mouseover' => array(
								'option_name' => __( 'Mouseover', 'gallery-slider-for-woocommerce' ),
							),
						),
						'default'     => 'click',
					),
					array(
						'id'          => 'thumbnail_style',
						'class'       => 'thumbnail_style pro_desc',
						'type'        => 'image_select',
						'ignore_db'   => true,
						'title'       => __( 'Active Thumbnail Style', 'gallery-slider-for-woocommerce' ),
						'title_video' => '<div class="wcgs-img-tag"><video autoplay loop muted playsinline><source src="https://plugins.svn.wordpress.org/gallery-slider-for-woocommerce/assets/visuals/active-thumbnails-style.webm" type="video/webm"></video></div><div class="wcgs-info-label">Active Thumbnail Style</div>',
						'desc'        => sprintf(
							/* translators: 1: opening anchor tag with Pro link, 2: closing anchor tag. */
							__( 'This feature is %1$savailable in Pro!%2$s', 'gallery-slider-for-woocommerce' ),
							'<a href="' . WOO_GALLERY_SLIDER_PRO_LINK . '" target="_blank"><strong>',
							'</strong></a>'
						),
						'options'     => array(
							'border_around' => array(
								'image'       => plugin_dir_url( __DIR__ ) . '../img/border-around.svg',
								'option_name' => __( 'Border Around', 'gallery-slider-for-woocommerce' ),
							),
							'bottom_line'   => array(
								'image'       => plugin_dir_url( __DIR__ ) . '../img/bottom-line.svg',
								'option_name' => __( 'Bottom Line', 'gallery-slider-for-woocommerce' ),
							),
							'zoom_out'      => array(
								'image'       => plugin_dir_url( __DIR__ ) . '../img/zoom-out.svg',
								'option_name' => __( 'Zoom Out', 'gallery-slider-for-woocommerce' ),
							),
							'opacity'       => array(
								'image'       => plugin_dir_url( __DIR__ ) . '../img/opacity.svg',
								'option_name' => __( 'Opacity', 'gallery-slider-for-woocommerce' ),
							),
						),
						'default'     => 'border_around',
					),
					array(
						'id'         => 'border_width_for_active_thumbnail',
						'class'      => 'border_active_thumbnail',
						'type'       => 'border',
						'title'      => __( 'Active Thumbnail Border', 'gallery-slider-for-woocommerce' ),
						'title_help' => '<div class="wcgs-img-tag"><img src="' . plugin_dir_url( __DIR__ ) . '/shapedplugin-framework/assets/images/help-visuals/active-thumbnail-border.svg" alt=""></div><div class="wcgs-info-label">' . __( 'Active Thumbnail Border', 'gallery-slider-for-woocommerce' ) . '</div>',
						'color'      => false,
						'color2'     => true,
						'color3'     => false,
						'style'      => false,
						'all'        => true,
						'radius'     => false,
						'default'    => array(
							'color2' => '#0085BA',
							'all'    => 2,
						),
						// 'dependency' => array( 'gallery_layout|thumbnail_style', '!=|!=', 'hide_thumb|bottom_line' ),
					),
					array(
						'id'         => 'inactive_thumbnails_effect',
						'type'       => 'select',
						'ignore_db'  => true,
						'title'      => __( 'Inactive Thumbnails Effect', 'gallery-slider-for-woocommerce' ),
						'title_help' => '<div class="wcgs-info-label">' . __( 'Inactive Thumbnails Effect', 'gallery-slider-for-woocommerce' ) . '</div><div class="wcgs-short-content">' . __( 'Refers to the visual treatment of thumbnails that are not currently selected or in focus.', 'gallery-slider-for-woocommerce' ) . '</div><a class="wcgs-open-docs" href="https://woogallery.io/docs/how-to-set-inactive-thumbnails-effect/" target="_blank">' . __( 'Open Docs', 'gallery-slider-for-woocommerce' ) . '</a><a class="wcgs-open-live-demo" href="https://demo.woogallery.io/inactive-thumbnails-effect/" target="_blank">' . __( 'Live Demo', 'gallery-slider-for-woocommerce' ) . '</a>',
						'options'    => array(
							'none'      => __( 'Normal', 'gallery-slider-for-woocommerce' ),
							'opacity'   => __( 'Opacity (Pro)', 'gallery-slider-for-woocommerce' ),
							'grayscale' => __( 'Grayscale (Pro)', 'gallery-slider-for-woocommerce' ),
						),
						'default'    => 'none',
						// 'dependency' => array( 'gallery_layout|thumbnail_style', '!=|!=', 'hide_thumb|opacity' ),
					),
					array(
						'id'          => 'gallery_width',
						'type'        => 'slider',
						'title'       => __( 'Gallery Width', 'gallery-slider-for-woocommerce' ),

						'title_video' => '<div class="wcgs-img-tag"><video autoplay loop muted playsinline><source src="https://plugins.svn.wordpress.org/gallery-slider-for-woocommerce/assets/visuals/gallery-width.webm" type="video/webm"></video></div><div class="wcgs-info-label">Gallery Width</div>',
						'default'     => 50,
						'unit'        => '%',
						'min'         => 1,
						'step'        => 1,
						'max'         => 100,
					),
					array(
						'id'         => 'gallery_responsive_width',
						'class'      => 'gallery_responsive_width',
						'type'       => 'dimensions_res',
						'title'      => __( 'Responsive Gallery Width', 'gallery-slider-for-woocommerce' ),
						'default'    => array(
							'width'   => '0',
							'height'  => '720',
							'height2' => '480',
							'unit'    => 'px',
						),
						'title_help' => sprintf(
							/* translators: 1: start icon tag, 2: close icon tag. 3: start icon tag, 4: close icon tag. 5: start icon tag, 6: close icon tag. */
							__(
								'%1$sA default value of 0 means that the thumbnail gallery will inherit the Gallery Width value intended for large devices. This default Gallery width is set to 50% up above,%2$s Tablet -Screen size is smaller than 768px. Set the value in between 480-768,%3$s Mobile - Screen size is smaller than 480px.  Set a value between 0-480.',
								'gallery-slider-for-woocommerce'
							),
							'<i class="sp-wgsp-icon-laptop"></i>',
							'<br> <i class="sp-wgsp-icon-tablet"></i>',
							'<br> <i class="sp-wgsp-icon-mobile"></i>'
						),
					),
					array(
						'id'         => 'gallery_bottom_gap',
						'type'       => 'spinner',
						'title'      => __( 'Gallery Bottom Gap', 'gallery-slider-for-woocommerce' ),
						'title_help' => '<div class="wcgs-img-tag"><img src="' . plugin_dir_url( __DIR__ ) . '/shapedplugin-framework/assets/images/help-visuals/gallery-bottom-gap.svg" alt=""></div><div class="wcgs-info-label">' . __( 'Gallery Bottom Gap', 'gallery-slider-for-woocommerce' ) . '</div>',
						'default'    => 30,
						'unit'       => 'px',
					),

					array(
						'id'          => 'gallery_image_source',
						'type'        => 'radio',
						'title'       => __( 'Gallery Image Source', 'gallery-slider-for-woocommerce' ),
						// 'title_help' => '<div class="wcgs-info-label">' . __( 'Gallery Image Source', 'gallery-slider-for-woocommerce' ) . '</div><div class="wcgs-short-content">' . __( 'Choose a source from where you want to display the gallery images.', 'gallery-slider-for-woocommerce' ) . '</div>',
						'title_video' => '<div class="wcgs-img-tag"><video autoplay loop muted playsinline><source src="https://plugins.svn.wordpress.org/gallery-slider-for-woocommerce/assets/visuals/gallery-image-sources.webm" type="video/webm"></video></div><div class="wcgs-info-label">' . __( 'Gallery Image Source', 'gallery-slider-for-woocommerce' ) . '</div>',
						'options'     => array(
							'attached' => __( 'All images attached to this product content', 'gallery-slider-for-woocommerce' ),
							'uploaded' => __( 'Only images uploaded to the product gallery', 'gallery-slider-for-woocommerce' ),
						),
						'default'     => 'uploaded',
					),
					array(
						'id'          => 'include_feature_image_to_gallery',
						'type'        => 'checkbox',
						'title'       => __( 'Include Feature Image', 'gallery-slider-for-woocommerce' ),
						'title_video' => '<div class="wcgs-img-tag"><video autoplay loop muted playsinline><source src="https://plugins.svn.wordpress.org/gallery-slider-for-woocommerce/assets/visuals/featured-image-and-video.webm" type="video/webm"></video></div><div class="wcgs-info-label">Include Feature Image</div>',
						'default'     => 'default_gl',
						'options'     => array(
							'default_gl'  => __( 'To Default Gallery', 'gallery-slider-for-woocommerce' ),
							'variable_gl' => __( 'To Variation Gallery', 'gallery-slider-for-woocommerce' ),
						),
					),
					// array(
					// 'id'         => 'single_combination',
					// 'type'       => 'radio',
					// 'title'      => esc_html__( 'Display Variation Images Based on Selection', 'gallery-slider-for-woocommerce' ),
					// 'title_help' => '<div class="wcgs-info-label">Display Variation Images Based on Selection</div><div class="wcgs-short-content">When \'Single Attribute\' chosen, variation images will show on a single variation attribute change; when \'All Attributes\' chosen, they will show only when all variation attributes are selected.</div>',
					// 'default'    => 'single',
					// 'options'    => array(
					// 'single' => __( 'Single Attribute', 'gallery-slider-for-woocommerce' ),
					// 'all'    => __( 'All Attributes', 'gallery-slider-for-woocommerce' ),
					// ),
					// ),
				),
			)
		);
	}
}
