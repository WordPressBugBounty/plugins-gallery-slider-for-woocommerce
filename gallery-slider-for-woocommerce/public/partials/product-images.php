<?php
/**
 * WooCommerce Product Gallery Slider.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/public
 * @author     ShapedPlugin <support@shapedplugin.com>
 * @version    2.0.0
 */

if ( ! class_exists( 'WCGS_Product_Gallery' ) ) {
	/**
	 * WooCommerce Product Gallery Slider.
	 *
	 * The gallery script rebuilds this markup after a variation change
	 * (generateGalleryItemHTML() / generateThumbnailItemHTML()), and the
	 * dashboard's live preview renders it with React
	 * (src/admin/pages/globalSettings/LivePreview/engine/Gallery.jsx): make
	 * markup changes in all three.
	 */
	class WCGS_Product_Gallery {
		/**
		 * Gallery settings
		 *
		 * @var array
		 */
		private $settings;

		/**
		 * Current product
		 *
		 * @var WC_Product
		 */
		private $product;

		/**
		 * Helper functions.
		 *
		 * @var function
		 */
		private $helper;

		/**
		 * Gallery images and videos
		 *
		 * @var array
		 */
		private $gallery_items = array();

		/**
		 * Image_lazy_load
		 *
		 * @var bool
		 */
		private $image_lazy_load = true;

		/**
		 * Constructor
		 */
		public function __construct() {
			$this->product = $this->get_product();
			if ( ! $this->product ) {
				return;
			}
			$this->helper   = new WCGS_Public_Helper();
			$this->settings = Woo_Gallery_Slider_Responsive::to_runtime( get_option( 'wcgs_settings', array() ) );
			$this->assigns_layout();
			// Free features only, also over a layout's values.
			$this->settings = WCGS_Public_Helper::free_settings( $this->settings );
			$this->init();
		}

		/**
		 * Update with Assigned Layout data.
		 *
		 * @return void
		 */
		private function assigns_layout() {
			$assigned_layout = $this->helper->get_assigns_layout( $this->product );
			// Apply first matching layout.
			if ( ! empty( $assigned_layout ) ) {
				$this->apply_assigned_layout( $assigned_layout[0] );
			}
		}

		/**
		 * Apply the assigned layout settings.
		 *
		 * @param int $layout_id Layout post ID.
		 */
		private function apply_assigned_layout( $layout_id ) {
			$assigned_options = get_post_meta( $layout_id, 'wcgs_metabox', true );
			if ( ! empty( $assigned_options ) ) {
				$assigned_options = Woo_Gallery_Slider_Responsive::to_runtime( $assigned_options );
				$this->settings   = Woo_Gallery_Slider_Responsive::from_layout( $this->helper->wp_parse_args_recursive( $assigned_options, $this->settings ), $assigned_options );
			}
		}

		/**
		 * Initialize gallery.
		 */
		private function init() {
			if ( ! $this->product ) {
				return;
			}
			$is_gallery_cache = $this->settings['gallery_cache'] ?? false;
			$transient_key    = false;

			$product_id = $this->product->get_id();
			// A variation preselected in the URL (?attribute_pa_color=blue) renders its own
			// images: don't serve or store that markup as the product's gallery.
			if ( $is_gallery_cache && ! $this->get_selected_attributes() ) {
				// The markup differs on mobile devices (the full gallery width),
				// so cache each device class under its own key.
				$transient_key = Woo_Gallery_Slider_Cache::key( 'wcgs_gallery_html_' . $product_id . ( wp_is_mobile() ? '_m' : '' ) );
				$cached_html   = get_transient( $transient_key );
				// Check if cached HTML exists and return it.
				if ( false !== $cached_html ) {
					echo $cached_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the markup rendered below.
					return;
				}
			}

			$this->prepare_gallery_items();
			$this->render_gallery( $transient_key );
		}

		/**
		 * Get current product
		 *
		 * @return WC_Product|null
		 */
		private function get_product() {
			global $product;
			$product = $product ? $product : wc_get_product( get_the_ID() );
			return $product;
		}

		/**
		 * Prepare gallery items.
		 */
		private function prepare_gallery_items() {
			$this->image_lazy_load = isset( $this->settings['wcgs_image_lazy_load'] ) && 'ondemand' === $this->settings['wcgs_image_lazy_load'];
			$this->product->get_type() === 'variable'
			? $this->handle_variation_gallery() : $this->handle_simple_product_gallery();

			$this->sort_gallery_items();
		}

		/**
		 * Handle variation gallery items.
		 */
		private function handle_variation_gallery() {
			$image_id          = $this->product->get_image_id();
			$default_variation = $this->get_default_variation();
			! empty( $default_variation )
			? $this->add_variation_images( $default_variation )
			: $this->add_default_product_images();
			if ( empty( $this->gallery_items ) ) {
				$this->add_image_to_gallery( $image_id );
			}
		}

		/**
		 * Handle simple product gallery items.
		 */
		private function handle_simple_product_gallery() {
			$image_id = $this->product->get_image_id();
			if ( $this->should_include_featured_image( 'default_gl' ) && $image_id ) {
				$this->add_image_to_gallery( $image_id );
			}
			$this->add_gallery_images();
			if ( empty( $this->gallery_items ) ) {
				$this->add_image_to_gallery( $image_id );
			}
		}

		/**
		 * Add variation images to gallery
		 *
		 * @param array $variation Variation attributes.
		 */
		private function add_variation_images( $variation ) {
			$feature_image_id = $this->product->get_image_id();
			if ( $this->should_include_featured_image( 'variable_gl' ) && $feature_image_id ) {
				$this->add_image_to_gallery( $feature_image_id );
			}
			$_temp_variations = array();
			foreach ( $variation as $key => $value ) {
				$_temp_variations[ 'attribute_' . $key ] = $value;
			}
			$data_store   = WC_Data_Store::load( 'product' );
			$variation_id = $data_store->find_matching_product_variation( $this->product, $_temp_variations );

			if ( $variation_id ) {
				$image_id = get_post_thumbnail_id( $variation_id );
				if ( $image_id ) {
					$this->add_image_to_gallery( $image_id );
				}
				$this->add_variation_gallery_images( $variation_id );
			}
		}

		/**
		 * Add default product images to gallery.
		 */
		private function add_default_product_images() {
			$image_id = $this->product->get_image_id();
			if ( $this->should_include_featured_image( 'default_gl' ) && $image_id ) {
				$this->add_image_to_gallery( $image_id );
			}
			$this->add_gallery_images();
		}

		/**
		 * Remove duplicate images from the gallery items based on their URLs.
		 *
		 * @param array $items Array of gallery items.
		 * @return array Filtered array with unique items based on URLs.
		 */
		private function remove_duplicate_images_by_url( $items ) {
			$unique_items = array();
			$seen_urls    = array();

			foreach ( $items as $item ) {
				if ( empty( $item['url'] ) || in_array( $item['url'], $seen_urls, true ) ) {
					continue;
				}

				$seen_urls[]    = $item['url'];
				$unique_items[] = $item;
			}

			return $unique_items;
		}

		/**
		 * Add image to gallery
		 *
		 * @param int $image_id Image ID.
		 */
		private function add_image_to_gallery( $image_id ) {
			if ( ! $image_id ) {
				return;
			}
			$image_url = wp_get_attachment_url( $image_id );
			if ( empty( $image_url ) ) {
				return;
			}
			$this->gallery_items[] = $this->get_image_data( $image_id );
		}

		/**
		 * Add gallery images.
		 */
		private function add_gallery_images() {
			$attachment_ids = $this->helper->gallery_image_ids( $this->product, $this->settings );
			foreach ( $attachment_ids as $attachment_id ) {
				$this->add_image_to_gallery( $attachment_id );
			}
		}

		/**
		 * Add variation gallery images: all images of the variation's gallery.
		 *
		 * @param int $variation_id Variation ID.
		 */
		private function add_variation_gallery_images( $variation_id ) {
			$gallery_ids = WCGS_Public_Helper::variation_gallery_ids( $variation_id );
			foreach ( $gallery_ids as $gallery_id ) {
				$this->add_image_to_gallery( $gallery_id );
			}
		}

		/**
		 * Get image data.
		 *
		 * @param int $image_id Image ID.
		 * @return array
		 */
		private function get_image_data( $image_id ) {
			$image_meta_handler = new WCGS_Public_Image( $this->settings );
			return $image_meta_handler->get_image_meta( $image_id );
		}

		/**
		 * Sort gallery items.
		 */
		private function sort_gallery_items() {
			$this->gallery_items = $this->remove_duplicate_images_by_url( $this->gallery_items );
			if ( 'in_gallery' !== $this->helper->video_presentation( $this->settings ) ) {
				// With the video gallery off, the video images show as plain images.
				foreach ( $this->gallery_items as $index => $item ) {
					unset( $this->gallery_items[ $index ]['video'] );
				}
				return;
			}
			// Sort videos last based on settings.
			if ( isset( $this->settings['video_order'] ) && 'video_come_last' === $this->settings['video_order'] ) {
				usort( $this->gallery_items, array( $this, 'sort_videos_last' ) );
			}
		}

		/**
		 * Sort callback to put videos last.
		 *
		 * @param  array $a List.
		 * @param  array $b List.
		 * @return array
		 */
		private function sort_videos_last( $a, $b ) {
			return ( isset( $a['video'] ) ? 1 : 0 ) - ( isset( $b['video'] ) ? 1 : 0 );
		}

		/**
		 * Render gallery HTML.
		 *
		 * @param  mixed $transient_key Transient key/false.
		 * @return void
		 */
		private function render_gallery( $transient_key ) {
			// Generate the gallery HTML.
			$gallery_class = $this->get_gallery_classes();
			$slider_dir    = $this->get_slider_direction();

			ob_start();
			do_action( 'sp_woo_gallery_slider_before_container' );
			$this->render_gallery_container( $gallery_class, $slider_dir );
			do_action( 'sp_woo_gallery_slider_after_container' );
			$html = ob_get_clean();
			$html = $this->helper->minify_output( $html );
			// Store the HTML in a transient.
			if ( $transient_key ) {
				set_transient( $transient_key, $html, WOO_GALLERY_SLIDER_TRANSIENT_EXPIRATION );
			}
			echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped while rendering.
		}

		/**
		 * Render gallery container
		 *
		 * @param string $gallery_class Gallery CSS classes.
		 * @param string $slider_dir Slider direction attribute.
		 */
		public function render_gallery_container( $gallery_class, $slider_dir ) {
			$gallery_width = ! empty( $this->settings['gallery_width'] ) ? $this->settings['gallery_width'] : 50;
			if ( wp_is_mobile() ) {
				$gallery_width = 100;
			}
			?>
		<div id="wpgs-gallery" <?php echo esc_attr( $slider_dir ); ?> class="wcgs-woocommerce-product-gallery <?php echo esc_attr( $gallery_class ); ?>" style="max-width: <?php echo esc_attr( $gallery_width ); ?>%; overflow: hidden;" data-id="<?php echo esc_attr( $this->product->get_id() ); ?>">
			<?php
			$this->maybe_render_thumbnails();
			$this->render_main_gallery();
			$this->maybe_render_preloader();
			?>
		</div>
			<?php
		}

		/**
		 * Render thumbnails unless the layout hides them.
		 */
		private function maybe_render_thumbnails() {
			if ( 'hide_thumb' !== ( $this->settings['gallery_layout'] ?? 'horizontal' ) ) {
				$this->render_thumbnails();
			}
		}

		/**
		 * Render thumbnails.
		 */
		private function render_thumbnails() {
			$thumbnailnavigation_style = ! empty( $this->settings['thumbnailnavigation_style'] ) ? $this->settings['thumbnailnavigation_style'] : 'custom';
			$thumb_nav_style_attr      = ' thumbnailnavigation-' . $thumbnailnavigation_style;
			$thumb_nav_visibility      = $this->settings['thumb_nav_visibility'] ?? 'hover';
			?>
		<div class="gallery-navigation-carousel-wrapper <?php echo esc_attr( $this->get_gallery_layout_class() ); ?>">
			<div thumbsSlider="" class="gallery-navigation-carousel spswiper <?php echo esc_attr( $this->get_gallery_layout_class() . $thumb_nav_style_attr ); ?> <?php echo esc_attr( $thumb_nav_visibility ); ?>">
				<div class="spswiper-wrapper">
					<?php
					foreach ( $this->gallery_items as $item ) {
						if ( ! isset( $item['url'] ) ) {
							continue;
						}
						$this->render_thumbnail( $item );
					}
					?>
				</div>
					<?php $this->render_thumbnail_navigation(); ?>
			</div>
			<div class="wcgs-border-bottom"></div>
		</div>
			<?php
		}

		/**
		 * Render thumbnail
		 *
		 * @param array $item Gallery item data.
		 */
		private function render_thumbnail( $item ) {
			$image_attributes = array(
				'class'      => 'skip-lazy wcgs-thumb-image',
				'alt'        => $item['alt_text'],
				'src'        => $item['thumb_url'],
				'height'     => $item['thumbHeight'],
				'width'      => $item['thumbWidth'],
				'data-cap'   => $item['cap'],
				'data-image' => $item['full_url'],
			);

			if ( ! empty( $item['video'] ) ) {
				$this->add_video_attributes( $image_attributes, $item );
			}
			?>
	<div class="wcgs-thumb spswiper-slide">
		<img <?php echo $this->build_attributes_string( $image_attributes ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in build_attributes_string(). ?> <?php echo $this->get_lazy_load_attribute(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	</div>
			<?php
		}

		/**
		 * Add video-specific attributes to image.
		 *
		 * @param array $attributes Image attributes array.
		 * @param array $item Gallery item data.
		 */
		private function add_video_attributes( &$attributes, $item ) {
			$video_url = wp_parse_url( $item['video'] );
			if ( ! $video_url || empty( $video_url['host'] ) ) {
				$video_url = array( 'host' => '' );
			}

			$video_host                  = $video_url['host'];
			$attributes['data-videosrc'] = $item['video'];
			if ( strpos( $video_host, 'youtu' ) !== false ) {
				$video_id                   = $this->get_youtube_video_id( $item['video'] );
				$attributes['data-type']    = 'youtube';
				$attributes['data-videoid'] = $video_id;
			} elseif ( strpos( $video_host, 'vimeo' ) !== false ) {
				$video_id                   = substr( wp_parse_url( $item['video'], PHP_URL_PATH ), 1 );
				$attributes['data-type']    = 'vimeo';
				$attributes['data-videoid'] = $video_id;
			} elseif ( strpos( $video_host, 'dailymotion' ) !== false ) {
				$attributes['data-type'] = 'dailymotion';
			} elseif ( strpos( $video_host, 'facebook' ) !== false ) {
				$attributes['data-type'] = 'facebook';
			} elseif ( strpos( $video_host, 'mediadelivery' ) !== false ) {
				$attributes['data-type'] = 'iframe';
			} else {
				$attributes['data-type']        = 'html5video';
				$attributes['data-videomp4']    = $item['video'];
				$attributes['data-description'] = 'Html5 Video Description';
			}
		}

		/**
		 * Build HTML attributes string from array.
		 *
		 * @param array $attributes Array of attribute key/value pairs.
		 * @return string
		 */
		private function build_attributes_string( $attributes ) {
			$html = '';
			foreach ( $attributes as $key => $value ) {
				if ( ! empty( $value ) ) {
					$html .= sprintf( ' %s="%s"', esc_attr( $key ), esc_attr( $value ) );
				}
			}
			return $html;
		}

		/**
		 * Render thumbnail navigation.
		 */
		private function render_thumbnail_navigation() {
			if ( ! empty( $this->settings['thumbnailnavigation'] ) ) {
				?>
			<div class="wcgs-spswiper-button-next wcgs-spswiper-arrow sp-wgsp-icon-right-open-3"></div>
			<div class="wcgs-spswiper-button-prev wcgs-spswiper-arrow sp-wgsp-icon-left-open-4"></div>
				<?php
			}
		}

		/**
		 * Render main gallery.
		 *
		 * @return void
		 */
		private function render_main_gallery() {
			?>
	<div class="wcgs-carousel <?php echo esc_attr( $this->get_carousel_classes() ); ?>">
		<div class="spswiper-wrapper">
			<?php
			array_walk( $this->gallery_items, array( $this, 'render_gallery_item' ) );
			?>
		</div>
			<?php
			$this->render_navigation();
			$this->maybe_render_pagination();
			?>
	</div>
			<?php
		}

		/**
		 * Render gallery item
		 *
		 * @param array $item Gallery item data.
		 * @param int   $index Item index.
		 */
		public function render_gallery_item( $item, $index ) {
			if ( ! isset( $item['url'] ) ) {
				return;
			}
			$control_id = 'wcgs-control-item' . $index;
			?>
		<div class="spswiper-slide" id="<?php echo esc_attr( $control_id ); ?>">
			<?php
			if ( isset( $item['video'] ) ) {
				$this->render_video_item( $item, $index );
			} else {
				$this->render_image_item( $item, $index );
			}
			?>
		</div>
			<?php
		}

		/**
		 * Render video item.
		 *
		 * @param array $item  Video item data.
		 * @param int   $index Item index.
		 */
		private function render_video_item( $item, $index = '' ) {
			$video             = $item['video'];
			$poster_img        = $item['url'];
			$video_url         = wp_parse_url( $video );
			$video_host        = ! empty( $video_url['host'] ) ? $video_url['host'] : '';
			$video_popup_place = $this->settings['video_popup_place'] ?? 'popup';
			$fetchpriority     = 0 === $index ? 'fetchpriority="high"' : '';
			// In popup mode the card shows its image (not zoomed: a click opens the
			// video). With the lightbox off, its play icon opens the video on its
			// own, from these attributes.
			$popup_attributes = '';
			if ( $video_url && 'inline' !== $video_popup_place ) {
				$popup_attributes = ' data-video-popup="' . esc_url( $this->get_video_embed_link( $video, $video_host ) ) . '" data-video-type="' . esc_attr( $this->get_video_popup_type( $video_host ) ) . '"';
			}
			?>
	<div class="wcgs-slider-image video"<?php echo $popup_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above. ?>>
			<?php
			if ( $video_url ) {
				// The lightbox opens at the video: its icon, the image and the play
				// icon all click this anchor (as in 3.x).
				if ( ! empty( $this->settings['lightbox'] ) ) {
					$this->render_video_lightbox( $item, $video, $video_host );
				}
				if ( 'inline' === $video_popup_place ) {
					echo '<div class="wcgs-iframe-wrapper">';
					$this->render_inline_video( $video, $video_host, $poster_img );
					$this->render_video_icon( $video_host );
					$this->render_video_thumbnail( $item, true, $fetchpriority );
					if ( false === strpos( $video_host, 'facebook' ) ) {
						echo '<div class="wcgs-touch-layer"></div>';
					}
					echo '</div>';
				} else {
					$this->render_video_icon( $video_host );
					$this->render_video_thumbnail( $item, false, $fetchpriority );
				}
			}
			$this->maybe_render_caption( $item );
			?>
		</div>
			<?php
		}

		/**
		 * Fancybox type of a popup video: `iframe` for the hosts Fancybox cannot
		 * detect, else empty (YouTube, Vimeo and video files are detected).
		 *
		 * @since 4.0.0
		 * @param string $video_host Video host domain.
		 * @return string
		 */
		private function get_video_popup_type( $video_host ) {
			foreach ( array( 'facebook', 'dailymotion', 'wistia', 'sproutvideo', 'mediadelivery' ) as $host ) {
				if ( false !== strpos( $video_host, $host ) ) {
					return 'iframe';
				}
			}
			return '';
		}

		/**
		 * Accessible title of a video iframe, e.g. "Vimeo video".
		 *
		 * @since 4.0.0
		 * @param string $host Video host name, shown as is.
		 * @return string
		 */
		private function video_title( $host ) {
			/* translators: %s: video host name, e.g. Vimeo. */
			return sprintf( __( '%s video', 'gallery-slider-for-woocommerce' ), $host );
		}

		/**
		 * Render the lightbox anchor of a video card: the lightbox shows the
		 * video, in the gallery's order.
		 *
		 * @since 4.0.0
		 * @param array  $item       Gallery item data.
		 * @param string $video      Video URL.
		 * @param string $video_host Video host domain.
		 * @return void
		 */
		private function render_video_lightbox( $item, $video, $video_host ) {
			$type = $this->get_video_popup_type( $video_host );
			?>
			<a class="wcgs-slider-lightbox" aria-label="<?php esc_attr_e( 'Open lightbox', 'gallery-slider-for-woocommerce' ); ?>" data-caption="<?php echo esc_attr( $item['cap'] ); ?>" data-fancybox="view" href="<?php echo esc_url( $this->get_video_embed_link( $video, $video_host ) ); ?>" data-thumb="<?php echo esc_url( $item['thumb_url'] ?? $item['url'] ); ?>"<?php echo '' !== $type ? ' data-type="' . esc_attr( $type ) . '"' : ''; ?>>
				<div class="wcgs-lightbox grid-lightbox <?php echo esc_attr( $this->settings['lightbox_icon_position'] ?? 'top_right' ); ?>" data-caption="<?php echo esc_attr( $item['cap'] ); ?>"><span class="sp-wgsp-icon-<?php echo esc_attr( $this->get_lightbox_icon() ); ?>"></span></div>
			</a>
			<?php
		}

		/**
		 * Render the lightbox anchor of an image.
		 *
		 * @since 4.0.0
		 * @param array $item Gallery item data.
		 * @return void
		 */
		private function render_image_lightbox( $item ) {
			?>
			<a class="wcgs-slider-lightbox" aria-label="<?php esc_attr_e( 'Open lightbox', 'gallery-slider-for-woocommerce' ); ?>" data-caption="<?php echo esc_attr( $item['cap'] ); ?>" data-fancybox="view" href="<?php echo esc_url( $item['full_url'] ); ?>" data-thumb="<?php echo esc_url( $item['thumb_url'] ?? $item['url'] ); ?>">
				<div class="wcgs-lightbox grid-lightbox <?php echo esc_attr( $this->settings['lightbox_icon_position'] ?? 'top_right' ); ?>" data-caption="<?php echo esc_attr( $item['cap'] ); ?>"><span class="sp-wgsp-icon-<?php echo esc_attr( $this->get_lightbox_icon() ); ?>"></span></div>
			</a>
			<?php
		}

		/**
		 * Render inline video: a placeholder the gallery script turns into the
		 * player when the play icon is clicked.
		 *
		 * @param string $video      Video URL.
		 * @param string $video_host Video host domain.
		 * @param string $poster_img Poster image URL.
		 */
		private function render_inline_video( $video, $video_host, $poster_img = '' ) {
			$lazy_load = $this->get_lazy_load_attribute();
			if ( strpos( $video_host, 'youtu' ) !== false ) {
				$video_id = $this->get_youtube_video_id( $video );
				?>
		<div class="skip-lazy wcgs-iframe wcgs-youtube-video" data-video-id="<?php echo esc_attr( $video_id ); ?>" data-src="<?php echo esc_url( $video ); ?>"></div>
				<?php
			} elseif ( strpos( $video_host, 'vimeo' ) !== false ) {
				$video_id = substr( wp_parse_url( $video, PHP_URL_PATH ), 1 );
				// Support vimeo unlisted video.
				$video_url = strpos( $video_id, '/' ) !== false
					? 'https://player.vimeo.com/video/' . str_replace( '/', '?h=', $video_id ) . '&autoplay=0&controls=1&loop=0'
					: 'https://player.vimeo.com/video/' . $video_id . '?autoplay=0&controls=1&loop=0';
				?>
		<div class="skip-lazy wcgs-iframe" data-title="<?php echo esc_attr( $this->video_title( 'Vimeo' ) ); ?>" data-width="600" data-height="400" data-src="<?php echo esc_url( $video_url ); ?>" data-frameborder="0" data-allow="autoplay; fullscreen" allowfullscreen <?php echo $lazy_load; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> ></div>
				<?php
			} elseif ( strpos( $video_host, 'dailymotion' ) !== false ) {
				$video = $this->generateDailymotionEmbedURL( $video );
				?>
		<div class="skip-lazy wcgs-iframe" data-title="<?php echo esc_attr( $this->video_title( 'Dailymotion' ) ); ?>" data-width="560" data-height="400" data-src="<?php echo esc_url( $video ); ?>?autoplay=1&mute=1" data-frameborder="0" data-allow="autoplay; fullscreen" allowfullscreen <?php echo $lazy_load; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> ></div>
				<?php
			} elseif ( strpos( $video_host, 'facebook' ) !== false ) {
				?>
		<div class="skip-lazy wcgs-iframe facebook-iframe" data-title="<?php echo esc_attr( $this->video_title( 'Facebook' ) ); ?>" data-width="560" data-height="400" data-frameborder="0" data-allow="autoplay; fullscreen" data-src="<?php echo esc_url( $video ); ?>" allowfullscreen <?php echo $lazy_load; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> ></div>
				<?php
			} elseif ( strpos( $video_host, 'wistia' ) !== false ) {
				?>
		<div class="skip-lazy wcgs-iframe wistia-iframe" data-title="<?php echo esc_attr( $this->video_title( 'Wistia' ) ); ?>" data-width="560" data-height="400" data-frameborder="0" data-allow="autoplay; fullscreen" data-src="<?php echo esc_url( $video ); ?>" allowfullscreen <?php echo $lazy_load; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> ></div>
				<?php
			} elseif ( strpos( $video_host, 'mediadelivery' ) !== false ) {
				$video = str_replace( '/play/', '/embed/', $video );
				?>
		<div class="skip-lazy wcgs-iframe wcgs-bunny-iframe" data-title="<?php echo esc_attr( $this->video_title( 'Bunny Stream' ) ); ?>" data-width="560" data-height="400" data-frameborder="0" data-allow="autoplay" data-src="<?php echo esc_url( $video ); ?>" allowfullscreen <?php echo $lazy_load; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> ></div>
				<?php
			} elseif ( strpos( $video_host, 'sproutvideo' ) !== false ) {
				?>
		<div class="skip-lazy wcgs-iframe sproutvideo-iframe" data-title="<?php echo esc_attr( $this->video_title( 'SproutVideo' ) ); ?>" data-width="560" data-height="400" data-frameborder="0" data-allow="autoplay; fullscreen" data-src="<?php echo esc_url( $video ); ?>" allowfullscreen <?php echo $lazy_load; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> ></div>
				<?php
			} else {
				// Self-hosted video.
				?>
		<div class="wcgs-video-self-hosted">
			<video playsinline preload="auto" class="video-js" poster="<?php echo esc_url( $poster_img ); ?>" controls <?php echo $lazy_load; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> data-setup="{}">
				<source src="<?php echo esc_url( $video ); ?>" type="video/mp4">
			</video>
		</div>
				<?php
			}
		}

		/**
		 * Render video thumbnail. The image never zooms: a click opens the video.
		 *
		 * @param array  $item          Video item data.
		 * @param bool   $inline        Whether the video plays inline (the image is its poster).
		 * @param string $fetchpriority Fetch priority attribute.
		 */
		private function render_video_thumbnail( $item, $inline = false, $fetchpriority = '' ) {
			$sizes = 'sizes="(max-width: 520px) 400px, (max-width: 768px) 600px, 600px"';
			?>
	<img class="skip-lazy wcgs-slider-image-tag wcgs-lazyloaded" alt="<?php echo esc_attr( $item['alt_text'] ); ?>" data-cap="<?php echo esc_attr( $item['cap'] ); ?>" data-videosrc="<?php echo esc_attr( $item['video'] ); ?>" data-image-src="<?php echo esc_url( $item['url'] ); ?>" src="<?php echo esc_url( $item['url'] ); ?>" data-image="<?php echo esc_url( $item['full_url'] ); ?>" height="<?php echo esc_attr( $item['imageHeight'] ); ?>" width="<?php echo esc_attr( $item['imageWidth'] ); ?>" <?php echo $this->get_image_srcset( $item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in get_image_srcset(). ?> <?php echo $this->get_lazy_load_attribute(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo $sizes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo $fetchpriority; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo $inline ? 'style="visibility: hidden"' : ''; ?>
		/>
			<?php
		}

		/**
		 * The srcset attribute of a main image, for the Product Image Size.
		 *
		 * @since 4.0.0
		 * @param array $item Gallery item data.
		 * @return string
		 */
		private function get_image_srcset( $item ) {
			$image_size = isset( $this->settings['image_sizes'] ) ? $this->settings['image_sizes'] : 'woocommerce_single';
			return 'srcset="' . esc_attr( (string) wp_get_attachment_image_srcset( $item['image_id'], $image_size ) ) . '"';
		}

		/**
		 * Get video embed link
		 *
		 * @param string $video Video URL.
		 * @param string $video_host Video host domain.
		 * @return string
		 */
		private function get_video_embed_link( $video, $video_host ) {
			if ( strpos( $video_host, 'youtu' ) !== false ) {
				$video_id = $this->get_youtube_video_id( $video );
				return "https://www.youtube.com/embed/{$video_id}";
			}
			if ( strpos( $video_host, 'dailymotion' ) !== false ) {
				return $this->generateDailymotionEmbedURL( $video );
			}
			if ( strpos( $video_host, 'mediadelivery' ) !== false ) {
				return str_replace( '/play/', '/embed/', $video );
			}
			return $video; // Return original URL for other cases (e.g., self-hosted or Facebook).
		}

		/**
		 * Generate Dailymotion EmbedURL
		 *
		 * @param  string $url Video URL.
		 * @return mixed Embed URL/false.
		 */
		private function generateDailymotionEmbedURL( $url ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
			if ( preg_match( '/(?:dailymotion\.com\/video\/|player\.html\?video=|embed\/video\/)([a-zA-Z0-9]+)/', $url, $matches ) ) {
				return 'https://www.dailymotion.com/embed/video/' . $matches[1];
			}
			return false;
		}

		/**
		 * Get YouTube video ID
		 *
		 * @param string $url YouTube video URL.
		 * @return string
		 */
		private function get_youtube_video_id( $url ) {
			// Replace 'shorts/' with 'watch?v=' to support youtube shorts.
			$url = str_replace( 'shorts/', 'watch?v=', $url );
			if ( strpos( $url, 'youtu.be' ) !== false ) {
				return basename( wp_parse_url( $url, PHP_URL_PATH ) );
			}
			$query = wp_parse_url( $url, PHP_URL_QUERY );
			if ( ! empty( $query ) ) {
				parse_str( $query, $params );
				return isset( $params['v'] ) ? $params['v'] : '';
			}
			return '';
		}

		/**
		 * Get lazy load attribute
		 *
		 * @return string
		 */
		private function get_lazy_load_attribute() {
			return $this->image_lazy_load ? 'loading="lazy"' : '';
		}

		/**
		 * Get lightbox icon
		 *
		 * @return string
		 */
		private function get_lightbox_icon() {
			$icon_mapping = array(
				'search-plus' => 'zoom-in-1',
			);

			$icon = $this->settings['lightbox_icon'] ?? 'search';
			return $icon_mapping[ $icon ] ?? $icon;
		}

		/**
		 * Maybe render caption
		 *
		 * @param array $item Gallery item data.
		 */
		private function maybe_render_caption( $item ) {
			if ( ! empty( $item['cap'] ) && ! empty( $this->settings['show_caption'] ) ) {
				?>
		<div class="wcgs-slider-image-caption">
			<span><?php echo esc_html( $item['cap'] ); ?></span>
		</div>
				<?php
			}
		}

		/**
		 * Render video icon: the play icon in the middle of the image.
		 *
		 * @param string $video_host The video host.
		 * @return void
		 */
		private function render_video_icon( $video_host ) {
			$video_icon_type = isset( $this->settings['video_icon'] ) ? $this->settings['video_icon'] : 'play-01';
			$video_icon      = '<i class="wcgs-video-icon sp-wgsp-icon-' . esc_attr( $video_icon_type ) . '"></i>';
			if ( 'native' === $video_icon_type ) {
				$video_icon_map = array(
					'vimeo'       => '<i class="sp-wgsp-icon-vimeo wcgs-video-icon"></i>',
					'facebook'    => '<i class="sp-wgsp-icon-facebook-circled wcgs-video-icon"></i>',
					'youtu'       => '<i class="sp-wgsp-icon-youtube-play wcgs-video-icon"></i>',
					'dailymotion' => '<i class="sp-wgsp-icon-dailymotion wcgs-video-icon"></i>',
				);
				$video_icon     = '<i class="wcgs-video-icon sp-wgsp-icon-play-01"></i>';
				foreach ( $video_icon_map as $host => $icon ) {
					if ( strpos( $video_host, $host ) !== false ) {
						$video_icon = $icon;
						break;
					}
				}
			}
			?>
		<div class="wcgs-video-icon-wrapper middle">
			<?php echo $video_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above. ?>
		</div>
			<?php
		}

		/**
		 * Render image item.
		 *
		 * @param array $item  Image item data.
		 * @param int   $index Item index.
		 */
		private function render_image_item( $item, $index = '' ) {
			$sizes         = 'sizes="(max-width: 520px) 400px, (max-width: 768px) 600px, 600px"';
			$fetchpriority = 0 === $index ? 'fetchpriority="high"' : '';
			?>
		<div class="wcgs-slider-image">
			<?php
			if ( ! empty( $this->settings['lightbox'] ) ) {
				$this->render_image_lightbox( $item );
			}
			?>
			<img class="skip-lazy wcgs-slider-image-tag wcgs_xzoom wcgs-lazyloaded" alt="<?php echo esc_attr( $item['alt_text'] ); ?>" data-cap="<?php echo esc_attr( $item['cap'] ); ?>" src="<?php echo esc_url( $item['url'] ); ?>" data-image="<?php echo esc_url( $item['full_url'] ); ?>" xoriginal="<?php echo esc_url( $item['full_url'] ); ?>" height="<?php echo esc_attr( $item['imageHeight'] ); ?>" width="<?php echo esc_attr( $item['imageWidth'] ); ?>" <?php echo $this->get_image_srcset( $item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in get_image_srcset(). ?> <?php echo $fetchpriority; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo $this->get_lazy_load_attribute(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo $sizes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> />
			<?php $this->maybe_render_caption( $item ); ?>
		</div>
			<?php
		}

		/**
		 * Render navigation
		 */
		private function render_navigation() {
			if ( ! empty( $this->settings['navigation'] ) ) {
				?>
			<div class="wcgs-spswiper-button-next wcgs-spswiper-arrow" tabindex="0" role="button" aria-label="<?php esc_attr_e( 'Next slide', 'gallery-slider-for-woocommerce' ); ?>" ></div>
			<div class="wcgs-spswiper-button-prev wcgs-spswiper-arrow" tabindex="0" role="button" aria-label="<?php esc_attr_e( 'Previous slide', 'gallery-slider-for-woocommerce' ); ?>" ></div>
				<?php
			}
		}

		/**
		 * Render preloader if enabled.
		 */
		private function maybe_render_preloader() {
			if ( ! empty( $this->settings['preloader'] ) ) {
				?>
			<div class="wcgs-gallery-preloader" style="opacity: 1; z-index: 9999;"></div>
				<?php
			}
		}

		/**
		 * Render pagination if enabled.
		 */
		private function maybe_render_pagination() {
			if ( ! empty( $this->settings['pagination'] ) ) {
				$pagination_type = ! empty( $this->settings['pagination_type'] ) ? $this->settings['pagination_type'] : 'bullets';
				?>
		<div class="spswiper-pagination <?php echo esc_attr( $pagination_type ); ?>"></div>
				<?php
			}
		}

		/**
		 * Get gallery classes.
		 *
		 * @return string
		 */
		private function get_gallery_classes() {
			$classes         = array( 'wcgs-spswiper-before-init' );
			$classes[]       = $this->get_gallery_layout_class();
			$preloader_style = ! empty( $this->settings['preloader_style'] ) ? $this->settings['preloader_style'] : 'normal';
			if ( ! empty( $this->settings['preloader'] ) ) {
				$classes[] = 'wcgs_preloader_' . $preloader_style;
			}
			return implode( ' ', $classes );
		}

		/**
		 * Get gallery layout class: thumbnails beside the image (`vertical`) or
		 * above or below it (`horizontal`; their side is set in the CSS).
		 *
		 * @return string
		 */
		private function get_gallery_layout_class() {
			return in_array( $this->settings['gallery_layout'] ?? 'horizontal', array( 'vertical', 'vertical_right' ), true ) ? 'vertical' : 'horizontal';
		}

		/**
		 * Get slider direction.
		 *
		 * @return string
		 */
		private function get_slider_direction() {
			return ( ! empty( $this->settings['slider_dir'] ) || is_rtl() ) ? 'dir=rtl' : '';
		}

		/**
		 * Get carousel classes.
		 *
		 * @return string
		 */
		private function get_carousel_classes() {
			$classes = array(
				$this->settings['navigation_position'] ?? 'center_center',
				$this->settings['zoom_type'] ?? 'in_side',
				$this->settings['slide_orientation'] ?? 'horizontal',
				'wcgs_xzoom_wrapper',
				'spswiper spswiper-container',
			);

			return implode( ' ', array_filter( $classes ) );
		}

		/**
		 * Get default variation
		 *
		 * @return array
		 */
		private function get_default_variation() {
			$default_attrs = $this->product->get_default_attributes();
			$slug_attr     = apply_filters( 'sp_woo_gallery_slider_use_slug_attr', true );
			if ( $slug_attr ) {
				$selected_attrs = $this->get_selected_attributes();
				if ( ! empty( $selected_attrs ) ) {
					return $selected_attrs;
				}
			}

			return $default_attrs;
		}

		/**
		 * Get selected attributes from request
		 *
		 * @return array
		 */
		private function get_selected_attributes() {
			$selected   = array();
			$attributes = $this->product->get_attributes();
			foreach ( $attributes as $attribute_name => $options ) {
				$key = 'attribute_' . sanitize_title( $attribute_name );
				if ( isset( $_REQUEST[ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- a read-only pre-selection, as WooCommerce does.
					$selected[ $attribute_name ] = wc_clean( wp_unslash( $_REQUEST[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				}
			}
			return $selected;
		}

		/**
		 * Check if featured image should be included.
		 *
		 * @param string $context Context for inclusion check.
		 * @return bool
		 */
		private function should_include_featured_image( $context ) {
			$include_feature_image = $this->settings['include_feature_image_to_gallery'] ?? array( 'default_gl' );
			return is_array( $include_feature_image ) ? in_array( $context, $include_feature_image, true ) : $include_feature_image === $context;
		}
	}
}
// Initialize gallery.
new WCGS_Product_Gallery();
