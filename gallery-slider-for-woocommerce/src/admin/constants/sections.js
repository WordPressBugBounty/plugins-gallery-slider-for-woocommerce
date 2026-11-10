import { __ } from '@wordpress/i18n';

/**
 * Settings sections of the sidebar (icons and labels from the Reno settings design).
 * `short` is the label under the sidebar icon; `children` open a hover flyout.
 * `isPro` sections show only an upsell card, with a Pro pill in the panel and
 * a crown on the sidebar icon. The design's Audio, Customer Photos and
 * Product Card Gallery are left out: neither plugin has those features.
 */
export const GALLERY_SUB_SECTIONS = [
	{
		key: 'slider',
		label: __( 'Gallery Slider', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'navpag',
		label: __(
			'Navigation & Pagination',
			'gallery-slider-for-woocommerce'
		),
	},
	{
		key: 'thumbsnav',
		label: __( 'Thumbnails Navigation', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'productimage',
		label: __( 'Product Image', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'zoom',
		label: __( 'Product Image Zoom', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'video',
		label: __( 'Product Video Gallery', 'gallery-slider-for-woocommerce' ),
	},
];

export const SECTIONS = [
	{
		key: 'general',
		label: __( 'General', 'gallery-slider-for-woocommerce' ),
		short: __( 'General', 'gallery-slider-for-woocommerce' ),
		icon: 'M20 7h-9M14 17H5M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
	},
	{
		key: 'gallery',
		label: __( 'Product Gallery', 'gallery-slider-for-woocommerce' ),
		short: __( 'Gallery', 'gallery-slider-for-woocommerce' ),
		icon: 'M18 22H4a2 2 0 0 1-2-2V6M8 2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM22 13l-3.1-3.1a2 2 0 0 0-2.8 0L7 19M12 7.5h.01',
		children: GALLERY_SUB_SECTIONS,
	},
	{
		key: 'lightbox',
		label: __( 'Lightbox', 'gallery-slider-for-woocommerce' ),
		short: __( 'Lightbox', 'gallery-slider-for-woocommerce' ),
		icon: 'M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 17l-3.2-3.2',
	},
	{
		key: 'shopvideo',
		label: __( 'Shop Page Video', 'gallery-slider-for-woocommerce' ),
		short: __( 'Video', 'gallery-slider-for-woocommerce' ),
		isPro: true,
		icon: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM10 8.5v7l5.5-3.5z',
	},
];
