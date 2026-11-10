import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import NumberBox from '../NumberBox';
import './editor.scss';

const joinClass = ( index, count ) => {
	if ( count < 2 ) {
		return '';
	}
	if ( 0 === index ) {
		return 'is-join-start';
	}
	return index === count - 1 ? 'is-join-end' : 'is-join-mid';
};

/**
 * Joined number fields with labels below, a unit box and an optional
 * trailing button (box shadow X/Y/Blur/Spread, spacing sides). Fields may
 * carry a leading icon instead of a label (per-device values).
 *
 * @param {Object}   props
 * @param {Array}    props.fields       `[ { key, label, icon, iconTitle, value, onChange, min, max, step } ]`.
 * @param {string}   props.unit         Current unit; '' hides the unit box.
 * @param {string[]} props.units        Selectable units; a dropdown shows when more than one.
 * @param {Function} props.onUnitChange Called with the picked unit.
 * @param {*}        props.after        Node after the unit box (e.g. link button).
 * @param {boolean}  props.joined       Join the fields into one box; false spaces them apart.
 */
const NumberGroup = ( {
	fields,
	unit = 'px',
	units = [],
	onUnitChange,
	after,
	joined = true,
} ) => {
	const [ unitOpen, setUnitOpen ] = useState( false );
	const timer = useRef();
	const hasUnitChoice = units.length > 1 && !! onUnitChange;
	const hasUnit = hasUnitChoice || !! unit;

	useEffect( () => () => clearTimeout( timer.current ), [] );

	const openUnits = () => {
		clearTimeout( timer.current );
		setUnitOpen( true );
	};
	const closeUnitsSoon = () => {
		clearTimeout( timer.current );
		timer.current = setTimeout( () => setUnitOpen( false ), 140 );
	};

	const columns =
		`repeat(${ fields.length }, minmax(0, 1fr))` +
		( hasUnit ? ' 44px' : '' ) +
		( after ? ' 46px' : '' );

	return (
		<div
			className={ `wcgs-number-group sp-d-grid sp-align-start${
				joined ? '' : ' is-spaced'
			}` }
			style={ { gridTemplateColumns: columns } }
		>
			{ fields.map( ( field, index ) => (
				<div
					className="wcgs-number-group__cell sp-d-flex sp-flex-col sp-gap-6px sp-min-w-0"
					key={ field.key }
				>
					<NumberBox
						className={
							joined ? joinClass( index, fields.length ) : ''
						}
						value={ field.value }
						onChange={ field.onChange }
						min={ field.min }
						max={ field.max }
						step={ field.step }
						icon={ field.icon }
						iconTitle={ field.iconTitle }
						ariaLabel={ field.label || field.iconTitle }
					/>
					{ field.label && (
						<span className="wcgs-number-group__label">
							{ field.label }
						</span>
					) }
				</div>
			) ) }
			{ hasUnitChoice ? (
				<div
					className="wcgs-number-group__units"
					onMouseEnter={ openUnits }
					onMouseLeave={ closeUnitsSoon }
				>
					<button
						type="button"
						className={ `wcgs-number-group__unit-toggle${
							unitOpen ? ' is-open' : ''
						}` }
						onClick={ () => setUnitOpen( ! unitOpen ) }
						title={ __( 'Unit', 'gallery-slider-for-woocommerce' ) }
						aria-haspopup="true"
						aria-expanded={ unitOpen }
					>
						{ unit || units[ 0 ] }
					</button>
					<div
						className={ `wcgs-number-group__unit-menu sp-d-flex sp-flex-col${
							unitOpen ? ' is-open' : ''
						}` }
					>
						{ units.map( ( item ) => (
							<button
								key={ item }
								type="button"
								className={ `wcgs-number-group__unit-option${
									item === unit ? ' is-active' : ''
								}` }
								onClick={ () => {
									setUnitOpen( false );
									onUnitChange( item );
								} }
								tabIndex={ unitOpen ? 0 : -1 }
							>
								{ item }
							</button>
						) ) }
					</div>
				</div>
			) : (
				hasUnit && (
					<div className="wcgs-number-group__unit sp-flex-center">
						{ unit }
					</div>
				)
			) }
			{ after }
		</div>
	);
};

export default NumberGroup;
