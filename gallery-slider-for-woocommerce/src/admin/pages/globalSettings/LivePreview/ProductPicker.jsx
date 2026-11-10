import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import useClickOutside from '../../../hooks/useClickOutside';
import useProductSearch from './useProductSearch';
import {
	ChevronDownIcon,
	CloseIcon,
	SearchIcon,
} from '../../../components/Icons';

/**
 * Thumbnail square of a product.
 *
 * @param {Object} props
 * @param {string} props.image Image URL.
 */
const Thumb = ( { image } ) => (
	<span
		className="wcgs-product-picker__thumb sp-flex-none"
		style={ image ? { backgroundImage: `url("${ image }")` } : undefined }
	/>
);

/**
 * Product dropdown of the preview toolbar, with paged server search: the
 * next page loads when the list is scrolled to its end. In the
 * layout editor it lists `groups` instead (the layout's products, see
 * `useLayoutProducts`), filtered as you type, with a "Uses …" tag on the
 * products another layout takes.
 *
 * @param {Object}     props
 * @param {Object}     props.product  Previewed product {id, name, image}, or null.
 * @param {Function}   props.onChange Called with the picked option {value, label, image}.
 * @param {Array|null} props.groups   `[ { key, title, items: [ { value, label, image, owner? } ] } ]`, or null for the server search.
 */
