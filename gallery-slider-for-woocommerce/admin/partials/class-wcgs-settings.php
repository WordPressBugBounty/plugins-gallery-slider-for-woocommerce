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

/**
 * WCGS Settings class
 */
class WCGS_Settings {
	/**
	 * Initialize the WooCommerce Settings page for the admin area.
	 *
	 * @since    1.0.0
	 * @param string $prefix Define prefix wcgs_settings.
	 */
	public static function options( $prefix ) {
		WCGS::createOptions(
			$prefix,
			array(
				'framework_title'    => '',
				'framework_class'    => 'wcgs-settings',
				'class'              => 'wcgs-preloader',
				'menu_title'         => esc_html__( 'WooGallery', 'gallery-slider-for-woocommerce' ),
				'menu_slug'          => 'wpgs-settings',
				'menu_icon'          => 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiBmb2N1c2FibGU9ImZhbHNlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIgoJIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI0IDI0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTAsMS45djIwLjFDMCwyMy4xLDAuOSwyNCwxLjksMjRoMjAuMWMxLjEsMCwxLjktMC45LDEuOS0xLjlWMS45QzI0LDAuOSwyMy4xLDAsMjIuMSwwSDEuOUMwLjksMCwwLDAuOSwwLDEuOQoJCXogTTIxLjQsMjIuM0gyLjZjLTAuNSwwLTEtMC40LTEtMVYyLjZjMC0wLjUsMC40LTEsMS0xaDE4LjdjMC41LDAsMSwwLjQsMSwxdjE4LjdDMjIuMywyMS45LDIxLjksMjIuMywyMS40LDIyLjN6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNy45LDE3LjR2Mi44YzAsMC4zLTAuMiwwLjUtMC41LDAuNUgzLjhjLTAuMywwLTAuNS0wLjItMC41LTAuNXYtMi44YzAtMC4zLDAuMi0wLjUsMC41LTAuNWgzLjUKCQlDNy42LDE2LjksNy45LDE3LjEsNy45LDE3LjR6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTQuNSwxNy40djIuOGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLTRjLTAuMywwLTAuNS0wLjItMC41LTAuNXYtMi44YzAtMC4zLDAuMi0wLjUsMC41LTAuNWg0CgkJQzE0LjIsMTYuOSwxNC41LDE3LjEsMTQuNSwxNy40eiIvPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTIwLjYsMTcuNHYyLjhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC0zLjVjLTAuMywwLTAuNS0wLjItMC41LTAuNXYtMi44YzAtMC4zLDAuMi0wLjUsMC41LTAuNWgzLjUKCQlDMjAuNCwxNi45LDIwLjYsMTcuMSwyMC42LDE3LjR6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMy40LDMuOHYxMC45YzAsMC4zLDAuMiwwLjUsMC41LDAuNWgxNi4zYzAuMywwLDAuNS0wLjIsMC41LTAuNVYzLjhjMC0wLjMtMC4yLTAuNS0wLjUtMC41SDMuOAoJCUMzLjYsMy40LDMuNCwzLjYsMy40LDMuOHogTTUuNCwxMi44bDMuOC03YzAuMi0wLjMsMC43LTAuMywwLjgsMGwyLjcsNC45YzAuMiwwLjMsMC43LDAuMywwLjgsMGwwLjQtMC43YzAuMi0wLjMsMC43LTAuMywwLjgsMAoJCWwxLjUsMi43YzAuMiwwLjMtMC4xLDAuNy0wLjQsMC43aC0xMEM1LjUsMTMuNSw1LjMsMTMuMSw1LjQsMTIuOHogTTE2LjgsOS40Yy0xLjIsMC0yLjItMS0yLjItMi4yYzAtMS4yLDEtMi4xLDIuMS0yLjEKCQlDMTgsNSwxOSw2LDE5LDcuMkMxOC45LDguNCwxOCw5LjMsMTYuOCw5LjR6Ii8+CjwvZz4KPC9zdmc+',
				'show_reset_section' => true,
				'show_search'        => false,
				'show_all_options'   => false,
				'theme'              => 'light',
				'show_footer'        => false,
				'sticky_header'      => true,
				'show_sub_menu'      => false,
				'footer_credit'      => sprintf(
					/* translators: 1: start strong tag, 2: close strong tag, 3: span tag start, 4: span tag end, 5: anchor tag start, 6: anchor tag ended. */
					__( 'Enjoying %1$sWooGallery?%2$s Please rate us %3$s★★★★★%4$s %5$sWordPress.org.%6$s Your positive feedback will help us grow more. Thank you! 😊', 'gallery-slider-for-woocommerce' ),
					'<strong>',
					'</strong>',
					'<span class="spwpcp-footer-text-star">',
					'</span>',
					'<a href="https://wordpress.org/support/plugin/gallery-slider-for-woocommerce/reviews/?filter=5#new-post" target="_blank">',
					'</a>'
				),
				'footer_after'       => "<div id='BuyProPopupContent' style='display: none;'>
				<div class='wcgs-popup-content'><div class='pro-image-tag'><span class='pro-icon'><img src='" . plugin_dir_url( __DIR__ ) . 'img/go-pro-icon.svg' . "'></span></div><h2> " . sprintf(
					/* translators: 1: start strong tag, 2: close strong tag. */
					__( 'Upgrade to %1$sWooGallery Pro%2$s', 'gallery-slider-for-woocommerce' ),
					'<strong>',
					'</strong>'
				) . '</h2><h3>' . __( 'To unlock this feature, simply upgrade to Pro!', 'gallery-slider-for-woocommerce' ) . "</h3><p class='wcgs-popup-p'>" . sprintf(
					/* translators: 1: start strong tag, 2: close strong tag. */
					__( 'Take your online shop\'s product page experience to the next level with many premium features and %1$sBoost Sales!%2$s', 'gallery-slider-for-woocommerce' ),
					'<strong>',
					'</strong>'
				) . " 🚀</p><p><a href='" . esc_url( WOO_GALLERY_SLIDER_PRO_LINK ) . "' target='_blank' class='btn'>" . __( 'Upgrade To Pro Now', 'gallery-slider-for-woocommerce' ) . '</a></p></div></div>',
			)
		);

		// <div id="myOnPageContent" style="display: none;"> <div class="wcgs-popup-content">
		// <h2> <Upgrade to <strong>WooGallery Pro</strong></h2>

		// <p> Take your online shop product page experience to the next
		// level ton of premium features and Boost Sales! 🚀</p> <p><a target="_blank" href=' . esc_url( WOO_GALLERY_SLIDER_PRO_LINK ) . ' class="btn">Get the Pro version</a></p></div> </div>
		WCGS_General::section( $prefix );
		WCGS_Gallery::section( $prefix );
		WCGS_Lightbox::section( $prefix );
		WCGSP_Shoppage::section( $prefix );
		WCGS_Advance::section( $prefix );
		WCGS_Help::section( $prefix );
	}
}
