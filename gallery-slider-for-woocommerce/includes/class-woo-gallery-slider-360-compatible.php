<?php
/**
 * Fired during plugin updates
 *
 * @link       https://shapedplugin.com/
 * @since      1.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// Don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Reno Product Gallery - 360° View Compatibility Class
 */
class View360_Compatible {

	/**
	 * Singleton instance
	 *
	 * @var View360_Compatible
	 */
	private static $instance = null;

	/**
	 * Get singleton instance
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor: hooks into WooCommerce
	 */
	private function __construct() {
		add_action( 'woocommerce_after_single_product_summary', array( $this, 'render_360_popup' ), 15 );
	}

	/**
	 * Render the 360° popup HTML and inject buttons
	 */
	public function render_360_popup() {
		global $product;

		if ( ! $product instanceof WC_Product ) {
			return;
		}

		$product_id = $product->get_id();
		$image_ids  = get_post_meta( $product_id, '_wp360view_images', true );

		if ( ! $image_ids ) {
			return;
		}

		$image_ids = array_filter( explode( ',', $image_ids ) );
		if ( empty( $image_ids ) ) {
			return;
		}

		$image_urls  = array_map( 'wp_get_attachment_url', $image_ids );
		$images_data = implode( ',', $image_urls );

		$icon_url = plugins_url(
			'images/360-degrees.png',
			WP_PLUGIN_DIR . '/360-product-viewer-for-woocommerce/360-product-viewer-for-woocommerce.php'
		);

		// 360° Popup HTML.
		?>
		<div id="threesixty_content_wrap" class="threesixty_content_wrap mfp-hide">
			<div class="threesixty threesixty-products enable-show-cursor">
				<div class="spinner"><span>0%</span></div>
				<ol class="threesixty_images">
					<?php
					foreach ( $image_urls as $i => $url ) :
						$class = $i === 0 ? 'normal current-image' : 'normal previous-image';
						?>
						<li><img src="<?php echo esc_url( $url ); ?>" class="<?php echo esc_attr( $class ); ?>" alt="360 Image"></li>
					<?php endforeach; ?>
				</ol>
			</div>
		</div>

		<script>
		(function() {
			const slides = document.querySelectorAll('#wpgs-gallery .wcgs-carousel');
			slides.forEach(slide => {
				if (slide.querySelector('.threesixty-btn')) return;

				const btn = document.createElement('a');
				btn.className = 'threesixty-btn';
				btn.href = '#threesixty_content_wrap';
				btn.dataset.images = '<?php echo esc_js( $images_data ); ?>';
				btn.dataset.width = '2560';
				btn.dataset.height = '962';
				btn.style.position = 'absolute';
				btn.style.top = '55px';
				btn.style.right = '15px';
				btn.style.zIndex = '99999';
				btn.style.display = 'inline-block';

				const img = document.createElement('img');
				img.src = '<?php echo esc_url( $icon_url ); ?>';
				img.style.width = '40px';
				img.style.height = '40px';
				btn.appendChild(img);

				const imageWrapper = slide;
				if (imageWrapper) {
					imageWrapper.style.position = 'relative';
					imageWrapper.appendChild(btn);
				}
			});
		})();
		</script>
		<?php
	}
}

// Initialize.
View360_Compatible::get_instance();
