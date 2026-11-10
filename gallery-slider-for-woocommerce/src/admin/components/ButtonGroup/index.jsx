import { memo } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import ControlHeader from '../ControlHeader';
import { CrownIcon, lockedOptionContent, useFeaturePopover } from '../Pro';
import './editor.scss';

const normalizeOptions = ( options ) =>
	options.map( ( option ) =>
		'object' === typeof option
			? option
			: { value: option, label: String( option ) }
	);

/**
 * Segmented button group with a sliding pill. Responsive when `attributes`
 * is `{ device: {…} }`.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Selected value (or responsive value).
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {Array}    props.options       `[ { value, label, locked, popover } ]` or plain values.
 *                                       A `locked` option (Pro) shows a crown and is never
 *                                       selected: hovering it opens its `popover` content (default:
 *                                       "Available in Reno Product Gallery Pro."); a click does nothing.
 * @param {boolean}  props.fitContent    Size segments by label length instead of equally.
 */
const ButtonGroup = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options = [],
	fitContent = false,
} ) => {
	const { isResponsive, value, setValue } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );
	const { bindTrigger } = useFeaturePopover();
	const items = normalizeOptions( options );
	const index = Math.max(
		0,
		items.findIndex( ( item ) => item.value === value && ! item.locked )
	);

	// Segment weights: equal, or label length + 6 (the design's `nw` rule).
	const weights = items.map( ( item ) =>
		fitContent ? String( item.label ).length + 6 : 1
	);
	const total = weights.reduce( ( a, b ) => a + b, 0 );
	const before = weights.slice( 0, index ).reduce( ( a, b ) => a + b, 0 );

	return (
		<div className="wcgs-control wcgs-button-group">
			<ControlHeader
				label={ label }
				help={ help }
				isResponsive={ isResponsive }
			/>
			<div
				className={ `wcgs-button-group__wrap sp-d-grid${
					fitContent ? ' is-fit' : ''
				}` }
				role="radiogroup"
				aria-label={ label }
				style={ {
					gridTemplateColumns: weights
						.map( ( w ) => `minmax(0,${ w }fr)` )
						.join( ' ' ),
				} }
			>
				{ items.length > 0 && (
					<span
						className="wcgs-button-group__pill"
						style={ {
							left: `calc(3px + (100% - 6px) * ${ before } / ${ total })`,
							width: `calc((100% - 6px) * ${ weights[ index ] } / ${ total })`,
						} }
					/>
				) }
				{ items.map( ( item, i ) => {
					if ( item.locked ) {
						const lockProps = bindTrigger(
							item.popover || lockedOptionContent( item.label )
						);
						return (
							<button
								key={ String( item.value ) }
								type="button"
								role="radio"
								aria-checked={ false }
								aria-disabled="true"
								className="wcgs-button-group__item is-locked"
								{ ...lockProps }
							>
								{ item.label }
								<CrownIcon />
							</button>
						);
					}
					return (
						<button
							key={ String( item.value ) }
							type="button"
							role="radio"
							aria-checked={ i === index }
							className={ `wcgs-button-group__item${
								i === index ? ' is-active' : ''
							}` }
							onClick={ () => setValue( item.value ) }
						>
							{ item.label }
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default memo( ButtonGroup );
