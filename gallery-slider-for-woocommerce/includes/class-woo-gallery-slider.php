<?php
/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}  // if direct access.

/**
 * Woo_Gallery_Slider
 */
class Woo_Gallery_Slider {
	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Woo_Gallery_Slider_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;
	/**
	 * All global settings.
	 *
	 * @var array
	 */
	public $settings = array();


	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		if ( defined( 'WOO_GALLERY_SLIDER_VERSION' ) ) {
			$this->version = WOO_GALLERY_SLIDER_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'gallery-slider-for-woocommerce';
		$this->load_dependencies();
		$this->set_locale();
		$this->define_admin_hooks();
		// Read after the admin hooks: on a fresh install the Global Settings API stores the defaults first.
		$this->settings = get_option( 'wcgs_settings' );
		$this->define_public_hooks();
		$active_plugins = get_option( 'active_plugins' );
		foreach ( $active_plugins as $active_plugin ) {
			$_temp = strpos( $active_plugin, 'woo-gallery-slider.php' );
			if ( false !== $_temp ) {
				add_filter( 'plugin_action_links_' . $active_plugin, array( $this, 'add_settings_links' ), 10, 2 );
			}
		}

		add_filter(
			'cmplz_whitelisted_script_tags',
			function ( $whitelisted_script_tags ) {
				$whitelisted_script_tags[] = 'gallery-slider-for-woocommerce'; // 'string from inline script or source that should be whitelisted'
				$whitelisted_script_tags[] = 'gallery-slider-for-woocommerce-js'; // 'string from inline script or source that should be whitelisted'
				$whitelisted_script_tags[] = 'gallery-slider-for-woocommerce-js-extra'; // 'string from inline script or source that should be whitelisted'
				return $whitelisted_script_tags;
			},
			10,
			1
		);
	}

	/**
	 * Add the Settings and Go Pro links to the plugin's row on the Plugins page.
	 *
	 * @since 2.0.0
	 * @param array  $links An array of existing plugin action links.
	 * @param string $file The plugin file path.
	 * @return array Modified array of plugin action links.
	 */
	public function add_settings_links( $links, $file ) {
		if ( WOO_GALLERY_SLIDER_BASENAME !== $file ) {
			return $links;
		}

		array_unshift( $links, sprintf( '<a href="%s">%s</a>', esc_url( Woo_Gallery_Slider_Dashboard::url( 'global' ) ), esc_html__( 'Settings', 'gallery-slider-for-woocommerce' ) ) );

		$links['go_pro'] = sprintf( '<a href="%s" target="_blank" style="%s">%s</a>', esc_url( WOO_GALLERY_SLIDER_PRO_LINK ), 'color:#1dab87;font-weight:bold', esc_html__( 'Go Pro!', 'gallery-slider-for-woocommerce' ) );

		return $links;
	}


	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Woo_Gallery_Slider_Loader. Orchestrates the hooks of the plugin.
	 * - Woo_Gallery_Slider_i18n. Defines internationalization functionality.
	 * - Woo_Gallery_Slider_Admin. Defines all hooks for the admin area.
	 * - Woo_Gallery_Slider_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-i18n.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-variation-image-import.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-product-gallery-video.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-import-export.php';

		// Variation images in the WooCommerce product block editor.
		require_once plugin_dir_path( __DIR__ ) . 'block/variation-images/variation-images.php';

		if ( function_exists( 'wp360view_plugin' ) ) {
			require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-360-compatible.php';
		}

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'admin/class-woo-gallery-slider-admin.php';