const ProductPicker = ( { product, onChange, groups = null } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ query, setQuery ] = useState( '' );
	const isGrouped = null !== groups;
	const {
		options: found,
		onSearch,
		loadMore,
		isSearching: isFinding,
		isLoadingMore,
		hasMore,
	} = useProductSearch( ! isGrouped );
	const filter = query.trim().toLowerCase();
	const shownGroups = isGrouped
		? groups
				.map( ( group ) => ( {
					...group,
					items: group.items.filter(
						( item ) =>
							! filter ||
							item.label.toLowerCase().includes( filter )
					),
				} ) )
				.filter( ( group ) => group.items.length )
		: [];
	const options = isGrouped
		? shownGroups.flatMap( ( group ) => group.items )
		: found;
	const isSearching = ! isGrouped && isFinding;
	const ref = useRef();
	const input = useRef();
	const list = useRef();
	const sentinel = useRef();
	const canLoadMore = isOpen && ! isGrouped && hasMore && ! isSearching;
	const close = useCallback( () => setIsOpen( false ), [] );
	useClickOutside( ref, isOpen, close );

	useEffect( () => {
		if ( isOpen && input.current ) {
			input.current.focus();
		}
	}, [ isOpen ] );

	// Next page when the end of the list scrolls into view. Observing again
	// after each page fires at once if the end is still visible, so a short
	// page fills the menu.
	useEffect( () => {
		if (
			! canLoadMore ||
			! sentinel.current ||
			'undefined' === typeof window.IntersectionObserver
		) {
			return;
		}
		const observer = new window.IntersectionObserver(
			( entries ) => {
				if ( entries.some( ( entry ) => entry.isIntersecting ) ) {
					loadMore();
				}
			},
			{ root: list.current }
		);
		observer.observe( sentinel.current );
		return () => observer.disconnect();
	}, [ canLoadMore, loadMore, options.length ] );

	const search = ( text ) => {
		setQuery( text );
		if ( ! isGrouped ) {
			onSearch( text );
		}
	};

	const pick = ( option ) => {
		onChange( option );
		setIsOpen( false );
	};

	const onKeyDown = ( event ) => {
		if ( 'Enter' === event.key && options.length ) {
			event.preventDefault();
			pick( options[ 0 ] );
		} else if ( 'Escape' === event.key ) {
			setIsOpen( false );
			search( '' );
		}
	};

	const renderOption = ( option ) => (
		<button
			key={ option.value }
			type="button"
			role="option"
			aria-selected={ option.value === product?.id }
			className={ `wcgs-product-picker__option sp-d-flex sp-align-center sp-gap-10px sp-w-full${
				option.value === product?.id ? ' is-selected' : ''
			}` }
			onClick={ () => pick( option ) }
			tabIndex={ isOpen ? 0 : -1 }
		>
			<Thumb image={ option.image } />
			<span className="wcgs-product-picker__name sp-flex-1 sp-min-w-0">
				{ option.label }
			</span>
			{ option.owner && (
				<span className="wcgs-product-picker__tag sp-flex-none">
					{ sprintf(
						/* translators: %s: layout name. */
						__( 'Uses %s', 'gallery-slider-for-woocommerce' ),
						option.owner
					) }
				</span>
			) }
		</button>
	);

	return (
		<div className="wcgs-product-picker" ref={ ref }>
			<button
				type="button"
				className={ `wcgs-product-picker__toggle sp-d-flex sp-align-center sp-gap-8px sp-w-full${
					isOpen ? ' is-open' : ''
				}` }
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-haspopup="listbox"
				aria-expanded={ isOpen }
				title={ __(
					'Product shown in the preview',
					'gallery-slider-for-woocommerce'
				) }
			>
				<Thumb image={ product?.image } />
				<span className="wcgs-product-picker__name sp-flex-1 sp-min-w-0">
					{ product?.name ||
						__(
							'Choose a product',
							'gallery-slider-for-woocommerce'
						) }
				</span>
				<ChevronDownIcon />
			</button>
			<div
				className={ `wcgs-product-picker__menu sp-d-flex sp-flex-col sp-gap-3px${
					isOpen ? ' is-open' : ''
				}` }
			>
				<div className="wcgs-product-picker__search sp-flex-none">
					<SearchIcon size={ 15 } />
					<input
						ref={ input }
						type="text"
						value={ query }
						onChange={ ( event ) => search( event.target.value ) }
						onKeyDown={ onKeyDown }
						placeholder={ __(
							'Search products…',
							'gallery-slider-for-woocommerce'
						) }
						aria-label={ __(
							'Search products',
							'gallery-slider-for-woocommerce'
						) }
						tabIndex={ isOpen ? 0 : -1 }
					/>
					{ query && (
						<button
							type="button"
							className="wcgs-product-picker__clear sp-d-i-flex sp-align-center sp-justify-center"
							onClick={ () => search( '' ) }
							aria-label={ __(
								'Clear search',
								'gallery-slider-for-woocommerce'
							) }
							tabIndex={ isOpen ? 0 : -1 }
						>
							<CloseIcon size={ 12 } />
						</button>
					) }
				</div>
				<div
					className="wcgs-product-picker__list sp-d-flex sp-flex-col sp-gap-2px sp-flex-1"
					ref={ list }
					role="listbox"
					aria-busy={ isSearching || isLoadingMore }
				>
					{ isGrouped
						? shownGroups.map( ( group ) => (
								<div
									key={ group.key || group.title }
									role="group"
									aria-label={ group.title }
								>
									<div className="wcgs-product-picker__head">
										{ group.title }
									</div>
									{ group.items.map( renderOption ) }
								</div>
						  ) )
						: options.map( renderOption ) }
					{ canLoadMore && options.length > 0 && (
						<div
							ref={ sentinel }
							className="wcgs-product-picker__more sp-d-flex sp-justify-center"
							aria-hidden="true"
						>
							{ isLoadingMore && <Spinner /> }
						</div>
					) }
					{ isSearching && ! options.length && (
						<div className="wcgs-product-picker__empty sp-d-flex sp-justify-center">
							<Spinner />
						</div>
					) }
					{ ! isSearching && ! options.length && (
						<div className="wcgs-product-picker__empty sp-d-flex sp-justify-center">
							{ query
								? sprintf(
										/* translators: %s: search text. */
										__(
											'No products match “%s”',
											'gallery-slider-for-woocommerce'
										),
										query
								  )
								: __(
										'No products yet.',
										'gallery-slider-for-woocommerce'
								  ) }
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

export default ProductPicker;
