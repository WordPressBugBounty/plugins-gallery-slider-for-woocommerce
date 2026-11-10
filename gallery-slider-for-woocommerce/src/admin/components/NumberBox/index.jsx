import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { clampToStep, formatNumber } from '../../utils/number';
import { SpinDownIcon, SpinUpIcon } from '../Icons';
import './editor.scss';

/**
 * Numeric field of the design (`rs-num`): typed input, hover spin buttons,
 * optional leading icon, and a static unit or a hover unit dropdown.
 *
 * @param {Object}   props
 * @param {number}   props.value        Current value.
 * @param {Function} props.onChange     Called with the new number.
 * @param {number}   props.min          Minimum.
 * @param {number}   props.max          Maximum.
 * @param {number}   props.step         Step.
 * @param {string}   props.unit         Current unit (shown when there is no unit choice).
 * @param {string[]} props.units        Selectable units; a dropdown shows when more than one.
 * @param {Function} props.onUnitChange Called with the picked unit.
 * @param {string}   props.icon         Leading icon SVG path.
 * @param {string}   props.iconTitle    Leading icon title.
 * @param {string}   props.id           Input id.
 * @param {string}   props.ariaLabel    Input label when no visible label names it.
 * @param {string}   props.className    Extra class (e.g. joined field position).
 */
const NumberBox = ( {
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	unit = '',
	units = [],
	onUnitChange,
	icon = '',
	iconTitle = '',
	id,
	ariaLabel,
	className = '',
} ) => {
	const [ draft, setDraft ] = useState( null );
	const [ unitOpen, setUnitOpen ] = useState( false );
	const unitTimer = useRef();
	const current = +value || 0;
	const hasUnitChoice = units.length > 1 && !! onUnitChange;
	const shownUnit = hasUnitChoice ? unit || units[ 0 ] : unit;

	useEffect( () => () => clearTimeout( unitTimer.current ), [] );

	const commit = ( next ) => onChange( clampToStep( next, min, max, step ) );

	const onInput = ( event ) => {
		const raw = event.target.value.replace( /[^0-9.\-]/g, '' );
		setDraft( raw );
		if ( '' !== raw && ! isNaN( +raw ) ) {
			onChange( +raw );
		}
	};

	const onBlur = () => {
		setDraft( null );
		commit( current );
	};

	const onKeyDown = ( event ) => {
		if ( 'ArrowUp' === event.key || 'ArrowDown' === event.key ) {
			event.preventDefault();
			setDraft( null );
			commit( current + ( 'ArrowUp' === event.key ? step : -step ) );
		}
	};

	const openUnits = () => {
		clearTimeout( unitTimer.current );
		setUnitOpen( true );
	};
	const closeUnitsSoon = () => {
		clearTimeout( unitTimer.current );
		unitTimer.current = setTimeout( () => setUnitOpen( false ), 260 );
	};
	const pickUnit = ( next ) => {
		clearTimeout( unitTimer.current );
		setUnitOpen( false );
		onUnitChange( next );
	};

	return (
		<div className={ `wcgs-number-box sp-min-w-0 ${ className }`.trim() }>
			<div className="wcgs-number-box__field sp-d-flex">
				{ icon && (
					<span
						className="wcgs-number-box__icon sp-flex-center"
						title={ iconTitle }
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.6"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d={ icon } />
						</svg>
					</span>
				) }
				<span className="wcgs-number-box__body sp-flex-1 sp-min-w-0 sp-d-flex">
					<input
						id={ id }
						type="text"
						inputMode="decimal"
						className="wcgs-number-box__input"
						value={
							null !== draft ? draft : formatNumber( value, step )
						}
						onChange={ onInput }
						onBlur={ onBlur }
						onKeyDown={ onKeyDown }
						aria-label={ ariaLabel }
						aria-valuemin={ min }
						aria-valuemax={ max }
						aria-valuenow={ current }
						role="spinbutton"
					/>
					<span className="wcgs-number-box__spin sp-d-flex sp-flex-col">
						<button
							type="button"
							className="wcgs-number-box__spin-btn"
							tabIndex={ -1 }
							title={ __(
								'Increase',
								'gallery-slider-for-woocommerce'
							) }
							onClick={ () => commit( current + step ) }
						>
							<SpinUpIcon />
						</button>
						<button
							type="button"
							className="wcgs-number-box__spin-btn"
							tabIndex={ -1 }
							title={ __(
								'Decrease',
								'gallery-slider-for-woocommerce'
							) }
							onClick={ () => commit( current - step ) }
						>
							<SpinDownIcon />
						</button>
					</span>
				</span>
				{ ! hasUnitChoice && shownUnit && (
					<span className="wcgs-number-box__unit sp-d-flex sp-align-center sp-flex-none">
						{ shownUnit }
					</span>
				) }
				{ hasUnitChoice && (
					<button
						type="button"
						className="wcgs-number-box__unit sp-d-flex sp-align-center sp-flex-none is-select"
						onMouseEnter={ openUnits }
						onMouseLeave={ closeUnitsSoon }
						onClick={ () => setUnitOpen( ! unitOpen ) }
						aria-haspopup="true"
						aria-expanded={ unitOpen }
						title={ __( 'Unit', 'gallery-slider-for-woocommerce' ) }
					>
						{ shownUnit }
					</button>
				) }
			</div>
			{ hasUnitChoice && (
				<div
					className={ `wcgs-number-box__units${
						unitOpen ? ' is-open' : ''
					}` }
					onMouseEnter={ openUnits }
					onMouseLeave={ closeUnitsSoon }
				>
					<div className="wcgs-number-box__units-list sp-d-flex sp-flex-col">
						{ units.map( ( item ) => (
							<button
								key={ item }
								type="button"
								className={ `wcgs-number-box__unit-option${
									item === shownUnit ? ' is-active' : ''
								}` }
								onClick={ () => pickUnit( item ) }
								tabIndex={ unitOpen ? 0 : -1 }
							>
								{ item }
							</button>
						) ) }
					</div>
				</div>
			) }
		</div>
	);
};

export default NumberBox;
