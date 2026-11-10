<?php
/**
 * Variation gallery source: the plugin's own meta or WooCommerce core's.
 *
 * @link       https://shapedplugin.com/
 * @since      4.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Resolves the gallery images of a variation.
 *
 * WooCommerce 10.9 added a per-variation gallery behind the "Variation gallery"
 * feature toggle, and 11.1 enabled it for every store. Its field holds one
 * ordered list: the first image becomes the variation image and the rest are
 * saved to the variation's `_product_image_gallery`.
 *
 * While the core gallery is enabled, the plugin's "Variation Image Gallery"
 * field is hidden. The 4.0.0 update copies `woo_gallery_slider` into core's
 * gallery (Woo_Gallery_Slider_Variation_Gallery_Migration) and marks each
 * migrated variation with MIGRATED_META; a migrated variation shows only its
 * core gallery. Until then, a variation whose `_product_image_gallery` holds
 * images shows them, and any other keeps showing its `woo_gallery_slider` meta.
 * Core's field shows those same plugin images (fill_core_gallery()), and a
 * save of core's gallery marks the variation (as WooCommerce does for the
 * retired Additional Variation Images extension), so what the merchant saves
 * there is what the gallery shows, also when they empty it.
 * The legacy meta is never deleted: it is what the classic field reads.
 *
 * The keys are shared with Pro, which reads and migrates the same data.
 */
class Woo_Gallery_Slider_Variation_Gallery {

	/**
	 * The plugin's variation gallery meta: "[12,34]", or "12,34" from 3.x
	 * and some importers.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const META_KEY = 'woo_gallery_slider';

	/**
	 * WooCommerce core's variation gallery meta: "12,34".
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const CORE_META_KEY = '_product_image_gallery';

	/**
	 * Option of the core feature toggle in WooCommerce 10.9 and 11.0.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const CORE_FEATURE_OPTION = 'wc_feature_woocommerce_additional_variation_images_enabled';

	/**
	 * Variation meta set once WooCommerce core's gallery holds the variation's
	 * images (by the migration or a write through set_ids() / add_ids()).
	 * The plugin's meta is no longer read for it while the core gallery is on.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const MIGRATED_META = '_wcgs_core_gallery_migrated';

	/**
	 * Register the hooks that keep core's variation gallery field and the
	 * gallery the plugin shows in step.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function init() {
		add_filter( 'woocommerce_product_variation_get_gallery_image_ids', array( __CLASS__, 'fill_core_gallery' ), 20, 2 );
		add_action( 'woocommerce_admin_process_variation_object', array( __CLASS__, 'mark_admin_save' ), 20, 2 );
		add_filter( 'woocommerce_rest_pre_insert_product_variation_object', array( __CLASS__, 'mark_rest_save' ), 20, 2 );
		add_action( 'woocommerce_before_product_object_save', array( __CLASS__, 'mark_changed_gallery' ) );
	}

	/**
	 * Show a not yet migrated variation's plugin images in core's gallery
	 * (its admin field, REST, core's own frontend), as ids() does. Without it
	 * core's field shows an empty gallery while the plugin shows the legacy
	 * images, so a merchant can't see or remove them, and saving the field
	 * would mark the variation and drop them.
	 *
	 * @since 4.0.0
	 * @param array                $gallery_image_ids Gallery image IDs core resolved.
	 * @param WC_Product_Variation $variation         Variation.
	 * @return array
	 */
	public static function fill_core_gallery( $gallery_image_ids, $variation ) {
		if ( ! empty( $gallery_image_ids ) || ! $variation instanceof WC_Product_Variation || ! self::core_enabled() ) {
			return $gallery_image_ids;
		}
		$variation_id = $variation->get_id();
		if ( ! $variation_id || self::is_migrated( $variation_id ) ) {
			return $gallery_image_ids;
		}
		$ids = self::legacy_ids( $variation_id );
		if ( empty( $ids ) ) {
			return $gallery_image_ids;
		}
		// Core's field puts the variation image first and saves the first image as the variation image.
		return array_values( array_diff( $ids, array( (int) $variation->get_image_id( 'edit' ) ) ) );
	}

