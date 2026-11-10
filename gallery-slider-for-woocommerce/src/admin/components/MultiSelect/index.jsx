import { __, sprintf } from '@wordpress/i18n';
import {
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import useClickOutside from '../../hooks/useClickOutside';
import ControlHeader from '../ControlHeader';
import { CheckIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '../Icons';
import './editor.scss';

const normalizeOptions = ( options ) =>
	options.map( ( option ) =>
		'object' === typeof option
			? option
			: { value: option, label: String( option ) }
	);

/**
 * Multiple choice dropdown (`ms` in the design): picked values show as
 * removable chips; the menu lists checkboxes, optionally grouped and searchable.
 *
 * @param {Object}   props
 * @param {string}   props.label           Label.
 * @param {string}   props.help            Help tip.
 * @param {Array}    props.attributes      Picked values.
 * @param {string}   props.attributesKey   Key passed to `setAttributes`.
 * @param {Function} props.setAttributes   Setter.
 * @param {Function} props.onChange        Optional setter called with the new values.
 * @param {Array}    props.options         `[ { value, label, sub, image, hint, disabled } ]` or plain
 *                                         values: `sub` is a second line, `image` a thumbnail URL,
 *                                         `hint` muted text on the right.
 * @param {Array}    props.groups          `[ { label, options } ]`, instead of `options`.
 * @param {boolean}  props.searchable      Show a search field in the menu.
 * @param {string}   props.placeholder     Text when nothing is picked.
 * @param {string}   props.note            Note at the bottom of the menu.
 * @param {Function} props.onSearch        Called with the search text; the parent then
 *                                         passes the matching `options` (server search).
 * @param {boolean}  props.isSearching     A server search is running.
 * @param {Array}    props.selectedOptions Labels of picked values that may be missing
 *                                         from `options` (with `onSearch`).
 */
const MultiSelect = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options = [],
	groups,
	searchable = false,
	placeholder = __( 'None', 'gallery-slider-for-woocommerce' ),
	note = '',
	onSearch,
	isSearching = false,
	selectedOptions = [],
} ) => {
	const id = useInstanceId( MultiSelect, 'wcgs-multi-select' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ query, setQuery ] = useState( '' );
	const ref = useRef();
	const searchRef = useRef();
	const close = useCallback( () => setIsOpen( false ), [] );
	useClickOutside( ref, isOpen, close );

	useEffect( () => {
		if ( isOpen && searchable ) {
			searchRef.current?.focus();
		}
	}, [ isOpen, searchable ] );

	const selected = Array.isArray( attributes ) ? attributes : [];
	const write = ( next ) => {
		if ( onChange ) {
			onChange( next );
		} else if ( setAttributes && attributesKey ) {
			setAttributes( { [ attributesKey ]: next } );
		}
	};
	const toggle = ( value ) =>
		write(
			selected.includes( value )
				? selected.filter( ( v ) => v !== value )
				: [ ...selected, value ]
		);

	const allGroups = ( groups || [ { label: '', options } ] ).map(
		( group ) => ( {
			...group,
			options: normalizeOptions( group.options || [] ),
		} )
	);
	const allOptions = allGroups.flatMap( ( group ) => group.options );

	const q = query.trim().toLowerCase();
	// With `onSearch` the parent already passes only the matching options.
	const visibleGroups = allGroups
		.map( ( group ) => ( {
			...group,
			options: group.options.filter(
				( option ) =>
					! q ||
					!! onSearch ||
					String( option.label ).toLowerCase().includes( q )
			),
		} ) )
		.filter( ( group ) => group.options.length );

	const knownOptions = [
		...allOptions,
		...normalizeOptions( selectedOptions ),
	];
	const chips = selected.map(
		( value ) =>
			knownOptions.find( ( option ) => option.value === value ) || {
				value,
				label: String( value ),
			}
	);

	const search = ( text ) => {
		setQuery( text );
		onSearch?.( text );
	};

	const openMenu = () => {
		if ( ! isOpen && query ) {
			search( '' );
		}
		setIsOpen( ! isOpen );
	};

	return (
		<div className="wcgs-control wcgs-multi-select">
			<ControlHeader label={ label } help={ help } htmlFor={ id } />
			<div className="wcgs-multi-select__wrap" ref={ ref }>
				<div
					className={ `wcgs-multi-select__field sp-d-flex sp-flex-wrap sp-align-center sp-gap-6px${
						isOpen ? ' is-open' : ''
					}` }
				>
					{ /* Covers the field so a click anywhere opens the menu; chips sit above it. */ }
					<button
						id={ id }
						type="button"
						className="wcgs-multi-select__toggle"
						onClick={ openMenu }
						aria-haspopup="listbox"
						aria-expanded={ isOpen }
					>
						<span className="screen-reader-text">
							{ chips.length
								? chips
										.map( ( chip ) => chip.label )
										.join( ', ' )
								: placeholder }
						</span>
					</button>
					{ chips.map( ( chip ) => (
						<span
							key={ String( chip.value ) }
							className="wcgs-multi-select__chip sp-d-i-flex sp-align-center sp-gap-4px"
						>
							{ chip.label }
							<button
								type="button"
								className="wcgs-multi-select__chip-remove sp-d-i-flex sp-align-center sp-justify-center"
								onClick={ () => toggle( chip.value ) }
								aria-label={ sprintf(
									/* translators: %s: option name. */
									__(
										'Remove %s',
										'gallery-slider-for-woocommerce'
									),
									chip.label
								) }
								title={ __(
									'Remove',
									'gallery-slider-for-woocommerce'
								) }
							>
								<CloseIcon />
							</button>
						</span>
					) ) }
					{ ! chips.length && (
						<span className="wcgs-multi-select__placeholder">
							{ placeholder }
						</span>
					) }
					<span className="wcgs-multi-select__chevron sp-d-flex">
						<ChevronDownIcon />
					</span>
				</div>
				<div
					className={ `wcgs-multi-select__menu${
						isOpen ? ' is-open' : ''
					}` }
				>
					{ searchable && (
						<div className="wcgs-multi-select__search">
							<div className="wcgs-multi-select__search-box sp-d-flex sp-align-center sp-gap-8px">
								<SearchIcon />
								<input
									ref={ searchRef }
									type="text"
									className="wcgs-multi-select__search-input"
									value={ query }
									onChange={ ( event ) =>
										search( event.target.value )
									}
									placeholder={ __(
										'Search…',
										'gallery-slider-for-woocommerce'
									) }
									aria-label={ __(
										'Search options',
										'gallery-slider-for-woocommerce'
									) }
									tabIndex={ isOpen ? 0 : -1 }
								/>
							</div>
						</div>
					) }
					<div
						role="listbox"
						aria-multiselectable="true"
						aria-labelledby={ id }
					>
						{ visibleGroups.map( ( group, gi ) => (
							<div
								key={ group.label || gi }
								role="group"
								aria-label={ group.label || undefined }
							>
								{ group.label && (
									<div className="wcgs-multi-select__group">
										{ group.label }
									</div>
								) }
								{ group.options.map( ( option ) => {
									const on = selected.includes(
										option.value
									);
									return (
										<button
											key={ String( option.value ) }
											type="button"
											role="option"
											aria-selected={ on }
											aria-disabled={ !! option.disabled }
											className={ `wcgs-multi-select__option sp-w-full sp-d-flex sp-align-center sp-gap-10px${
												option.disabled
													? ' is-disabled'
													: ''
											}` }
											onClick={ () =>
												! option.disabled &&
												toggle( option.value )
											}
											tabIndex={ isOpen ? 0 : -1 }
										>
											<span
												className={ `wcgs-multi-select__box sp-d-i-flex sp-align-center sp-justify-center${
													on ? ' is-checked' : ''
												}` }
											>
												<CheckIcon />
											</span>
											{ option.image && (
												<span
													className="wcgs-multi-select__image sp-flex-none"
													style={ {
														backgroundImage: `url(${ option.image })`,
													} }
												/>
											) }
											<span className="wcgs-multi-select__text sp-flex-1 sp-min-w-0 sp-d-flex sp-flex-col">
												<span className="wcgs-multi-select__label">
													{ option.label }
												</span>
												{ option.sub && (
													<span className="wcgs-multi-select__sub">
														{ option.sub }
													</span>
												) }
											</span>
											{ option.hint && (
												<span className="wcgs-multi-select__hint">
													{ option.hint }
												</span>
											) }
										</button>
									);
								} ) }
							</div>
						) ) }
					</div>
					{ isSearching && (
						<div className="wcgs-multi-select__empty">
							{ __(
								'Searching…',
								'gallery-slider-for-woocommerce'
							) }
						</div>
					) }
					{ q && ! isSearching && ! visibleGroups.length && (
						<div className="wcgs-multi-select__empty">
							{ sprintf(
								/* translators: %s: search text. */
								__(
									'No matches for “%s”',
									'gallery-slider-for-woocommerce'
								),
								query.trim()
							) }
						</div>
					) }
					{ note && (
						<div className="wcgs-multi-select__note">{ note }</div>
					) }
				</div>
			</div>
		</div>
	);
};

export default memo( MultiSelect );
