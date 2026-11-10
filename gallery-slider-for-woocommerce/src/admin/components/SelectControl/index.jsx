import { memo, useCallback, useRef, useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import useControlValue from '../../hooks/useControlValue';
import useClickOutside from '../../hooks/useClickOutside';
import ControlHeader from '../ControlHeader';
import { ChevronDownIcon } from '../Icons';
import { LockPill } from '../Pro';
import './editor.scss';

const normalizeOptions = ( options ) =>
	options.map( ( option ) =>
		'object' === typeof option
			? option
			: { value: option, label: String( option ) }
	);

/**
 * Dropdown select. Responsive when `attributes` is `{ device: {…} }`.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Selected value (or responsive value).
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {Array}    props.options       `[ { value, label, preview, locked } ]` or plain values;
 *                                       `preview` is an element drawn at the right of the option.
 *                                       `locked` options (Pro) are listed last, after a divider,
 *                                       with a crown pill; they are not clickable and never
 *                                       selected.
 * @param {string}   props.placeholder   Text when nothing matches the value.
 * @param {string}   props.align         Menu alignment: 'left' or 'right'.
 * @param {boolean}  props.small         Small label (inside a labelled row).
 */
const SelectControl = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options = [],
	placeholder = '',
	align = 'left',
	small = false,
} ) => {
	const id = useInstanceId( SelectControl, 'wcgs-select' );
	const { isResponsive, value, setValue } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );
	const [ isOpen, setIsOpen ] = useState( false );
	const ref = useRef();
	const close = useCallback( () => setIsOpen( false ), [] );
	useClickOutside( ref, isOpen, close );

	const all = normalizeOptions( options );
	const items = all.filter( ( item ) => ! item.locked );
	const lockedItems = all.filter( ( item ) => item.locked );
	const selected = items.find( ( item ) => item.value === value );

	const pick = ( next ) => {
		setValue( next );
		setIsOpen( false );
	};

	return (
		<div className="wcgs-control wcgs-select-control">
			<ControlHeader
				label={ label }
				help={ help }
				htmlFor={ id }
				isResponsive={ isResponsive }
				small={ small }
			/>
			<div className="wcgs-select-control__wrap" ref={ ref }>
				<button
					id={ id }
					type="button"
					className={ `wcgs-select-control__button sp-w-full sp-d-flex sp-align-center sp-gap-8px${
						isOpen ? ' is-open' : ''
					}` }
					onClick={ () => setIsOpen( ! isOpen ) }
					onKeyDown={ ( event ) => {
						if ( 'ArrowDown' === event.key && ! isOpen ) {
							event.preventDefault();
							setIsOpen( true );
						}
					} }
					aria-haspopup="listbox"
					aria-expanded={ isOpen }
				>
					<span className="wcgs-select-control__value sp-flex-1 sp-min-w-0">
						{ selected ? selected.label : placeholder || value }
					</span>
					{ selected?.preview && (
						<span className="wcgs-select-control__preview sp-d-flex sp-flex-none sp-align-center sp-gap-4px">
							{ selected.preview }
						</span>
					) }
					<span className="wcgs-select-control__chevron sp-d-flex">
						<ChevronDownIcon />
					</span>
				</button>
				<div
					className={ `wcgs-select-control__menu sp-d-flex sp-flex-col is-${ align }${
						isOpen ? ' is-open' : ''
					}` }
					role="listbox"
					aria-labelledby={ id }
				>
					{ items.map( ( item ) => (
						<button
							key={ String( item.value ) }
							type="button"
							role="option"
							aria-selected={ item.value === value }
							className={ `wcgs-select-control__option sp-w-full sp-d-flex sp-align-center sp-gap-12px${
								item.value === value ? ' is-active' : ''
							}` }
							onClick={ () => pick( item.value ) }
							tabIndex={ isOpen ? 0 : -1 }
						>
							<span>{ item.label }</span>
							{ item.preview && (
								<span className="wcgs-select-control__preview sp-d-flex sp-flex-none sp-align-center sp-gap-4px is-end">
									{ item.preview }
								</span>
							) }
						</button>
					) ) }
					{ lockedItems.length > 0 && (
						<span
							className="wcgs-select-control__divider sp-d-block"
							role="presentation"
						/>
					) }
					{ lockedItems.map( ( item ) => (
						<div
							key={ String( item.value ) }
							role="option"
							aria-selected={ false }
							aria-disabled="true"
							className="wcgs-select-control__option sp-w-full sp-d-flex sp-align-center sp-gap-12px is-locked wcgs-lock-host"
							data-novis=""
						>
							<span>{ item.label }</span>
							<LockPill />
							{ item.preview && (
								<span className="wcgs-select-control__preview sp-d-flex sp-flex-none sp-align-center sp-gap-4px">
									{ item.preview }
								</span>
							) }
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default memo( SelectControl );
