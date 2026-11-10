import { __ } from '@wordpress/i18n';

/**
 * Sub-tabs of the Settings header tab (`setDefs` in the design). Each one
 * maps to a sub-tab of the legacy Advanced section of `wcgs_settings`.
 * `icon` is the SVG markup inside a 24×24 viewBox.
 */
export const SETTINGS_TABS = [
	{
		key: 'advanced',
		label: __( 'Advanced Controls', 'gallery-slider-for-woocommerce' ),
		icon: (
			<>
				<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
				<circle cx="16" cy="6" r="2" />
				<circle cx="10" cy="12" r="2" />
				<circle cx="18" cy="18" r="2" />
			</>
		),
	},
	{
		key: 'speed',
		label: __( 'Speed Optimization', 'gallery-slider-for-woocommerce' ),
		icon: (
			<>
				<path d="M4.5 17a8 8 0 1 1 15 0" />
				<path d="M12 13l3.5-4" />
				<circle
					cx="12"
					cy="13"
					r="1.4"
					fill="currentColor"
					stroke="none"
				/>
				<path d="M6.6 11.4h.01M8.4 7.9h.01M12 6.5h.01" />
			</>
		),
	},
	{
		key: 'migration',
		label: __( 'Migration', 'gallery-slider-for-woocommerce' ),
		icon: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
	},
	{
		key: 'importexport',
		label: __( 'Import & Export', 'gallery-slider-for-woocommerce' ),
		icon: (
			<>
				<path d="M12 3v12M8 11l4 4 4-4" />
				<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
			</>
		),
	},
	{
		key: 'css',
		label: __( 'Additional CSS & JS', 'gallery-slider-for-woocommerce' ),
		icon: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
	},
];

// Documentation and support links used by the Settings tab and the header Help menu.
export const SETTINGS_LINKS = {
	pageBuilders:
		'https://docs.renoproductgallery.com/guide/integrations/page-builder-compatibility',
	speedGuide:
		'https://docs.renoproductgallery.com/guide/how-to/performance-and-speed#best-practices-to-speed-up-the-single-product-page',
	support:
		'https://wordpress.org/support/plugin/gallery-slider-for-woocommerce/',
	about: 'https://shapedplugin.com/about-us/',
	videos: 'https://youtube.com/@ShapedPlugin',
	changelog:
		'https://wordpress.org/plugins/gallery-slider-for-woocommerce/#developers',
	docs: 'https://docs.renoproductgallery.com/guide/introduction',
};
