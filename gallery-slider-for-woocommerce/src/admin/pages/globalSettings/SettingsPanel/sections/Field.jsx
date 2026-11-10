import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import {
	ColorControl,
	ControlHeader,
	NumberBox,
	NumberGroup,
	SpacingControl,
} from '../../../../components';
import { DEVICE_ICONS } from './options';
import useGlobalSettings from './useGlobalSettings';
import useDeviceType from '../../../../hooks/useDeviceType';
import { DEVICES } from '../../../../utils/responsive';

/**
 * Column of settings in a section body. Shown fields are 18px apart.
 *
 * @param {Object} props
 * @param {*}      props.children Fields.
 */
export const Fields = ( { children } ) => (
	<div className="wcgs-fields sp-d-flex sp-flex-col sp-min-w-0">
		{ children }
	</div>
);

/**
 * One setting (or row of settings) that folds away when its condition is off,
 * like the `c` condition of the design's rows. Hidden fields are inert.
 *
 * @param {Object}  props
 * @param {boolean} props.show     Whether the field applies.
 * @param {*}       props.children Control.
 */
export const Field = ( { show = true, children } ) => (
	<div
		className={ `wcgs-field sp-d-grid sp-min-w-0${
			show ? ' is-shown' : ''
		}` }
		inert={ show ? undefined : '' }
		aria-hidden={ ! show }
	>
		<div className="wcgs-field__inner">{ children }</div>
	</div>
);

/**
 * Labelled row of small controls (`R` in the design), e.g. a border's width,
 * radius and colors.
 *
 * @param {Object}   props
 * @param {string}   props.label        Row label.
 * @param {string}   props.help         Help tip.
 * @param {number}   props.cols         Cells per line.
 * @param {string}   props.template     Custom `grid-template-columns`.
 * @param {Function} props.onReset      Reset callback.
 * @param {boolean}  props.showReset    Whether the reset button is visible.
 * @param {string}   props.resetLabel   Accessible name of the reset button.
 * @param {boolean}  props.isResponsive Show the device switch (cells edit the picked device).
 * @param {*}        props.children     Cells.
 */
export const Row = ( {
	label,
	help,
	cols = 1,
	template,
	onReset,
	showReset = false,
	resetLabel,
	isResponsive = false,
	children,
} ) => (
	<div className="wcgs-row sp-d-flex sp-flex-col sp-gap-8px sp-min-w-0">
		<ControlHeader
			label={ label }
			help={ help }
			onReset={ onReset }
			showReset={ showReset }
			resetLabel={ resetLabel }
			isResponsive={ isResponsive }
		/>
		<div
			className="wcgs-row__grid sp-d-grid sp-align-end sp-min-w-0"
			style={ {
				gridTemplateColumns:
					template || `repeat(${ cols }, minmax(0, 1fr))`,
				gap: cols > 2 ? '8px' : '12px',
			} }
		>
			{ children }
		</div>
	</div>
);

/**
 * Number field with its own label: small inside a labelled row.
 *
 * @param {Object}   props
 * @param {string}   props.label        Label.
 * @param {boolean}  props.small        Small, muted label.
 * @param {number}   props.value        Value.
 * @param {Function} props.onChange     Called with the new number.
 * @param {number}   props.min          Minimum.
 * @param {number}   props.max          Maximum.
 * @param {number}   props.step         Step.
 * @param {string}   props.unit         Unit shown in the field.
 * @param {string[]} props.units        Selectable units.
 * @param {Function} props.onUnitChange Called with the picked unit.
 * @param {boolean}  props.isResponsive Show the device switch (the value is the picked device's).
 * @param {Function} props.onReset      Reset callback.
 * @param {boolean}  props.showReset    Whether the reset button is visible.
 * @param {string}   props.resetLabel   Accessible name of the reset button.
 */
