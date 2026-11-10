<?php
/**
 * The dynamic style .
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/public
 */

/**
 * WCGS Public Style class
 */
class WCGS_Public_Style extends WCGS_Public_Settings {

	/**
	 * Dynamic css
	 *
	 * @var string
	 */
	private static $dynamic_css;

	/**
	 * Additional css
	 *
	 * @var string
	 */
	private static $additional_css;


	/**
	 * The settings array the instance was built from.
	 *
	 * @since 4.0.0
	 * @var array
	 */
	private $source_settings = array();

	/**
	 * The constructor of the class.
	 *
	 * @param array $settings settings option.
	 * @param bool  $render   Build the page CSS into the shared stylesheet; false
	 *                        for an instance that only computes CSS (a device's).
	 */
	public function __construct( $settings, $render = true ) {
		parent::__construct( $settings );
		$this->source_settings = is_array( $settings ) ? $settings : array();
		if ( $render ) {
			$this->wcgs_css();
			$this->wcgs_custom_css();
		}
	}

	/**
	 * Set a setting as a property, keeping only values safe to print in the
	 * dynamic CSS. Values from layout meta, settings saved before 4.0.0 or
	 * by the Pro plugin skip the dashboard's sanitizers, so a value that is
	 * not a plain CSS token (color, number, unit, keyword) keeps the default.
	 * The additional CSS is the user's own stylesheet and is passed through.
	 *
	 * @since 4.0.0
	 * @param string $key   Setting key.
	 * @param mixed  $value Setting value.
	 * @return void
	 */
	public function setData( $key, $value ) {
		if ( 'wcgs_additional_css' !== $key ) {
			$value = is_array( $value ) ? array_filter( $value, array( __CLASS__, 'is_css_safe' ) ) : $value;
			if ( ! self::is_css_safe( $value ) ) {
				return;
			}
		}
		parent::setData( $key, $value );
	}

	/**
	 * Whether a value can be printed in a CSS declaration as is: hex, rgb(a)
	 * and hsl(a) colors, numbers, units and keywords. Arrays are checked per
	 * item by the caller.
	 *
	 * @since 4.0.0
	 * @param mixed $value Value.
	 * @return bool
	 */
	private static function is_css_safe( $value ) {
		if ( is_array( $value ) || is_bool( $value ) || null === $value ) {
			return true;
		}
		return is_scalar( $value ) && (bool) preg_match( '/^[#a-zA-Z0-9().,%\s_\-]*$/', (string) $value );
	}

	/**
	 * Lighten Color for hover
	 *
	 * @param  string $hex hex color.
	 * @param  int    $percent lighten percentage.
	 * @return string
	 */
	public function lightenColor( $hex, $percent = 10 ) {
		// Remove the hash from the beginning, if present.
		$hex = ltrim( $hex, '#' );

		// Convert the hex value to RGB.
		list($r, $g, $b) = sscanf( $hex, '%02x%02x%02x' );

		// Calculate the new color values.
		$r = round( $r + ( $percent / 100 ) * ( 255 - $r ) );
		$g = round( $g + ( $percent / 100 ) * ( 255 - $g ) );
		$b = round( $b + ( $percent / 100 ) * ( 255 - $b ) );

		// Convert back to hex.
		$new_hex = sprintf( '#%02x%02x%02x', $r, $g, $b );
		return $new_hex;
	}
	/**
	 * Wcgs css: the gallery CSS, then the tablet and mobile values of the
	 * responsive settings in media queries.
	 *
	 * @return void
	 */
	public function wcgs_css() {
		$dynamic_css       = $this->build_css();
		self::$dynamic_css = $dynamic_css . $this->responsive_css( $dynamic_css );
	}

