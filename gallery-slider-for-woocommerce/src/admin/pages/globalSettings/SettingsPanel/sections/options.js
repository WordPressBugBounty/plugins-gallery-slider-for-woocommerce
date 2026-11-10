import { __, sprintf } from '@wordpress/i18n';

/**
 * Option lists of the Global Settings panel: the design's labels and icons,
 * mapped to the values the legacy settings page stores.
 */

// Layout groups of the free layouts: the ones with a thumbnail strip, and
// the vertical ones (Slider has no thumbnails).
export const THUMB_LAYOUTS = [
	'horizontal',
	'vertical',
	'vertical_right',
	'horizontal_top',
];
export const VERTICAL_LAYOUTS = [ 'vertical', 'vertical_right' ];

/**
 * Image size choices (REST `choices.imageSizes`) plus the Pro "Set custom
 * size" option, locked.
 *
 * @param {Array} sizes `[ { value, label } ]` from the REST API.
 * @return {Array} Options.
 */
export const imageSizeOptions = ( sizes = [] ) => [
	...sizes.filter( ( size ) => 'custom' !== size.value ),
	{
		value: 'custom',
		label: __( 'Set custom size', 'gallery-slider-for-woocommerce' ),
		locked: true,
	},
];

/**
 * Mark Pro options of a list as locked (shown with a crown, never selected).
 *
 * @param {Array}    options `[ { value, … } ]`.
 * @param {string[]} values  Pro values.
 * @param {Object}   extra   Props added to each locked option, e.g. `{ popover }`.
 * @return {Array} Options.
 */
export const lockOptions = ( options, values, extra = {} ) =>
	options.map( ( option ) =>
		values.includes( option.value )
			? { ...option, locked: true, ...extra }
			: option
	);

// Device icons of per-device number fields (`DI` in the design).
export const DEVICE_ICONS = {
	desktop: {
		title: __( 'Desktop', 'gallery-slider-for-woocommerce' ),
		icon: 'M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 20h8M12 16v4',
	},
	laptop: {
		title: __( 'Laptop', 'gallery-slider-for-woocommerce' ),
		icon: 'M5 5h14a1 1 0 0 1 1 1v9H4V6a1 1 0 0 1 1-1zM2 19h20l-1.5-4h-17z',
	},
	tablet: {
		title: __( 'Tablet', 'gallery-slider-for-woocommerce' ),
		icon: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2',
	},
	mobile: {
		title: __( 'Mobile', 'gallery-slider-for-woocommerce' ),
		icon: 'M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
	},
};