export const NumberField = ( {
	label,
	small = true,
	value,
	onChange,
	min = 0,
	max = 2000,
	step = 1,
	unit = '',
	units = [],
	onUnitChange,
	isResponsive = false,
	onReset,
	showReset = false,
	resetLabel,
} ) => {
	const id = useInstanceId( NumberField, 'wcgs-number-field' );
	return (
		<div className="wcgs-control">
			<ControlHeader
				label={ label }
				htmlFor={ id }
				small={ small }
				isResponsive={ isResponsive }
				onReset={ onReset }
				showReset={ showReset }
				resetLabel={ resetLabel }
			/>
			<NumberBox
				id={ id }
				value={ value }
				onChange={ onChange }
				min={ min }
				max={ max }
				step={ step }
				unit={ unit }
				units={ units }
				onUnitChange={ onUnitChange }
			/>
		</div>
	);
};

/**
 * Pairs of color pickers (`COLS2` in the design), two per line.
 *
 * @param {Object} props
 * @param {Array}  props.colors `[ { key, label, value, onChange, defaultValue } ]`.
 */
export const ColorPairs = ( { colors } ) => (
	<div className="wcgs-row__grid sp-d-grid sp-align-end sp-min-w-0 is-pairs">
		{ colors.map( ( color, index ) => (
			<ColorControl
				key={ color.key }
				label={ color.label }
				attributes={ color.value }
				onChange={ color.onChange }
				defaultValue={ color.defaultValue }
				align={ index % 2 ? 'right' : 'left' }
			/>
		) ) }
	</div>
);

/**
 * Color pickers of a legacy `color_group` value.
 *
 * @param {Object} props
 * @param {string} props.groupKey Settings key.
 * @param {Array}  props.items    `[ [ sub key, label ] ]`.
 */
export const GroupColors = ( { groupKey, items } ) => {
	const { v, d, setSub } = useGlobalSettings();
	return (
		<ColorPairs
			colors={ items.map( ( [ sub, label ] ) => ( {
				key: sub,
				label,
				value: v[ groupKey ]?.[ sub ],
				onChange: ( color ) => setSub( groupKey, sub, color ),
				defaultValue: d[ groupKey ]?.[ sub ],
			} ) ) }
		/>
	);
};

/**
 * Per-device number fields with a shared unit (`SPI` cells in the design).
 *
 * @param {Object}   props
 * @param {string}   props.label        Row label.
 * @param {string}   props.help         Help tip.
 * @param {Array}    props.devices      `[ [ device, value, onChange ] ]`.
 * @param {string}   props.unit         Current unit.
 * @param {string[]} props.units        Selectable units.
 * @param {Function} props.onUnitChange Called with the picked unit.
 * @param {number}   props.min          Minimum.
 * @param {number}   props.max          Maximum.
 * @param {Function} props.onReset      Reset callback.
 * @param {boolean}  props.showReset    Whether the reset button is visible.
 */
export const DeviceRow = ( {
	label,
	help,
	devices,
	unit = 'px',
	units = [],
	onUnitChange,
	min = 0,
	max = 2000,
	onReset,
	showReset,
} ) => (
	<div className="wcgs-row sp-d-flex sp-flex-col sp-gap-8px sp-min-w-0">
		<ControlHeader
			label={ label }
			help={ help }
			onReset={ onReset }
			showReset={ showReset }
		/>
		<NumberGroup
			joined={ false }
			unit={ unit }
			units={ units }
			onUnitChange={ onUnitChange }
			fields={ devices.map( ( [ device, value, onChange ] ) => ( {
				key: device,
				icon: DEVICE_ICONS[ device ].icon,
				iconTitle: DEVICE_ICONS[ device ].title,
				value,
				onChange,
				min,
				max,
			} ) ) }
		/>
	</div>
);

/**
 * Box shadow offsets (`SH4` in the design): X, Y, Blur and Spread joined,
 * with the labels below. Edits the legacy `box_shadow` keys.
 *
 * @param {Object}   props
 * @param {string}   props.label     Row label.
 * @param {Object}   props.value     `{ horizontal, vertical, blur, spread }`.
 * @param {Function} props.onChange  Called with `( key, number )`.
 * @param {Function} props.onReset   Reset callback.
 * @param {boolean}  props.showReset Whether the reset button is visible.
 */
