import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import { isSameValue } from '../../utils/responsive';
import ControlHeader from '../ControlHeader';
import NumberGroup from '../NumberGroup';
import SelectControl from '../SelectControl';
import ColorControl from '../ColorControl';
import './editor.scss';

export const BOX_SHADOW_DEFAULT = {
	x: 0,
	y: 4,
	blur: 12,
	spread: 0,
	type: 'outset',
	color: '#0000001A',
};

const SHADOW_TYPES = [
	{ value: 'none', label: __( 'None', 'gallery-slider-for-woocommerce' ) },
	{
		value: 'outset',
		label: __( 'Outset', 'gallery-slider-for-woocommerce' ),
	},
	{ value: 'inset', label: __( 'Inset', 'gallery-slider-for-woocommerce' ) },
];

/**
 * CSS `box-shadow` value for a box shadow control value.
 *
 * @param {Object} shadow `{ x, y, blur, spread, type, color }`.
 * @return {string} CSS value.
 */
export const boxShadowCss = ( shadow = {} ) => {
	if ( ! shadow || 'none' === shadow.type ) {
		return 'none';
	}
	const { x = 0, y = 0, blur = 0, spread = 0, color = '#000000' } = shadow;
	return `${
		'inset' === shadow.type ? 'inset ' : ''
	}${ x }px ${ y }px ${ blur }px ${ spread }px ${ color }`;
};

/**
 * Box shadow: X / Y / Blur / Spread fields, shadow type and color.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {Object}   props.attributes    `{ x, y, blur, spread, type, color }`.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {Object}   props.defaultValue  Default value; enables reset.
 */
const BoxShadowControl = ( {
	label = __( 'Box Shadow', 'gallery-slider-for-woocommerce' ),
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	defaultValue = BOX_SHADOW_DEFAULT,
} ) => {
	const { write } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );
	const shadow = { ...BOX_SHADOW_DEFAULT, ...( attributes || {} ) };
	const update = ( patch ) => write( { ...shadow, ...patch } );

	const field = ( key, fieldLabel, min, max ) => ( {
		key,
		label: fieldLabel,
		value: shadow[ key ],
		onChange: ( value ) => update( { [ key ]: value } ),
		min,
		max,
		step: 1,
	} );

	return (
		<div className="wcgs-control wcgs-box-shadow-control">
			<ControlHeader
				label={ label }
				help={ help }
				onReset={
					defaultValue
						? () => write( { ...defaultValue } )
						: undefined
				}
				showReset={
					!! defaultValue &&
					! isSameValue( shadow, {
						...BOX_SHADOW_DEFAULT,
						...defaultValue,
					} )
				}
			/>
			<NumberGroup
				unit="px"
				fields={ [
					field(
						'x',
						__( 'X', 'gallery-slider-for-woocommerce' ),
						-50,
						50
					),
					field(
						'y',
						__( 'Y', 'gallery-slider-for-woocommerce' ),
						-50,
						50
					),
					field(
						'blur',
						__( 'Blur', 'gallery-slider-for-woocommerce' ),
						0,
						100
					),
					field(
						'spread',
						__( 'Spread', 'gallery-slider-for-woocommerce' ),
						-50,
						50
					),
				] }
			/>
			<div className="wcgs-box-shadow-control__row sp-d-grid sp-gap-12px sp-align-end">
				<SelectControl
					label={ __(
						'Shadow Type',
						'gallery-slider-for-woocommerce'
					) }
					attributes={ shadow.type }
					onChange={ ( type ) => update( { type } ) }
					options={ SHADOW_TYPES }
				/>
				<ColorControl
					label={ __(
						'Shadow Color',
						'gallery-slider-for-woocommerce'
					) }
					attributes={ shadow.color }
					onChange={ ( color ) => update( { color } ) }
					align="right"
				/>
			</div>
		</div>
	);
};

export default memo( BoxShadowControl );
