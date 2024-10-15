<?php
/**
 * The help page for the WooGallery Free
 *
 * @package WooGallery Free
 * @subpackage woo-gallery-slider/admin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}  // if direct access.

/**
 * The help class for the WooGallery Free
 */
class Woo_Gallery_Slider_Help {

	/**
	 * Single instance of the class
	 *
	 * @var null
	 */
	protected static $instance = null;

	/**
	 * Plugins Path variable.
	 *
	 * @var array
	 */
	protected static $plugins = array(
		'woo-product-slider'             => 'main.php',
		'gallery-slider-for-woocommerce' => 'woo-gallery-slider.php',
		'post-carousel'                  => 'main.php',
		'easy-accordion-free'            => 'plugin-main.php',
		'logo-carousel-free'             => 'main.php',
		'location-weather'               => 'main.php',
		'woo-quickview'                  => 'woo-quick-view.php',
		'wp-expand-tabs-free'            => 'plugin-main.php',

	);

	/**
	 * Welcome pages
	 *
	 * @var array
	 */
	public $pages = array(
		'wpgs-settings',
	);


	/**
	 * Not show this plugin list.
	 *
	 * @var array
	 */
	protected static $not_show_plugin_list = array( 'aitasi-coming-soon', 'latest-posts', 'widget-post-slider', 'easy-lightbox-wp', 'gallery-slider-for-woocommerce' );

	/**
	 * Help Page construct function.
	 */
	public function __construct() {
		$this->help_page_callback();
	}

