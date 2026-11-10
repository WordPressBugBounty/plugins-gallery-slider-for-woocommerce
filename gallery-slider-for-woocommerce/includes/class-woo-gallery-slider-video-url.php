<?php
/**
 * The video URL of an image (`wcgs_video` attachment meta).
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
 * Registers the `wcgs_video` attachment meta and decides which URLs it may
 * hold: a video host the gallery embeds, or a video file it plays itself.
 *
 * The meta is registered with a sanitize callback, so every write (the
 * media dialog's Video Link field, the CSV and WebToffee imports, REST)
 * stores an accepted URL or ''. It is shown in REST (`meta.wcgs_video` on
 * `wp/v2/media`), editable by users who can edit the attachment.
 */
class Woo_Gallery_Slider_Video_Url {

	/**
	 * Attachment meta holding an image's video URL.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const META_KEY = 'wcgs_video';

	/**
	 * Hosts the gallery embeds (a host matches itself and its subdomains).
	 * Same services as the template's video rendering.
	 *
	 * @since 4.0.0
	 * @var string[]
	 */
	const HOSTS = array(
		'youtube.com',
		'youtu.be',
		'youtube-nocookie.com',
		'vimeo.com',
		'dailymotion.com',
		'dai.ly',
		'facebook.com',
		'fb.watch',
		'wistia.com',
		'wistia.net',
		'wi.st',
		'sproutvideo.com',
		'vids.io',
		'mediadelivery.net',
	);

	/**
	 * File extensions the gallery plays in its own `<video>` player.
	 *
	 * @since 4.0.0
	 * @var string[]
	 */
	const EXTENSIONS = array( 'mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov' );

	/**
	 * Register the hooks.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_meta' ) );
		add_filter( 'rest_request_before_callbacks', array( __CLASS__, 'keep_unchanged_rest_value' ), 10, 3 );
	}

	/**
	 * Leave an image's stored video alone when a REST request sends it back
	 * unchanged. Core compares the sanitized value with the stored one, so a
	 * video saved before 4.0 on a host not listed in HOSTS would otherwise be
	 * stored as '' by any client that resends the whole `meta` object (as the
	 * media modal's own save leaves it alone, see Admin::wcgs_add_media_custom_field_save()).
	 *
	 * @since 4.0.0
	 * @param mixed           $response Response so far (null unless a filter set one).
	 * @param array           $handler  Route handler.
	 * @param WP_REST_Request $request  Request.
	 * @return mixed
	 */
	public static function keep_unchanged_rest_value( $response, $handler, $request ) {
		$meta = $request->get_param( 'meta' );
		$id   = absint( $request->get_param( 'id' ) );
		if ( ! $id || ! is_array( $meta ) || ! array_key_exists( self::META_KEY, $meta ) || ! is_string( $meta[ self::META_KEY ] ) ) {
			return $response;
		}
		if ( 'attachment' === get_post_type( $id ) && get_post_meta( $id, self::META_KEY, true ) === $meta[ self::META_KEY ] ) {
			unset( $meta[ self::META_KEY ] );
			$request->set_param( 'meta', $meta );
		}
		return $response;
	}

	/**
	 * Register the attachment meta, with its sanitizing and REST access.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public static function register_meta() {
		register_post_meta(
			'attachment',
			self::META_KEY,
			array(
				'type'              => 'string',
				'description'       => __( 'Video URL shown for this image in Reno Product Gallery.', 'gallery-slider-for-woocommerce' ),
				'single'            => true,
				'show_in_rest'      => array(
					'schema' => array(
						'type'   => 'string',
						'format' => 'uri',
					),
				),
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
				'auth_callback'     => array( __CLASS__, 'can_edit' ),
			)
		);
	}

	/**
	 * Only users who can edit the attachment may change its video.
	 *
	 * @since 4.0.0
	 * @param bool   $allowed  Whether the user can edit the meta.
	 * @param string $meta_key Meta key.
	 * @param int    $post_id  Attachment ID.
	 * @return bool
	 */
	public static function can_edit( $allowed, $meta_key, $post_id ) {
		return current_user_can( 'edit_post', $post_id );
	}

	/**
	 * A video URL to store: the URL when it is accepted, else ''.
	 *
	 * @since 4.0.0
	 * @param mixed $url URL.
	 * @return string
	 */
	public static function sanitize( $url ) {
		$url = is_string( $url ) ? esc_url_raw( trim( $url ), array( 'http', 'https' ) ) : '';
		return self::is_valid( $url ) ? $url : '';
	}

	/**
	 * Whether a URL is a video the gallery can show: on one of HOSTS, or a
	 * video file (by extension, also a path-only URL on this site).
	 *
	 * @since 4.0.0
	 * @param string $url URL.
	 * @return bool
	 */
	public static function is_valid( $url ) {
		$valid = false;
		$parts = is_string( $url ) && '' !== $url ? wp_parse_url( $url ) : false;
		if ( is_array( $parts ) ) {
			$host = isset( $parts['host'] ) ? strtolower( $parts['host'] ) : '';
			$path = isset( $parts['path'] ) ? $parts['path'] : '';
			// A full URL needs http(s); a path-only one is on this site.
			$scheme_ok = '' === $host ? ! isset( $parts['scheme'] ) : isset( $parts['scheme'] ) && in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true );
			if ( $scheme_ok ) {
				$valid = in_array( strtolower( pathinfo( $path, PATHINFO_EXTENSION ) ), self::EXTENSIONS, true );
				foreach ( self::HOSTS as $video_host ) {
					if ( $host === $video_host || substr( $host, -strlen( '.' . $video_host ) ) === '.' . $video_host ) {
						$valid = true;
						break;
					}
				}
			}
		}

		/**
		 * Filters whether a URL may be stored as an image's video (e.g. to
		 * allow a CDN that serves video files without an extension).
		 *
		 * @since 4.0.0
		 * @param bool   $valid Whether the URL is accepted.
		 * @param string $url   The URL.
		 */
		return (bool) apply_filters( 'wcgs_is_valid_video_url', $valid, $url );
	}
}
