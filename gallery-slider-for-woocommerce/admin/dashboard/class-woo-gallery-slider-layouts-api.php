<?php
/**
 * REST API endpoints of the dashboard Per-Product Layouts tab.
 *
 * @link       https://shapedplugin.com/
 * @since      4.0.0
 *
 * @package    Woo_Gallery_Slider
 * @subpackage Woo_Gallery_Slider/admin/dashboard
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Lists, creates, edits, orders and assigns the `wcgs_layouts` posts for the
 * React Per-Product Layouts tab.
 *
 * It keeps the 3.x per-product storage unchanged:
 * - a layout's settings are its `wcgs_metabox` post meta (the General,
 *   Product Gallery and Lightbox keys, in the legacy shapes);
 * - where it applies is `wcgs_assigns['assign_layout_data']`, the rules the
 *   3.x Assign Layout page edited and `WCGS_Public_Helper` matches.
 *
 * The tab edits one assignment per layout (categories, products and the
 * products excluded from its categories). It is written as up to two rules
 * (one `specific_products`, one `category` carrying the exclusions in
 * `exclude_products`), and
 * the option is rebuilt from every published layout in list order: product
 * rules first, then category rules, so a product picked one by one wins over
 * a category match, as the tab promises. The frontend applies a rule whatever
 * the layout's post status, so an inactive (draft) layout has no rules; its
 * assignment waits in the `wcgs_layout_assign` post meta until it is activated.
 *
 * The free version has one per-product layout: a layout is created only
 * while no other (not trashed) layout exists, and there is no Duplicate.
 *
 * @since 4.0.0
 */
class Woo_Gallery_Slider_Layouts_API {

	/**
	 * REST API namespace.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const REST_NAMESPACE = 'wcgs/v1';

	/**
	 * Layout post type.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const POST_TYPE = 'wcgs_layouts';

	/**
	 * Post meta holding a layout's settings (the 3.x layout metabox).
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const SETTINGS_META = 'wcgs_metabox';

	/**
	 * Post meta holding a layout's assignment while it is inactive:
	 * `{ categories: [term ids], products: [product ids], exclude: [product ids] }`.
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const ASSIGN_META = 'wcgs_layout_assign';

	/**
	 * Option holding the assignment rules (the 3.x Assign Layout page).
	 *
	 * @since 4.0.0
	 * @var string
	 */
	const ASSIGNS_OPTION = 'wcgs_assigns';

	/**
	 * Post statuses of the layouts the tab handles: everything but the trash
	 * and WordPress's internal `auto-draft` and `inherit`.
	 *
	 * @since 4.0.0
	 * @var array
	 */
	const STATUSES = array( 'publish', 'draft', 'pending', 'private', 'future' );

	/**
	 * Global Settings REST API, for the field definitions and conversions.
	 *
	 * @since 4.0.0
	 * @var Woo_Gallery_Slider_Global_Settings_API
	 */
	private $global_settings_api;

	/**
	 * True while one of the endpoints writes layouts itself, so the status
	 * hooks don't rebuild the rules a second time.
	 *
	 * @since 4.0.0
	 * @var bool
	 */
	private $is_writing = false;

	/**
	 * Constructor.
	 *
	 * @since 4.0.0
	 * @param Woo_Gallery_Slider_Global_Settings_API $global_settings_api Global Settings REST API.
	 */
	public function __construct( $global_settings_api ) {
		$this->global_settings_api = $global_settings_api;
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		// A layout published, drafted, trashed or deleted elsewhere (WP-CLI, the trash purge, other code) keeps the rules in step.
		add_action( 'transition_post_status', array( $this, 'on_status_change' ), 10, 3 );
		add_action( 'deleted_post', array( $this, 'on_deleted' ), 10, 2 );
	}