export const VISIBILITY = [
	{
		value: 'always',
		label: __( 'Always', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'hover',
		label: __( 'On Hover', 'gallery-slider-for-woocommerce' ),
	},
];

export const CLICK_OR_HOVER = [
	{ value: 'click', label: __( 'Click', 'gallery-slider-for-woocommerce' ) },
	{
		value: 'mouseover',
		label: __( 'Mouseover', 'gallery-slider-for-woocommerce' ),
	},
];

export const INLINE_OR_POPUP = [
	{
		value: 'inline',
		label: __( 'Inline', 'gallery-slider-for-woocommerce' ),
	},
	{ value: 'popup', label: __( 'Popup', 'gallery-slider-for-woocommerce' ) },
];

// Arrow icons (`NAVI` in the design), in the order of the legacy icon keys.
export const ARROW_ICONS = [
	[ 'angle', 'M9 6l6 6-6 6' ],
	[ 'chevron', 'M10 7l5 5-5 5' ],
	[ 'right_open', 'M9 5l7 7-7 7' ],
	[ 'right_open_1', 'M10 6l6 6-6 6' ],
	[ 'right_open_3', 'M8 5l7 7-7 7' ],
	// Outlined shapes, as the font draws them (fonts_map: \e806, \e807).
	[ 'right_open_outline', 'M9 4l8 8-8 8-3-3 5-5-5-5z' ],
	[ 'angle_double', 'M6 6l6 6-6 6 M13 6l6 6-6 6' ],
	[ 'chevron_circle', 'M12 3a9 9 0 100 18 9 9 0 000-18z M10 8l5 4-5 4' ],
	[ 'arrow', 'M4 12h15 M13 6l6 6-6 6' ],
	[ 'long_arrow', 'M4 12h14 M12 7l5 5-5 5' ],
	[ 'right_outline', 'M3 10h10V5l7 7-7 7v-5H3z' ],
].map( ( [ value, path ], index ) => ( {
	value,
	path,
	/* translators: %d: icon style number. */
	title: sprintf( __( 'Style %d', 'gallery-slider-for-woocommerce' ), index ),
} ) );

// Video play icons (`VID` in the design): stroked `path`, filled `fillPath`.
export const VIDEO_ICONS = [
	{
		value: 'play-01',
		title: __( 'Circle', 'gallery-slider-for-woocommerce' ),
		path: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
		fillPath: 'M10 8.8l5 3.2-5 3.2z',
	},
	{
		value: 'play-02',
		title: __( 'Circle Outline', 'gallery-slider-for-woocommerce' ),
		path: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10.5 9l4 3-4 3z',
	},
	{
		value: 'play-03',
		title: __( 'Filled Circle', 'gallery-slider-for-woocommerce' ),
		fillPath: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10.3 9.2v5.6l4-2.8z',
	},
	{
		value: 'play-04',
		title: __( 'Triangle', 'gallery-slider-for-woocommerce' ),
		fillPath: 'M7 5l12 7-12 7z',
	},
	{
		value: 'play-05',
		title: __( 'Triangle Outline', 'gallery-slider-for-woocommerce' ),
		path: 'M8 6l10 6-10 6z',
	},
	{
		value: 'play-06',
		title: __( 'Rounded Square', 'gallery-slider-for-woocommerce' ),
		path: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z',
		fillPath: 'M10 8.5l5 3.5-5 3.5z',
	},
	{
		value: 'play-07',
		title: __( 'Square', 'gallery-slider-for-woocommerce' ),
		path: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
		fillPath: 'M10 8.5l5 3.5-5 3.5z',
	},
	{
		value: 'play-08',
		title: __( 'Camera', 'gallery-slider-for-woocommerce' ),
		path: 'M4 6h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM15 10.5l6-3.5v10l-6-3.5z',
	},
	{
		value: 'play-09',
		title: __( 'Media', 'gallery-slider-for-woocommerce' ),
		path: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
		fillPath: 'M10 9l5 3-5 3z',
	},
	{ value: 'native', text: __( 'Native', 'gallery-slider-for-woocommerce' ) },
];

// Lightbox icons, in the order of the legacy `lightbox_icon` keys. Each one
// is a line-style copy of the fontello glyph the frontend shows for its value
// (`getLightboxIcon()` maps `search-plus` to `zoom-in-1`). Free has the four
// icons of 3.x (search, search-plus, plus, info); the others are Pro.
export const FREE_LIGHTBOX_ICONS = [ 'search', 'search-plus', 'plus', 'info' ];
const ALL_LIGHTBOX_ICONS = [
	{
		value: 'search',
		title: __( 'Search', 'gallery-slider-for-woocommerce' ),
		path: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
	},
	{
		value: 'search-plus',
		title: __( 'Zoom In', 'gallery-slider-for-woocommerce' ),
		path: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6',
	},
	{
		value: 'zoom-in',
		title: __( 'Magnifier Plus', 'gallery-slider-for-woocommerce' ),
		path: 'M9.5 8a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM13.5 17.5l3 3M17 3.5v6M14 6.5h6',
	},
	{
		value: 'expand',
		title: __( 'Expand', 'gallery-slider-for-woocommerce' ),
		path: 'M14 4h6v6M20 4l-6 6M10 20H4v-6M4 20l6-6',
	},
	{
		value: 'resize-full-1',
		title: __( 'Expand Frame', 'gallery-slider-for-woocommerce' ),
		path: 'M4 10V4h6M20 14v6h-6M15 4h5v5M20 4l-5.5 5.5M9 20H4v-5M4 20l5.5-5.5',
	},
	{
		value: 'resize-full-alt',
		title: __( 'Expand All', 'gallery-slider-for-woocommerce' ),
		path: 'M4 4l16 16M20 4L4 20M4 9V4h5M15 4h5v5M4 15v5h5M20 15v5h-5',
	},
	{
		value: 'arrows-alt',
		title: __( 'Corner Arrows', 'gallery-slider-for-woocommerce' ),
		path: 'M4 8.5V4h4.5M4 4l5 5M15.5 4H20v4.5M20 4l-5 5M4 15.5V20h4.5M4 20l5-5M15.5 20H20v-4.5M20 20l-5-5',
	},
	{
		value: 'eye',
		title: __( 'Eye', 'gallery-slider-for-woocommerce' ),
		path: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
	},
	{
		value: 'eye-1',
		title: __( 'Eye Filled', 'gallery-slider-for-woocommerce' ),
		path: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z',
		fillPath: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
	},
	{
		value: 'plus',
		title: __( 'Plus', 'gallery-slider-for-woocommerce' ),
		path: 'M12 4v16M4 12h16',
	},
	{
		value: 'plus-1',
		title: __( 'Small Plus', 'gallery-slider-for-woocommerce' ),
		path: 'M12 7v10M7 12h10',
	},
	{
		value: 'info',
		title: __( 'Info', 'gallery-slider-for-woocommerce' ),
		path: 'M10 10h2v9M9.5 19h5',
		fillPath: 'M12 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z',
	},
	{
		value: 'lightbox-open',
		title: __( 'Focus', 'gallery-slider-for-woocommerce' ),
		path: 'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2',
		fillPath:
			'M10.5 9h3A1.5 1.5 0 0 1 15 10.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3A1.5 1.5 0 0 1 10.5 9z',
	},
];
export const LIGHTBOX_ICONS = ALL_LIGHTBOX_ICONS.map( ( icon ) =>
	FREE_LIGHTBOX_ICONS.includes( icon.value )
		? icon
		: { ...icon, locked: true }
);

/**
 * React style object from a CSS declaration string of the design.
 *
 * @param {string} css Declarations, e.g. `width:7px;border-radius:50%;`.
 * @return {Object} Style object.
 */
export const cssToStyle = ( css ) =>
	css.split( ';' ).reduce( ( style, declaration ) => {
		const at = declaration.indexOf( ':' );
		if ( at < 1 ) {
			return style;
		}
		const property = declaration
			.slice( 0, at )
			.trim()
			.replace( /-([a-z])/g, ( m, letter ) => letter.toUpperCase() );
		return { ...style, [ property ]: declaration.slice( at + 1 ).trim() };
	}, {} );
