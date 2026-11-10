import { memo } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import useControlValue from '../../hooks/useControlValue';
import { getDeviceValue, isSameValue } from '../../utils/responsive';
import ControlHeader from '../ControlHeader';
import NumberBox from '../NumberBox';
import './editor.scss';

/**
 * Text or number input. Responsive when `attributes` is `{ device: {…} }`.
 *
 * @param {Object}   props
 * @param {string}   props.type          'text' or 'number'.
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Value (string/number, `{ value, unit }` or responsive).
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {string}   props.placeholder   Text input placeholder.
 * @param {number}   props.min           Number minimum.
 * @param {number}   props.max           Number maximum.
 * @param {number}   props.step          Number step.
 * @param {string[]} props.units         Selectable units (number, object values only).
 * @param {string}   props.icon          Number field leading icon path.
 * @param {string}   props.iconTitle     Number field leading icon title.
 * @param {*}        props.defaultValue  Default, same shape as `attributes`; enables reset (number).
 * @param {boolean}  props.small         Small label (inside a labelled row).
 */
const InputControl = ( {
	type = 'text',
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	placeholder = '',
	min = 0,
	max = 2000,
	step = 1,
	units = [],
	icon = '',
	iconTitle = '',
	defaultValue,
	small = false,
} ) => {
	const id = useInstanceId( InputControl, 'wcgs-input' );
	const { device, isResponsive, value, unit, setValue, setUnit } =
		useControlValue( {
			attributes,
			attributesKey,
			setAttributes,
			onChange,
		} );
	const isNumber = 'number' === type;
	const defaultForDevice =
		undefined !== defaultValue
			? getDeviceValue( defaultValue, device )
			: undefined;
	const canReset = isNumber && undefined !== defaultValue;

	return (
		<div className="wcgs-control wcgs-input-control">
			<ControlHeader
				label={ label }
				help={ help }
				htmlFor={ id }
				isResponsive={ isResponsive }
				small={ small }
				onReset={
					canReset ? () => setValue( defaultForDevice ) : undefined
				}
				showReset={
					canReset && ! isSameValue( value, defaultForDevice )
				}
			/>
			{ isNumber ? (
				<NumberBox
					id={ id }
					value={ value }
					onChange={ setValue }
					min={ min }
					max={ max }
					step={ step }
					unit={ unit }
					units={ units }
					onUnitChange={
						attributes && 'object' === typeof attributes
							? setUnit
							: undefined
					}
					icon={ icon }
					iconTitle={ iconTitle }
					ariaLabel={ label ? undefined : iconTitle }
				/>
			) : (
				<input
					id={ id }
					type="text"
					className="wcgs-input-control__input"
					value={ value ?? '' }
					placeholder={ placeholder }
					onChange={ ( event ) => setValue( event.target.value ) }
				/>
			) }
		</div>
	);
};

export default memo( InputControl );
