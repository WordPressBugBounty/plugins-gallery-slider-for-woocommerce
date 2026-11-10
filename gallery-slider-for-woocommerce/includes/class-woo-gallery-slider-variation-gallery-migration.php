<?php
/**
 * Migration of the plugin's variation galleries into WooCommerce core's.
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
 * Copies each variation's `woo_gallery_slider` images into the variation's
 * core `_product_image_gallery`.
 *
 * The 4.0.0 plugin update queues it (queue()). It runs in Action Scheduler
 * batches once WooCommerce core's variation gallery is enabled, so a store on
 * an older WooCommerce migrates after it updates WooCommerce. Per variation:
 * the core gallery keeps its images and gets the missing plugin images
 * appended (no duplicates, never the variation image), the result is read back
 * from the database and checked, and only then is MIGRATED_META set. The
 * plugin's meta is kept as a backup. A variation that fails MAX_ATTEMPTS times
 * is skipped and keeps its pre-migration read rule (see Variation_Gallery::ids()).
 *
 * Every image is copied, and both the free gallery and Pro show them all. The option, meta keys and hook are shared with Pro, so either
 * plugin picks up a migration the other started.
 */
class Woo_Gallery_Slider_Variation_Gallery_Migration {

	/**
	 * Migration state: status (pending|running|complete), queued_at,
	 * started_at, completed_at, migrated, skipped, failed. Autoloaded.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const OPTION = 'wcgs_core_gallery_migration';

	/**
	 * Action Scheduler hook of one batch.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const HOOK = 'wcgs_migrate_variation_galleries';

	/**
	 * Action Scheduler group.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const GROUP = 'gallery-slider-for-woocommerce';

	/**
	 * Variation meta: attempts made on the variation so far.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const ATTEMPTS_META = '_wcgs_core_gallery_migration_attempts';

	/**
	 * Variation meta: set after MAX_ATTEMPTS failed attempts. The variation is
	 * not selected again (delete the meta to retry it).
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const FAILED_META = '_wcgs_core_gallery_migration_failed';

	/**
	 * Attempts per variation before it is given up.
	 *
	 * @since 4.0.0
	 * @var int
	 */
	const MAX_ATTEMPTS = 3;

	/**
	 * Variations per batch.
	 *
	 * @since 4.0.0
	 * @var int
	 */
	const BATCH_SIZE = 100;