	/**
	 * Mark a variation when core's variation gallery field was saved in the
	 * product editor (also with no change, e.g. the plugin images removed
	 * from it, which leaves core's empty gallery as it was).
	 *
	 * @since 4.0.0
	 * @param WC_Product_Variation $variation Variation being saved.
	 * @param int                  $index     Variation row index.
	 * @return void
	 */
	public static function mark_admin_save( $variation, $index ) {
		// WooCommerce verified the variations nonce before this action.
		if ( isset( $_POST['variable_gallery_image_ids'][ $index ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			self::mark_core_managed( $variation );
		}
	}

	/**
	 * Mark a variation when a REST request sets its core gallery.
	 *
	 * @since 4.0.0
	 * @param WC_Product_Variation|WP_Error $variation Variation to be saved.
	 * @param WP_REST_Request               $request   Request.
	 * @return WC_Product_Variation|WP_Error
	 */
	public static function mark_rest_save( $variation, $request ) {
		if ( $variation instanceof WC_Product_Variation && isset( $request['gallery_image_ids'] ) ) {
			self::mark_core_managed( $variation );
		}
		return $variation;
	}

	/**
	 * Mark a variation when anything else (CRUD, an import, another plugin)
	 * changes its core gallery.
	 *
	 * @since 4.0.0
	 * @param WC_Product $product Product being saved.
	 * @return void
	 */
	public static function mark_changed_gallery( $product ) {
		if ( $product instanceof WC_Product_Variation && array_key_exists( 'gallery_image_ids', $product->get_changes() ) ) {
			self::mark_core_managed( $product );
		}
	}

	/**
	 * Set MIGRATED_META on a variation that is about to be saved, when core's
	 * gallery is on and the variation has plugin gallery meta. Saved with the
	 * variation.
	 *
	 * @since 4.0.0
	 * @param WC_Product_Variation $variation Variation.
	 * @return void
	 */
	private static function mark_core_managed( $variation ) {
		$variation_id = $variation->get_id();
		if ( ! $variation_id || ! self::core_enabled() || self::is_migrated( $variation_id ) || $variation->meta_exists( self::MIGRATED_META ) ) {
			return;
		}
		if ( metadata_exists( 'post', $variation_id, self::META_KEY ) ) {
			$variation->update_meta_data( self::MIGRATED_META, time() );
		}
	}

	/**
	 * Whether WooCommerce core manages the variation galleries.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public static function core_enabled() {
		$enabled = false;
		if ( defined( 'WC_VERSION' ) ) {
			// Pre-releases (11.1.0-rc.1, -beta.2, -dev) already ship the feature on: compare the release number only.
			$wc_version = preg_replace( '/^(\d+(?:\.\d+)*).*$/', '$1', WC_VERSION );
			if ( version_compare( $wc_version, '11.1.0', '>=' ) ) {
				$enabled = true;
			} elseif ( version_compare( $wc_version, '10.9.0', '>=' ) ) {
				$enabled = 'yes' === get_option( self::CORE_FEATURE_OPTION );
			}
		}

		/**
		 * Filters whether the variation galleries come from WooCommerce core
		 * (and the plugin's variation gallery field is hidden).
		 *
		 * @since 4.0.0
		 * @param bool $enabled Whether the core variation gallery is enabled.
		 */
		return (bool) apply_filters( 'wcgs_core_variation_gallery_enabled', $enabled );
	}

	/**
	 * Gallery image IDs of a variation, without its variation image.
	 *
	 * With the core gallery enabled: the core gallery of a migrated variation
	 * (even when empty, the merchant may have cleared it), otherwise the core
	 * gallery when it holds images, otherwise the plugin's meta. With the core
	 * gallery disabled: the plugin's meta. Attachments that no longer exist
	 * are left out of both (core's list keeps image attachments only).
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return int[]
	 */
	public static function ids( $variation_id ) {
		if ( self::core_enabled() ) {
			$core_ids = self::core_ids( $variation_id );
			if ( ! empty( $core_ids ) || self::is_migrated( $variation_id ) ) {
				return $core_ids;
			}
		}
		return self::legacy_ids( $variation_id );
	}

	/**
	 * The plugin's variation meta without the attachments that were deleted.
	 * Only existence is checked: the gallery renders any attachment with a
	 * URL, also one without a local file (offloaded or external media), which
	 * `wp_attachment_is_image()` would reject.
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return int[]
	 */
	public static function legacy_ids( $variation_id ) {
		$ids = self::meta_ids( $variation_id );
		self::prime( $ids );
		return array_values( array_filter( $ids, array( __CLASS__, 'attachment_exists' ) ) );
	}

	/**
	 * Whether an attachment with this ID exists.
	 *
	 * @since 4.0.0
	 * @param int $id Attachment ID.
	 * @return bool
	 */
	public static function attachment_exists( $id ) {
		return 'attachment' === get_post_type( $id );
	}

	/**
	 * Load the attachments and their meta in two queries, instead of two
	 * per image in the checks that follow.
	 *
	 * @since 4.0.0
	 * @param int[] $ids Attachment IDs.
	 * @return void
	 */
	private static function prime( array $ids ) {
		if ( ! empty( $ids ) ) {
			_prime_post_caches( array_unique( $ids ), false, true );
		}
	}

	/**
	 * Whether core's gallery owns the variation's images (MIGRATED_META is set).
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return bool
	 */
	public static function is_migrated( $variation_id ) {
		return metadata_exists( 'post', $variation_id, self::MIGRATED_META );
	}

	/**
	 * Images of the variation's core gallery that still exist. Read from the
	 * meta, not `get_gallery_image_ids()`, which core filters (its fallback to
	 * the retired Additional Variation Images extension).
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return int[]
	 */
	public static function core_ids( $variation_id ) {
		$value = (string) get_post_meta( $variation_id, self::CORE_META_KEY, true );
		$ids   = array_filter( array_map( 'absint', explode( ',', $value ) ) );
		self::prime( $ids );
		return array_values( array_filter( $ids, 'wp_attachment_is_image' ) );
	}

	/**
	 * Gallery image IDs stored in the plugin's variation meta.
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return int[]
	 */
	public static function meta_ids( $variation_id ) {
		$value = (string) get_post_meta( $variation_id, self::META_KEY, true );
		return array_values( array_filter( array_map( 'absint', explode( ',', trim( $value, '[] ' ) ) ) ) );
	}

	/**
	 * Replace a variation's gallery (imports).
	 *
	 * With the core gallery enabled, it writes core's `_product_image_gallery`
	 * (without the variation image) and marks the variation migrated;
	 * otherwise it writes the plugin's meta as "[12,34]".
	 *
	 * @since 4.0.0
	 * @param int   $variation_id Variation ID.
	 * @param int[] $ids          Image IDs, in order.
	 * @return void
	 */
	public static function set_ids( $variation_id, array $ids ) {
		self::write( $variation_id, self::clean_ids( $ids ), false );
	}

	/**
	 * Append images to a variation's gallery, skipping the ones it already
	 * holds (the "migrate from another plugin" tool).
	 *
	 * @since 4.0.0
	 * @param int   $variation_id Variation ID.
	 * @param int[] $ids          Image IDs, in order.
	 * @return void
	 */
	public static function add_ids( $variation_id, array $ids ) {
		self::write( $variation_id, self::clean_ids( $ids ), true );
	}

	/**
	 * Write a variation's gallery to core's meta or the plugin's meta.
	 *
	 * @since 4.0.0
	 * @param int   $variation_id Variation ID.
	 * @param int[] $ids          Positive, unique image IDs.
	 * @param bool  $merge        Append to the current gallery instead of replacing it.
	 * @return void
	 */
	private static function write( $variation_id, array $ids, $merge ) {
		$variation_id = absint( $variation_id );
		if ( ! $variation_id ) {
			return;
		}

		if ( self::core_enabled() ) {
			if ( $merge ) {
				// Like the migration, keep every stored core entry as it is.
				$current = wp_parse_id_list( (string) get_post_meta( $variation_id, self::CORE_META_KEY, true ) );
				if ( ! self::is_migrated( $variation_id ) ) {
					// Marked migrated below, so take along what the migration would have appended.
					$current = array_merge( $current, array_filter( self::meta_ids( $variation_id ), 'wp_attachment_is_image' ) );
				}
				$ids = self::clean_ids( array_merge( $current, $ids ) );
			}
			// Core's field holds the variation image in `_thumbnail_id`, not in the gallery.
			$thumbnail_id = absint( get_post_meta( $variation_id, '_thumbnail_id', true ) );
			$ids          = array_values( array_diff( $ids, array( $thumbnail_id ) ) );
			update_post_meta( $variation_id, self::CORE_META_KEY, implode( ',', $ids ) );
			update_post_meta( $variation_id, self::MIGRATED_META, time() );
			// The migration's bookkeeping is moot once core's gallery holds the images.
			delete_post_meta( $variation_id, '_wcgs_core_gallery_migration_attempts' );
			delete_post_meta( $variation_id, '_wcgs_core_gallery_migration_failed' );
		} else {
			if ( $merge ) {
				$ids = self::clean_ids( array_merge( self::meta_ids( $variation_id ), $ids ) );
			}
			update_post_meta( $variation_id, self::META_KEY, wp_json_encode( $ids ) );
		}

		if ( class_exists( 'Woo_Gallery_Slider_Cache' ) ) {
			Woo_Gallery_Slider_Cache::purge_product( wp_get_post_parent_id( $variation_id ) );
		}
	}

	/**
	 * Positive, unique image IDs, in their first order.
	 *
	 * @since 4.0.0
	 * @param array $ids Image IDs.
	 * @return int[]
	 */
	private static function clean_ids( array $ids ) {
		return array_values( array_unique( array_filter( array_map( 'absint', $ids ) ) ) );
	}
}
