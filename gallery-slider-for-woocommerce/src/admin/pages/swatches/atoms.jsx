import { __ } from '@wordpress/i18n';

// Sample colors of the mock products.
export const COLORS = {
	forest: '#1F5F4A',
	burgundy: '#7A1F2B',
	navy: '#1E2A44',
	stone: '#D8C7A6',
	sand: '#D9D4C7',
	charcoal: '#3A3B3F',
	twoTone: 'linear-gradient(135deg, #3A3B3F 50%, #C9CBD0 50%)',
};

/**
 * "Color: Forest" line above a row of swatches.
 *
 * @param {Object}  props
 * @param {string}  props.label Attribute name with its colon.
 * @param {string}  props.value Selected value.
 * @param {boolean} props.small Smaller text (the hero card).
 */
export const OptionLabel = ( { label, value, small = false } ) => (
	<span className={ `wcgs-sw-label${ small ? ' is-small' : '' }` }>
		{ label } <b>{ value }</b>
	</span>
);

/**
 * Round (or shaped) color swatch.
 *
 * @param {Object}  props
 * @param {string}  props.color     CSS background.
 * @param {number}  props.size      Width and height in px.
 * @param {boolean} props.active    Selected (ringed).
 * @param {string}  props.className Extra class (shape, ring color).
 * @param {*}       props.children  Content (a tooltip).
 */
export const Dot = ( {
	color,
	size = 30,
	active = false,
	className = '',
	children,
} ) => (
	<span
		className={ `wcgs-sw-dot${
			active ? ' is-active' : ''
		} ${ className }`.trim() }
		style={ { width: size, height: size, background: color } }
	>
		{ children }
	</span>
);

/**
 * Label swatch (a size, fit or material).
 *
 * @param {Object}  props
 * @param {string}  props.children  Label.
 * @param {string}  props.variant   Selected style: 'dark', 'blue' or 'pill'.
 * @param {boolean} props.active    Selected.
 * @param {boolean} props.out       Out of stock (crossed out).
 * @param {string}  props.className Extra class (size).
 */
export const Chip = ( {
	children,
	variant = 'dark',
	active = false,
	out = false,
	className = '',
} ) => (
	<span
		className={ [
			'wcgs-sw-chip',
			`is-${ variant }`,
			active && 'is-active',
			out && 'is-out',
			className,
		]
			.filter( Boolean )
			.join( ' ' ) }
	>
		{ children }
	</span>
);

export const LABEL_COLOR = __( 'Color:', 'gallery-slider-for-woocommerce' );
export const LABEL_SIZE = __( 'Size:', 'gallery-slider-for-woocommerce' );
