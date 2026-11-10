import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Free add-ons from the Reno team, offered by the Setup Wizard's Plugins
 * step and the Variation Swatches page, and the helpers that install and
 * activate them through the core REST API (`/wp/v2/plugins`).
 *
 * @since 4.0.0
 */

/**
 * WordPress.org slug of Smart Swatches.
 */
export const SWATCHES_SLUG = 'smart-swatches';

/**
 * Settings page of Smart Swatches (its `ssp_settings` admin menu).
 */
export const SWATCHES_ADMIN_URL = 'admin.php?page=ssp_settings#tab=general';

/**
 * Icon of a plugin on WordPress.org. The 128px file is already sharp in the
 * 48px tile on 2x screens, and the 256px GIFs are several times heavier.
 *
 * @param {string} slug WordPress.org slug.
 * @return {string} Icon URL.
 */
const orgIcon = ( slug ) =>
	`https://ps.w.org/${ slug }/assets/icon-128x128.gif`;

/**
 * Add-ons of the Plugins step: WordPress.org slug, icon, the monogram and
 * tile color shown when the icon can't load, name and description.
 */
export const ADDONS = [
	{
		slug: SWATCHES_SLUG,
		icon: orgIcon( SWATCHES_SLUG ),
		mono: 'SV',
		color: '#7C3AED',
		name: __(
			'Smart Variation Swatches',
			'gallery-slider-for-woocommerce'
		),
		description: __(
			'Color, image and label swatches. A swatch click switches the gallery images.',
			'gallery-slider-for-woocommerce'
		),
	},
	{
		slug: 'shaped-recommend',
		icon: orgIcon( 'shaped-recommend' ),
		mono: 'SR',
		color: '#0E7C66',
		name: __( 'ShapedRecommend', 'gallery-slider-for-woocommerce' ),
		description: __(
			'Related and frequently bought together products on product and cart pages.',
			'gallery-slider-for-woocommerce'
		),
	},
	{
		slug: 'reno-cart',
		icon: orgIcon( 'reno-cart' ),
		mono: 'SC',
		color: '#C2410C',
		name: __( 'ShapedCart', 'gallery-slider-for-woocommerce' ),
		description: __(
			'A slide-out cart so shoppers keep browsing after adding to cart.',
			'gallery-slider-for-woocommerce'
		),
	},
	{
		slug: 'wp-expand-tabs-free',
		icon: orgIcon( 'wp-expand-tabs-free' ),
		mono: 'PT',
		color: '#2563EB',
		name: __(
			'Product Tabs for WooCommerce',
			'gallery-slider-for-woocommerce'
		),
		description: __(
			'Custom tabs for specs, size guides, shipping info and FAQs.',
			'gallery-slider-for-woocommerce'
		),
	},
];

/**
 * Folder (WordPress.org slug) of a plugin id such as `smart-swatches/smart-swatches`.
 *
 * @param {string} plugin Plugin id from `/wp/v2/plugins`.
 * @return {string} Slug.
 */
const slugOf = ( plugin ) => String( plugin ).split( '/' )[ 0 ];

/**
 * Installed plugins, keyed by slug.
 *
 * @return {Promise<Object>} `{ slug: { plugin, status } }`; status is 'active' or 'inactive'.
 */
export const fetchPluginStatuses = async () => {
	const items = await apiFetch( {
		path: '/wp/v2/plugins?_fields=plugin,status',
	} );
	const statuses = {};
	( Array.isArray( items ) ? items : [] ).forEach( ( { plugin, status } ) => {
		statuses[ slugOf( plugin ) ] = { plugin, status };
	} );
	return statuses;
};

/**
 * Install (from WordPress.org) and activate a plugin, or only activate it
 * when it is installed already.
 *
 * Some plugins redirect right after they are activated, so the request can
 * fail although the plugin is active: a failed request is checked against
 * the installed plugins before it counts as an error.
 *
 * @param {string}      slug    WordPress.org slug.
 * @param {Object|null} current Its `fetchPluginStatuses()` entry, if installed.
 * @return {Promise<Object>} `{ plugin, status: 'active' }`.
 */
export const installPlugin = async ( slug, current = null ) => {
	if ( 'active' === current?.status ) {
		return current;
	}
	try {
		const result = await apiFetch(
			current
				? {
						path: `/wp/v2/plugins/${ current.plugin }`,
						method: 'POST',
						data: { status: 'active' },
				  }
				: {
						path: '/wp/v2/plugins',
						method: 'POST',
						data: { slug, status: 'active' },
				  }
		);
		if ( 'active' === result?.status ) {
			return { plugin: result.plugin, status: 'active' };
		}
		throw new Error(
			__(
				'The plugin was installed but could not be activated.',
				'gallery-slider-for-woocommerce'
			)
		);
	} catch ( error ) {
		const after = await fetchPluginStatuses().catch( () => ( {} ) );
		if ( 'active' === after[ slug ]?.status ) {
			return after[ slug ];
		}
		throw error?.message
			? error
			: new Error(
					__(
						'The plugin could not be installed.',
						'gallery-slider-for-woocommerce'
					)
			  );
	}
};