	/**
	 * Help Page Instance
	 *
	 * @static
	 * @return self Main instance
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Wcgs_ajax_help_page function.
	 *
	 * @return void
	 */
	public function wcgs_plugins_info_api_help_page() {
		$plugins_arr = get_transient( 'wcgs_plugins' );
		if ( false === $plugins_arr ) {
			$args    = (object) array(
				'author'   => 'shapedplugin',
				'per_page' => '120',
				'page'     => '1',
				'fields'   => array(
					'slug',
					'name',
					'version',
					'downloaded',
					'active_installs',
					'last_updated',
					'rating',
					'num_ratings',
					'short_description',
					'author',
				),
			);
			$request = array(
				'action'  => 'query_plugins',
				'timeout' => 30,
				'request' => serialize( $args ),
			);
			// https://codex.wordpress.org/WordPress.org_API.
			$url      = 'http://api.wordpress.org/plugins/info/1.0/';
			$response = wp_remote_post( $url, array( 'body' => $request ) );
			if ( ! is_wp_error( $response ) ) {
				$plugins_arr = array();
				$plugins     = unserialize( $response['body'] );
				if ( isset( $plugins->plugins ) && ( count( $plugins->plugins ) > 0 ) ) {
					foreach ( $plugins->plugins as $pl ) {
						if ( ! in_array( $pl->slug, self::$not_show_plugin_list, true ) ) {
							$plugins_arr[] = array(
								'slug'              => $pl->slug,
								'name'              => $pl->name,
								'version'           => $pl->version,
								'downloaded'        => $pl->downloaded,
								'active_installs'   => $pl->active_installs,
								'last_updated'      => strtotime( $pl->last_updated ),
								'rating'            => $pl->rating,
								'num_ratings'       => $pl->num_ratings,
								'short_description' => $pl->short_description,
							);
						}
					}
				}

				set_transient( 'wcgs_plugins', $plugins_arr, 24 * HOUR_IN_SECONDS );
			}
		}

		$woocommerce_plugin = array( 'woo-category-slider-grid', 'woo-product-slider', 'woo-quickview', 'smart-brands-for-woocommerce' );
		$woo_plugins        = array();
		$normal_plugins     = array();

		foreach ( $plugins_arr as $plugin ) {
			if ( in_array( $plugin['slug'], $woocommerce_plugin, true ) ) {
				array_push( $woo_plugins, $plugin );
			} else {
				array_push( $normal_plugins, $plugin );
			}
		}

		$plugins_arr = array_merge( $woo_plugins, $normal_plugins );

		if ( is_array( $plugins_arr ) && ( count( $plugins_arr ) > 0 ) ) {

			foreach ( $plugins_arr as $plugin ) {
				$plugin_slug = $plugin['slug'];
				$image_type  = 'png';
				if ( isset( self::$plugins[ $plugin_slug ] ) ) {
					$plugin_file = self::$plugins[ $plugin_slug ];
				} else {
					$plugin_file = $plugin_slug . '.php';
				}

				switch ( $plugin_slug ) {
					case 'styble':
						$image_type = 'jpg';
						break;
					case 'location-weather':
					case 'testimonial-free':
					case 'gallery-slider-for-woocommerce':
						$image_type = 'gif';
						break;
				}
				$details_link = network_admin_url( 'plugin-install.php?tab=plugin-information&amp;plugin=' . $plugin['slug'] . '&amp;TB_iframe=true&amp;width=745&amp;height=550' );
				?>
				<div class="plugin-card <?php echo esc_attr( $plugin_slug ); ?>" id="<?php echo esc_attr( $plugin_slug ); ?>">
					<div class="plugin-card-top">
						<div class="name column-name">
							<h3>
								<a class="thickbox" title="<?php echo esc_attr( $plugin['name'] ); ?>" href="<?php echo esc_url( $details_link ); ?>">
						<?php echo esc_html( $plugin['name'] ); ?>
									<img src="<?php echo esc_url( 'https://ps.w.org/' . $plugin_slug . '/assets/icon-256x256.' . $image_type ); ?>" class="plugin-icon"/>
								</a>
							</h3>
						</div>
						<div class="action-links">
							<ul class="plugin-action-buttons">
								<li>
						<?php
						if ( $this->is_plugin_installed( $plugin_slug, $plugin_file ) ) {
							if ( $this->is_plugin_active( $plugin_slug, $plugin_file ) ) {
								?>
										<button type="button" class="button button-disabled" disabled="disabled">Active</button>
									<?php
							} else {
								?>
											<a href="<?php echo esc_url( $this->activate_plugin_link( $plugin_slug, $plugin_file ) ); ?>" class="button button-primary activate-now">
									<?php esc_html_e( 'Activate', 'gallery-slider-for-woocommerce' ); ?>
											</a>
									<?php
							}
						} else {
							?>
										<a href="<?php echo esc_url( $this->install_plugin_link( $plugin_slug ) ); ?>" class="button install-now">
								<?php esc_html_e( 'Install Now', 'gallery-slider-for-woocommerce' ); ?>
										</a>
								<?php } ?>
								</li>
								<li>
									<a href="<?php echo esc_url( $details_link ); ?>" class="thickbox open-plugin-details-modal" aria-label="<?php echo esc_attr( 'More information about ' . $plugin['name'] ); ?>" title="<?php echo esc_attr( $plugin['name'] ); ?>">
								<?php esc_html_e( 'More Details', 'gallery-slider-for-woocommerce' ); ?>
									</a>
								</li>
							</ul>
						</div>
						<div class="desc column-description">
							<p><?php echo esc_html( isset( $plugin['short_description'] ) ? $plugin['short_description'] : '' ); ?></p>
							<p class="authors"> <cite>By <a href="https://shapedplugin.com/">ShapedPlugin LLC</a></cite></p>
						</div>
					</div>
					<?php
					echo '<div class="plugin-card-bottom">';

					if ( isset( $plugin['rating'], $plugin['num_ratings'] ) ) {
						?>
						<div class="vers column-rating">
							<?php
							wp_star_rating(
								array(
									'rating' => $plugin['rating'],
									'type'   => 'percent',
									'number' => $plugin['num_ratings'],
								)
							);
							?>
							<span class="num-ratings">(<?php echo esc_html( number_format_i18n( $plugin['num_ratings'] ) ); ?>)</span>
						</div>
						<?php
					}
					if ( isset( $plugin['version'] ) ) {
						?>
						<div class="column-updated">
							<strong><?php esc_html_e( 'Version:', 'gallery-slider-for-woocommerce' ); ?></strong>
							<span><?php echo esc_html( $plugin['version'] ); ?></span>
						</div>
							<?php
					}

					if ( isset( $plugin['active_installs'] ) ) {
						?>
						<div class="column-downloaded">
						<?php echo esc_html( number_format_i18n( $plugin['active_installs'] ) ) . esc_html__( '+ Active Installations', 'gallery-slider-for-woocommerce' ); ?>
						</div>
									<?php
					}

					if ( isset( $plugin['last_updated'] ) ) {
						?>
						<div class="column-compatibility">
							<strong><?php esc_html_e( 'Last Updated:', 'gallery-slider-for-woocommerce' ); ?></strong>
							<span><?php echo esc_html( human_time_diff( $plugin['last_updated'] ) ) . ' ' . esc_html__( 'ago', 'gallery-slider-for-woocommerce' ); ?></span>
						</div>
									<?php
					}

					echo '</div>';
					?>
				</div>
				<?php
			}
		}
	}

