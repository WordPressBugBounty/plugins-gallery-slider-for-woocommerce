<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/admin
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}  // if direct access.

/**
 * Woo_Gallery_Slider_Admin
 */
class Woo_Gallery_Slider_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Images of a variation gallery the free version shows and edits.
	 *
	 * @since 4.0.0
	 * @var int
	 */
	const VARIATION_GALLERY_LIMIT = 2;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string $plugin_name       The name of this plugin.
	 * @param      string $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
		// Before the menu access check, so the old settings and layout pages can redirect.
		add_action( 'admin_menu', array( $this, 'redirect_legacy_pages' ), 1 );
		add_action( 'admin_menu', array( $this, 'admin_menu' ), 10 );
		// After the Dashboard submenu (priority 11) exists.
		add_action( 'admin_menu', array( $this, 'remove_parent_submenu' ), 99 );
	}

	/**
	 * Send the settings, layout and Get Help pages of 3.x to their place in
	 * the dashboard, so old bookmarks and links keep working.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function redirect_legacy_pages() {
		global $pagenow;
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- read-only routing.
		$page      = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		$post_type = isset( $_GET['post_type'] ) ? sanitize_key( wp_unslash( $_GET['post_type'] ) ) : '';
		$post_id   = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
		$action    = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : '';
		// phpcs:enable

		$route = null;
		if ( 'admin.php' === $pagenow && 'wpgs-settings' === $page ) {
			$route = 'global';
		} elseif ( 'admin.php' === $pagenow && 'wpgs-help' === $page ) {
			$route = 'global';
		} elseif ( 'admin.php' === $pagenow && 'assign_layout' === $page ) {
			$route = 'layouts';
		} elseif ( 'edit.php' === $pagenow && 'wcgs_layouts' === $post_type ) {
			$route = 'layouts';
		} elseif ( 'post-new.php' === $pagenow && 'wcgs_layouts' === $post_type ) {
			// Free has one layout: with one already there, the list explains the limit.
			$route = Woo_Gallery_Slider_Layouts_API::count_layouts() > 0 ? 'layouts' : 'layouts/new';
		} elseif ( 'post.php' === $pagenow && 'edit' === $action && $post_id && 'wcgs_layouts' === get_post_type( $post_id ) ) {
			$route = 'layouts/' . $post_id;
		}

		if ( null !== $route && current_user_can( apply_filters( 'wcgs_ui_permission', 'manage_options' ) ) ) {
			wp_safe_redirect( Woo_Gallery_Slider_Dashboard::url( $route ) );
			exit;
		}
	}

	/**
	 * Add menu items.
	 */
	public function admin_menu() {
		$capability = apply_filters( 'wcgs_ui_permission', 'manage_options' );
		$menu_icon  = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiBmb2N1c2FibGU9ImZhbHNlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIgoJIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI0IDI0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTAsMS45djIwLjFDMCwyMy4xLDAuOSwyNCwxLjksMjRoMjAuMWMxLjEsMCwxLjktMC45LDEuOS0xLjlWMS45QzI0LDAuOSwyMy4xLDAsMjIuMSwwSDEuOUMwLjksMCwwLDAuOSwwLDEuOQoJCXogTTIxLjQsMjIuM0gyLjZjLTAuNSwwLTEtMC40LTEtMVYyLjZjMC0wLjUsMC40LTEsMS0xaDE4LjdjMC41LDAsMSwwLjQsMSwxdjE4LjdDMjIuMywyMS45LDIxLjksMjIuMywyMS40LDIyLjN6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNy45LDE3LjR2Mi44YzAsMC4zLTAuMiwwLjUtMC41LDAuNUgzLjhjLTAuMywwLTAuNS0wLjItMC41LTAuNXYtMi44YzAtMC4zLDAuMi0wLjUsMC41LTAuNWgzLjUKCQlDNy42LDE2LjksNy45LDE3LjEsNy45LDE3LjR6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTQuNSwxNy40djIuOGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLTRjLTAuMywwLTAuNS0wLjItMC41LTAuNXYtMi44YzAtMC4zLDAuMi0wLjUsMC41LTAuNWg0CgkJQzE0LjIsMTYuOSwxNC41LDE3LjEsMTQuNSwxNy40eiIvPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTIwLjYsMTcuNHYyLjhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC0zLjVjLTAuMywwLTAuNS0wLjItMC41LTAuNXYtMi44YzAtMC4zLDAuMi0wLjUsMC41LTAuNWgzLjUKCQlDMjAuNCwxNi45LDIwLjYsMTcuMSwyMC42LDE3LjR6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMy40LDMuOHYxMC45YzAsMC4zLDAuMiwwLjUsMC41LDAuNWgxNi4zYzAuMywwLDAuNS0wLjIsMC41LTAuNVYzLjhjMC0wLjMtMC4yLTAuNS0wLjUtMC41SDMuOAoJCUMzLjYsMy40LDMuNCwzLjYsMy40LDMuOHogTTUuNCwxMi44bDMuOC03YzAuMi0wLjMsMC43LTAuMywwLjgsMGwyLjcsNC45YzAuMiwwLjMsMC43LDAuMywwLjgsMGwwLjQtMC43YzAuMi0wLjMsMC43LTAuMywwLjgsMAoJCWwxLjUsMi43YzAuMiwwLjMtMC4xLDAuNy0wLjQsMC43aC0xMEM1LjUsMTMuNSw1LjMsMTMuMSw1LjQsMTIuOHogTTE2LjgsOS40Yy0xLjIsMC0yLjItMS0yLjItMi4yYzAtMS4yLDEtMi4xLDIuMS0yLjEKCQlDMTgsNSwxOSw2LDE5LDcuMkMxOC45LDguNCwxOCw5LjMsMTYuOCw5LjR6Ii8+CjwvZz4KPC9zdmc+';
		add_menu_page( __( 'Product Gallery', 'gallery-slider-for-woocommerce' ), __( 'Product Gallery', 'gallery-slider-for-woocommerce' ), $capability, 'wpgs-settings', null, $menu_icon, '58' );
	}

	/**
	 * Remove the submenu entry WordPress adds for the parent menu itself. The
	 * parent page has no screen of its own: the menu opens the Dashboard, its
	 * first submenu, and the old URL redirects there (redirect_legacy_pages()).
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function remove_parent_submenu() {
		remove_submenu_page( 'wpgs-settings', 'wpgs-settings' );
	}

	/**
	 * Register wcgs_layouts custom post type
	 *
	 * @since
	 */
	public function wcgs_layouts_post_type() {
		$labels = array(
			'name'               => __( 'Manage Layouts', 'gallery-slider-for-woocommerce' ),
			'singular_name'      => __( 'Layout', 'gallery-slider-for-woocommerce' ),
			'add_new'            => __( 'Add New', 'gallery-slider-for-woocommerce' ),
			'add_new_item'       => __( 'Add New Layout', 'gallery-slider-for-woocommerce' ),
			'edit_item'          => __( 'Edit', 'gallery-slider-for-woocommerce' ),
			'new_item'           => __( 'New Layout', 'gallery-slider-for-woocommerce' ),
			'all_items'          => __( 'Manage Layouts', 'gallery-slider-for-woocommerce' ),
			'search_items'       => __( 'Search', 'gallery-slider-for-woocommerce' ),
			'not_found'          => __( 'No Layout Found', 'gallery-slider-for-woocommerce' ),
			'not_found_in_trash' => __( 'No Layout Found in Trash', 'gallery-slider-for-woocommerce' ),
			'parent_item_colon'  => null,
		);
		// Layouts are only handled through the dashboard's own REST routes: not
		// public, not in the core REST API, and every capability is the plugin's.
		$capability = apply_filters( 'wcgs_ui_permission', 'manage_options' );
		register_post_type(
			'wcgs_layouts',
			array(
				'labels'              => $labels,
				'supports'            => array( 'title' ),
				'public'              => false,
				'publicly_queryable'  => false,
				// Layouts are managed in the dashboard's Per-Product Layouts tab.
				'show_ui'             => false,
				'exclude_from_search' => true,
				'show_in_nav_menus'   => false,
				'show_in_admin_bar'   => false,
				'has_archive'         => false,
				'show_in_rest'        => false,
				'rewrite'             => false,
				'query_var'           => false,
				'map_meta_cap'        => false,
				'capabilities'        => array(
					'edit_post'              => $capability,
					'read_post'              => $capability,
					'delete_post'            => $capability,
					'edit_posts'             => $capability,
					'edit_others_posts'      => $capability,
					'delete_posts'           => $capability,
					'publish_posts'          => $capability,
					'read_private_posts'     => $capability,
					'read'                   => $capability,
					'delete_private_posts'   => $capability,
					'delete_published_posts' => $capability,
					'delete_others_posts'    => $capability,
					'edit_private_posts'     => $capability,
					'edit_published_posts'   => $capability,
					'create_posts'           => $capability,
				),
			)
		);
	}

	/**
	 * Add attachment video field.
	 *
	 * @access public
	 * @since 1.0.0
	 * @param  mixed  $form_fields form_fields.
	 * @param  object $post post.
	 */
	public function wcgs_add_media_custom_field( $form_fields, $post ) {
		// The video link is meant to attach a video to an image, so hide it on non-image attachments (e.g. videos).
		if ( ! wp_attachment_is_image( $post->ID ) ) {
			return $form_fields;
		}
		$wcgs_video = get_post_meta( $post->ID, 'wcgs_video', true );

		$form_fields['wcgs_notice'] = array(
			'input' => 'html',
			'label' => '',
			'html'  => '<h2 class="wcgs-video">' . esc_html__( 'Reno Product Gallery Video', 'gallery-slider-for-woocommerce' ) . '</h2>',
		);
		$form_fields['wcgs_video']  = array(
			'value' => $wcgs_video ? $wcgs_video : '',
			'label' => esc_html__( 'Video Link', 'gallery-slider-for-woocommerce' ),
			'input' => 'text',
			'helps' => sprintf(
				/* translators: 1: start link and strong tag, 2: close link and strong tag, 3: start link and strong tag. */
				__( 'To show this video on the %1$sShop page%2$s, %3$sUpgrade to Pro!%2$s', 'gallery-slider-for-woocommerce' ),
				'<a href="https://demo.renoproductgallery.com/" target="_blank" class="btn"><strong>',
				'</strong></a>',
				'<a href="' . esc_url( WOO_GALLERY_SLIDER_PRO_LINK ) . '" target="_blank" class="btn"><strong>'
			),
		);
		return $form_fields;
	}
	/**
	 * Save attachment having video field.
	 *
	 * @since 1.0.0
	 * @access public
	 * @param  integer $attachment_id attachment id.
	 */
	public function wcgs_add_media_custom_field_save( $attachment_id ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- edit_attachment runs after core checked the attachment save.
		if ( isset( $_REQUEST['attachments'][ $attachment_id ]['wcgs_video'] ) ) {
			$submitted = trim( (string) wp_unslash( $_REQUEST['attachments'][ $attachment_id ]['wcgs_video'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Compared only; sanitized below.
			// The form sends the field on every attachment save: leave an unchanged URL alone,
			// so a video saved before 4.0 on a host not listed in Video_Url isn't wiped by a caption edit.
			if ( get_post_meta( $attachment_id, 'wcgs_video', true ) !== $submitted ) {
				// A URL that is neither a supported video host nor a video file is stored as ''.
				update_post_meta( $attachment_id, 'wcgs_video', Woo_Gallery_Slider_Video_Url::sanitize( $submitted ) );
			}
		}
	}

	/**
	 * Implementation of yield for better performance.
	 * https://medium.com/tech-tajawal/use-memory-gently-with-yield-in-php-7e62e2480b8d
	 * wcgs_reduce_processor_use
	 *
	 * @param array $array array.
	 */
	public function wcgs_reduce_processor_use( $array ) {
		$array_length = count( $array );
		for ( $i = 0; $i < $array_length; $i++ ) {
			yield $array[ $i ];
		}
	}

	/**
	 * The attachment IDs of a variation gallery. Reads both stored formats:
	 * JSON "[12,34]" and "12,34" (saved by the removed product-editor block).
	 *
	 * @since 4.0.0
	 * @param mixed $value Stored or posted `woo_gallery_slider` value.
	 * @return int[]
	 */
	private function parse_gallery_ids( $value ) {
		if ( ! is_string( $value ) ) {
			return array();
		}
		return array_values( array_filter( array_map( 'absint', explode( ',', trim( $value, '[] ' ) ) ) ) );
	}

	/**
	 * Which images in WooCommerce core's variation gallery field have a video.
	 *
	 * Core's field lists the variation image followed by the gallery (the
	 * same list as `ClassicVariationGalleryAdmin::get_display_image_ids()`).
	 * The admin JS reads this list for the row's image/video count badge.
	 * Images added later in the media modal are checked through their
	 * attachment model instead.
	 *
	 * @since 4.0.0
	 * @param WP_Post $variation Variation post.
	 * @return void
	 */
	private function core_gallery_video_ids_field( $variation ) {
		$variation_object = wc_get_product( $variation->ID );
		if ( ! $variation_object instanceof WC_Product_Variation ) {
			return;
		}
		$image_ids   = array_map( 'intval', $variation_object->get_gallery_image_ids() );
		$image_ids[] = (int) $variation_object->get_image_id( 'edit' );
		$image_ids   = array_values( array_unique( array_filter( $image_ids ) ) );
		if ( empty( $image_ids ) ) {
			return;
		}
		update_meta_cache( 'post', $image_ids );
		$video_ids = array();
		foreach ( $image_ids as $image_id ) {
			if ( get_post_meta( $image_id, 'wcgs_video', true ) ) {
				$video_ids[] = $image_id;
			}
		}
		?>
		<input type="hidden" class="wcgs-core-gallery-video-ids" value="<?php echo esc_attr( implode( ',', $video_ids ) ); ?>" />
		<?php
	}

	/**
	 * Add WooCommerce Product Variation Gallery field from WCGS plugin.
	 *
	 * The free version shows and edits the first two images of a variation
	 * gallery, with an "Upgrade to Pro" notice when it holds more (as 3.x).
	 * The hidden field carries the whole list, so stored images beyond the
	 * first two survive a save.
	 *
	 * @param string $loop Product Variation id.
	 * @param mixed  $variation_data Product variation data.
	 * @param object $variation Product variation.
	 * @since    1.0.0
	 * @access public
	 */
	public function woocommerce_add_gallery_product_variation( $loop, $variation_data, $variation ) {
		// Printed in both modes: WooCommerce can render its own gallery field even when the plugin keeps its own.
		$this->core_gallery_video_ids_field( $variation );
		// WooCommerce's own variation gallery field replaces this one.
		if ( Woo_Gallery_Slider_Variation_Gallery::core_enabled() ) {
			return;
		}
		// Deleted attachments are dropped, so they neither show as empty tiles nor count toward the limit.
		$image_ids   = array_values( array_filter( Woo_Gallery_Slider_Variation_Gallery::meta_ids( $variation->ID ), 'wp_attachment_is_image' ) );
		$shown_ids   = array_slice( $image_ids, 0, self::VARIATION_GALLERY_LIMIT );
		$empty_class = empty( $shown_ids ) ? 'hidden' : '';
		?>
		<div class="wcgs-variation-gallery form-row form-row-full">
		<h4><?php esc_html_e( 'Variation Image Gallery', 'gallery-slider-for-woocommerce' ); ?></h4>
		<div class="wcgs-gallery-items" id="<?php echo esc_attr( $variation->ID ); ?>" data-limit="<?php echo esc_attr( self::VARIATION_GALLERY_LIMIT ); ?>">
			<?php
			foreach ( $this->wcgs_reduce_processor_use( $shown_ids ) as $image_id ) {
				$image_attachment = wp_get_attachment_image_src( $image_id );
				$video_url        = get_post_meta( $image_id, 'wcgs_video', true );
				?>
				<div class="wcgs-image <?php echo $video_url ? 'wcgs-video' : ''; ?>" data-attachmentid="<?php echo esc_attr( $image_id ); ?>">
					<img src="<?php echo esc_url( $image_attachment ? $image_attachment[0] : '' ); ?>" style="max-width:100%;display:inline-block;" />
					<div class="wcgs-image-remover"><span class="dashicons dashicons-no"></span></div>
					<?php
					if ( $video_url ) {
						?>
						<div class="wcgs-video-icons"><i class="dashicons dashicons-video-alt3"></i></div>
						<?php
					}
					?>
				</div>
				<?php
			}
			?>
		</div>
		<p>
			<button class="wcgs-remove-all-images button <?php echo esc_attr( $empty_class ); ?>"><?php esc_html_e( 'Remove all', 'gallery-slider-for-woocommerce' ); ?></button>
			<button class="wcgs-upload-image button <?php echo esc_attr( empty( $shown_ids ) ? '' : 'hidden' ); ?>" id="<?php echo 'wcgs-upload-' . esc_attr( $variation->ID ); ?>"><?php esc_html_e( 'Add Gallery Images', 'gallery-slider-for-woocommerce' ); ?></button>
			<button class="wcgs-upload-more-image button <?php echo esc_attr( $empty_class ); ?>"><?php esc_html_e( 'Add more', 'gallery-slider-for-woocommerce' ); ?></button>
			<button class="wcgs-edit button <?php echo esc_attr( $empty_class ); ?>"><?php esc_html_e( 'Edit Gallery', 'gallery-slider-for-woocommerce' ); ?></button>
			<span class="wcgs-pro-notice <?php echo esc_attr( count( $image_ids ) > self::VARIATION_GALLERY_LIMIT ? '' : 'hidden' ); ?>" style="color:red;">
				<?php
				echo wp_kses(
					sprintf(
						/* translators: 1: start link tag, 2: close link tag. */
						__( 'To add more images & videos, %1$sUpgrade to Pro!%2$s', 'gallery-slider-for-woocommerce' ),
						'<a href="' . esc_url( WOO_GALLERY_SLIDER_PRO_LINK ) . '" target="_blank" style="font-style: italic;">',
						'</a>'
					),
					array(
						'a' => array(
							'href'   => array(),
							'target' => array(),
							'style'  => array(),
						),
					)
				);
				?>
			</span>
		</p>
		<script type="text/javascript">
		jQuery(document).ready( function($) {
			$('.wcgs-gallery-items').sortable({
				placeholder: "ui-state-highlight",
				stop: function() {
					var variableID = $(this).parents('.woocommerce_variation').find('.variable_post_id').val();
					variableID = '#'+variableID;
					var newWcgsArr = [];
					var field = $('.wcgs-gallery-items'+variableID).parents('.woocommerce_variable_attributes').find('.wcgs-gallery');
					var stored = $.trim(String(field.val() || '')).replace(/^\[|\]$/g, '');
					var allIds = stored === '' ? [] : stored.split(',');
					$('.wcgs-gallery-items'+variableID).find('.wcgs-image').each( function() {
						var imageID = $(this).data('attachmentid');
						newWcgsArr.push(imageID);
					});
					// The shown images come first; keep the ones beyond them in their order.
					newWcgsArr = newWcgsArr.concat($.map(allIds.slice(newWcgsArr.length), function(id) { return parseInt(id, 10) || null; }));
					field.val(JSON.stringify(newWcgsArr)).trigger('change');
				}
			});
		});
		</script>
		<div class="hidden">
		<?php
		woocommerce_wp_text_input(
			array(
				'id'    => 'woo_gallery_slider[' . $loop . ']',
				'class' => 'wcgs-gallery',
				'label' => '',
				// Every stored image (as JSON whatever the stored format), so a save keeps the ones not shown.
				'value' => $image_ids ? wp_json_encode( $image_ids ) : '',
			)
		);
		$variation_nonce = wp_create_nonce( 'woo_gallery_slider_variation_nonce' );
		woocommerce_wp_text_input(
			array(
				'id'    => 'woo_gallery_slider_variation_nonce',
				'class' => 'wcgs-gallery-nonce',
				'label' => '',
				'value' => $variation_nonce,
			)
		);
		?>
		</div>
		</div>
		<?php
	}

	/**
	 * WooCommerce save gallery product variation, as JSON.
	 *
	 * @param string $variation_id save gallery product.
	 * @param string $i save gallery product id.
	 * @return void
	 */
	public function woocommerce_save_gallery_product_variation( $variation_id, $i ) {
		// The field isn't rendered, and a missing field would delete the meta.
		if ( Woo_Gallery_Slider_Variation_Gallery::core_enabled() ) {
			return;
		}
		$variation_nonce = isset( $_POST['woo_gallery_slider_variation_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['woo_gallery_slider_variation_nonce'] ) ) : '';
		if ( ! wp_verify_nonce( $variation_nonce, 'woo_gallery_slider_variation_nonce' ) || ! current_user_can( 'edit_post', $variation_id ) ) {
			return;
		}
		if ( isset( $_POST['woo_gallery_slider'][ $i ] ) ) {
			$image_ids = $this->parse_gallery_ids( sanitize_text_field( wp_unslash( $_POST['woo_gallery_slider'][ $i ] ) ) );
			update_post_meta( $variation_id, 'woo_gallery_slider', wp_json_encode( $image_ids ) );
		}
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 * @access public
	 */
	public function enqueue_styles() {

		/**
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Woo_Gallery_Slider_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Woo_Gallery_Slider_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */
		$current_screen = get_current_screen();

		if ( is_object( $current_screen ) && 'product' === $current_screen->post_type ) {
			wp_enqueue_style( 'wp-jquery-ui' );
			// Fontello icon loader.
			wp_enqueue_style( $this->plugin_name . '-admin' );
			wp_enqueue_script( $this->plugin_name . '-admin' );
			wp_enqueue_style( $this->plugin_name . '-fontello' );
		}
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 * @access public
	 */
	public function enqueue_scripts() {
		/**
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Woo_Gallery_Slider_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Woo_Gallery_Slider_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */
		$current_screen = get_current_screen();
		if ( is_object( $current_screen ) && 'product' === $current_screen->post_type ) {
			if ( ! did_action( 'wp_enqueue_media' ) ) {
				wp_enqueue_media();
			}
			wp_enqueue_script( $this->plugin_name . '-admin' );
		}
	}
}