		/**
		 * The classes responsible for the React admin dashboard page and its REST API.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'admin/dashboard/class-woo-gallery-slider-dashboard-api.php';
		require_once plugin_dir_path( __DIR__ ) . 'admin/dashboard/class-woo-gallery-slider-settings-api.php';
		require_once plugin_dir_path( __DIR__ ) . 'admin/dashboard/class-woo-gallery-slider-global-settings-api.php';
		require_once plugin_dir_path( __DIR__ ) . 'admin/dashboard/class-woo-gallery-slider-preview-api.php';
		require_once plugin_dir_path( __DIR__ ) . 'admin/dashboard/class-woo-gallery-slider-preview-frame.php';
		require_once plugin_dir_path( __DIR__ ) . 'admin/dashboard/class-woo-gallery-slider-layouts-api.php';
		require_once plugin_dir_path( __DIR__ ) . 'admin/dashboard/class-woo-gallery-slider-dashboard.php';

		require_once plugin_dir_path( __DIR__ ) . 'admin/helper/class-woo-gallery-slider-cron.php';

		/**
		 * The class responsible for managing the product gallery transient caches.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-cache.php';

		/**
		 * The class responsible for the tablet and mobile values of the responsive settings.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-responsive.php';

		/**
		 * The class owning an image's video URL meta (validation, REST).
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-video-url.php';
		Woo_Gallery_Slider_Video_Url::init();

		/**
		 * The class resolving a variation's gallery from the plugin's meta or WooCommerce core.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-variation-gallery.php';
		Woo_Gallery_Slider_Variation_Gallery::init();

		/**
		 * The class migrating the plugin's variation galleries into WooCommerce core's.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-woo-gallery-slider-variation-gallery-migration.php';
		Woo_Gallery_Slider_Variation_Gallery_Migration::init();

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'public/class-woo-gallery-slider-public.php';

		/**
		 * Admin notices: review request and the Smart Swatches recommendation.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'admin/partials/class-wgs-admin-notices.php';
		$this->loader = new Woo_Gallery_Slider_Loader();
		$this->loader->add_action( 'wp_loaded', $this, 'register_all_scripts' );
	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the Woo_Gallery_Slider_i18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function set_locale() {
		$plugin_i18n = new Woo_Gallery_Slider_i18n();
		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );
	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_admin_hooks() {
		$plugin_admin = new Woo_Gallery_Slider_Admin( $this->get_plugin_name(), $this->get_version() );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );
		$this->loader->add_action( 'init', $plugin_admin, 'wcgs_layouts_post_type' );
		// React dashboard submenu page and its REST API.
		new Woo_Gallery_Slider_Dashboard();
		$this->loader->add_filter( 'attachment_fields_to_edit', $plugin_admin, 'wcgs_add_media_custom_field', 99, 2 );
		$this->loader->add_filter( 'edit_attachment', $plugin_admin, 'wcgs_add_media_custom_field_save' );
		$this->loader->add_action( 'woocommerce_product_after_variable_attributes', $plugin_admin, 'woocommerce_add_gallery_product_variation', 10, 3 );
		$this->loader->add_action( 'woocommerce_save_product_variation', $plugin_admin, 'woocommerce_save_gallery_product_variation', 10, 2 );

		// Delete expired product gallery transients weekly.
		add_action( 'woo_gallery_slider_weekly_scheduled_events', array( 'Woo_Gallery_Slider_Cache', 'delete_expired_transients' ) );
		// Redirect after active.
		add_action( 'activated_plugin', array( $this, 'redirect_to' ) );

		if ( $this->is_active_theme( 'gearnix' ) ) {
			add_filter( 'wp_kses_allowed_html', array( $this, 'woo_gallery_support_additional_attributes' ), 99, 2 );
		}
	}

	/**
	 * Allow additional attributes for Gearnix theme div tags in wp_kses.
	 *
	 * @param array  $allowed_tags Existing allowed tags and attributes.
	 * @param string $context Context for the allowed tags.
	 * @return array Modified allowed tags.
	 */
	public function woo_gallery_support_additional_attributes( $allowed_tags, $context ) {
		if ( 'post' === $context || 'rbb-kses' === $context ) {

			// Supported video tags.
			$allowed_tags['video'] = array_merge(
				isset( $allowed_tags['video'] ) ? (array) $allowed_tags['video'] : array(),
				array(
					'data-setup'  => array(),
					'class'       => array(),
					'preload'     => array(),
					'volume'      => array(),
					'poster'      => array(),
					'playsinline' => array(),
					'id'          => array(),
					'tabindex'    => array(),
					'controls'    => array(),
					'allow'       => array(),
				)
			);

			$allowed_tags['source'] = array_merge(
				isset( $allowed_tags['source'] ) ? (array) $allowed_tags['source'] : array(),
				array(
					'src'  => array(),
					'type' => array(),
				)
			);

			// Extend (not replace) the allowed attributes: these rules apply site-wide.
			$allowed_tags['div'] = array_merge(
				isset( $allowed_tags['div'] ) ? (array) $allowed_tags['div'] : array(),
				array(
					'id'             => array(),
					'data-embed'     => array(),
					'data-loop'      => array(),
					'data-control'   => array(),
					'data-fancybox'  => array(),
					'data-src'       => array(),
					'data-autoplay'  => array(),
					'data-type'      => array(),
					'data-width'     => array(),
					'data-height'    => array(),
					'data-unique-id' => array(),
					'class'          => array(),
					'title'          => array(),
					'style'          => array(),
					'data-title'     => array(),
				)
			);
			$allowed_tags['iframe'] = array_merge(
				isset( $allowed_tags['iframe'] ) ? (array) $allowed_tags['iframe'] : array(),
				array(
					'src'             => array(),
					'width'           => array(),
					'height'          => array(),
					'frameborder'     => array(),
					'allowfullscreen' => array(),
					'allow'           => array(),
					'referrerpolicy'  => array(),
					'sandbox'         => array(),
					'scrolling'       => array(),
					'class'           => array(),
					'id'              => array(),
					'style'           => array(),
					'name'            => array(),
					'loading'         => array(),
					'title'           => array(),
					'aria-hidden'     => array(),
					'data-*'          => array(), // Allows all data attributes.
				)
			);
		}

		return $allowed_tags;
	}

