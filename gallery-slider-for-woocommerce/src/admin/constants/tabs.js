import { __ } from '@wordpress/i18n';

/**
 * Header tabs (from the Reno settings design): Global Settings shows the
 * split view, Per-Product Layouts the layout list and editor, Settings the
 * Settings page.
 */
export const HEADER_TABS = [
	{
		key: 'global',
		label: __( 'Global Settings', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'layouts',
		label: __( 'Per-Product Layouts', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'settings',
		label: __( 'Settings', 'gallery-slider-for-woocommerce' ),
	},
];

/**
 * Pages a hash route can open: the header tabs, plus the Variation Swatches
 * page (its own admin submenu, shown without the plugin header).
 *
 * @since 4.0.0
 */
export const ROUTE_TABS = [
	...HEADER_TABS.map( ( tab ) => tab.key ),
	'swatches',
];
