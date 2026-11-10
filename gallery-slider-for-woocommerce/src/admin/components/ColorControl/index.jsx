import { __ } from '@wordpress/i18n';
import { memo, useCallback, useRef, useState } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import useClickOutside from '../../hooks/useClickOutside';
import { isSameValue } from '../../utils/responsive';
import { startPointerDrag } from '../../utils/number';
import {
	composeColor,
	hexToHsl,
	hexToHsv,
	hexToRgb,
	hslToHex,
	hsvToHex,
	isValidHex,
	parseColor,
	rgbToHex,
} from '../../utils/color';
import ControlHeader from '../ControlHeader';
import { ChevronDownIcon } from '../Icons';
import './editor.scss';

const FORMATS = [ 'Hex', 'RGB', 'HSL' ];

export const SAVED_COLORS = [
	'#EF4444',
	'#F97316',
	'#F5C518',
	'#34C759',
	'#2DBD9A',
	'#3B82F6',
	'#5B5BEF',
	'#EC4899',
	'#F43F72',
	'#C026D3',
	'#8B5CF6',
	'#0EA5E9',
	'#10B981',
	'#84CC16',
];

const formatValue = ( format, base, stored ) => {
	if ( 'RGB' === format ) {
		return hexToRgb( base ).join( ', ' );
	}
	if ( 'HSL' === format ) {
		const [ h, s, l ] = hexToHsl( base );
		return `${ h }, ${ s }%, ${ l }%`;
	}
	return stored.replace( '#', '' ).toUpperCase();
};

/**
 * Parse the popover value field for the active format.
 *
 * @param {string} format 'Hex', 'RGB' or 'HSL'.
 * @param {string} input  Typed value.
 * @return {string|null} `#RRGGBB`, or null while the value is incomplete.
 */
const parseFormatValue = ( format, input ) => {
	if ( 'Hex' === format ) {
		const hex = '#' + input.replace( '#', '' ).trim();
		return /^#[0-9a-fA-F]{6}$/.test( hex ) ? hex.toUpperCase() : null;
	}
	const numbers = ( input.match( /-?\d+(\.\d+)?/g ) || [] ).map( Number );
	if ( 'RGB' === format && numbers.length >= 3 ) {
		const rgb = numbers.slice( 0, 3 );
		return rgb.every( ( n ) => n >= 0 && n <= 255 )
			? rgbToHex( ...rgb )
			: null;
	}
	if ( 'HSL' === format && numbers.length >= 3 ) {
		const clamp = ( n, max ) => Math.max( 0, Math.min( max, n ) );
		return hslToHex(
			clamp( numbers[ 0 ], 360 ),
			clamp( numbers[ 1 ], 100 ),
			clamp( numbers[ 2 ], 100 )
		);
	}
	return null;
};

/**
 * Color field with swatch + hex input, and a picker popover (saturation /
 * hue / alpha, Hex·RGB·HSL value, saved colors). Value: `#RRGGBB` or `#RRGGBBAA`.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {string}   props.attributes    Current color.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new color.
 * @param {string}   props.defaultValue  Default color; enables reset.
 * @param {string}   props.align         Popover alignment: 'left' or 'right'.
 * @param {string[]} props.savedColors   Swatches under the picker.
 * @param {boolean}  props.small         Small label (inside a labelled row).
 */