	/**
	 * Logger source (WooCommerce > Status > Logs).
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const LOG_SOURCE = 'gallery-slider-for-woocommerce';

	/**
	 * Register the hooks.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function init() {
		// Action Scheduler is ready on `init`, not on `plugins_loaded` where updates run.
		add_action( 'init', array( __CLASS__, 'maybe_schedule' ), 20 );
		add_action( self::HOOK, array( __CLASS__, 'run_batch' ) );
		add_action( 'added_post_meta', array( __CLASS__, 'reopen_on_legacy_write' ), 10, 3 );
		add_action( 'updated_post_meta', array( __CLASS__, 'reopen_on_legacy_write' ), 10, 3 );
	}

	/**
	 * Queue the migration (4.0.0 update). Creates the state only when a
	 * variation holds plugin gallery images, and only once.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function queue() {
		if ( false !== get_option( self::OPTION ) || ! self::has_legacy_galleries() ) {
			return;
		}
		add_option(
			self::OPTION,
			array(
				'status'       => 'pending',
				'queued_at'    => time(),
				'started_at'   => 0,
				'completed_at' => 0,
				'migrated'     => 0,
				'skipped'      => 0,
				'failed'       => 0,
			),
			'',
			// Autoloaded: maybe_schedule() reads it on every request, also after the migration finished.
			true
		);
	}

	/**
	 * Current migration state, or an empty array when none was queued.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public static function state() {
		$state = get_option( self::OPTION );
		return is_array( $state ) ? $state : array();
	}

	/**
	 * Whether the migration is queued or running and not finished.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public static function is_open() {
		$state = self::state();
		return isset( $state['status'] ) && in_array( $state['status'], array( 'pending', 'running' ), true );
	}

	/**
	 * Schedule a batch when the migration is open, core's gallery is enabled
	 * and no batch is pending or running. Runs on every `init`, so a batch
	 * chain stopped by a fatal error or a timeout starts again.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function maybe_schedule() {
		if ( ! self::is_open() || ! Woo_Gallery_Slider_Variation_Gallery::core_enabled() ) {
			return;
		}
		if ( ! function_exists( 'WC' ) || ! WC()->queue() || self::has_pending_or_running_batch() ) {
			return;
		}
		WC()->queue()->add( self::HOOK, array(), self::GROUP );
	}

	/**
	 * Action Scheduler callback: migrate one batch, then schedule the next one
	 * or finish.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function run_batch() {
		if ( ! self::is_open() || ! Woo_Gallery_Slider_Variation_Gallery::core_enabled() ) {
			return;
		}

		$state = self::state();
		if ( 'running' !== $state['status'] ) {
			$state['status']     = 'running';
			$state['started_at'] = time();
			update_option( self::OPTION, $state );
		}

		$counts = array(
			'migrated' => 0,
			'skipped'  => 0,
			'failed'   => 0,
		);
		foreach ( self::select_variation_ids( self::BATCH_SIZE ) as $variation_id ) {
			try {
				$result = self::migrate_variation( $variation_id );
			} catch ( Throwable $e ) {
				// Retried by the next batch, up to MAX_ATTEMPTS.
				self::log( 'error', sprintf( 'Variation #%d: %s', $variation_id, $e->getMessage() ) );
				$result = 'retry';
			}
			if ( isset( $counts[ $result ] ) ) {
				++$counts[ $result ];
			}
		}

		// Re-read: a legacy write during the batch may have changed the state.
		$state = self::state();
		foreach ( $counts as $key => $count ) {
			$state[ $key ] = ( isset( $state[ $key ] ) ? (int) $state[ $key ] : 0 ) + $count;
		}

		if ( empty( self::select_variation_ids( 1 ) ) ) {
			$state['status']       = 'complete';
			$state['completed_at'] = time();
			update_option( self::OPTION, $state );
			if ( class_exists( 'Woo_Gallery_Slider_Cache' ) ) {
				Woo_Gallery_Slider_Cache::purge_product_transients();
			}
			self::log(
				$state['failed'] ? 'warning' : 'info',
				sprintf(
					'Variation gallery migration complete: %1$d migrated, %2$d already in the core gallery, %3$d failed.',
					$state['migrated'],
					$state['skipped'],
					$state['failed']
				)
			);
			return;
		}

		update_option( self::OPTION, $state );
		WC()->queue()->add( self::HOOK, array(), self::GROUP );
	}

	/**
	 * Migrate one variation.
	 *
	 * @since 4.0.0
	 * @param int $variation_id Variation ID.
	 * @return string `migrated` (images added), `skipped` (core already held
	 *                them all) or `failed` (given up).
	 * @throws RuntimeException When the stored core gallery misses an image.
	 */
	public static function migrate_variation( $variation_id ) {
		$variation_id = absint( $variation_id );

		// set_ids() / add_ids() may have written core's gallery since the batch selected it.
		if ( Woo_Gallery_Slider_Variation_Gallery::is_migrated( $variation_id ) ) {
			return 'skipped';
		}

		// Counted before the work, so an attempt that ends in a fatal error counts too.
		$attempts = absint( get_post_meta( $variation_id, self::ATTEMPTS_META, true ) ) + 1;
		if ( $attempts > self::MAX_ATTEMPTS ) {
			update_post_meta( $variation_id, self::FAILED_META, 1 );
			self::log( 'error', sprintf( 'Variation #%d: gave up after %d attempts; it keeps its pre-migration gallery (core images if any, otherwise woo_gallery_slider).', $variation_id, self::MAX_ATTEMPTS ) );
			return 'failed';
		}
		update_post_meta( $variation_id, self::ATTEMPTS_META, $attempts );

		$legacy_ids = Woo_Gallery_Slider_Variation_Gallery::meta_ids( $variation_id );
		$valid_ids  = array_values( array_unique( array_filter( $legacy_ids, 'wp_attachment_is_image' ) ) );
		$dropped    = array_diff( $legacy_ids, $valid_ids );
		if ( ! empty( $dropped ) ) {
			self::log( 'notice', sprintf( 'Variation #%1$d: skipped missing or non-image attachments %2$s.', $variation_id, implode( ',', array_unique( $dropped ) ) ) );
		}

		// Every stored core entry is kept as it is.
		$core_ids     = wp_parse_id_list( (string) get_post_meta( $variation_id, Woo_Gallery_Slider_Variation_Gallery::CORE_META_KEY, true ) );
		$thumbnail_id = absint( get_post_meta( $variation_id, '_thumbnail_id', true ) );
		$add_ids      = array_values( array_diff( $valid_ids, $core_ids, array( $thumbnail_id ) ) );

		if ( ! empty( $add_ids ) ) {
			update_post_meta( $variation_id, Woo_Gallery_Slider_Variation_Gallery::CORE_META_KEY, implode( ',', array_merge( $core_ids, $add_ids ) ) );
		}

		// Verify against the database, not the meta cache.
		wp_cache_delete( $variation_id, 'post_meta' );
		$stored_ids = wp_parse_id_list( (string) get_post_meta( $variation_id, Woo_Gallery_Slider_Variation_Gallery::CORE_META_KEY, true ) );
		$missing    = array_diff( $valid_ids, $stored_ids, array( $thumbnail_id ) );
		if ( ! empty( $missing ) ) {
			throw new RuntimeException( sprintf( 'images %s are not in the stored core gallery.', esc_html( implode( ',', $missing ) ) ) );
		}

		update_post_meta( $variation_id, Woo_Gallery_Slider_Variation_Gallery::MIGRATED_META, time() );
		delete_post_meta( $variation_id, self::ATTEMPTS_META );

		clean_post_cache( $variation_id );
		if ( function_exists( 'wc_delete_product_transients' ) ) {
			wc_delete_product_transients( $variation_id );
		}
		if ( class_exists( 'Woo_Gallery_Slider_Cache' ) ) {
			Woo_Gallery_Slider_Cache::purge_product( wp_get_post_parent_id( $variation_id ) );
		}

		return empty( $add_ids ) ? 'skipped' : 'migrated';
	}

