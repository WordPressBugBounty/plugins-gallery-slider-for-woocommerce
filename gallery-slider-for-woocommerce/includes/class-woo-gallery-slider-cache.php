<?php
/**
 * Product gallery transient cache management.
 *
 * @link       https://shapedplugin.com/
 * @since      3.5.0
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
 * Manages the plugin's per-product gallery transient caches.
 *
 * Handles purging and expired-row cleanup for the two transient families
 * (variation JSON and cached gallery HTML), including rows orphaned by
 * previous plugin versions.
 */
class Woo_Gallery_Slider_Cache {

	/**
	 * Transient key patterns of the cached product gallery data.
	 *
	 * @since 3.5.0
	 * @var array
	 */
	private static $families = array(
		'wcgs_json_data%',
		'wcgs_gallery_html%',
	);

	/**
	 * Option holding the cache generation used in the keys with an external
	 * object cache, where transients can't be deleted by pattern. Shared with Pro.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const GENERATION_OPTION = 'wcgs_cache_generation';

	/**
	 * Transient key of a cached product gallery entry. With an external object
	 * cache the key carries the cache generation, so a purge only has to bump it
	 * (the old entries expire on their own).
	 *
	 * @since 4.0.0
	 * @param string $key Base key (`wcgs_gallery_html_{id}[_m]`, `wcgs_json_data{id}`).
	 * @return string
	 */
	public static function key( $key ) {
		if ( ! wp_using_ext_object_cache() ) {
			return $key;
		}
		return $key . '_g' . absint( get_option( self::GENERATION_OPTION, 1 ) );
	}

	/**
	 * Delete all cached product gallery transients, including rows orphaned
	 * by previous plugin versions and their timeout rows.
	 *
	 * With an external object cache the transients have no options-table rows
	 * and can't be matched by pattern: the cache generation in their keys is
	 * bumped instead (see key()), and 0 is returned.
	 *
	 * @since 3.5.0
	 * @return int Number of deleted cache entries (timeout rows excluded).
	 */
	public static function purge_product_transients() {
		global $wpdb;

		if ( wp_using_ext_object_cache() ) {
			update_option( self::GENERATION_OPTION, absint( get_option( self::GENERATION_OPTION, 1 ) ) + 1 );
			return 0;
		}

		$deleted    = 0;
		$wp_options = $wpdb->prefix . 'options';

		foreach ( self::$families as $family ) {
			$deleted += (int) $wpdb->query(
				$wpdb->prepare( "DELETE FROM {$wp_options} WHERE option_name LIKE %s", '\_transient\_' . $family )
			);
			$wpdb->query(
				$wpdb->prepare( "DELETE FROM {$wp_options} WHERE option_name LIKE %s", '\_transient\_timeout\_' . $family )
			);
		}

		if ( is_multisite() ) {
			$wp_sitemeta = $wpdb->sitemeta;
			foreach ( self::$families as $family ) {
				$deleted += (int) $wpdb->query(
					$wpdb->prepare( "DELETE FROM {$wp_sitemeta} WHERE meta_key LIKE %s", '\_site\_transient\_' . $family )
				);
				$wpdb->query(
					$wpdb->prepare( "DELETE FROM {$wp_sitemeta} WHERE meta_key LIKE %s", '\_site\_transient\_timeout\_' . $family )
				);
			}
		}

		return $deleted;
	}

	/**
	 * Delete the cached gallery data of one product: its variation JSON and
	 * its desktop and mobile gallery HTML. Works with an object cache too.
	 *
	 * @since 4.0.0
	 * @param int $product_id Product ID.
	 * @return void
	 */
	public static function purge_product( $product_id ) {
		$product_id = absint( $product_id );
		if ( ! $product_id ) {
			return;
		}
		delete_transient( self::key( 'wcgs_gallery_html_' . $product_id ) );
		delete_transient( self::key( 'wcgs_gallery_html_' . $product_id . '_m' ) );
		if ( is_multisite() ) {
			delete_site_transient( self::key( 'wcgs_json_data' . get_current_blog_id() . $product_id ) );
		} else {
			delete_transient( self::key( 'wcgs_json_data' . $product_id ) );
		}
	}