	/**
	 * Check if a specific theme is active.
	 *
	 * @param string $theme_slug The slug of the theme to check.
	 * @return bool True if the theme is active, false otherwise.
	 */
	public function is_active_theme( $theme_slug ) {
		if ( empty( $theme_slug ) || ! is_string( $theme_slug ) ) {
			return false;
		}

		return get_template() === $theme_slug || get_stylesheet() === $theme_slug;
	}

	/**
	 * Register the scripts for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function register_all_scripts() {
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
		wp_register_style( 'wcgs-video', WOO_GALLERY_SLIDER_URL . 'public/css/video.min.css', array(), $this->version, 'all' );
		wp_register_style( $this->plugin_name . '-fontello', WOO_GALLERY_SLIDER_URL . 'admin/css/fontello.min.css', array(), $this->version, 'all' );
		wp_register_style( 'wcgs-swiper', WOO_GALLERY_SLIDER_URL . 'public/css/swiper.min.css', array(), $this->version, 'all' );
		wp_register_style( 'wcgs-fancybox', WOO_GALLERY_SLIDER_URL . 'public/css/fancybox.min.css', array(), $this->version, 'all' );
		wp_register_style( $this->plugin_name, WOO_GALLERY_SLIDER_URL . 'public/css/woo-gallery-slider-public.min.css', array(), $this->version, 'all' );
		wp_register_style( $this->plugin_name . '-admin', WOO_GALLERY_SLIDER_URL . 'admin/css/woo-gallery-slider-admin.min.css', array(), $this->version, 'all' );
		// JS file register.
		wp_register_script( 'wcgs-fancybox', WOO_GALLERY_SLIDER_URL . 'public/js/fancybox-bundle.min.js', array( 'jquery' ), $this->version, true );
		wp_register_script( $this->plugin_name, WOO_GALLERY_SLIDER_URL . 'public/js/woo-gallery-slider-public.min.js', array( 'jquery' ), $this->version, true );
		wp_register_script( $this->plugin_name . '-admin', WOO_GALLERY_SLIDER_URL . 'admin/js/woo-gallery-slider-admin.min.js', array( 'jquery' ), $this->version, true );
		wp_register_script( 'wcgs-video', WOO_GALLERY_SLIDER_URL . 'public/js/video.min.js', array( 'jquery' ), $this->version, true );
		wp_register_script( 'wcgs-zoom', WOO_GALLERY_SLIDER_URL . 'public/js/zoom.min.js', array( 'jquery' ), $this->version, true );
	}
	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks() {
		$plugin_public = new Woo_Gallery_Slider_Public( $this->get_plugin_name(), $this->get_version(), $this->settings );

		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts', 94 ); // Added priority for fixing css conflict with Astra theme.
		// Custom Woocommerce Product Gallery.
		$this->loader->add_action( 'wc_get_template', $plugin_public, 'wpgsp_gallery_template_override', 99, 2 );
		// Sale badge compatible.
		add_action(
			'sp_woo_gallery_slider_before_container',
			function () {
				do_action( 'flatsome_sale_flash' ); // Sale badge for flatsome theme.
				do_action( 'urna_woocommerce_before_product_block_grid' ); // Sales flash for urna theme.
			}
		);

		if ( ! is_admin() ) {
			remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 10 );
			if ( class_exists( 'WC_PRODUCT_VIDEO_GALLERY_RENDERING' ) ) {
				remove_action( 'plugins_loaded', 'nickx_remove_woo_hooks' );
			}
		}
	}

	/**
	 * Open the dashboard after the plugin is activated.
	 *
	 * The first install on a site (no stored version yet; the wizard flag is
	 * set on the next page load) opens the Setup Wizard (`#wizard`), as does
	 * a reactivation while the wizard was never finished or closed. Any other
	 * activation opens Global Settings.
	 *
	 * Skipped for AJAX, REST, WP-CLI and bulk activations: exiting there
	 * would break the response or stop the plugins after this one from
	 * being activated.
	 *
	 * @since 4.0.0 Opens the Setup Wizard on a first install.
	 * @param mixed $plugin plugin file.
	 * @return void
	 */
	public function redirect_to( $plugin ) {
		if ( WOO_GALLERY_SLIDER_BASENAME !== $plugin || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			return;
		}
		// Bulk "Activate" from the top (`action`) or bottom (`action2`) dropdown of the plugins list.
		foreach ( array( 'action', 'action2' ) as $field ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only reads which plugins.php action is running; plugins.php checked its nonce.
			if ( isset( $_REQUEST[ $field ] ) && 'activate-selected' === sanitize_key( wp_unslash( $_REQUEST[ $field ] ) ) ) {
				return;
			}
		}

		$route = ( false === get_option( 'woo_gallery_slider_version' ) || Woo_Gallery_Slider_Dashboard_API::is_wizard_pending() ) ? 'wizard' : 'global';
		wp_safe_redirect( Woo_Gallery_Slider_Dashboard::url( $route ) );
		exit;
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    Woo_Gallery_Slider_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}
}