	/**
	 * A `woo_gallery_slider` write on a migrated variation (possible only
	 * while the core gallery is off: the classic field, an import) makes the
	 * variation pending again, so those images reach the core gallery once
	 * it is back on.
	 *
	 * @since 4.0.0
	 * @param int    $meta_id   Meta ID.
	 * @param int    $object_id Post ID.
	 * @param string $meta_key  Meta key.
	 * @return void
	 */
	public static function reopen_on_legacy_write( $meta_id, $object_id, $meta_key ) {
		if ( Woo_Gallery_Slider_Variation_Gallery::META_KEY !== $meta_key || Woo_Gallery_Slider_Variation_Gallery::core_enabled() ) {
			return;
		}
		if ( ! Woo_Gallery_Slider_Variation_Gallery::is_migrated( $object_id ) || 'product_variation' !== get_post_type( $object_id ) ) {
			return;
		}
		delete_post_meta( $object_id, Woo_Gallery_Slider_Variation_Gallery::MIGRATED_META );
		delete_post_meta( $object_id, self::FAILED_META );
		delete_post_meta( $object_id, self::ATTEMPTS_META );

		$state = self::state();
		if ( empty( $state ) ) {
			// Migrated outside the 4.0.0 run (set_ids() / add_ids()): start tracking.
			self::queue();
			return;
		}
		if ( 'complete' === $state['status'] ) {
			$state['status']       = 'pending';
			$state['completed_at'] = 0;
			update_option( self::OPTION, $state );
		}
	}

	/**
	 * Whether any variation holds plugin gallery images.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	private static function has_legacy_galleries() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- One-off migration check.
		return (bool) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT 1 FROM {$wpdb->postmeta} AS legacy
				INNER JOIN {$wpdb->posts} AS posts ON posts.ID = legacy.post_id AND posts.post_type = 'product_variation'
				WHERE legacy.meta_key = %s AND legacy.meta_value NOT IN ( '', '[]' )
				LIMIT 1",
				Woo_Gallery_Slider_Variation_Gallery::META_KEY
			)
		);
	}

	/**
	 * Variations with plugin gallery images that are neither migrated nor
	 * given up, lowest ID first.
	 *
	 * @since 4.0.0
	 * @param int $limit Maximum number of IDs.
	 * @return int[]
	 */
	private static function select_variation_ids( $limit ) {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Batch selection, the result changes on every batch.
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT legacy.post_id FROM {$wpdb->postmeta} AS legacy
				INNER JOIN {$wpdb->posts} AS posts ON posts.ID = legacy.post_id AND posts.post_type = 'product_variation'
				LEFT JOIN {$wpdb->postmeta} AS migrated ON migrated.post_id = legacy.post_id AND migrated.meta_key = %s
				LEFT JOIN {$wpdb->postmeta} AS failed ON failed.post_id = legacy.post_id AND failed.meta_key = %s
				WHERE legacy.meta_key = %s AND legacy.meta_value NOT IN ( '', '[]' )
					AND migrated.post_id IS NULL AND failed.post_id IS NULL
				GROUP BY legacy.post_id
				ORDER BY legacy.post_id ASC
				LIMIT %d",
				Woo_Gallery_Slider_Variation_Gallery::MIGRATED_META,
				self::FAILED_META,
				Woo_Gallery_Slider_Variation_Gallery::META_KEY,
				$limit
			)
		);
		return array_map( 'intval', $ids );
	}

	/**
	 * Whether a batch is pending or running (the same check as WooCommerce's
	 * own variation gallery migration).
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	private static function has_pending_or_running_batch() {
		$queue = WC()->queue();
		if ( null !== $queue->get_next( self::HOOK, array(), self::GROUP ) ) {
			return true;
		}
		$running = $queue->search(
			array(
				'hook'     => self::HOOK,
				'status'   => ActionScheduler_Store::STATUS_RUNNING,
				'group'    => self::GROUP,
				'per_page' => 1,
			),
			'ids'
		);
		return ! empty( $running );
	}

	/**
	 * Log a message to WooCommerce's logs.
	 *
	 * @since 4.0.0
	 * @param string $level   PSR-3 level.
	 * @param string $message Message.
	 * @return void
	 */
	private static function log( $level, $message ) {
		if ( function_exists( 'wc_get_logger' ) ) {
			wc_get_logger()->log( $level, $message, array( 'source' => self::LOG_SOURCE ) );
		}
	}
}
