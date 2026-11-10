import { __, sprintf } from '@wordpress/i18n';
import { memo, useCallback, useRef, useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import useControlValue from '../../hooks/useControlValue';
import useClickOutside from '../../hooks/useClickOutside';
import ControlHeader from '../ControlHeader';
import { CheckIcon } from '../Icons';
import { LockPill, openPricing, useProUrl } from '../Pro';
import { layoutArt } from './layoutArt';
import './editor.scss';

/**
 * Gallery layouts of the `gallery_layout` setting: the free ones in the
 * design's order, then the Pro ones (`locked`).
 */
export const GALLERY_LAYOUTS = [
	{
		value: 'horizontal',
		label: __( 'Thumbs Bottom', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'vertical',
		label: __( 'Thumbs Left', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'vertical_right',
		label: __( 'Thumbs Right', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'horizontal_top',
		label: __( 'Thumbs Top', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'hide_thumb',
		label: __( 'Slider', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'grid',
		label: __( 'Tiles', 'gallery-slider-for-woocommerce' ),
		locked: true,
	},
	{
		value: 'modern',
		label: __( 'Hierarchy Grid', 'gallery-slider-for-woocommerce' ),
		locked: true,
	},
	{
		value: 'modern_grid',
		label: __( 'Modern Grid', 'gallery-slider-for-woocommerce' ),
		locked: true,
	},
	{
		value: 'anchor_navigation',
		label: __( 'Anchor Nav', 'gallery-slider-for-woocommerce' ),
		locked: true,
	},
	{
		value: 'vertical_scroll',
		label: __( 'Vertical Scroll', 'gallery-slider-for-woocommerce' ),
		locked: true,
	},
	{
		value: 'multi_row_thumb',
		label: __( 'Multi-row Thumbs', 'gallery-slider-for-woocommerce' ),
		locked: true,
	},
];

const SliderArrows = () => (
	<svg
		viewBox="0 0 44 24"
		className="wcgs-layout-art__arrows"
		aria-hidden="true"
	>
		<path
			d="M6 8l-4 4 4 4M38 8l4 4-4 4"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * Wireframe of a layout.
 *
 * @param {Object} props
 * @param {string} props.layout Layout key.
 * @param {number} props.width  Frame width in px.
 * @param {number} props.height Frame height in px.
 */
export const LayoutArt = ( { layout, width, height } ) => {
	const art = layoutArt( layout, width, height );
	return (
		<span
			className="wcgs-layout-art sp-flex-none sp-d-block"
			style={ { width: art.width, height: art.height } }
			aria-hidden="true"
		>
			{ art.shapes.map( ( shape, i ) => (
				<span
					key={ i }
					className="wcgs-layout-art__shape sp-flex-center"
					style={ shape.style }
				>
					{ shape.slider && <SliderArrows /> }
				</span>
			) ) }
		</span>
	);
};

/**
 * Grid of layout cards, shared by the picker's popover and the live
 * preview's "Gallery Layouts" drawer. Pro layouts (`locked`) are not
 * selectable; only their "Get Pro" pill opens the pricing page.
 *
 * @param {Object}   props
 * @param {Array}    props.options     `[ { value, label, locked } ]`.
 * @param {string}   props.value       Selected layout key.
 * @param {Function} props.onPick      Called with the picked layout key.
 * @param {string}   props.label       Accessible name of the group.
 * @param {boolean}  props.isFocusable Whether the cards take keyboard focus.
 * @param {string}   props.className   Extra class of the grid.
 */
export const LayoutGrid = ( {
	options = GALLERY_LAYOUTS,
	value,
	onPick,
	label,
	isFocusable = true,
	className = '',
} ) => {
	const proUrl = useProUrl();
	return (
		<div
			className={ `wcgs-layout-picker__grid sp-d-grid ${ className }`.trim() }
			role="radiogroup"
			aria-label={
				label ||
				__( 'Gallery Layouts', 'gallery-slider-for-woocommerce' )
			}
		>
			{ options.map( ( option ) => {
				if ( option.locked ) {
					// Only the "Get Pro" pill opens the pricing page.
					return (
						<div
							key={ option.value }
							role="radio"
							aria-checked={ false }
							aria-disabled="true"
							className="wcgs-layout-picker__option sp-d-flex sp-flex-col sp-gap-6px is-locked wcgs-lock-host"
						>
							<span className="wcgs-layout-picker__card sp-flex-center">
								<LayoutArt
									layout={ option.value }
									width={ 62 }
									height={ 48 }
								/>
								<LockPill
									className="is-corner"
									onClick={ () => openPricing( proUrl ) }
									tabIndex={ isFocusable ? 0 : -1 }
								/>
							</span>
							<span className="wcgs-layout-picker__option-name">
								{ option.label }
							</span>
						</div>
					);
				}
				const isActive = option.value === value;
				return (
					<button
						key={ option.value }
						type="button"
						role="radio"
						aria-checked={ isActive }
						className={ `wcgs-layout-picker__option sp-d-flex sp-flex-col sp-gap-6px${
							isActive ? ' is-active' : ''
						}` }
						onClick={ () => onPick( option.value ) }
						tabIndex={ isFocusable ? 0 : -1 }
					>
						<span className="wcgs-layout-picker__card sp-flex-center">
							<LayoutArt
								layout={ option.value }
								width={ 62 }
								height={ 48 }
							/>
							<span className="wcgs-layout-picker__check">
								<CheckIcon size={ 9 } />
							</span>
						</span>
						<span className="wcgs-layout-picker__option-name">
							{ option.label }
						</span>
					</button>
				);
			} ) }
		</div>
	);
};

/**
 * Gallery layout picker (`layout` in the design): the current layout's
 * wireframe and name, and a "Change Layout" button. The button opens a
 * popover grid of layouts, or calls `onOpen` instead when given (the Global
 * Settings page opens the preview's layout drawer, as in the design).
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {string}   props.attributes    Selected layout key.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new key.
 * @param {Array}    props.options       `[ { value, label } ]`; defaults to every gallery layout.
 * @param {Function} props.onOpen        Optional: opens the layouts elsewhere instead of the popover.
 * @param {boolean}  props.isOpen        With `onOpen`: whether those layouts are open.
 */
const LayoutPicker = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options = GALLERY_LAYOUTS,
	onOpen,
	isOpen: isOpenElsewhere = false,
} ) => {
	const id = useInstanceId( LayoutPicker, 'wcgs-layout-picker' );
	const { value, setValue } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );
	const [ isMenuOpen, setIsMenuOpen ] = useState( false );
	const ref = useRef();
	const close = useCallback( () => setIsMenuOpen( false ), [] );
	useClickOutside( ref, isMenuOpen, close );

	const current =
		options.find(
			( option ) => option.value === value && ! option.locked
		) || options[ 0 ];
	const isOpen = onOpen ? isOpenElsewhere : isMenuOpen;

	const pick = ( next ) => {
		setValue( next );
		setIsMenuOpen( false );
	};

	return (
		<div className="wcgs-control wcgs-layout-picker" ref={ ref }>
			<ControlHeader label={ label } help={ help } />
			<div className="wcgs-layout-picker__summary sp-d-flex sp-align-center sp-gap-14px">
				<span className="wcgs-layout-picker__frame sp-flex-center">
					<LayoutArt
						layout={ current?.value }
						width={ 80 }
						height={ 62 }
					/>
				</span>
				<div className="wcgs-layout-picker__info sp-min-w-0 sp-d-flex sp-flex-col sp-align-start sp-gap-10px">
					<div className="wcgs-layout-picker__name">
						{ current?.label }
					</div>
					<button
						type="button"
						className={ `wcgs-layout-picker__change sp-d-i-flex sp-align-center${
							isOpen ? ' is-open' : ''
						}` }
						onClick={
							onOpen
								? onOpen
								: () => setIsMenuOpen( ! isMenuOpen )
						}
						aria-expanded={ isOpen }
						aria-controls={ onOpen ? undefined : id }
						data-wcgs-layouts-toggle={ onOpen ? '' : undefined }
					>
						{ __(
							'Change Layout',
							'gallery-slider-for-woocommerce'
						) }
					</button>
				</div>
			</div>
			{ ! onOpen && (
				<div
					id={ id }
					className={ `wcgs-layout-picker__menu${
						isMenuOpen ? ' is-open' : ''
					}` }
				>
					<div className="wcgs-layout-picker__menu-head sp-d-flex sp-gap-10px">
						<span className="wcgs-layout-picker__menu-title">
							{ __(
								'Gallery Layouts',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span className="wcgs-layout-picker__menu-meta sp-min-w-0">
							{ sprintf(
								/* translators: %s: layout name. */
								__(
									'%s selected',
									'gallery-slider-for-woocommerce'
								),
								current?.label
							) }
						</span>
					</div>
					<LayoutGrid
						options={ options }
						value={ current?.value }
						onPick={ pick }
						label={ label }
						isFocusable={ isMenuOpen }
					/>
				</div>
			) }
		</div>
	);
};

export default memo( LayoutPicker );