export const ShadowRow = ( { label, value, onChange, onReset, showReset } ) => (
	<div className="wcgs-row sp-d-flex sp-flex-col sp-gap-8px sp-min-w-0">
		<ControlHeader
			label={ label }
			onReset={ onReset }
			showReset={ showReset }
		/>
		<NumberGroup
			fields={ [
				[
					'horizontal',
					__( 'X', 'gallery-slider-for-woocommerce' ),
					-50,
				],
				[
					'vertical',
					__( 'Y', 'gallery-slider-for-woocommerce' ),
					-50,
				],
				[ 'blur', __( 'Blur', 'gallery-slider-for-woocommerce' ), 0 ],
				[
					'spread',
					__( 'Spread', 'gallery-slider-for-woocommerce' ),
					-50,
				],
			].map( ( [ key, fieldLabel, min ] ) => ( {
				key,
				label: fieldLabel,
				value: value?.[ key ],
				onChange: ( next ) => onChange( key, next ),
				min,
				max: 'blur' === key ? 100 : 50,
			} ) ) }
		/>
	</div>
);

const SIDES = [ 'top', 'right', 'bottom', 'left' ];

/**
 * Margin or padding with link toggle (`LB` in the design), over the legacy
 * `spacing` shape `{ top, right, bottom, left, unit? }`. Linked when both
 * pairs already match.
 *
 * With `deviceValues` it is responsive: it shows the device switch and edits
 * the device picked in the store, each device with its own unit.
 *
 * @param {Object}   props
 * @param {string}   props.label          Label.
 * @param {Object}   props.value          Legacy spacing value.
 * @param {Function} props.onChange       Called with the new legacy value.
 * @param {Object}   props.defaultValue   Default legacy value; enables reset.
 * @param {Object}   props.deviceValues   `{ desktop, tablet, mobile }` legacy values (responsive).
 * @param {Object}   props.deviceDefaults `{ desktop, tablet, mobile }` reset targets (responsive).
 * @param {Function} props.onDeviceChange Called with `( device, legacy value )` (responsive).
 * @param {string}   props.resetLabel     Accessible name of the reset button (responsive).
 * @param {string[]} props.units          Selectable units.
 * @param {number}   props.min            Minimum.
 */
export const SpacingField = ( {
	label,
	value = {},
	onChange,
	defaultValue,
	deviceValues,
	deviceDefaults,
	onDeviceChange,
	resetLabel,
	units = [ 'px' ],
	min = 0,
} ) => {
	const device = useDeviceType();
	const source = deviceValues ? deviceValues.desktop || {} : value;
	const [ linked, setLinked ] = useState(
		() => source.top === source.bottom && source.left === source.right
	);
	const box = ( from ) =>
		SIDES.reduce(
			( out, side ) => ( { ...out, [ side ]: from?.[ side ] ?? 0 } ),
			{}
		);
	const unitOf = ( from ) => from?.unit || units[ 0 ];
	const perDevice = ( values, read ) =>
		DEVICES.reduce(
			( out, name ) => ( { ...out, [ name ]: read( values?.[ name ] ) } ),
			{}
		);

	if ( deviceValues ) {
		const current = deviceValues[ device ] || {};
		return (
			<SpacingControl
				label={ label }
				attributes={ {
					device: perDevice( deviceValues, box ),
					unit: perDevice( deviceValues, unitOf ),
					linked,
				} }
				onChange={ ( next ) => {
					setLinked( false !== next.linked );
					onDeviceChange( device, {
						...current,
						...next.device?.[ device ],
						...( 'unit' in current
							? {
									unit:
										next.unit?.[ device ] ||
										unitOf( current ),
							  }
							: {} ),
					} );
				} }
				defaultValue={
					deviceDefaults
						? {
								device: perDevice( deviceDefaults, box ),
								unit: perDevice( deviceDefaults, unitOf ),
						  }
						: undefined
				}
				resetLabel={ resetLabel }
				units={ units }
				min={ min }
			/>
		);
	}

	const unit = unitOf( value );
	return (
		<SpacingControl
			label={ label }
			attributes={ { value: box( value ), unit, linked } }
			onChange={ ( next ) => {
				setLinked( false !== next.linked );
				onChange( {
					...value,
					...next.value,
					...( 'unit' in value ? { unit: next.unit || unit } : {} ),
				} );
			} }
			defaultValue={
				defaultValue
					? { value: box( defaultValue ), unit: defaultValue.unit }
					: undefined
			}
			units={ units }
			min={ min }
		/>
	);
};
