import { __, sprintf } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import ControlHeader from '../ControlHeader';
import { CrownIcon, useFeaturePopover } from '../Pro';
import './editor.scss';

/**
 * Icon of an option.
 *
 * @param {Object} props
 * @param {Object} props.option `{ path, fillPath }`.
 */
const OptionIcon = ( { option } ) => (
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.6"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		{ option.path && <path d={ option.path } /> }
		{ option.fillPath && (
			<path
				d={ option.fillPath }
				fill="currentColor"
				fillRule="evenodd"
				stroke="none"
			/>
		) }
	</svg>
);

/**
 * Grid of icon buttons (`icons` in the design), e.g. arrow or cursor styles.
 * Up to 12 icon-only options sit on one row; otherwise `columns` per row.
 *
 * Pro options (`locked`) come after the free ones. When there are no more of
 * them than free ones, each shows a crown and opens the "More icon styles"
 * popover; otherwise they collapse into one "+N" tile whose popover lists them.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Selected value (or responsive value).
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {Array}    props.options       `[ { value, title, path, fillPath, text, locked } ]`: `path`
 *                                       is stroked, `fillPath` filled (24×24 viewBox); `text`
 *                                       shows a text label instead of an icon; `locked` is Pro.
 * @param {number}   props.columns       Columns when the options don't fit one row.
 */
const IconPicker = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options = [],
	columns = 6,
} ) => {
	const { isResponsive, value, setValue } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );
	const { bindTrigger } = useFeaturePopover();

	const free = options.filter( ( option ) => ! option.locked );
	const locked = options.filter( ( option ) => option.locked );
	const hasMoreTile = locked.length > free.length;
	// Each cell: an option, or the "+N" tile (two columns wide).
	const cells = hasMoreTile ? [ ...free, null ] : [ ...free, ...locked ];

	let cols;
	if ( hasMoreTile ) {
		cols = free.length + 2;
	} else {
		const oneRow =
			options.length <= 12 &&
			options.every( ( option ) => ! option.text );
		cols = Math.max( 1, oneRow ? options.length : columns );
	}
	const span = ( cell ) => ( null === cell ? 2 : 1 );
	const slots = cells.reduce( ( sum, cell ) => sum + span( cell ), 0 );
	const rows = Math.ceil( slots / cols );

	const moreContent = {
		title: sprintf(
			/* translators: %d: number of icon styles. */
			__( '%d more icon styles', 'gallery-slider-for-woocommerce' ),
			locked.length
		),
		text: __(
			'Unlock every icon style with Pro.',
			'gallery-slider-for-woocommerce'
		),
		preview: locked.map( ( option ) => ( {
			title: option.title,
			path: option.path,
			fillPath: option.fillPath,
		} ) ),
	};
	const lockedContent = {
		title: __( 'More icon styles', 'gallery-slider-for-woocommerce' ),
		text: __(
			'Available in Reno Product Gallery Pro.',
			'gallery-slider-for-woocommerce'
		),
	};

	let slot = 0;
	return (
		<div className="wcgs-control wcgs-icon-picker">
			<ControlHeader
				label={ label }
				help={ help }
				isResponsive={ isResponsive }
			/>
			<div
				className="wcgs-icon-picker__grid sp-d-grid"
				style={ { gridTemplateColumns: `repeat(${ cols }, 1fr)` } }
				role="radiogroup"
				aria-label={ label }
			>
				{ cells.map( ( option, i ) => {
					const start = slot;
					slot += span( option );
					const sepRight = slot % cols !== 0 && i < cells.length - 1;
					const sepBottom = Math.floor( start / cols ) < rows - 1;
					const classes = [
						'wcgs-icon-picker__item sp-flex-center sp-min-w-0',
						sepRight && 'has-sep-right',
						sepBottom && 'has-sep-bottom',
					];

					if ( null === option ) {
						return (
							<button
								key="more"
								type="button"
								className={ [ ...classes, 'is-more' ]
									.filter( Boolean )
									.join( ' ' ) }
								title={ moreContent.title }
								{ ...bindTrigger( moreContent ) }
							>
								<CrownIcon />
								{ `+${ locked.length }` }
							</button>
						);
					}

					if ( option.locked ) {
						return (
							<button
								key={ String( option.value ) }
								type="button"
								role="radio"
								aria-checked={ false }
								aria-disabled="true"
								aria-label={ option.title || option.text }
								title={ option.title || option.text }
								className={ [ ...classes, 'is-locked' ]
									.filter( Boolean )
									.join( ' ' ) }
								{ ...bindTrigger( lockedContent ) }
							>
								{ option.text ? (
									option.text
								) : (
									<OptionIcon option={ option } />
								) }
								<span className="wcgs-icon-picker__crown">
									<CrownIcon />
								</span>
							</button>
						);
					}

					const isActive = option.value === value;
					return (
						<button
							key={ String( option.value ) }
							type="button"
							role="radio"
							aria-checked={ isActive }
							aria-label={ option.title || option.text }
							title={ option.title || option.text }
							className={ [ ...classes, isActive && 'is-active' ]
								.filter( Boolean )
								.join( ' ' ) }
							onClick={ () => setValue( option.value ) }
						>
							{ option.text ? (
								option.text
							) : (
								<OptionIcon option={ option } />
							) }
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default memo( IconPicker );