	/**
	 * Check plugins installed function.
	 *
	 * @param string $plugin_slug Plugin slug.
	 * @param string $plugin_file Plugin file.
	 * @return boolean
	 */
	public function is_plugin_installed( $plugin_slug, $plugin_file ) {
		return file_exists( WP_PLUGIN_DIR . '/' . $plugin_slug . '/' . $plugin_file );
	}

	/**
	 * Check active plugin function
	 *
	 * @param string $plugin_slug Plugin slug.
	 * @param string $plugin_file Plugin file.
	 * @return boolean
	 */
	public function is_plugin_active( $plugin_slug, $plugin_file ) {
		return is_plugin_active( $plugin_slug . '/' . $plugin_file );
	}

	/**
	 * Install plugin link.
	 *
	 * @param string $plugin_slug Plugin slug.
	 * @return string
	 */
	public function install_plugin_link( $plugin_slug ) {
		return wp_nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=' . $plugin_slug ), 'install-plugin_' . $plugin_slug );
	}

	/**
	 * Active Plugin Link function
	 *
	 * @param string $plugin_slug Plugin slug.
	 * @param string $plugin_file Plugin file.
	 * @return string
	 */
	public function activate_plugin_link( $plugin_slug, $plugin_file ) {
		return wp_nonce_url( admin_url( 'admin.php?page=wpgs-settings&action=activate&plugin=' . $plugin_slug . '/' . $plugin_file . '#tab=get-help#recommended' ), 'activate-plugin_' . $plugin_slug . '/' . $plugin_file );
	}