	/**
	 * Delete the cached gallery data of every product that shows an image:
	 * as its featured image, in its gallery, in a variation's gallery or in
	 * its description (the "attached" image source). Works with an object
	 * cache too.
	 *
	 * @since 4.0.0
	 * @param int $attachment_id Attachment ID.
	 * @return void
	 */
	public static function purge_attachment_products( $attachment_id ) {
		global $wpdb;

		$attachment_id = absint( $attachment_id );
		if ( ! $attachment_id ) {
			return;
		}
		// The ID as a whole entry of a comma list, with or without JSON brackets.
		$in_list  = '(^|[^0-9])' . $attachment_id . '([^0-9]|$)';
		$post_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT post_id FROM {$wpdb->postmeta} WHERE ( meta_key = '_thumbnail_id' AND meta_value = %s ) OR ( meta_key IN ( '_product_image_gallery', 'woo_gallery_slider' ) AND meta_value REGEXP %s )",
				(string) $attachment_id,
				$in_list
			)
		);
		$post_ids = array_merge(
			$post_ids,
			$wpdb->get_col(
				$wpdb->prepare(
					"SELECT ID FROM {$wpdb->posts} WHERE post_type = 'product' AND post_content LIKE %s",
					'%wp-image-' . $attachment_id . '%'
				)
			),
			array( wp_get_post_parent_id( $attachment_id ) )
		);

		$product_ids = array();
		foreach ( array_unique( array_map( 'absint', $post_ids ) ) as $post_id ) {
			$post_type = get_post_type( $post_id );
			if ( 'product_variation' === $post_type ) {
				$product_ids[] = wp_get_post_parent_id( $post_id );
			} elseif ( 'product' === $post_type ) {
				$product_ids[] = $post_id;
			}
		}
		foreach ( array_unique( $product_ids ) as $product_id ) {
			self::purge_product( $product_id );
		}
	}

	/**
	 * Delete expired and legacy product gallery transients from the database.
	 *
	 * Runs on the weekly scheduled event. Core removes an expired transient
	 * only when its key is read again, so rows for products never revisited
	 * would otherwise accumulate. Rows without a timeout companion are
	 * leftovers from versions before transients expired (including the
	 * orphaned versioned gallery HTML keys) and are swept as well. No-op when
	 * an external object cache handles transients (no database rows exist).
	 *
	 * @since 3.5.0
	 * @return void
	 */
	public static function delete_expired_transients() {
		global $wpdb;

		if ( wp_using_ext_object_cache() ) {
			return;
		}

		// Sweep the per-blog transient rows (the cached gallery HTML) — on
		// multisite that means every blog's options table, since each site
		// stores its own rows.
		$blog_ids = is_multisite()
			? get_sites( array( 'fields' => 'ids', 'number' => 0 ) )
			: array( get_current_blog_id() );

		foreach ( $blog_ids as $blog_id ) {
			$wp_options = $wpdb->get_blog_prefix( $blog_id ) . 'options';
			$wpdb->query(
				"DELETE cache_value, cache_timeout
				FROM {$wp_options} cache_value
				INNER JOIN {$wp_options} cache_timeout
					ON cache_timeout.option_name = REPLACE( cache_value.option_name, '_transient_wcgs_', '_transient_timeout_wcgs_' )
				WHERE cache_value.option_name LIKE '\_transient\_wcgs\_%'
					AND cache_timeout.option_value < UNIX_TIMESTAMP()"
			);
			// Legacy rows written before transients had an expiration.
			$wpdb->query(
				"DELETE cache_value
				FROM {$wp_options} cache_value
				LEFT JOIN {$wp_options} cache_timeout
					ON cache_timeout.option_name = REPLACE( cache_value.option_name, '_transient_wcgs_', '_transient_timeout_wcgs_' )
				WHERE cache_value.option_name LIKE '\_transient\_wcgs\_%'
					AND cache_timeout.option_name IS NULL"
			);
		}

		// Sweep the network rows in sitemeta — the variation JSON is stored
		// as a site transient on multisite.
		if ( is_multisite() ) {
			$wp_sitemeta = $wpdb->sitemeta;
			$wpdb->query(
				"DELETE cache_value, cache_timeout
				FROM {$wp_sitemeta} cache_value
				INNER JOIN {$wp_sitemeta} cache_timeout
					ON cache_timeout.meta_key = REPLACE( cache_value.meta_key, '_site_transient_wcgs_', '_site_transient_timeout_wcgs_' )
				WHERE cache_value.meta_key LIKE '\_site\_transient\_wcgs\_%'
					AND cache_timeout.meta_value < UNIX_TIMESTAMP()"
			);
			$wpdb->query(
				"DELETE cache_value
				FROM {$wp_sitemeta} cache_value
				LEFT JOIN {$wp_sitemeta} cache_timeout
					ON cache_timeout.meta_key = REPLACE( cache_value.meta_key, '_site_transient_wcgs_', '_site_transient_timeout_wcgs_' )
				WHERE cache_value.meta_key LIKE '\_site\_transient\_wcgs\_%'
					AND cache_timeout.meta_key IS NULL"
			);
		}
	}
}
