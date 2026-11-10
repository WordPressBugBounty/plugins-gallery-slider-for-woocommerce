import { memo } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import useControlValue from '../../hooks/useControlValue';
import { clampToStep, startPointerDrag } from '../../utils/number';
import { getDeviceValue, isSameValue } from '../../utils/responsive';
import ControlHeader from '../ControlHeader';
import NumberBox from '../NumberBox';
import './editor.scss';

/**
 * Slider with a number field. Responsive when `attributes` is
 * `{ device: { desktop, tablet, mobile }, unit }`.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Value: number, `{ value, unit }` or responsive.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {number}   props.min           Minimum.
 * @param {number}   props.max           Maximum.
 * @param {number}   props.step          Step.
 * @param {string[]} props.units         Selectable units (object values only).
 * @param {*}        props.defaultValue  Default, same shape as `attributes`; enables reset.
 * @param {string}   props.resetLabel    Accessible name of the reset button.
 */
const RangeControl = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	units = [],
	defaultValue,
	resetLabel,
} ) => {
	const id = useInstanceId( RangeControl, 'wcgs-range' );
	const { device, isResponsive, value, unit, setValue, setUnit } =
		useControlValue( {
			attributes,
			attributesKey,
			setAttributes,
			onChange,
		} );

	const current = +value || 0;
	const percent = Math.max(
		0,
		Math.min( 100, ( ( current - min ) / ( max - min ) ) * 100 )
	);
	const defaultForDevice =
		undefined !== defaultValue
			? getDeviceValue( defaultValue, device )
			: undefined;

	const onTrackPointerDown = ( event ) =>
		startPointerDrag( event, ( x ) =>
			setValue( clampToStep( min + x * ( max - min ), min, max, step ) )
		);

	const onTrackKeyDown = ( event ) => {
		const moves = {
			ArrowRight: step,
			ArrowUp: step,
			ArrowLeft: -step,
			ArrowDown: -step,
		};
		if ( moves[ event.key ] ) {
			event.preventDefault();
			setValue(
				clampToStep( current + moves[ event.key ], min, max, step )
			);
		} else if ( 'Home' === event.key || 'End' === event.key ) {
			event.preventDefault();
			setValue( 'Home' === event.key ? min : max );
		}
	};

	return (
		<div className="wcgs-control wcgs-range-control">
			<ControlHeader
				label={ label }
				help={ help }
				htmlFor={ id }
				isResponsive={ isResponsive }
				onReset={
					undefined !== defaultValue
						? () => setValue( defaultForDevice )
						: undefined
				}
				showReset={
					undefined !== defaultValue &&
					! isSameValue( value, defaultForDevice )
				}
				resetLabel={ resetLabel }
			/>
			<div className="wcgs-range-control__row sp-d-flex sp-align-center sp-gap-12px sp-min-w-0">
				<div
					className="wcgs-range-control__track sp-flex-1 sp-min-w-0 sp-d-flex sp-align-center"
					role="slider"
					tabIndex={ 0 }
					aria-label={ label }
					aria-valuemin={ min }
					aria-valuemax={ max }
					aria-valuenow={ current }
					aria-valuetext={ `${ current }${ unit }` }
					onPointerDown={ onTrackPointerDown }
					onKeyDown={ onTrackKeyDown }
				>
					<span className="wcgs-range-control__rail" />
					<span
						className="wcgs-range-control__fill"
						style={ { width: `${ percent }%` } }
					/>
					<span
						className="wcgs-range-control__thumb"
						style={ { left: `${ percent }%` } }
					/>
				</div>
				<NumberBox
					id={ id }
					className="wcgs-range-control__number"
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
				/>
			</div>
		</div>
	);
};

export default memo( RangeControl );