	/**
	 * The gallery CSS for the instance's settings.
	 *
	 * @since 4.0.0
	 * @return string
	 */
	public function build_css() {
		$thumbnails_top = $this->thumbnails_sliders_height;
		if ( ( 'vertical' === $this->gallery_layout ) || ( 'horizontal_top' === $this->gallery_layout ) ) {
			$thumb_position = '-1';
			$direction      = 'rtl';
			$rtl_direction  = 'ltr';
		} else {
			$thumb_position = '2';
			$direction      = 'ltr';
			$rtl_direction  = 'rtl';
		}
		$this->lightbox_icon_size = ! empty( $this->lightbox_icon_size ) ? $this->lightbox_icon_size : 13;
		$thumb_slider_margin      = "margin-top: {$thumbnails_top}px;";
		if ( 'vertical' === $this->gallery_layout ) {
			$thumb_slider_margin = "margin-right: {$thumbnails_top}px;";
		}
		if ( 'vertical_right' === $this->gallery_layout ) {
			$thumb_slider_margin = "margin-left: {$thumbnails_top}px;";
		}
		if ( 'horizontal_top' === $this->gallery_layout ) {
			$thumb_slider_margin = "margin-bottom: {$thumbnails_top}px;";
		}
		$dynamic_css             = '';
		$gallery_width           = (int) $this->gallery_width;
		$gallery_width_with_unit = $gallery_width > 100 ? $gallery_width . 'px' : $gallery_width . '%';
		// At least 1: a malformed value (0, '', 'Array') would divide by zero.
		$thumb_item_width = ( 100 / max( 1, (int) $this->thumbnails_item_to_show ) );
		$dynamic_css     .= '.wcgs-spswiper-before-init.horizontal .gallery-navigation-carousel-wrapper .spswiper-wrapper>div {
				width: calc(' . $thumb_item_width . '% - ' . $this->thumbnails_sliders_width . 'px) !important;
		}';
		$dynamic_css     .= '@media screen and (min-width:992px ){
  			#wpgs-gallery.wcgs-woocommerce-product-gallery:has(:not(+ .summary)) {
                max-width: 100%;
            }
           	#wpgs-gallery.wcgs-woocommerce-product-gallery:has( + .summary) {
                max-width: ' . $gallery_width_with_unit . ';
            }
        }';
		// Block themes: WooCommerce's Single Product template puts the gallery in a
		// 512px column with no .summary sibling, and the JS sizes the gallery to
		// that column. Size the column from the setting, but only while it keeps
		// the stock width: a column resized in the Site Editor is the merchant's.
		// Either way, lift the block's own 512px cap so the gallery fills it. Core
		// keeps columns on one row; let a full-width gallery push the summary below.
		$dynamic_css .= '@media screen and (min-width:782px ){
			.wp-block-columns:has(> .wp-block-column[style*="flex-basis:512px"] > .wp-block-woocommerce-product-image-gallery > #wpgs-gallery) {
				flex-wrap: wrap !important;
			}
			.wp-block-columns > .wp-block-column[style*="flex-basis:512px"]:has(> .wp-block-woocommerce-product-image-gallery > #wpgs-gallery) {
				flex-basis: ' . $gallery_width_with_unit . ' !important;
			}
			.wp-block-columns > .wp-block-column > .wp-block-woocommerce-product-image-gallery:has(> #wpgs-gallery) {
				max-width: none;
			}
		}';
		if ( $gallery_width < 100 ) {
			$summary_width_with_unit = 'calc(' . ( 100 - $gallery_width ) . '% - 50px)';
			$dynamic_css            .= '@media screen and (min-width:992px ){
                #wpgs-gallery.wcgs-woocommerce-product-gallery+.summary {
                    max-width: ' . $summary_width_with_unit . ';
                }
            }';
		}
		// The video play icon: 64px wide, 36px high, white.
		$dynamic_css .= '#wpgs-gallery .vjs-big-play-button .wcgs-video-icon,
		#wpgs-gallery .wcgs-video-icon-wrapper .wcgs-video-icon{
			font-size: 64px;
			height: 64px;
			line-height: 1;
			width: auto;
		}#wpgs-gallery  .wcgs-video-icon{
			color:#fff;
			font-size: 36px;
		}';
		if ( 'strokes' === $this->pagination_type ) {
			$dynamic_css .= '
			.wcgs-carousel .spswiper-pagination .spswiper-pagination-bullet span{
				display: none;
			}
			.wcgs-carousel .spswiper-pagination .spswiper-pagination-bullet{
				border-radius: 0;
				border-radius: 2px;
				height: 5px !important;
				min-height: 5px !important;
				width: 20px;
				margin-right: 5px !important;
			}';
		}

		if ( 'top_line' === $this->thumbnail_style ) {
			if ( 'horizontal_top' === $this->gallery_layout ) {
				$dynamic_css .= '#wpgs-gallery .wcgs-thumb {
					padding-top: 0;
					padding-bottom: 10px;
					transition: border-color 0.33s;
					border-bottom: ' . $this->border_bottom_all . 'px solid transparent;
				}';
			}
			if ( 'horizontal' === $this->gallery_layout ) {
				$dynamic_css .= '#wpgs-gallery .wcgs-thumb {
					padding-top: 10px;
					transition: border-color 0.33s;
					border-top: ' . $this->border_bottom_all . 'px solid transparent;
				}';
			}
			if ( 'vertical' === $this->gallery_layout ) {
				$dynamic_css .= '	#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-thumb{
					padding-left: 0px;
					padding-right: 10px;
					border-right: 2px solid transparent;
				}
				#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-border-bottom {
					right: 0;
				}';
			}
			if ( 'vertical_right' === $this->gallery_layout ) {
				$dynamic_css .= '	#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-thumb{
				padding-right: 0px;
				padding-left: 10px;
				border-left: 2px solid transparent;
			}#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-border-bottom {
					right: auto;
					left: 0;
				}';
			}

			$dynamic_css .= '
			#wpgs-gallery .gallery-navigation-carousel-wrapper {
				position: relative;
			}

			#wpgs-gallery .wcgs-thumb img {
				border: 1px solid #dddddd;
				border-radius: 0px;
			}
			.gallery-navigation-carousel-wrapper .wcgs-border-bottom {
				position: absolute;
				content: "";
				z-index: 999;
				transition: left 400ms ease 0s;
				border-bottom: ' . $this->border_bottom_all . 'px solid ' . $this->border_bottom_color2 . ';
				bottom: 0;
				left: 0;
			}
			#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-border-bottom {
				border-right: ' . $this->border_bottom_all . 'px solid ' . $this->border_bottom_color2 . ';
				border-bottom: none;
				bottom: auto;
				transition: top 400ms ease 0s;
			}
			#wpgs-gallery .wcgs-thumb.wcgs-thumb:hover{
				border-color: ' . $this->lightenColor( $this->border_bottom_color2, 45 ) . ';
			}';
		}

		if ( 'border_around' === $this->thumbnail_style ) {
			$dynamic_css .= '#wpgs-gallery  .spswiper-slide-thumb-active.wcgs-thumb {
				box-shadow: ' . $this->active_thumb_horizontal . 'px ' . $this->active_thumb_vertical . 'px ' . $this->active_thumb_blur . 'px ' . $this->active_thumb_spread . 'px ' . $this->active_thumb_color . ';
			}
			#wpgs-gallery  .spswiper-slide-thumb-active.wcgs-thumb::after{
				border: ' . $this->border_width_all . 'px solid ' . $this->border_width_color2 . ';

			}
			#wpgs-gallery  .wcgs-thumb.spswiper-slide-thumb-active.wcgs-thumb:hover::after {
				border-color: ' . $this->border_width_color2 . ';
			}
			#wpgs-gallery .wcgs-thumb:hover::after {
				border-color: ' . $this->border_normal_color3 . ';
			}
			#wpgs-gallery .wcgs-thumb::after {
				border: ' . $this->border_normal_all . 'px solid ' . $this->border_normal_color . ';
				border-radius: ' . $this->border_normal_radius . 'px;
				overflow: hidden;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				content: "";
				position: absolute;
			}
			#wpgs-gallery .wcgs-thumb {
				border-radius: ' . $this->border_normal_radius . 'px;
				padding: ' . $this->thumbnails_inner_padding . 'px;
			}
			#wpgs-gallery .wcgs-thumb img {
				border-radius: ' . $this->border_normal_radius . 'px;
			}
			';
		}
		if ( 'grayscale' === $this->inactive_thumbnails_effect ) {
			$dynamic_css .= '#wpgs-gallery .wcgs-thumb img{
				opacity: 1;
				filter: grayscale(100%);
			}#wpgs-gallery .wcgs-thumb.spswiper-slide-thumb-active.wcgs-thumb img{
				opacity: 1;
				filter: grayscale(0);
			}';
		}
		$dynamic_css .= '#wpgs-gallery.wcgs-woocommerce-product-gallery .gallery-navigation-carousel-wrapper {
			-ms-flex-order: ' . $thumb_position . ' !important;
			order: ' . $thumb_position . ' !important;
			position: relative;
		}
		#wpgs-gallery.wcgs-woocommerce-product-gallery .wcgs-carousel .wcgs-slider-image {
			border-radius: ' . $this->image_border_radius . 'px;
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow {
			font-size: ' . $this->navigation_icon_size . 'px;
			color: ' . $this->navigation_icon_color . ';
			background-color: ' . $this->navigation_icon_bg_color . ';
			border-radius: ' . $this->navigation_icon_radius . 'px;
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow:hover,
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow:hover {
			color: ' . $this->navigation_icon_hover_color . ';
			background-color: ' . $this->navigation_icon_hover_bg_color . ';
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow::before {
			content: "' . $this->navigation_left_icon . '";
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow::before {
			content: "' . $this->navigation_right_icon . '";
		}
		#wpgs-gallery .spswiper-pagination{
		margin: ' . $this->pagination_margin_top . 'px ' . $this->pagination_margin_right . 'px ' . $this->pagination_margin_bottom . 'px ' . $this->pagination_margin_left . 'px;
		}
		#wpgs-gallery .spswiper-pagination .spswiper-pagination-bullet {
			background-color: ' . $this->pagination_icon_color . ';
		}
		#wpgs-gallery .spswiper-pagination .spswiper-pagination-bullet.spswiper-pagination-bullet-active {
			background-color: ' . $this->pagination_icon_active_color . ';
		}
		#wpgs-gallery .wcgs-lightbox {
			height:' . ( (int) $this->lightbox_icon_size + 17 ) . 'px;
			width: ' . ( (int) $this->lightbox_icon_size + 17 ) . 'px;
			color: ' . $this->lightbox_icon_color . ';
			background-color: ' . $this->lightbox_icon_bg_color . ';
			font-size: ' . $this->lightbox_icon_size . 'px;
			border: none;
		}
		#wpgs-gallery .wcgs-lightbox:hover {
			color: ' . $this->lightbox_icon_hover_color . ';
			background-color: ' . $this->lightbox_icon_hover_bg_color . ';
		}
		#wpgs-gallery .gallery-navigation-carousel.vertical  .wcgs-spswiper-button-next.wcgs-spswiper-arrow::before,
		#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow::before {
			content: "' . $this->thumbnailnavigation_left_icon . '";
		}
		#wpgs-gallery .gallery-navigation-carousel.vertical  .wcgs-spswiper-button-prev.wcgs-spswiper-arrow::before,
		#wpgs-gallery .gallery-navigation-carousel  .wcgs-spswiper-button-next.wcgs-spswiper-arrow::before {
			content: "' . $this->thumbnailnavigation_right_icon . '";
		}
		#wpgs-gallery .gallery-navigation-carousel-wrapper {
			' . $thumb_slider_margin . ';
		}
		#wpgs-gallery {
			margin-bottom: ' . $this->gallery_bottom_gap . 'px;
			--wcgs-lightbox-icon-size: ' . ( (int) $this->lightbox_icon_size + 17 ) . 'px;
		}
		#wpgs-gallery .gallery-navigation-carousel.vertical .wcgs-thumb {
			width: auto !important;
		}
		.wcgs-fancybox-wrapper .fancybox__caption {
			color: ' . $this->caption_color . ';
			font-size: ' . $this->lightbox_caption_size . 'px;
			text-align: center;
		}
		.fancybox__backdrop {
			background: #1e1e1e !important;
		}';

		if ( 'inner_right' === $this->thumbnailnavigation_style ) {
			// The arrows are 30px square.
			$dynamic_css .= '#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow{
				color: ' . $this->thumbnailnavigation_icon_color . ';
				background-color: ' . $this->thumbnailnavigation_icon_bg_color . ';
				font-size: ' . $this->thumbnailnavigation_icon_size . 'px;
				border:  ' . $this->thumbnail_navi_all . 'px solid ' . $this->thumbnail_navi_color . ';
				border-radius: ' . $this->thumbnail_navi_radius . 'px;
				width: 30px;
				height: 30px;

			}#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow:hover,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow:hover{
				border-color:  ' . $this->thumbnail_navi_color3 . ';
				color: ' . $this->thumbnailnavigation_icon_hover_color . ';
				background-color: ' . $this->thumbnailnavigation_icon_hover_bg_color . ';
			}';
		}

		if ( 'custom' === $this->thumbnailnavigation_style ) {
			// The arrows are 25px wide and as high as the thumbnails.
			$dynamic_css .= '#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow{
				font-size: ' . $this->thumbnailnavigation_icon_size . 'px;
				color: ' . $this->thumbnailnavigation_icon_color . ';
				background-color: ' . $this->thumbnailnavigation_icon_bg_color . ';
				border:  ' . $this->thumbnail_navi_all . 'px solid ' . $this->thumbnail_navi_color . ';
				border-radius: ' . $this->thumbnail_navi_radius . 'px;
				width: 25px;
				height: 100%;
			}#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow:hover,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow:hover{
				border-color:  ' . $this->thumbnail_navi_color3 . ';
				color: ' . $this->thumbnailnavigation_icon_hover_color . ';
				background-color: ' . $this->thumbnailnavigation_icon_hover_bg_color . ';
			}';
			if ( 'vertical_right' === $this->gallery_layout || 'vertical' === $this->gallery_layout ) {
				$dynamic_css .= '#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
				#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow{
					left: calc(50% - 50%);
					height: 25px;
					width: 100%;
				}';
			} else {
				$dynamic_css .= '#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
				#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow{
					top: calc(50% - 50%);
					width: 25px;
					height: 100%;
				}';
			}
		}

		switch ( $this->thumbnails_hover_effect ) {
			case 'zoom_out':
				$dynamic_css .= '.gallery-navigation-carousel .wcgs-thumb img{
					transform: scale(1.2);
				}
				.gallery-navigation-carousel .wcgs-thumb:hover img {
					transform: scale(1);
				}';
				break;
			case 'slide_down':
				$dynamic_css .= '.gallery-navigation-carousel .wcgs-thumb:hover {
					transform: translateY(5px);
				}
				.gallery-navigation-carousel .wcgs-thumb{
					margin-bottom: 5px;
				}';
				break;
		}
		if ( 'vertical_right' === $this->gallery_layout ) {
			$dynamic_css .= "#wpgs-gallery[dir='rtl'] .gallery-navigation-carousel {
				margin-right: {$thumbnails_top}px;
				margin-left: 0px;
			}";
			$dynamic_css .= "#wpgs-gallery .overflow_y_auto{
				direction: {$direction};
                overflow-y: scroll;
			}
			#wpgs-gallery[dir='rtl'] .overflow_y_auto {
				direction: {$rtl_direction};
			}";
		}
		if ( 'vertical' === $this->gallery_layout ) {
			$dynamic_css .= "#wpgs-gallery[dir='rtl'] .gallery-navigation-carousel {
					margin-left: {$thumbnails_top}px;
					margin-right: 0px;
				}";
			$dynamic_css .= "#wpgs-gallery .overflow_y_auto{
					direction: {$direction};
					overflow-y: scroll;
				}
				#wpgs-gallery[dir='rtl'] .overflow_y_auto {
					direction: {$rtl_direction};
				}.woocommerce-js div.product.first:has(#wpgs-gallery.vertical) span.onsale{
					left: 101px;
				}.woocommerce-js div.product.first:has(#wpgs-gallery.vertical) .product span.onsale{
					left: auto;
				}";
		}

		// The inside zoom (in_side, zoom_2x).
		$dynamic_css .= '.wcgs_xzoom-preview {
				border: none ;
				box-shadow: none;
				cursor: default;
				border-radius: ' . $this->image_border_radius . 'px;
			}';
		return $dynamic_css;
	}

	/**
	 * Media query blocks with the tablet and mobile values of the responsive
	 * settings (Woo_Gallery_Slider_Responsive).
	 *
	 * Each device's CSS is built from its own settings by build_css() and
	 * compared, rule block by rule block, with the CSS of the next larger
	 * device; the blocks that differ go into that device's media query, in
	 * their original order, so they override with the same selectors.
	 * Settings with no device values add nothing.
	 *
	 * @since 4.0.0
	 * @param string $desktop_css CSS of the desktop values (build_css()).
	 * @return string
	 */
	public function responsive_css( $desktop_css ) {
		if ( ! class_exists( 'Woo_Gallery_Slider_Responsive' ) || ! Woo_Gallery_Slider_Responsive::has_overrides( $this->source_settings ) ) {
			return '';
		}
		// Building and comparing the device CSS costs two more passes over the
		// rules: keep the result in the object cache (per request without a
		// persistent cache). It depends on the settings, wp_is_mobile() and the
		// plugin version only.
		$cache_key = md5( WOO_GALLERY_SLIDER_VERSION . '|' . ( function_exists( 'wp_is_mobile' ) && wp_is_mobile() ? 'm' : 'd' ) . '|' . wp_json_encode( $this->source_settings ) );
		$found     = false;
		$cached    = wp_cache_get( $cache_key, 'wcgs_responsive_css', false, $found );
		if ( $found && is_string( $cached ) ) {
			return $cached;
		}
		$css       = '';
		$previous  = self::css_blocks( $desktop_css );
		$overrides = Woo_Gallery_Slider_Responsive::get( $this->source_settings );
		foreach ( Woo_Gallery_Slider_Responsive::devices() as $device => $max_width ) {
			// A device with no values of its own inherits the larger one's media query.
			if ( empty( $overrides[ $device ] ) ) {
				continue;
			}
			$values       = Woo_Gallery_Slider_Responsive::for_device( $this->source_settings, $device );
			$device_style = new self( $values, false );
			$blocks       = self::css_blocks( $device_style->build_css() );
			// A setting that changes which rules print: take the device's CSS whole.
			$changed = count( $blocks ) === count( $previous ) ? array_diff_assoc( $blocks, $previous ) : $blocks;
			if ( $changed ) {
				$css .= '@media screen and (max-width:' . $max_width . 'px ){' . implode( '', $changed ) . '}';
			}
			$previous = $blocks;
		}
		wp_cache_set( $cache_key, $css, 'wcgs_responsive_css', DAY_IN_SECONDS );
		return $css;
	}

	/**
	 * Split CSS into its top-level blocks: rules and whole at-rules such as
	 * `@media … { … }`. Braces in comments and strings are skipped.
	 *
	 * @since 4.0.0
	 * @param string $css CSS.
	 * @return string[]
	 */
	public static function css_blocks( $css ) {
		$blocks = array();
		$depth  = 0;
		$start  = 0;
		$quote  = '';
		$length = strlen( $css );
		for ( $i = 0; $i < $length; $i++ ) {
			$char = $css[ $i ];
			if ( '' !== $quote ) {
				if ( '\\' === $char ) {
					++$i;
				} elseif ( $char === $quote ) {
					$quote = '';
				}
				continue;
			}
			if ( '/' === $char && $i + 1 < $length && '*' === $css[ $i + 1 ] ) {
				$end = strpos( $css, '*/', $i + 2 );
				$i   = false === $end ? $length : $end + 1;
				continue;
			}
			if ( '"' === $char || "'" === $char ) {
				$quote = $char;
			} elseif ( '{' === $char ) {
				++$depth;
			} elseif ( '}' === $char && $depth > 0 ) {
				--$depth;
				if ( 0 === $depth ) {
					$blocks[] = trim( substr( $css, $start, $i - $start + 1 ) );
					$start    = $i + 1;
				}
			}
		}
		return $blocks;
	}

	/**
	 * Wcgs custom css
	 *
	 * @return void
	 */
	public function wcgs_custom_css() {
		// Decoded CSS goes into an inline <style>: break "</" so it can't close the tag.
		self::$additional_css = str_replace( '</', '<\/', trim( html_entity_decode( $this->wcgs_additional_css ) ) );
	}

	/**
	 * The dynamic stylesheet include by this function for frontend.
	 *
	 * @return dynamic_styles.
	 */
	public static function wcgs_stylesheet_include() {
		return self::$dynamic_css . self::$additional_css;
	}
}
