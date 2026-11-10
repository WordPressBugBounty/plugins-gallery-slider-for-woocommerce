import { __ } from '@wordpress/i18n';

/**
 * Steps and feature cards of the Setup Wizard (free design, `wz`).
 *
 * @since 4.0.0
 */

/** Welcome screen, the three numbered steps, and the Done screen. */
export const STEP_WELCOME = 0;
export const STEP_LAYOUT = 1;
export const STEP_FEATURES = 2;
export const STEP_PLUGINS = 3;
export const STEP_DONE = 4;

/** Labels of the numbered steps in the header. */
export const STEP_LABELS = [
	__( 'Layout', 'gallery-slider-for-woocommerce' ),
	__( 'Features', 'gallery-slider-for-woocommerce' ),
	__( 'Plugins', 'gallery-slider-for-woocommerce' ),
];

/**
 * Feature cards: free ones switch a `wcgs_settings` key (`key`); locked ones
 * (Pro) open the pricing page. `short` names the feature in the Done summary.
 */
export const FEATURES = [
	{
		key: 'zoom',
		name: __( 'Image Zoom', 'gallery-slider-for-woocommerce' ),
		short: __( 'Zoom', 'gallery-slider-for-woocommerce' ),
		description: __(
			'Shoppers look closer at fabric, texture and finish.',
			'gallery-slider-for-woocommerce'
		),
		icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6',
	},
	{
		key: 'lightbox',
		name: __( 'Lightbox', 'gallery-slider-for-woocommerce' ),
		short: __( 'Lightbox', 'gallery-slider-for-woocommerce' ),
		description: __(
			'Open images full screen with swipe and zoom.',
			'gallery-slider-for-woocommerce'
		),
		icon: 'M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7',
	},
	{
		key: 'video_gallery',
		name: __( 'Product Video Gallery', 'gallery-slider-for-woocommerce' ),
		short: __( 'Video', 'gallery-slider-for-woocommerce' ),
		description: __(
			'Add YouTube, Vimeo or self-hosted videos to the gallery.',
			'gallery-slider-for-woocommerce'
		),
		icon: 'M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM16 10.5l5-3v9l-5-3',
	},
	{
		key: 'shop_video',
		locked: true,
		name: __( 'Shop Page Video', 'gallery-slider-for-woocommerce' ),
		description: __(
			'Play product videos on Shop page cards.',
			'gallery-slider-for-woocommerce'
		),
		icon: 'M3 5h18v14H3zM3 9h18M8 5v4M16 5v4M10.5 12.5v4l3.5-2z',
	},
];

/** Settings keys the Features step switches. */
export const FEATURE_KEYS = FEATURES.filter( ( item ) => ! item.locked ).map(
	( item ) => item.key
);
