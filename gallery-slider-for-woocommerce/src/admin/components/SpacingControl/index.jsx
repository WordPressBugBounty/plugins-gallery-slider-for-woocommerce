import { __, _x } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import { getDeviceValue, isSameValue } from '../../utils/responsive';
import ControlHeader from '../ControlHeader';
import NumberGroup from '../NumberGroup';
import { LinkIcon } from '../Icons';
import './editor.scss';

const SIDES = [ 'top', 'right', 'bottom', 'left' ];
const EMPTY_BOX = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Padding / margin sides. Linked (default) edits Top & Bottom and
 * Left & Right as pairs; unlinked edits each side. Responsive when
 * `attributes` is `{ device: { desktop: {…}, … }, unit, linked }`.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {Object}   props.attributes    `{ value|device, unit, linked }`.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {number}   props.min           Minimum.
 * @param {number}   props.max           Maximum.
 * @param {number}   props.step          Step.
 * @param {string[]} props.units         Selectable units.
 * @param {Object}   props.defaultValue  Default, same shape as `attributes`; enables reset.
 * @param {string}   props.resetLabel    Accessible name of the reset button.
 */
const SpacingControl = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	min = 0,
	max = 200,
	step = 1,
	units = [ 'px' ],
	defaultValue,
	resetLabel,
} ) => {
	const attr =
		attributes && 'object' === typeof attributes
			? attributes
			: { value: EMPTY_BOX };
	const { device, isResponsive, value, unit, write, setValue, setUnit } =
		useControlValue( {
			attributes: attr,
			attributesKey,
			setAttributes,
			onChange,
		} );

	const box = { ...EMPTY_BOX, ...( value || {} ) };
	const isLinked = false !== attr.linked;
	const defaultBox =
		undefined !== defaultValue
			? {
					...EMPTY_BOX,
					...( getDeviceValue( defaultValue, device ) || {} ),
			  }
			: undefined;

	const setSides = ( sides, next ) => {
		const updated = { ...box };
		sides.forEach( ( side ) => {
			updated[ side ] = next;
		} );
		setValue( updated );
	};

	// Relinking copies Top → Bottom and Right → Left (as in the design).
	const toggleLink = () => {
		if ( isLinked ) {
			write( { ...attr, linked: false } );
			return;
		}
		const relinked = { ...box, bottom: box.top, left: box.right };
		const next = isResponsive
			? { ...attr, device: { ...attr.device, [ device ]: relinked } }
			: { ...attr, value: relinked };
		write( { ...next, linked: true } );
	};

	const field = ( key, fieldLabel, sides ) => ( {
		key,
		label: fieldLabel,
		value: box[ sides[ 0 ] ],
		onChange: ( next ) => setSides( sides, next ),
		min,
		max,
		step,
	} );

	const fields = isLinked
		? [
				field(
					'vertical',
					__( 'Top & Bottom', 'gallery-slider-for-woocommerce' ),
					[ 'top', 'bottom' ]
				),
				field(
					'horizontal',
					__( 'Left & Right', 'gallery-slider-for-woocommerce' ),
					[ 'right', 'left' ]
				),
		  ]
		: SIDES.map( ( side ) =>
				field(
					side,
					{
						top: _x(
							'Top',
							'spacing side',
							'gallery-slider-for-woocommerce'
						),
						right: __( 'Right', 'gallery-slider-for-woocommerce' ),
						bottom: _x(
							'Bottom',
							'spacing side',
							'gallery-slider-for-woocommerce'
						),
						left: __( 'Left', 'gallery-slider-for-woocommerce' ),
					}[ side ],
					[ side ]
				)
		  );

	const linkTitle = isLinked
		? __( 'Unlink values', 'gallery-slider-for-woocommerce' )
		: __( 'Link values', 'gallery-slider-for-woocommerce' );

	return (
		<div className="wcgs-control wcgs-spacing-control">
			<ControlHeader
				label={ label }
				help={ help }
				isResponsive={ isResponsive }
				onReset={
					defaultBox ? () => setValue( defaultBox ) : undefined
				}
				showReset={ !! defaultBox && ! isSameValue( box, defaultBox ) }
				resetLabel={ resetLabel }
			/>
			<NumberGroup
				fields={ fields }
				unit={ unit || units[ 0 ] || 'px' }
				units={ units }
				onUnitChange={ setUnit }
				after={
					<button
						type="button"
						className={ `wcgs-spacing-control__link sp-flex-center${
							isLinked ? ' is-linked' : ''
						}` }
						onClick={ toggleLink }
						title={ linkTitle }
						aria-label={ linkTitle }
						aria-pressed={ isLinked }
					>
						<LinkIcon linked={ isLinked } />
					</button>
				}
			/>
		</div>
	);
};

export default memo( SpacingControl );