	/**
	 * The WooGallery Help Callback.
	 *
	 * @return void
	 */
	public function help_page_callback() {
		add_thickbox();

		$action   = isset( $_GET['action'] ) ? sanitize_text_field( wp_unslash( $_GET['action'] ) ) : '';
		$plugin   = isset( $_GET['plugin'] ) ? sanitize_text_field( wp_unslash( $_GET['plugin'] ) ) : '';
		$_wpnonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';

		if ( isset( $action, $plugin ) && ( 'activate' === $action ) && wp_verify_nonce( $_wpnonce, 'activate-plugin_' . $plugin ) ) {
			activate_plugin( $plugin, '', false, true );
		}

		if ( isset( $action, $plugin ) && ( 'deactivate' === $action ) && wp_verify_nonce( $_wpnonce, 'deactivate-plugin_' . $plugin ) ) {
			deactivate_plugins( $plugin, '', false, true );
		}

		?>
		<div class="sp-woo-gallery-slider-help">
			<!-- Header section start -->
			<div class="wcgs-header-nav">
				<div class="wcgs-container">
					<div class="wcgs-header-nav-menu">
						<ul>
							<li><a class="active" data-id="get-start-tab"  href="<?php echo esc_url( home_url( '' ) . '/wp-admin/admin.php?page=wpgs-settings#tab=help#get-started' ); ?>">Get Started</a></li>
							<li><a href="<?php echo esc_url( home_url( '' ) . '/wp-admin/admin.php?page=wpgs-settings#tab=help#recommended' ); ?>" data-id="recommended-tab">Recommended</a></li>
							<li><a href="<?php echo esc_url( home_url( '' ) . '/wp-admin/admin.php?page=wpgs-settings#tab=help#lite-to-pro' ); ?>" data-id="lite-to-pro-tab">Lite Vs Pro</a></li>
							<li><a href="<?php echo esc_url( home_url( '' ) . '/wp-admin/admin.php?page=wpgs-settings#tab=help#about-us' ); ?>" data-id="about-us-tab">About Us</a></li>
						</ul>
					</div>
				</div>
			</div>
			<!-- Header section end -->

			<!-- Start Page -->
			<section class="wcgs__help start-page" id="get-start-tab">
				<div class="wcgs-container">
					<div class="wcgs-start-page-wrap">
						<div class="wcgs-video-area">
							<h2 class='wcgs-section-title-help'>Welcome to WooGallery!</h2>
							<span class='wcgs-normal-paragraph'>Thank you for installing WooGallery! This video will help you get started with the plugin. Enjoy!</span>
							<iframe width="724" height="405" src="https://www.youtube.com/embed/aofImhOCZYs?si=NMYms_CEQi4KpDa4" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
							<ul>
								<li><a class='wcgs-medium-btn' href="<?php echo esc_url( home_url( '/' ) . 'wp-admin/admin.php?page=wpgs-settings#tab=general' ); ?>">Configure Settings</a></li>
								<li><a target="_blank" class='wcgs-medium-btn' href="https://demo.woogallery.io/thumbnails-bottom/product/air-max-plus/">Live Demo</a></li>
								<li><a target="_blank" class='wcgs-medium-btn arrow-btn' href="https://woogallery.io/?ref=143">Explore WooGallery <i class="wcgs-icon-button-arrow-icon"></i></a></li>
							</ul>
						</div>
						<div class="wcgs-start-page-sidebar">
							<div class="wcgs-start-page-sidebar-info-box">
								<div class="wcgs-info-box-title">
									<h4><i class="wcgs-icon-doc-icon"></i> Documentation</h4>
								</div>
								<span class='wcgs-normal-paragraph'>Explore WooGallery plugin capabilities in our enriched documentation.</span>
								<a target="_blank" class='wcgs-small-btn' href="https://docs.shapedplugin.com/docs/gallery-slider-for-woocommerce/overview/">Browse Now</a>
							</div>
							<div class="wcgs-start-page-sidebar-info-box">
								<div class="wcgs-info-box-title">
									<h4><i class="wcgs-icon-support"></i> Technical Support</h4>
								</div>
								<span class='wcgs-normal-paragraph'>For personalized assistance, reach out to our skilled support team for prompt help.</span>
								<a target="_blank" class='wcgs-small-btn' href="https://shapedplugin.com/create-new-ticket/">Ask Now</a>
							</div>
							<div class="wcgs-start-page-sidebar-info-box">
								<div class="wcgs-info-box-title">
									<h4><i class="wcgs-icon-team-icon"></i> Join The Community</h4>
								</div>
								<span class='wcgs-normal-paragraph'>Join the official ShapedPlugin Facebook group to share your experiences, thoughts, and ideas.</span>
								<a target="_blank" class='wcgs-small-btn' href="https://www.facebook.com/groups/ShapedPlugin/">Join Now</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Lite To Pro Page -->
			<section class="wcgs__help lite-to-pro-page" id="lite-to-pro-tab">
				<div class="wcgs-container">
					<div class="wcgs-call-to-action-top">
						<h2 class="wcgs-section-title-help">Lite vs Pro Comparison</h2>
						<a target="_blank" href="https://woogallery.io/pricing/?ref=143" class='wcgs-big-btn'>Upgrade to Pro Now!</a>
					</div>
					<div class="wcgs-lite-to-pro-wrap">
						<div class="wcgs-features">
							<ul>
								<li class='wcgs-header'>
									<span class='wcgs-title'>FEATURES</span>
									<span class='wcgs-free'>Lite</span>
									<span class='wcgs-pro'><i class='wcgs-icon-pro'></i> PRO</span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>All Free Version Features</span>
									<span class='wcgs-free wcgs-check-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Amazing Product Gallery Layouts (Thumbs Bottom & Top, Thumbs Left & Right, Grid, Hierarchy Grid, Anchor Navigation, and Slider)</span>
									<span class='wcgs-free'><b>2</b></span>
									<span class='wcgs-pro'><b>8</b></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Dedicated Customization Options for Grid, Hierarchy Grid, and Anchor Navigation <i class="wcgs-new">New</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Add and Display Unlimited Images Per Product Variation </span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Display Product Video on the Shop or Product Archive Page <i class="wcgs-new">New</i> <i class="wcgs-hot">Hot</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Embed Unlimited Videos to Your Products and Variation Gallery Images</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Support YouTube, Vimeo, Dailymotion, Facebook, and Self-Hosted video source (YouTube/All)</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Number of Videos Per Product</span>
									<span class='wcgs-free'><b>1</b></span>
									<span class='wcgs-pro'>Unlimited</span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Thumbnails Item Display Type (Auto, Custom) <i class="wcgs-new">New</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Control Thumbnail items to Show, Space, Border</span>
									<span class='wcgs-free wcgs-check-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Change Vertical Thumbnails Area Width and Inner Padding <i class="wcgs-new">New</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Custom Thumbnail Dimensions and Retina Ready Supported</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Gallery Thumbnails Hover Effects (Normal, Zoom In, Zoom Out, Slide Up, Slide Down)</span>
									<span class='wcgs-free'><b>1</b></span>
									<span class='wcgs-pro'><b>5</b></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Activate Gallery Thumbnails On Mouseover <i class="wcgs-hot">Hot</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Active Thumbnail Styles (Border Around, Bottom Line, Zoom Out, and Opacity)</span>
									<span class='wcgs-free'><b>1</b></span>
									<span class='wcgs-pro'><b>4</b></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Inactive Gallery Thumbnail Effects (Opacity, Grayscale, and Normal) </span>
									<span class='wcgs-free'>1</span>
									<span class='wcgs-pro'>3</span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Control Responsive Product Gallery Width and Bottom Gap</span>
									<span class='wcgs-free wcgs-check-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Show/Hide Product Gallery Image Caption and Gallery Image Source</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Gallery Slider AutoPlay, AutoPlay Interval, Speed, Horizontal and Vertical Orientation</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Gallery Slider Navigation, Pagination, Adaptive Height, Accessibility, RTL, Free Mode, and Mouse Wheel</span>
									<span class='wcgs-free wcgs-check-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Product Gallery Sliding Effects (Fade, Slide, Flip, and Cube)</span>
									<span class='wcgs-free'><b>1</b></span>
									<span class='wcgs-pro'><b>4</b></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Thumbnails Navigation Styles (Outer, Inner, and Custom) <i class="wcgs-new">New</i> <i class="wcgs-hot">Hot</i></span>
									<span class='wcgs-free'><b>1</b></span>
									<span class='wcgs-pro'><b>3</b></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Customize Thumbnail Navigation Icon, Border, and Box Size</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Product Image Custom Dimensions and Retina Ready Supported</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>On-Demand Lazy Load and Product Image Modes (Original, Grayscale, Grayscale on hover, etc.)</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Beautiful Product Zoom Styles (Right Side, Inside, Magnific)  <i class="wcgs-hot">Hot</i></span>
									<span class='wcgs-free'><b>1</b></span>
									<span class='wcgs-pro'><b>3</b></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Zoom Scale <i class="wcgs-new">New</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Add Custom Lens Color, Border, and Image Overlay Color</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Adjust the Product Zoom Window Size and Distance, Border and Box-Shadow, etc.</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Product Video Play Modes (Inline, Popup) <i class="wcgs-new">New</i></span>
									<span class='wcgs-free wcgs-check-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Fully Customized Self-hosted Video Player with VideoJS  <i class="wcgs-new">New</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Show/Hide YouTube Related Videos and Desired Placement for the Product Videos in the Gallery  <i class="wcgs-hot">Hot</i></span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>30+ Powerful Lightbox Options (Sliding Effects, Icon Display Position, Thumbnails Gallery, etc.)</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>All Premium Features, Security Enhancements, and Compatibility</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
								<li class='wcgs-body'>
									<span class='wcgs-title'>Priority Top-notch Support</span>
									<span class='wcgs-free wcgs-close-icon'></span>
									<span class='wcgs-pro wcgs-check-icon'></span>
								</li>
							</ul>
						</div>
						<div class="wcgs-upgrade-to-pro">
							<h2 class='wcgs-section-title-help'>Upgrade To PRO & Enjoy Advanced Features!</h2>
							<span class='wcgs-section-subtitle'>Already, <b>10000+</b> people are using WooGallery on their websites to create beautiful carousels, sliders, and galleries; why won’t you!</span>
							<div class="wcgs-upgrade-to-pro-btn">
								<div class="wcgs-action-btn">
									<a target="_blank" href="https://woogallery.io/pricing/?ref=143" class='wcgs-big-btn'>Upgrade to Pro Now!</a>
									<span class='wcgs-small-paragraph'>14-Day No-Questions-Asked <a target="_blank" href="https://shapedplugin.com/refund-policy/">Refund Policy</a></span>
								</div>
								<a target="_blank" href="https://woogallery.io/?ref=143" class='wcgs-big-btn-border'>See All Features</a>
								<a target="_blank" href="https://demo.woogallery.io/thumbnails-left/product/featherlight-cap/" class="wcgs-big-btn-border wcgs-pro-live-demo-btn">Pro Live Demo</a>
							</div>
						</div>
					</div>
					<div class="wcgs-testimonial">
						<div class="wcgs-testimonial-title-section">
							<span class='wcgs-testimonial-subtitle'>NO NEED TO TAKE OUR WORD FOR IT</span>
							<h2 class="wcgs-section-title-help">Our Users Love WooGallery Pro!</h2>
						</div>
						<div class="wcgs-testimonial-wrap">
							<div class="wcgs-testimonial-area">
								<div class="wcgs-testimonial-content">
									<p>There’s one piece of experience I would like to share – in addition to my review before: It’s the world class support of Shaped Plugin WooGallery.I use this plugin...</p>
								</div>
								<div class="wcgs-testimonial-info">
									<div class="wcgs-img">
										<img src="<?php echo esc_url( WOO_GALLERY_SLIDER_URL . 'admin/help-page/img/stb91.png' ); ?>" alt="">
									</div>
									<div class="wcgs-info">
										<h3>Stb91</h3>
										<div class="wcgs-star">
											<i>★★★★★</i>
										</div>
									</div>
								</div>
							</div>
							<div class="wcgs-testimonial-area">
								<div class="wcgs-testimonial-content">
									<p>I had an issue with the Product Gallery Slider and couldn’t get it to work with Brizy. I contacted support and the issue was solved in no time and in a brilliant way! Thanks!</p>
								</div>
								<div class="wcgs-testimonial-info">
									<div class="wcgs-img">
										<img src="<?php echo esc_url( WOO_GALLERY_SLIDER_URL . 'admin/help-page/img/rivanegri.png' ); ?>" alt="">
									</div>
									<div class="wcgs-info">
										<h3>Rivanegri</h3>
										<div class="wcgs-star">
											<i>★★★★★</i>
										</div>
									</div>
								</div>
							</div>
							<div class="wcgs-testimonial-area">
								<div class="wcgs-testimonial-content">
									<p>If you want to effectively manage galleries in WooCommerce, this plugin is a highly recommended choice. You won’t find yourself disappointed with support when using this...</p>
								</div>
								<div class="wcgs-testimonial-info">
									<div class="wcgs-img">
										<img src="<?php echo esc_url( WOO_GALLERY_SLIDER_URL . 'admin/help-page/img/martin.png' ); ?>" alt="">
									</div>
									<div class="wcgs-info">
										<h3>Martin Frederic </h3>
										<div class="wcgs-star">
											<i>★★★★★</i>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Recommended Page -->
			<section id="recommended-tab" class="wcgs-recommended-page">
				<div class="wcgs-container">
					<h2 class="wcgs-section-title-help">Enhance your Website with our Free Robust Plugins</h2>
					<div class="wcgs-wp-list-table plugin-install-php">
						<div class="wcgs-recommended-plugins" id="the-list">
							<?php
								$this->wcgs_plugins_info_api_help_page();
							?>
						</div>
					</div>
				</div>
			</section>

			<!-- About Page -->
			<section id="about-us-tab" class="wcgs__help about-page">
				<div class="wcgs-container">
					<div class="wcgs-about-box">
						<div class="wcgs-about-info">
							<h3>All-in-One WooCommerce Product Image and Video Gallery Solution by the WooGallery Team, ShapedPlugin, LLC</h3>
							<p>Over the years, we have found that many WooCommerce store owners struggle to effectively display multiple crystal-clear product images to online customers, which is essential to increase sales. However, this powerful plugin can help you with that and much more:</p>
							<ul>
								<li><span class="wcgs-checkmark-icon"></span> Enable Product Gallery Slider on the Product Page</li>
								<li><span class="wcgs-checkmark-icon"></span> Enable Additional Variation Images Gallery Slider</li>
								<li><span class="wcgs-checkmark-icon"></span> Create Product Video Gallery</li>
								<li><span class="wcgs-checkmark-icon"></span> Add Product Image Zoom and Lightbox</li>
								<li><span class="wcgs-checkmark-icon"></span> Add Product Video on the Shop/Archive Page (Replace featured image)</li>
							</ul>
							<div class="wcgs-about-btn">
								<a target="_blank" href="https://woogallery.io/?ref=143" class='wcgs-medium-btn'>Explore WooGallery</a>
								<a target="_blank" href="https://shapedplugin.com/about-us/" class='wcgs-medium-btn wcgs-arrow-btn'>More About Us <i class="wcgs-icon-button-arrow-icon"></i></a>
							</div>
						</div>
						<div class="wcgs-about-img">
							<img src="https://shapedplugin.com/wp-content/uploads/2024/01/shapedplugin-team.jpg" alt="">
							<span>Team ShapedPlugin LLC at WordCamp Sylhet</span>
						</div>
					</div>
					<div class="wcgs-our-plugin-list">
						<h3 class="wcgs-section-title-help">Upgrade your Website with our High-quality Plugins!</h3>
						<div class="wcgs-our-plugin-list-wrap">
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://wpcarousel.io/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/wp-carousel-free/assets/icon-256x256.png" alt="WP Carousel">
								<h4>WP Carousel</h4>
								<p>The most powerful and user-friendly multi-purpose carousel, slider, & gallery plugin for WordPress.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://realtestimonials.io/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/testimonial-free/assets/icon-256x256.gif" alt="Real Testimonials">
								<h4>Real Testimonials</h4>
								<p>Simply collect, manage, and display Testimonials on your website and boost conversions.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://smartpostshow.com/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/post-carousel/assets/icon-256x256.png" alt="Smart Post Show">
								<h4>Smart Post Show</h4>
								<p>Filter and display posts (any post types), pages, taxonomy, custom taxonomy, and custom field, in beautiful layouts.</p>
							</a>
							<a target="_blank" href="https://wooproductslider.io/" class="wcgs-our-plugin-list-box">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/woo-product-slider/assets/icon-256x256.png" alt="Product Slider for WooCommerce">
								<h4>Product Slider for WooCommerce</h4>
								<p>Boost sales by interactive product Slider, Grid, and Table in your WooCommerce website or store.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://woogallery.io/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/gallery-slider-for-woocommerce/assets/icon-256x256.gif" alt="WooGallery">
								<h4>WooGallery</h4>
								<p>Product gallery slider and additional variation images gallery for WooCommerce and boost your sales.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://getwpteam.com/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/team-free/assets/icon-256x256.png" alt="WP Team">
								<h4>WP Team</h4>
								<p>Display your team members smartly who are at the heart of your company or organization!</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://logocarousel.com/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/logo-carousel-free/assets/icon-256x256.png" alt="Logo Carousel">
								<h4>Logo Carousel</h4>
								<p>Showcase a group of logo images with Title, Description, Tooltips, Links, and Popup as a grid or in a carousel.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://easyaccordion.io/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/easy-accordion-free/assets/icon-256x256.png" alt="Easy Accordion">
								<h4>Easy Accordion</h4>
								<p>Minimize customer support by offering comprehensive FAQs and increasing conversions.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://shapedplugin.com/woocategory/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/woo-category-slider-grid/assets/icon-256x256.png" alt="WooCategory">
								<h4>WooCategory</h4>
								<p>Display by filtering the list of categories aesthetically and boosting sales.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://wptabs.com/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/wp-expand-tabs-free/assets/icon-256x256.png" alt="WP Tabs">
								<h4>WP Tabs</h4>
								<p>Display tabbed content smartly & quickly on your WordPress site without coding skills.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://shapedplugin.com/plugin/woocommerce-quick-view-pro/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/woo-quickview/assets/icon-256x256.png" alt="Quick View for WooCommerce">
								<h4>Quick View for WooCommerce</h4>
								<p>Quickly view product information with smooth animation via AJAX in a nice Modal without opening the product page.</p>
							</a>
							<a target="_blank" class="wcgs-our-plugin-list-box" href="https://shapedplugin.com/plugin/smart-brands-for-woocommerce/">
								<i class="wcgs-icon-button-arrow-icon"></i>
								<img src="https://ps.w.org/smart-brands-for-woocommerce/assets/icon-256x256.png" alt="Smart Brands for WooCommerce">
								<h4>Smart Brands for WooCommerce</h4>
								<p>Smart Brands for WooCommerce Pro helps you display product brands in an attractive way on your online store.</p>
							</a>
						</div>
					</div>
				</div>
			</section>

			<!-- Footer Section -->
			<section class="wcgs-footer-help">
				<div class="wcgs-footer-help-top">
					<p><span>Made With <i class="wcgs-icon-heart"></i> </span> By the Team <a target="_blank" href="https://shapedplugin.com/">ShapedPlugin LLC</a></p>
					<p>Get connected with</p>
					<ul>
						<li><a target="_blank" href="https://www.facebook.com/ShapedPlugin/"><i class="wcgs-icon-fb"></i></a></li>
						<li><a target="_blank" href="https://twitter.com/intent/follow?screen_name=ShapedPlugin"><i class="wcgs-icon-x"></i></a></li>
						<li><a target="_blank" href="https://profiles.wordpress.org/shapedplugin/#content-plugins"><i class="wcgs-icon-wp-icon"></i></a></li>
						<li><a target="_blank" href="https://youtube.com/@ShapedPlugin?sub_confirmation=1"><i class="wcgs-icon-youtube-play"></i></a></li>
					</ul>
				</div>
			</section>
		</div>
		<?php
	}
}