	/**
	 * Rebuild the rules when a layout enters or leaves `publish` outside the
	 * dashboard. Without it, a layout trashed or drafted by other code keeps
	 * applying on the store, because the frontend checks no post status.
	 *
	 * @since 4.0.0
	 * @param string  $new_status New status.
	 * @param string  $old_status Old status.
	 * @param WP_Post $post       Post.
	 * @return void
	 */
	public function on_status_change( $new_status, $old_status, $post ) {
		if ( $this->is_writing || ! $post || self::POST_TYPE !== $post->post_type || $new_status === $old_status ) {
			return;
		}
		if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
			return;
		}
		// A layout published again (e.g. restored from the trash and published) gets its parked assignment back.
		$overrides = array();
		if ( 'publish' === $new_status ) {
			$rules = $this->get_rule_assignments();
			if ( ! isset( $rules[ $post->ID ] ) ) {
				$meta                   = get_post_meta( $post->ID, self::ASSIGN_META, true );
				$overrides[ $post->ID ] = $this->sanitize_assignment( is_array( $meta ) ? $meta : array() );
			}
		}
		$this->sync_assignments( $overrides );
		Woo_Gallery_Slider_Cache::purge_product_transients();
	}

	/**
	 * Rebuild the rules when a layout is deleted for good while still published.
	 *
	 * @since 4.0.0
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post.
	 * @return void
	 */
	public function on_deleted( $post_id, $post = null ) {
		if ( $this->is_writing || ! $post || self::POST_TYPE !== $post->post_type || 'publish' !== $post->post_status ) {
			return;
		}
		$this->sync_assignments();
		Woo_Gallery_Slider_Cache::purge_product_transients();
	}

	/**
	 * Settings fields of a layout: the Global Settings fields.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	public static function fields() {
		return Woo_Gallery_Slider_Global_Settings_API::fields();
	}

	/**
	 * Number of layouts that are not in the trash. The free version allows one.
	 *
	 * @since 4.0.0
	 * @return int
	 */
	public static function count_layouts() {
		$query = new WP_Query(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => self::STATUSES,
				'posts_per_page'   => 1,
				'fields'           => 'ids',
				'suppress_filters' => true,
			)
		);
		return (int) $query->found_posts;
	}

	/**
	 * The error a request gets when it would create a second layout.
	 *
	 * @since 4.0.0
	 * @return WP_Error
	 */
	public static function limit_error() {
		return new WP_Error(
			'wcgs_layout_limit',
			__( 'The free version includes one per-product layout. Upgrade to Pro to create unlimited per-product layouts.', 'gallery-slider-for-woocommerce' ),
			array(
				'status' => 403,
				'proUrl' => WOO_GALLERY_SLIDER_PRO_LINK,
			)
		);
	}

	/**
	 * Register the REST API routes.
	 *
	 * @since 4.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		$permission = array( $this, 'check_permission' );
		$id_arg     = array(
			'id' => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
		);
		$ids_arg    = array(
			'ids' => array(
				'type'    => 'array',
				'default' => array(),
				'items'   => array( 'type' => 'integer' ),
			),
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/layouts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_layouts' ),
					'permission_callback' => $permission,
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_layout' ),
					'permission_callback' => $permission,
				),
			)
		);
		register_rest_route(
			self::REST_NAMESPACE,
			'/layouts/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_layout' ),
					'permission_callback' => $permission,
					'args'                => $id_arg,
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'save_layout' ),
					'permission_callback' => $permission,
					'args'                => $id_arg,
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_layout' ),
					'permission_callback' => $permission,
					'args'                => $id_arg,
				),
			)
		);
		register_rest_route(
			self::REST_NAMESPACE,
			'/layouts/bulk',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'bulk_action' ),
				'permission_callback' => $permission,
				'args'                => $ids_arg + array(
					'action' => array(
						'type'    => 'string',
						'enum'    => array( 'activate', 'deactivate', 'delete' ),
						'default' => 'activate',
					),
				),
			)
		);
		register_rest_route(
			self::REST_NAMESPACE,
			'/layouts/products',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_products' ),
				'permission_callback' => $permission,
				'args'                => array(
					'search'     => array(
						'type'    => 'string',
						'default' => '',
					),
					'page'       => array(
						'type'    => 'integer',
						'default' => 1,
						'minimum' => 1,
					),
					'per_page'   => array(
						'type'    => 'integer',
						'default' => 10,
						'minimum' => 1,
						'maximum' => 50,
					),
					// No default: sent (even empty) only by the Exclude tab.
					'categories' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'integer' ),
					),
					'skip'       => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'integer' ),
					),
					// "Show only unassigned / not excluded": leave out what layouts other than this one (-1: a new layout) pick or exclude.
					'free_for'   => array(
						'type'    => 'integer',
						'default' => 0,
					),
					'free_kind'  => array(
						'type'    => 'string',
						'enum'    => array( 'products', 'exclude' ),
						'default' => 'products',
					),
				),
			)
		);
		register_rest_route(
			self::REST_NAMESPACE,
			'/layouts/preview-products',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_preview_products' ),
				'permission_callback' => $permission,
				'args'                => array(
					'id'         => array(
						'type'    => 'integer',
						'default' => 0,
					),
					'search'     => array(
						'type'    => 'string',
						'default' => '',
					),
					'categories' => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'integer' ),
					),
					'products'   => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'integer' ),
					),
					'exclude'    => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'integer' ),
					),
				),
			)
		);
		register_rest_route(
			self::REST_NAMESPACE,
			'/layouts/order',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'reorder_layouts' ),
				'permission_callback' => $permission,
				'args'                => $ids_arg,
			)
		);
	}

	/**
	 * Only users who can manage the plugin may use these endpoints.
	 * The REST nonce (X-WP-Nonce, sent by apiFetch) authenticates the cookie.
	 *
	 * @since 4.0.0
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( apply_filters( 'wcgs_ui_permission', 'manage_options' ) );
	}

	/**
	 * REST API: every layout with its assignment, plus the category tree and
	 * the labels of the assigned products.
	 *
	 * @since 4.0.0
	 * @return WP_REST_Response
	 */
	public function get_layouts() {
		return rest_ensure_response( $this->get_list_data() );
	}

	/**
	 * REST API: a layout to edit. Id 0 is a new layout, which starts from the
	 * Global Settings values.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_layout( WP_REST_Request $request ) {
		$id   = (int) $request->get_param( 'id' );
		$post = $id ? $this->get_layout_post( $id ) : null;
		if ( $id && ! $post ) {
			return $this->not_found();
		}
		return rest_ensure_response( $this->get_editor_data( $post ) );
	}

	/**
	 * REST API: create (POST /layouts) or update (POST /layouts/<id>) a layout:
	 * its name, status, settings and assignment.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_layout( WP_REST_Request $request ) {
		$id   = (int) $request->get_param( 'id' );
		$post = $id ? $this->get_layout_post( $id ) : null;
		if ( $id && ! $post ) {
			return $this->not_found();
		}
		if ( ! $post && self::count_layouts() > 0 ) {
			return self::limit_error();
		}
		$this->is_writing = true;

		// A request that leaves the name out keeps it, like the status.
		$name = $post && ! $request->has_param( 'name' ) ? $post->post_title : sanitize_text_field( (string) $request->get_param( 'name' ) );
		if ( '' === trim( $name ) ) {
			$name = __( 'Untitled Layout', 'gallery-slider-for-woocommerce' );
		}
		if ( $request->has_param( 'status' ) ) {
			$status = 'publish' === $request->get_param( 'status' ) ? 'publish' : 'draft';
		} else {
			// A request that leaves the status out keeps it.
			$status = $post && 'publish' === $post->post_status ? 'publish' : 'draft';
		}
		$postarr  = array(
			'post_title'  => $name,
			'post_status' => $status,
			'post_type'   => self::POST_TYPE,
		);
		$postarr += $post ? array( 'ID' => $post->ID ) : array( 'menu_order' => 0 );

		$result = $post ? wp_update_post( wp_slash( $postarr ), true ) : wp_insert_post( wp_slash( $postarr ), true );
		if ( is_wp_error( $result ) ) {
			$result->add_data( array( 'status' => 500 ) );
			return $result;
		}
		$id = (int) $result;

		$values = $request->get_param( 'values' );
		if ( is_array( $values ) ) {
			$meta = Woo_Gallery_Slider_Responsive::to_runtime( get_post_meta( $id, self::SETTINGS_META, true ) );
			$meta = is_array( $meta ) ? $meta : array();
			foreach ( self::fields() as $key => $field ) {
				if ( array_key_exists( $key, $values ) ) {
					$meta[ $key ] = $this->global_settings_api->to_storage( $values[ $key ], $field, isset( $meta[ $key ] ) ? $meta[ $key ] : null );
				}
			}
			update_post_meta( $id, self::SETTINGS_META, Woo_Gallery_Slider_Responsive::to_stored( $meta ) );
		}

		$assignment = null;
		if ( $request->has_param( 'categories' ) || $request->has_param( 'products' ) || $request->has_param( 'exclude' ) ) {
			$assignment = $this->sanitize_assignment(
				array(
					'categories' => $request->get_param( 'categories' ),
					'products'   => $request->get_param( 'products' ),
					'exclude'    => $request->get_param( 'exclude' ),
				)
			);
		}
		$this->sync_assignments( null === $assignment ? array() : array( $id => $assignment ) );
		Woo_Gallery_Slider_Cache::purge_product_transients();

		$item = $this->get_layout_item( get_post( $id ) );
		return rest_ensure_response(
			array(
				'layout'   => $item,
				'products' => $this->get_product_labels( array_values( array_unique( array_merge( $item['products'], $item['exclude'] ) ) ) ),
				'values'   => $this->read_layout_values( $id ),
				'message'  => __( 'Layout saved.', 'gallery-slider-for-woocommerce' ),
			)
		);
	}

	/**
	 * REST API: move a layout to the trash and drop its rules.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_layout( WP_REST_Request $request ) {
		$post = $this->get_layout_post( (int) $request->get_param( 'id' ) );
		if ( ! $post ) {
			return $this->not_found();
		}
		$this->trash_layouts( array( $post->ID ) );
		return rest_ensure_response(
			array(
				'deleted' => array( $post->ID ),
				'message' => __( 'Layout moved to the trash.', 'gallery-slider-for-woocommerce' ),
			)
		);
	}

	/**
	 * REST API: activate, deactivate or delete several layouts.
	 *
	 * Activate publishes the layouts that have an assignment (categories,
	 * products or exclusions; an unassigned layout stays a draft, as the
	 * list explains). Deactivate drafts them,
	 * which removes their rules from the store but keeps their assignment.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function bulk_action( WP_REST_Request $request ) {
		$action = (string) $request->get_param( 'action' );
		$ids    = $this->layout_ids( (array) $request->get_param( 'ids' ) );

		if ( 'delete' === $action ) {
			$this->trash_layouts( $ids );
			return rest_ensure_response(
				array(
					'deleted' => $ids,
					'message' => sprintf(
						/* translators: %d: number of layouts. */
						_n( '%d layout moved to the trash.', '%d layouts moved to the trash.', count( $ids ), 'gallery-slider-for-woocommerce' ),
						count( $ids )
					),
				)
			);
		}

		$this->set_status( $ids, 'activate' === $action ? 'publish' : 'draft' );
		$list = $this->get_list_data();
		return rest_ensure_response(
			array(
				'layouts' => array_values(
					array_filter(
						$list['layouts'],
						function ( $item ) use ( $ids ) {
							return in_array( $item['id'], $ids, true );
						}
					)
				),
				'message' => 'activate' === $action
					? __( 'Layouts activated.', 'gallery-slider-for-woocommerce' )
					: __( 'Layouts deactivated.', 'gallery-slider-for-woocommerce' ),
			)
		);
	}

	/**
	 * REST API: store the list order. Rules follow it, so the first matching
	 * layout wins on the store as the list shows it.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function reorder_layouts( WP_REST_Request $request ) {
		$this->is_writing = true;
		global $wpdb;
		$ids = $this->layout_ids( (array) $request->get_param( 'ids' ) );
		foreach ( $ids as $index => $id ) {
			// Not wp_update_post(): a reorder is no edit, so the list's "Updated" must not move to "Just now".
			$wpdb->update( $wpdb->posts, array( 'menu_order' => $index + 1 ), array( 'ID' => $id ), array( '%d' ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- menu_order only; wp_update_post() would bump post_modified.
			clean_post_cache( $id );
		}
		$this->sync_assignments();
		Woo_Gallery_Slider_Cache::purge_product_transients();

		return rest_ensure_response(
			array(
				'ids'     => $ids,
				'message' => __( 'Order saved.', 'gallery-slider-for-woocommerce' ),
			)
		);
	}

	/**
	 * REST API: one page of products for the assign drawer. With
	 * `categories`, only the products filed directly under them (the
	 * frontend matches a product's own categories, not their parents), as
	 * the Exclude tab lists them; `skip` leaves products out.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_products( WP_REST_Request $request ) {
		$categories = array_values( array_filter( array_map( 'absint', (array) $request->get_param( 'categories' ) ) ) );
		$args       = array(
			'post_type'        => 'product',
			'post_status'      => array( 'publish', 'private', 'draft', 'pending', 'future' ),
			'posts_per_page'   => min( 50, max( 1, (int) $request->get_param( 'per_page' ) ) ),
			'paged'            => max( 1, (int) $request->get_param( 'page' ) ),
			'orderby'          => 'title',
			'order'            => 'ASC',
			'suppress_filters' => true,
			'post__not_in'     => array_filter( array_map( 'absint', (array) $request->get_param( 'skip' ) ) ),
		);
		$search     = sanitize_text_field( (string) $request->get_param( 'search' ) );
		if ( '' !== $search ) {
			$args['s'] = $search;
		}
		$free_for = (int) $request->get_param( 'free_for' );
		if ( $free_for ) {
			$taken                = 'exclude' === $request->get_param( 'free_kind' ) ? $this->get_product_excluders( $free_for ) : $this->get_product_owners( $free_for );
			$args['post__not_in'] = array_merge( $args['post__not_in'], array_keys( $taken ) );
		}
		if ( $request->has_param( 'categories' ) ) {
			if ( ! $categories ) {
				return rest_ensure_response(
					array(
						'items' => array(),
						'total' => 0,
					)
				);
			}
			$args['tax_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- admin-only paged list.
				array(
					'taxonomy'         => 'product_cat',
					'field'            => 'term_id',
					'terms'            => $categories,
					'include_children' => false,
				),
			);
		}

		$query = new WP_Query( $args );
		$items = array();
		foreach ( $query->posts as $product ) {
			$items[] = $this->product_item( $product, $categories );
		}
		return rest_ensure_response(
			array(
				'items' => $items,
				'total' => (int) $query->found_posts,
			)
		);
	}

	/**
	 * REST API: the products the layout editor's preview can show, grouped
	 * as the design's product dropdown lists them: "Assigned Products" (the
	 * products picked one by one), then each assigned category with its
	 * products, without the excluded ones. A category product that another
	 * layout picks one by one is tagged with that layout, which wins on the
	 * store. Works on the unsaved assignment the request carries.
	 *
	 * @since 4.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_preview_products( WP_REST_Request $request ) {
		$id         = (int) $request->get_param( 'id' );
		$assignment = $this->sanitize_assignment(
			array(
				'categories' => $request->get_param( 'categories' ),
				'products'   => $request->get_param( 'products' ),
				'exclude'    => $request->get_param( 'exclude' ),
			)
		);
		$search     = sanitize_text_field( (string) $request->get_param( 'search' ) );

		// Products picked one by one elsewhere win on the store.
		$owners = $this->get_product_owners( $id, true );

		$base = array(
			'post_type'        => 'product',
			'post_status'      => array( 'publish', 'private', 'draft', 'pending', 'future' ),
			'orderby'          => 'title',
			'order'            => 'ASC',
			'suppress_filters' => true,
			'no_found_rows'    => true,
		);
		if ( '' !== $search ) {
			$base['s'] = $search;
		}
		$groups = array();
		$seen   = array_merge( $assignment['exclude'], $assignment['products'] );

		if ( $assignment['products'] ) {
			$items = array();
			foreach ( get_posts(
				$base + array(
					'post__in'       => $assignment['products'],
					'posts_per_page' => count( $assignment['products'] ),
				)
			) as $product ) {
				$items[] = $this->product_item( $product );
			}
			if ( $items ) {
				$groups[] = array(
					'key'   => 'assigned',
					'title' => __( 'Assigned Products', 'gallery-slider-for-woocommerce' ),
					'items' => $items,
				);
			}
		}

		$terms = $assignment['categories'] ? get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'include'    => $assignment['categories'],
				'hide_empty' => false,
				'orderby'    => 'include',
			)
		) : array();
		foreach ( is_wp_error( $terms ) ? array() : $terms as $term ) {
			$products = get_posts(
				$base + array(
					// The first page of each category is enough to pick a product to preview.
					'posts_per_page' => 20,
					'post__not_in'   => $seen,
					'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- admin-only, a few rows.
						array(
							'taxonomy'         => 'product_cat',
							'field'            => 'term_id',
							'terms'            => array( (int) $term->term_id ),
							'include_children' => false,
						),
					),
				)
			);
			$items    = array();
			foreach ( $products as $product ) {
				$seen[] = $product->ID;
				$item   = $this->product_item( $product );
				if ( isset( $owners[ $product->ID ] ) ) {
					$item['owner'] = $owners[ $product->ID ];
				}
				$items[] = $item;
			}
			if ( $items ) {
				$groups[] = array(
					'key'   => 'category-' . $term->term_id,
					'title' => html_entity_decode( $term->name ),
					'items' => $items,
				);
			}
		}

		return rest_ensure_response( array( 'groups' => $groups ) );
	}

	/**
	 * Products that layouts other than `$id` pick one by one in their
	 * assignment. With `$live_only`, only assignments that apply on the
	 * store (published).
	 *
	 * @since 4.0.0
	 * @param int  $id        Layout to leave out (0 or -1: none).
	 * @param bool $live_only Only published layouts' assignments.
	 * @return array `product id => layout name`.
	 */
	private function get_product_owners( $id, $live_only = false ) {
		$posts  = $this->get_layout_posts();
		$names  = array();
		$owners = array();
		foreach ( $posts as $post ) {
			$names[ $post->ID ] = '' !== $post->post_title ? html_entity_decode( $post->post_title ) : __( 'Untitled Layout', 'gallery-slider-for-woocommerce' );
		}
		// The free version applies the first layout only: later ones (kept from Pro) hold nothing.
		$free_id = $posts ? $posts[0]->ID : 0;
		foreach ( $this->collect_assignments( $posts ) as $layout_id => $other ) {
			if ( $layout_id === $id || $layout_id !== $free_id || ( $live_only && 'publish' !== get_post_status( $layout_id ) ) ) {
				continue;
			}
			foreach ( $other['products'] as $product_id ) {
				if ( ! isset( $owners[ $product_id ] ) ) {
					$owners[ $product_id ] = $names[ $layout_id ];
				}
			}
		}
		return $owners;
	}

	/**
	 * Products that layouts other than `$id` exclude.
	 *
	 * @since 4.0.0
	 * @param int $id Layout to leave out (0 or -1: none).
	 * @return array `product id => layout name`.
	 */
	private function get_product_excluders( $id ) {
		$posts   = $this->get_layout_posts();
		$found   = array();
		$free_id = $posts ? $posts[0]->ID : 0;
		foreach ( $this->collect_assignments( $posts ) as $layout_id => $other ) {
			if ( $layout_id === $id || $layout_id !== $free_id ) {
				continue;
			}
			foreach ( $other['exclude'] as $product_id ) {
				if ( ! isset( $found[ $product_id ] ) ) {
					$found[ $product_id ] = $layout_id;
				}
			}
		}
		return $found;
	}

	/**
	 * A product as the drawer and the preview dropdown list it, with the
	 * path of one of its categories (one of `$categories` when it has one).
	 *
	 * @since 4.0.0
	 * @param WP_Post $product    Product post.
	 * @param int[]   $categories Categories to prefer for the path.
	 * @return array `{ value, label, image, category }`.
	 */
	private function product_item( $product, $categories = array() ) {
		$image = get_the_post_thumbnail_url( $product, 'thumbnail' );
		$terms = get_the_terms( $product, 'product_cat' );
		$terms = is_array( $terms ) ? $terms : array();
		$term  = $terms ? reset( $terms ) : null;
		foreach ( $terms as $candidate ) {
			if ( in_array( (int) $candidate->term_id, $categories, true ) ) {
				$term = $candidate;
				break;
			}
		}
		$path = '';
		if ( $term ) {
			$path   = html_entity_decode( $term->name );
			$parent = $term->parent ? get_term( $term->parent, 'product_cat' ) : null;
			if ( $parent instanceof WP_Term ) {
				$path = html_entity_decode( $parent->name ) . ' › ' . $path;
			}
		}
		return array(
			'value'    => $product->ID,
			'label'    => '' !== $product->post_title ? html_entity_decode( $product->post_title ) : '#' . $product->ID,
			'image'    => $image ? $image : '',
			'category' => $path,
		);
	}

	/**
	 * A layout post the tab handles (one of `STATUSES`, as the list).
	 *
	 * @since 4.0.0
	 * @param int $id Post ID.
	 * @return WP_Post|null
	 */
	private function get_layout_post( $id ) {
		$post = $id ? get_post( $id ) : null;
		if ( ! $post || self::POST_TYPE !== $post->post_type || ! in_array( $post->post_status, self::STATUSES, true ) ) {
			return null;
		}
		return $post;
	}

	/**
	 * Existing (not trashed) layout IDs among the given ones.
	 *
	 * @since 4.0.0
	 * @param array $ids IDs.
	 * @return int[]
	 */
	private function layout_ids( $ids ) {
		$found = array();
		foreach ( array_unique( array_map( 'absint', $ids ) ) as $id ) {
			if ( $this->get_layout_post( $id ) ) {
				$found[] = (int) $id;
			}
		}
		return $found;
	}

	/**
	 * "Layout not found" error.
	 *
	 * @since 4.0.0
	 * @return WP_Error
	 */
	private function not_found() {
		return new WP_Error( 'wcgs_layout_not_found', __( 'This layout no longer exists.', 'gallery-slider-for-woocommerce' ), array( 'status' => 404 ) );
	}

	/**
	 * Every layout that is not in the trash, in list order.
	 *
	 * @since 4.0.0
	 * @return WP_Post[]
	 */
	private function get_layout_posts() {
		return get_posts(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => self::STATUSES,
				'posts_per_page'   => -1,
				'orderby'          => array(
					'menu_order' => 'ASC',
					'date'       => 'DESC',
				),
				// Every layout, whatever the language plugin filters.
				'suppress_filters' => true,
			)
		);
	}

	/**
	 * Trash layouts and drop their rules.
	 *
	 * @since 4.0.0
	 * @param int[] $ids Layout IDs.
	 * @return void
	 */
	private function trash_layouts( $ids ) {
		$this->is_writing = true;
		foreach ( $ids as $id ) {
			wp_trash_post( $id );
		}
		$this->sync_assignments();
		Woo_Gallery_Slider_Cache::purge_product_transients();
	}

	/**
	 * Publish or draft layouts. Activation needs an assignment.
	 *
	 * @since 4.0.0
	 * @param int[]  $ids    Layout IDs.
	 * @param string $status 'publish' or 'draft'.
	 * @return void
	 */
	private function set_status( $ids, $status ) {
		$this->is_writing = true;
		// Read the assignments before the status change decides where they come from.
		$assignments = $this->collect_assignments();
		$overrides   = array();
		foreach ( $ids as $id ) {
			$assignment = isset( $assignments[ $id ] ) ? $assignments[ $id ] : $this->empty_assignment();
			// Exclusions count too, as the list shows them.
			if ( 'publish' === $status && empty( $assignment['categories'] ) && empty( $assignment['products'] ) && empty( $assignment['exclude'] ) ) {
				continue;
			}
			wp_update_post(
				array(
					'ID'          => $id,
					'post_status' => $status,
				)
			);
			$overrides[ $id ] = $assignment;
		}
		$this->sync_assignments( $overrides );
		Woo_Gallery_Slider_Cache::purge_product_transients();
	}

	/**
	 * Sanitize an assignment from a request.
	 *
	 * @since 4.0.0
	 * @param array $assignment `{ categories, products, exclude }`.
	 * @return array `{ categories: int[], products: int[], exclude: int[] }`.
	 */
	private function sanitize_assignment( $assignment ) {
		$ids        = function ( $list ) {
			return array_values( array_unique( array_filter( array_map( 'absint', (array) $list ) ) ) );
		};
		$products   = $ids( isset( $assignment['products'] ) ? $assignment['products'] : array() );
		$categories = $ids( isset( $assignment['categories'] ) ? $assignment['categories'] : array() );
		return array(
			'categories' => $categories,
			'products'   => $products,
			// A product picked one by one is never excluded: its own rule comes first anyway.
			'exclude'    => array_values( array_diff( $ids( isset( $assignment['exclude'] ) ? $assignment['exclude'] : array() ), $products ) ),
		);
	}

	/**
	 * An empty assignment.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function empty_assignment() {
		return array(
			'categories' => array(),
			'products'   => array(),
			'exclude'    => array(),
		);
	}

	/**
	 * The stored rules of `wcgs_assigns`, keyed by layout ID and merged into
	 * one assignment per layout.
	 *
	 * @since 4.0.0
	 * @return array `layout id => { categories, products, exclude }`.
	 */
	private function get_rule_assignments() {
		$option = get_option( self::ASSIGNS_OPTION, array() );
		$rules  = is_array( $option ) && ! empty( $option['assign_layout_data'] ) && is_array( $option['assign_layout_data'] ) ? $option['assign_layout_data'] : array();
		$found  = array();
		// Category rules per layout: `layout id => [ { terms, exclude } ]`, to merge their exclusions.
		$category_rules = array();
		foreach ( $rules as $rule ) {
			if ( ! is_array( $rule ) || empty( $rule['layout'] ) ) {
				continue;
			}
			$layout_id = (int) ( is_array( $rule['layout'] ) ? reset( $rule['layout'] ) : $rule['layout'] );
			if ( ! $layout_id ) {
				continue;
			}
			if ( ! isset( $found[ $layout_id ] ) ) {
				$found[ $layout_id ] = $this->empty_assignment();
			}
			$from = isset( $rule['assign_product_from'] ) ? $rule['assign_product_from'] : '';
			if ( 'specific_products' === $from && ! empty( $rule['specific_product'] ) ) {
				$found[ $layout_id ]['products'] = array_merge( $found[ $layout_id ]['products'], array_map( 'absint', (array) $rule['specific_product'] ) );
			} elseif ( 'category' === $from && ! empty( $rule['assign_product_terms'] ) ) {
				$terms                             = array_map( 'absint', (array) $rule['assign_product_terms'] );
				$exclude                           = ! empty( $rule['exclude_products'] ) ? array_map( 'absint', (array) $rule['exclude_products'] ) : array();
				$found[ $layout_id ]['categories'] = array_merge( $found[ $layout_id ]['categories'], $terms );
				$category_rules[ $layout_id ][]    = array(
					'terms'   => $terms,
					'exclude' => $exclude,
				);
			}
		}
		foreach ( $category_rules as $layout_id => $layout_rules ) {
			$found[ $layout_id ]['exclude'] = $this->merge_rule_exclusions( $layout_rules );
		}
		foreach ( $found as $layout_id => $assignment ) {
			$found[ $layout_id ] = $this->sanitize_assignment( $assignment );
		}
		return $found;
	}

	/**
	 * The exclusions of a layout's category rules, merged for its single
	 * category rule.
	 *
	 * The free 3.x Assign Layout page kept one rule, but rules written by the
	 * Pro plugin (which shares `wcgs_assigns`) each carry their own
	 * exclusions ("categories A excluding p1", "categories B"), while the
	 * dashboard keeps one category rule per layout. A product stays excluded
	 * only when no other category rule of the layout would still match it, so
	 * p1, which is also in B, keeps the layout after the rules are merged.
	 *
	 * @since 4.0.0
	 * @param array $layout_rules `[ { terms: int[], exclude: int[] } ]`.
	 * @return int[] Product IDs.
	 */
	private function merge_rule_exclusions( $layout_rules ) {
		if ( count( $layout_rules ) < 2 ) {
			return $layout_rules ? $layout_rules[0]['exclude'] : array();
		}
		$excluded = array_filter( array_unique( array_merge( ...array_column( $layout_rules, 'exclude' ) ) ) );
		$kept     = array();
		foreach ( $excluded as $product_id ) {
			// The frontend matches a product's own categories only.
			$categories = wp_get_post_terms( $product_id, 'product_cat', array( 'fields' => 'ids' ) );
			$categories = is_wp_error( $categories ) ? array() : array_map( 'absint', $categories );
			$matched    = false;
			foreach ( $layout_rules as $rule ) {
				if ( ! in_array( $product_id, $rule['exclude'], true ) && array_intersect( $categories, $rule['terms'] ) ) {
					$matched = true;
					break;
				}
			}
			if ( ! $matched ) {
				$kept[] = $product_id;
			}
		}
		return $kept;
	}

	/**
	 * The assignment of every layout: from the rules when it has any (a
	 * published layout, or rules written before this API existed, by the 3.x
	 * Assign Layout page), from the `wcgs_layout_assign` meta otherwise.
	 *
	 * @since 4.0.0
	 * @param WP_Post[]|null $posts Layout posts, or null to load them.
	 * @return array `layout id => { categories, products, exclude }`.
	 */
	private function collect_assignments( $posts = null ) {
		$posts = null === $posts ? $this->get_layout_posts() : $posts;
		$rules = $this->get_rule_assignments();
		$map   = array();
		foreach ( $posts as $post ) {
			if ( 'publish' === $post->post_status && isset( $rules[ $post->ID ] ) ) {
				$map[ $post->ID ] = $rules[ $post->ID ];
				// Exclusions only reach the rules with a category rule; without one they wait in the meta.
				if ( ! $map[ $post->ID ]['categories'] ) {
					$meta                        = get_post_meta( $post->ID, self::ASSIGN_META, true );
					$parked                      = $this->sanitize_assignment( is_array( $meta ) ? $meta : array() );
					$map[ $post->ID ]['exclude'] = array_values( array_diff( $parked['exclude'], $map[ $post->ID ]['products'] ) );
				}
			} elseif ( isset( $rules[ $post->ID ] ) ) {
				// Rules of an unpublished layout (never synced yet, or added on the 3.x Assign Layout page): keep them.
				$map[ $post->ID ] = $rules[ $post->ID ];
			} else {
				// No rules: an inactive layout, or a published one the free version doesn't apply (see sync_assignments()).
				$meta             = get_post_meta( $post->ID, self::ASSIGN_META, true );
				$map[ $post->ID ] = $this->sanitize_assignment( is_array( $meta ) ? $meta : array() );
			}
		}
		return $map;
	}

	/**
	 * Write the assignments: the `wcgs_layout_assign` meta of every layout,
	 * and the `wcgs_assigns` rules of the published ones in list order
	 * (product rules first, then category rules).
	 *
	 * @since 4.0.0
	 * @param array $overrides `layout id => assignment` to use instead of the stored one.
	 * @return void
	 */
	private function sync_assignments( $overrides = array() ) {
		$posts       = $this->get_layout_posts();
		$assignments = $this->collect_assignments( $posts );
		foreach ( $overrides as $id => $assignment ) {
			$assignments[ (int) $id ] = $this->sanitize_assignment( $assignment );
		}

		$product_rules  = array();
		$category_rules = array();
		// The free version applies one layout: the first in list order. Others
		// (after a switch from Pro) keep their assignment in the meta only.
		$free_id = $posts ? $posts[0]->ID : 0;
		foreach ( $posts as $post ) {
			$assignment = isset( $assignments[ $post->ID ] ) ? $assignments[ $post->ID ] : $this->empty_assignment();
			update_post_meta( $post->ID, self::ASSIGN_META, $assignment );
			if ( 'publish' !== $post->post_status || $post->ID !== $free_id ) {
				continue;
			}
			if ( $assignment['products'] ) {
				$product_rules[] = array(
					'assign_product_from'  => 'specific_products',
					'assign_product_terms' => array(),
					'specific_product'     => array_map( 'strval', $assignment['products'] ),
					'layout'               => (string) $post->ID,
				);
			}
			if ( $assignment['categories'] ) {
				$category_rules[] = array(
					'assign_product_from'  => 'category',
					'assign_product_terms' => array_map( 'strval', $assignment['categories'] ),
					'specific_product'     => array(),
					'exclude_products'     => array_map( 'strval', $assignment['exclude'] ),
					'layout'               => (string) $post->ID,
				);
			}
		}

		$option = get_option( self::ASSIGNS_OPTION, array() );
		$option = is_array( $option ) ? $option : array();
		$rules  = array_merge( $product_rules, $category_rules );
		// The framework stores an empty group as ''.
		$option['assign_layout_data'] = $rules ? $rules : '';
		update_option( self::ASSIGNS_OPTION, $option );
		// Every endpoint that writes posts ends here, so the status hooks may run again.
		$this->is_writing = false;
	}

	/**
	 * The list data: layouts with their assignment, the category tree and
	 * the labels of every product referenced.
	 *
	 * @since 4.0.0
	 * @return array
	 */
	private function get_list_data() {
		$posts       = $this->get_layout_posts();
		$assignments = $this->collect_assignments( $posts );
		$product_ids = array();
		$layouts     = array();

		$free_id = $posts ? $posts[0]->ID : 0;
		foreach ( $posts as $post ) {
			$item        = $this->list_item( $post, $assignments[ $post->ID ], $free_id );
			$layouts[]   = $item;
			$product_ids = array_merge( $product_ids, $item['products'], $item['exclude'] );
		}

		return array(
			'layouts'    => $layouts,
			// Free allows one layout; the tab disables "Create New Layout" once it exists.
			'limit'      => 1,
			'canCreate'  => ! $layouts,
			'categories' => $this->get_category_tree(),
			'products'   => $this->get_product_labels( array_values( array_unique( $product_ids ) ) ),
		);
	}

	/**
	 * One layout as the list shows it, without building the whole list.
	 *
	 * @since 4.0.0
	 * @param WP_Post $post Layout post.
	 * @return array
	 */
	private function get_layout_item( $post ) {
		$assignments = $this->collect_assignments( array( $post ) );
		$posts       = $this->get_layout_posts();
		return $this->list_item( $post, $assignments[ $post->ID ], $posts ? $posts[0]->ID : 0 );
	}

	/**
	 * One layout of the list data.
	 *
	 * @since 4.0.0
	 * @param WP_Post $post       Layout post.
	 * @param array   $assignment `{ categories, products, exclude }`.
	 * @param int     $free_id    The layout the free version applies (the first in list order).
	 * @return array
	 */
	private function list_item( $post, $assignment, $free_id ) {
		$meta = get_post_meta( $post->ID, self::SETTINGS_META, true );
		$meta = is_array( $meta ) ? $meta : array();
		// Not post_modified_gmt: WordPress leaves it at zero for a new draft.
		$modified = get_post_timestamp( $post, 'modified' );
		$modified = $modified ? $modified : time();
		$age      = time() - $modified;

		return array(
			'id'             => $post->ID,
			'name'           => '' !== $post->post_title ? html_entity_decode( $post->post_title ) : __( 'Untitled Layout', 'gallery-slider-for-woocommerce' ),
			'status'         => 'publish' === $post->post_status ? 'publish' : 'draft',
			'layout'         => isset( $meta['gallery_layout'] ) ? (string) $meta['gallery_layout'] : '',
			'categories'     => $assignment['categories'],
			'products'       => $assignment['products'],
			'exclude'        => $assignment['exclude'],
			// Only the first layout applies on the store in the free version (others remain after a switch from Pro).
			'isActiveInFree' => $post->ID === $free_id,
			'modified'       => gmdate( 'c', $modified ),
			'updated'        => $age < MINUTE_IN_SECONDS
				? __( 'Just now', 'gallery-slider-for-woocommerce' )
				: sprintf(
					/* translators: %s: human-readable time difference. */
					__( '%s ago', 'gallery-slider-for-woocommerce' ),
					human_time_diff( $modified, time() )
				),
		);
	}

	/**
	 * Every product category as a flat tree: parents first, children under
	 * them with their depth, as the assign drawer lists them.
	 *
	 * @since 4.0.0
	 * @return array List of `{ value, label, count, parent, level }`.
	 */
	private function get_category_tree() {
		$terms = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => false,
				'number'     => 0,
				'orderby'    => 'name',
			)
		);
		if ( is_wp_error( $terms ) || ! $terms ) {
			return array();
		}

		$children = array();
		foreach ( $terms as $term ) {
			$children[ (int) $term->parent ][] = $term;
		}

		$tree = array();
		$walk = function ( $parent, $level ) use ( &$walk, &$tree, &$children ) {
			if ( empty( $children[ $parent ] ) ) {
				return;
			}
			foreach ( $children[ $parent ] as $term ) {
				$tree[] = array(
					'value'  => (int) $term->term_id,
					'label'  => html_entity_decode( $term->name ),
					'count'  => (int) $term->count,
					'parent' => (int) $term->parent,
					'level'  => $level,
				);
				$walk( (int) $term->term_id, $level + 1 );
			}
			unset( $children[ $parent ] );
		};
		$walk( 0, 0 );
		// Terms whose parent is missing (orphans) still get listed.
		foreach ( $children as $parent => $terms ) {
			foreach ( $terms as $term ) {
				$tree[] = array(
					'value'  => (int) $term->term_id,
					'label'  => html_entity_decode( $term->name ),
					'count'  => (int) $term->count,
					'parent' => (int) $term->parent,
					'level'  => 0,
				);
			}
		}
		return $tree;
	}

	/**
	 * Label and thumbnail of products, keyed by ID.
	 *
	 * @since 4.0.0
	 * @param int[] $ids Product IDs.
	 * @return object `{ id: { label, image } }` (an object in JSON even when empty).
	 */
	private function get_product_labels( $ids ) {
		$labels = array();
		foreach ( Woo_Gallery_Slider_Settings_API::find_products( '', $ids ) as $product ) {
			$labels[ $product['value'] ] = array(
				'label' => $product['label'],
				'image' => $product['image'],
			);
		}
		return (object) $labels;
	}

	/**
	 * The stored layout settings in the app shapes. Keys the layout never
	 * saved come from the Global Settings, which is what the store applies.
	 *
	 * @since 4.0.0
	 * @param int $id Layout ID, or 0 for the Global Settings values.
	 * @return array
	 */
	private function read_layout_values( $id ) {
		$global = $this->global_settings_api->read_values();
		$meta   = $id ? Woo_Gallery_Slider_Responsive::to_runtime( get_post_meta( $id, self::SETTINGS_META, true ) ) : array();
		$meta   = is_array( $meta ) ? $meta : array();
		$values = array();
		foreach ( self::fields() as $key => $field ) {
			if ( array_key_exists( $key, $meta ) ) {
				$values[ $key ] = $this->global_settings_api->from_storage( $meta[ $key ], $field );
			} elseif ( Woo_Gallery_Slider_Responsive::KEY === $key && $meta ) {
				// A saved layout without device values has none on the store
				// (Woo_Gallery_Slider_Responsive::from_layout()), not the global ones.
				$values[ $key ] = $this->global_settings_api->default_value( $field );
			} else {
				$values[ $key ] = $global[ $key ];
			}
		}
		return $values;
	}

	/**
	 * What the layout editor needs: the layout, its values, its starting
	 * values (the Global Settings, what Reset goes back to) and the picker
	 * choices.
	 *
	 * @since 4.0.0
	 * @param WP_Post|null $post Layout post, or null for a new layout.
	 * @return array
	 */
	private function get_editor_data( $post ) {
		$values = $this->read_layout_values( $post ? $post->ID : 0 );
		// A layout's starting values are the Global Settings: Reset goes back to them, as the design says.
		$defaults = $this->read_layout_values( 0 );

		$assignment = $this->empty_assignment();
		$layout     = null;
		if ( $post ) {
			$layout     = $this->get_layout_item( $post );
			$assignment = array(
				'categories' => $layout['categories'],
				'products'   => $layout['products'],
				'exclude'    => $layout['exclude'],
			);
		}

		return array(
			'id'         => $post ? $post->ID : 0,
			'name'       => $layout ? $layout['name'] : '',
			'status'     => $layout ? $layout['status'] : 'draft',
			'categories' => $assignment['categories'],
			'products'   => $assignment['products'],
			'exclude'    => $assignment['exclude'],
			'values'     => $values,
			'defaults'   => $defaults,
			'choices'    => array(
				'imageSizes' => $this->global_settings_api->get_image_sizes(),
			),
		);
	}
}
