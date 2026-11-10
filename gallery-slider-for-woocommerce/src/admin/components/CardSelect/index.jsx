import { __, sprintf } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import ControlHeader from '../ControlHeader';
import { CheckIcon } from '../Icons';
import {
	CrownIcon,
	LockPill,
	lockedOptionContent,
	useFeaturePopover,
} from '../Pro';
import './editor.scss';

/**
 * Preview area of a card: an image or any element.
 *
 * @param {Object} props
 * @param {Object} props.option        Card option.
 * @param {number} props.previewHeight Height in px.
 */
const CardPreview = ( { option, previewHeight } ) => (
	<span
		className="wcgs-card-select__preview sp-flex-center sp-gap-3px"
		style={ { height: previewHeight } }
	>
		{ option.image ? (
			<span
				className="wcgs-card-select__image"
				style={ { backgroundImage: `url(${ option.image })` } }
			/>
		) : (
			option.preview
		) }
	</span>
);

/**
 * Grid of selectable cards (`cards` in the design), e.g. zoom or active
 * thumbnail styles. A card shows a preview above its name when the option has
 * `image` or `preview`; otherwise it is a text tile.
 *
 * Pro options (`locked`) come after the free ones and are never selected.
 * When there are no more of them than free ones, each card shows a lock pill
 * and opens its popover; otherwise they collapse into one "+N more" card.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Selected value (or responsive value).
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {Array}    props.options       `[ { value, label, image, preview, locked, popover } ]`:
 *                                       `image` is a URL, `preview` any element; a `locked`
 *                                       card opens `popover` (default: "Available in Pro").
 * @param {number}   props.columns       Cards per row.
 * @param {number}   props.previewHeight Height of the preview area in px.
 */
const CardSelect = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options = [],
	columns = 3,
	previewHeight = 44,
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
	const hasMoreCard = locked.length > free.length;
	const hasPreviews = options.some(
		( option ) => option.image || option.preview
	);
	const cards = hasMoreCard ? [ ...free, null ] : [ ...free, ...locked ];

	// "Active Thumbnail Style" → "3 more active thumbnail styles".
	const name = String( label || '' )
		.toLowerCase()
		.replace( / style$/, '' );
	const moreContent = {
		title: sprintf(
			/* translators: 1: number of styles, 2: setting name, e.g. "active thumbnail". */
			__( '%1$d more %2$s styles', 'gallery-slider-for-woocommerce' ),
			locked.length,
			name
		),
		text: __(
			'Unlock every style with Pro.',
			'gallery-slider-for-woocommerce'
		),
		preview: locked.map( ( option ) => ( {
			label: option.label,
			preview: option.preview,
		} ) ),
	};

	return (
		<div className="wcgs-control wcgs-card-select">
			<ControlHeader
				label={ label }
				help={ help }
				isResponsive={ isResponsive }
			/>
			<div
				className="wcgs-card-select__grid sp-d-grid sp-gap-8px"
				style={ {
					gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
				} }
				role="radiogroup"
				aria-label={ label }
			>
				{ cards.map( ( option ) => {
					if ( null === option ) {
						return (
							<button
								key="more"
								type="button"
								className={ `wcgs-card-select__card sp-flex-center sp-min-w-0 is-more${
									hasPreviews ? ' is-tall' : ''
								}` }
								{ ...bindTrigger( moreContent ) }
							>
								<CrownIcon size={ 22 } strokeWidth={ 1.5 } />
								<span>
									{ sprintf(
										/* translators: %d: number of Pro styles. */
										__(
											'+%d more',
											'gallery-slider-for-woocommerce'
										),
										locked.length
									) }
								</span>
							</button>
						);
					}

					const hasPreview = !! ( option.image || option.preview );
					if ( option.locked ) {
						return (
							<button
								key={ String( option.value ) }
								type="button"
								role="radio"
								aria-checked={ false }
								aria-disabled="true"
								className={ `wcgs-card-select__card sp-flex-center sp-min-w-0 is-locked wcgs-lock-host${
									hasPreview ? ' has-preview' : ''
								}` }
								{ ...bindTrigger(
									option.popover ||
										lockedOptionContent( option.label )
								) }
							>
								<LockPill className="is-corner" />
								{ hasPreview && (
									<CardPreview
										option={ option }
										previewHeight={ previewHeight }
									/>
								) }
								<span className="wcgs-card-select__name">
									{ option.label }
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
							className={ `wcgs-card-select__card sp-flex-center sp-min-w-0${
								hasPreview ? ' has-preview' : ''
							}${ isActive ? ' is-active' : '' }` }
							onClick={ () => setValue( option.value ) }
						>
							<span className="wcgs-card-select__check sp-flex-center">
								<CheckIcon />
							</span>
							{ hasPreview && (
								<CardPreview
									option={ option }
									previewHeight={ previewHeight }
								/>
							) }
							<span className="wcgs-card-select__name">
								{ option.label }
							</span>
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default memo( CardSelect );