const ColorControl = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	defaultValue,
	align = 'left',
	savedColors = SAVED_COLORS,
	small = false,
} ) => {
	const { write } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );
	const stored = isValidHex( attributes || '' )
		? attributes.toUpperCase()
		: '#000000';
	const { base, alpha } = parseColor( stored );

	const [ isOpen, setIsOpen ] = useState( false );
	// HSV kept while the picker is open, so hue survives grey/black picks.
	const [ pick, setPick ] = useState( null );
	const [ hexDraft, setHexDraft ] = useState( null );
	const [ valueDraft, setValueDraft ] = useState( null );
	const [ format, setFormat ] = useState( 'Hex' );
	const [ formatOpen, setFormatOpen ] = useState( false );
	const ref = useRef();

	const close = useCallback( () => {
		setIsOpen( false );
		setFormatOpen( false );
	}, [] );
	useClickOutside( ref, isOpen, close );

	const hsv = isOpen && pick ? pick : { ...hexToHsv( base ), a: alpha };

	const commit = ( hex, nextPick ) => {
		const next = nextPick || { ...hexToHsv( hex ), a: hsv.a };
		setPick( next );
		write( composeColor( hex, next.a ) );
	};

	const toggle = () => {
		if ( ! isOpen ) {
			setPick( { ...hexToHsv( base ), a: alpha } );
		}
		setIsOpen( ! isOpen );
		setFormatOpen( false );
	};

	const onHexInput = ( event ) => {
		const typed = event.target.value.trim();
		setHexDraft( typed );
		const hex = typed.startsWith( '#' ) ? typed : '#' + typed;
		if ( isValidHex( hex ) ) {
			const parsed = parseColor( hex );
			commit( parsed.base, {
				...hexToHsv( parsed.base ),
				a: parsed.alpha,
			} );
		}
	};

	const onValueInput = ( event ) => {
		setValueDraft( event.target.value );
		const hex = parseFormatValue( format, event.target.value );
		if ( hex ) {
			commit( hex );
		}
	};

	const onSaturationDown = ( event ) =>
		startPointerDrag( event, ( x, y ) => {
			const next = { h: hsv.h, s: x * 100, v: ( 1 - y ) * 100, a: hsv.a };
			commit( hsvToHex( next.h, next.s, next.v ), next );
		} );

	const onHueDown = ( event ) =>
		startPointerDrag( event, ( x ) => {
			const next = { ...hsv, h: Math.min( 359.9, x * 360 ) };
			commit( hsvToHex( next.h, next.s, next.v ), next );
		} );

	const onAlphaDown = ( event ) =>
		startPointerDrag( event, ( x ) => {
			const next = { ...hsv, a: Math.round( x * 100 ) };
			setPick( next );
			write( composeColor( base, next.a ) );
		} );

	const clearDrafts = () => {
		setHexDraft( null );
		setValueDraft( null );
	};

	return (
		<div className="wcgs-control wcgs-color-control">
			<ControlHeader
				label={ label }
				help={ help }
				small={ small }
				onReset={
					undefined !== defaultValue
						? () => write( defaultValue )
						: undefined
				}
				showReset={
					undefined !== defaultValue &&
					! isSameValue(
						stored,
						String( defaultValue ).toUpperCase()
					)
				}
			/>
			<div className="wcgs-color-control__wrap sp-min-w-0" ref={ ref }>
				<div
					className={ `wcgs-color-control__box sp-d-flex sp-align-center sp-gap-8px sp-w-full${
						isOpen ? ' is-open' : ''
					}` }
				>
					<button
						type="button"
						className="wcgs-color-control__swatch"
						style={ { background: stored } }
						onClick={ toggle }
						aria-label={ __(
							'Open color picker',
							'gallery-slider-for-woocommerce'
						) }
						aria-expanded={ isOpen }
					/>
					<input
						type="text"
						className="wcgs-color-control__hex"
						value={ null !== hexDraft ? hexDraft : stored }
						onChange={ onHexInput }
						onFocus={ ( event ) => event.target.select() }
						onBlur={ clearDrafts }
						aria-label={
							label ||
							__( 'Color', 'gallery-slider-for-woocommerce' )
						}
					/>
				</div>
				<div
					className={ `wcgs-color-control__popover is-${ align }${
						isOpen ? ' is-open' : ''
					}` }
				>
					<div
						className="wcgs-color-control__saturation"
						style={ {
							background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),hsl(${ Math.round(
								hsv.h
							) },100%,50%)`,
						} }
						onPointerDown={ onSaturationDown }
					>
						<span
							className="wcgs-color-control__sat-knob"
							style={ {
								left: `${ hsv.s }%`,
								top: `${ 100 - hsv.v }%`,
								background: base,
							} }
						/>
					</div>
					<div
						className="wcgs-color-control__hue"
						onPointerDown={ onHueDown }
					>
						<span
							className="wcgs-color-control__bar-knob"
							style={ { left: `${ ( hsv.h / 360 ) * 100 }%` } }
						/>
					</div>
					<div
						className="wcgs-color-control__alpha"
						style={ {
							backgroundImage: `linear-gradient(to right,transparent,${ base }),linear-gradient(45deg,#E2E3E6 25%,transparent 25%,transparent 75%,#E2E3E6 75%),linear-gradient(45deg,#E2E3E6 25%,#fff 25%,#fff 75%,#E2E3E6 75%)`,
						} }
						onPointerDown={ onAlphaDown }
					>
						<span
							className="wcgs-color-control__bar-knob"
							style={ { left: `${ hsv.a ?? 100 }%` } }
						/>
					</div>
					<div className="wcgs-color-control__values sp-d-flex sp-align-center sp-gap-8px">
						<div className="wcgs-color-control__format sp-flex-none">
							<button
								type="button"
								className={ `wcgs-color-control__format-toggle sp-d-i-flex sp-align-center${
									formatOpen ? ' is-open' : ''
								}` }
								onClick={ () => setFormatOpen( ! formatOpen ) }
								aria-haspopup="true"
								aria-expanded={ formatOpen }
							>
								{ format }
								<ChevronDownIcon
									size={ 11 }
									strokeWidth={ 1.2 }
								/>
							</button>
							<div
								className={ `wcgs-color-control__format-menu sp-d-flex sp-flex-col sp-gap-2px${
									formatOpen ? ' is-open' : ''
								}` }
							>
								{ FORMATS.map( ( item ) => (
									<button
										key={ item }
										type="button"
										className={ `wcgs-color-control__format-option${
											item === format ? ' is-active' : ''
										}` }
										onClick={ () => {
											setFormat( item );
											setFormatOpen( false );
											setValueDraft( null );
										} }
										tabIndex={ formatOpen ? 0 : -1 }
									>
										{ item }
									</button>
								) ) }
							</div>
						</div>
						<div className="wcgs-color-control__value sp-flex-1 sp-min-w-0 sp-d-flex sp-align-center sp-gap-6px">
							{ 'Hex' === format && <span>#</span> }
							<input
								type="text"
								className="wcgs-color-control__value-input"
								value={
									null !== valueDraft
										? valueDraft
										: formatValue( format, base, stored )
								}
								onChange={ onValueInput }
								onFocus={ ( event ) => event.target.select() }
								onBlur={ clearDrafts }
								aria-label={ format }
							/>
						</div>
					</div>
					<div className="wcgs-color-control__saved-title">
						{ __(
							'Saved colors',
							'gallery-slider-for-woocommerce'
						) }
					</div>
					<div className="wcgs-color-control__saved sp-d-grid sp-gap-8px">
						{ savedColors.map( ( hex ) => (
							<button
								key={ hex }
								type="button"
								title={ hex }
								aria-label={ hex }
								className={ `wcgs-color-control__saved-swatch${
									base.toLowerCase() === hex.toLowerCase()
										? ' is-active'
										: ''
								}` }
								style={ { background: hex } }
								onClick={ () => commit( hex.toUpperCase() ) }
							/>
						) ) }
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo( ColorControl );
