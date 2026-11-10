import { __, _n, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import {
	CheckIcon,
	ChevronDownIcon,
	CrossIcon,
	SearchIcon,
} from '../../components/Icons';
import { affectedCount, indexCategories, productLabel } from './utils';

// Exit animation lengths (match the stylesheet).
const OUT_MS = 220;
const SUMMARY_OUT_MS = 210;

// Products per page of the Products and Exclude tabs.
const PER_PAGE = 10;
const EMPTY_PAGES = { items: [], total: 0 };
const NO_PICKS = { categories: [], products: [], exclude: [] };

const TABS = [
	{
		key: 'categories',
		label: __( 'Categories', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'products',
		label: __( 'Products', 'gallery-slider-for-woocommerce' ),
	},
	{
		key: 'exclude',
		label: __( 'Exclude', 'gallery-slider-for-woocommerce' ),
	},
];

/**
 * A pickable row of the drawer: checkbox, optional thumbnail, label and
 * meta. A row owned by another layout is locked, with a tip naming it.
 *
 * @param {Object}   props
 * @param {string}   props.label    Name.
 * @param {string}   props.meta     Right-hand note ("12 products", "Product").
 * @param {boolean}  props.isOn     Checked.
 * @param {string}   props.lockTip  Why it can't be picked, or ''.
 * @param {number}   props.level    Indent level (categories).
 * @param {string}   props.image    Thumbnail URL (products).
 * @param {boolean}  props.hasImage Reserve the thumbnail square.
 * @param {boolean}  props.tipDown  Open the tip downwards (first rows).
 * @param {Function} props.onToggle Toggle handler.
 */
const DrawerRow = ( {
	label,
	meta,
	isOn,
	lockTip = '',
	level = 0,
	image = '',
	hasImage = false,
	tipDown = false,
	onToggle,
} ) => {
	const isLocked = !! lockTip;
	return (
		<button
			type="button"
			className={ `wcgs-assign-drawer__row sp-w-full sp-d-flex sp-align-center sp-gap-10px${
				isOn ? ' is-on' : ''
			}${ hasImage ? ' has-thumb' : '' }${
				isLocked ? ' is-locked wcgs-tip is-left' : ''
			}${ tipDown ? ' is-down' : '' }` }
			role="checkbox"
			aria-checked={ isOn }
			aria-disabled={ isLocked }
			onClick={ isLocked ? undefined : onToggle }
		>
			<span className={ `wcgs-check${ isOn ? ' is-on' : '' }` }>
				<span className="wcgs-check__mark sp-d-i-flex">
					<CheckIcon size={ 10 } strokeWidth={ 3.4 } />
				</span>
			</span>
			{ level > 0 && (
				<span
					className="wcgs-assign-drawer__indent sp-flex-none"
					style={ { width: 14 * level } }
				/>
			) }
			{ hasImage && (
				<span
					className="wcgs-assign-drawer__thumb"
					style={
						image
							? { backgroundImage: `url("${ image }")` }
							: undefined
					}
				/>
			) }
			<span className="wcgs-assign-drawer__label sp-min-w-0">
				{ label }
			</span>
			<span className="wcgs-assign-drawer__meta sp-flex-none">
				{ meta }
			</span>
			{ isLocked && <span className="wcgs-tip__box">{ lockTip }</span> }
		</button>
	);
};

/**
 * Pages of products from REST `wcgs/v1/layouts/products`, ten at a time,
 * for the drawer's Products and Exclude tabs. Idle while `isActive` is off.
 *
 * @param {Object}  props
 * @param {boolean} props.isActive   Whether the tab is showing.
 * @param {string}  props.search     Search text.
 * @param {Array}   props.categories Only products filed under these, or null for all.
 * @param {Array}   props.skip       Product IDs to leave out.
 * @param {number}  props.freeFor    Leave out the products layouts other than this one hold (0: off).
 * @param {string}  props.freeKind   What "hold" means: 'products' (picked) or 'exclude' (excluded).
 * @return {Object} `{ items, total, isLoading, loadMore }`.
 */
const useProductPages = ( {
	isActive,
	search,
	categories = null,
	skip = [],
	freeFor = 0,
	freeKind = 'products',
} ) => {
	const [ result, setResult ] = useState( EMPTY_PAGES );
	const [ isLoading, setLoading ] = useState( false );
	// A failed page stops the paging until the query changes (no retry loop).
	const [ hasFailed, setFailed ] = useState( false );
	const page = useRef( 0 );
	const request = useRef( 0 );
	const query = search.trim();
	const key = JSON.stringify( [
		query,
		categories,
		skip,
		freeFor,
		freeKind,
	] );

	const load = useCallback(
		async ( next ) => {
			const id = ++request.current;
			setLoading( true );
			const params = new window.URLSearchParams( {
				search: query,
				page: next,
				per_page: PER_PAGE,
			} );
			( categories || [] ).forEach( ( category ) =>
				params.append( 'categories[]', category )
			);
			skip.forEach( ( product ) => params.append( 'skip[]', product ) );
			if ( freeFor ) {
				params.append( 'free_for', freeFor );
				params.append( 'free_kind', freeKind );
			}
			let response = EMPTY_PAGES;
			try {
				response = await apiFetch( {
					path: `/wcgs/v1/layouts/products?${ params.toString() }`,
				} );
			} catch ( error ) {
				// Keep what is listed; a new query tries again.
				if ( id === request.current ) {
					setLoading( false );
					setFailed( true );
				}
				return;
			}
			// Only the latest request may update the list.
			if ( id !== request.current ) {
				return;
			}
			page.current = next;
			setResult( ( current ) => ( {
				items:
					1 === next
						? response.items
						: [ ...current.items, ...response.items ],
				total: response.total,
			} ) );
			setLoading( false );
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `key` holds the query, categories and skip.
		[ key ]
	);

	// First page on open and on every change of the query; nothing listed while idle.
	useEffect( () => {
		++request.current;
		page.current = 0;
		setFailed( false );
		setLoading( false );
		if ( ! isActive ) {
			setResult( EMPTY_PAGES );
			return;
		}
		const timer = setTimeout( () => load( 1 ), query ? 300 : 0 );
		return () => clearTimeout( timer );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `load` changes with `key`.
	}, [ isActive, load ] );

	const loadMore = useCallback( () => {
		if (
			isActive &&
			! isLoading &&
			! hasFailed &&
			page.current > 0 &&
			result.items.length < result.total
		) {
			load( page.current + 1 );
		}
	}, [ isActive, isLoading, hasFailed, result, load ] );

	return { ...result, isLoading, loadMore };
};

/**
 * "Assign Layout" drawer of the layout editor: pick the categories and
 * products the layout applies to, and the products its categories leave
 * out (Exclude). Items assigned to another layout are locked (one layout
 * per category or product, the first match wins on the store). Products
 * load ten at a time as the list scrolls. A footer sums up the picks as
 * removable chips.
 */
const AssignDrawer = () => {
	const { isOpen, meta, layoutId, layouts, categories, productsById } =
		useSelect( ( select ) => {
			const store = select( STORE_NAME );
			return {
				isOpen: store.isAssignDrawerOpen(),
				meta: store.getLayoutMeta(),
				layoutId: store.getLayoutId(),
				layouts: store.getLayouts(),
				categories: store.getLayoutCategories(),
				productsById: store.getLayoutProducts(),
			};
		}, [] );
	const { setAssignDrawerOpen, setLayoutMeta } = useDispatch( STORE_NAME );
	const [ isMounted, setMounted ] = useState( isOpen );
	const [ isClosing, setClosing ] = useState( false );
	const [ tab, setTab ] = useState( 'categories' );
	const [ query, setQuery ] = useState( '' );
	const [ onlyFree, setOnlyFree ] = useState( false );
	// This layout's own picks as of when the filter went on, or the drawer or
	// the tab opened: "Show only unassigned / not excluded" hides them too.
	const [ ownWhenFiltered, setOwnWhenFiltered ] = useState( NO_PICKS );
	const [ isSummaryCollapsed, setSummaryCollapsed ] = useState( false );
	const [ isSummaryLeaving, setSummaryLeaving ] = useState( false );
	// Product labels seen in the lists, so chips can name a pick.
	const [ known, setKnown ] = useState( {} );
	const [ pill, setPill ] = useState( null );
	const tabsRef = useRef();
	const listRef = useRef();
	const sentinelRef = useRef();
	const searchInput = useRef();
	const closeTimer = useRef();
	const summaryTimer = useRef();
	const hadSummary = useRef( false );

	// Who else holds a category, a product or an exclusion: `{ id: layout name }`.
	const owners = useMemo( () => {
		const byCategory = {};
		const byProduct = {};
		const byExclude = {};
		layouts.forEach( ( layout ) => {
			// Free applies the first layout only: later ones (kept from Pro) hold nothing.
			if ( layout.id === layoutId || false === layout.isActiveInFree ) {
				return;
			}
			layout.categories.forEach( ( id ) => {
				byCategory[ id ] = byCategory[ id ] || layout.name;
			} );
			( layout.exclude || [] ).forEach( ( id ) => {
				byExclude[ id ] = byExclude[ id ] || layout.name;
			} );
			layout.products.forEach( ( id ) => {
				byProduct[ id ] = byProduct[ id ] || layout.name;
			} );
		} );
		return { byCategory, byProduct, byExclude };
	}, [ layouts, layoutId ] );

	const snapshotOwn = () =>
		setOwnWhenFiltered( {
			categories: meta.categories,
			products: meta.products,
			exclude: meta.exclude,
		} );
	// With the filter on, the list holds only what no layout has, this one
	// included. A pick made while it is on stays listed (checked), so the row
	// doesn't vanish under the pointer; one removed from the summary comes back.
	const hiddenOwn = onlyFree
		? {
				categories: ownWhenFiltered.categories.filter( ( id ) =>
					meta.categories.includes( id )
				),
				products: ownWhenFiltered.products.filter( ( id ) =>
					meta.products.includes( id )
				),
				exclude: ownWhenFiltered.exclude.filter( ( id ) =>
					meta.exclude.includes( id )
				),
		  }
		: NO_PICKS;

	// "Show only unassigned / not excluded" has the server leave other layouts' items out, so pages stay full.
	const products = useProductPages( {
		isActive: isMounted && 'products' === tab,
		search: query,
		skip: hiddenOwn.products,
		freeFor: onlyFree ? layoutId || -1 : 0,
	} );
	// Exclude lists every product but the ones picked in Products, as the design does.
	const exclusions = useProductPages( {
		isActive: isMounted && 'exclude' === tab,
		search: query,
		skip: [ ...meta.products, ...hiddenOwn.exclude ],
		freeFor: onlyFree ? layoutId || -1 : 0,
		freeKind: 'exclude',
	} );
	const pages = 'exclude' === tab ? exclusions : products;

	// Mount on open; keep mounted through the exit animation.
	useEffect( () => {
		clearTimeout( closeTimer.current );
		if ( isOpen ) {
			setMounted( true );
			setClosing( false );
			setQuery( '' );
			snapshotOwn();
			return;
		}
		if ( isMounted ) {
			setClosing( true );
			closeTimer.current = setTimeout( () => {
				setMounted( false );
				setClosing( false );
			}, OUT_MS );
		}
		return () => clearTimeout( closeTimer.current );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Runs on open/close only.
	}, [ isOpen ] );

	useEffect( () => {
		if ( isOpen ) {
			searchInput.current?.focus( { preventScroll: true } );
		}
	}, [ isOpen, tab ] );

	// Escape closes.
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key ) {
				setAssignDrawerOpen( false );
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ isOpen, setAssignDrawerOpen ] );

	// Remember the labels of listed products.
	useEffect( () => {
		const items = [ ...products.items, ...exclusions.items ];
		if ( ! items.length ) {
			return;
		}
		setKnown( ( current ) => {
			const next = { ...current };
			items.forEach( ( item ) => {
				next[ item.value ] = { label: item.label, image: item.image };
			} );
			return next;
		} );
	}, [ products.items, exclusions.items ] );

	// Next page when the end of the list comes into view.
	const { loadMore } = pages;
	const listedCount = pages.items.length;
	useEffect( () => {
		const sentinel = sentinelRef.current;
		if ( ! sentinel || 'categories' === tab ) {
			return;
		}
		const observer = new window.IntersectionObserver(
			( entries ) => {
				if ( entries.some( ( entry ) => entry.isIntersecting ) ) {
					loadMore();
				}
			},
			{ root: listRef.current, rootMargin: '0px 0px 60px 0px' }
		);
		observer.observe( sentinel );
		return () => observer.disconnect();
	}, [ tab, loadMore, listedCount, isMounted ] );

	// The sliding pill behind the active tab.
	useLayoutEffect( () => {
		const el = tabsRef.current;
		if ( ! el || ! isMounted ) {
			return;
		}
		const measure = () => {
			const active = el.querySelector( '[aria-selected="true"]' );
			if ( active ) {
				setPill( { x: active.offsetLeft, w: active.offsetWidth } );
			}
		};
		measure();
		const observer = new window.ResizeObserver( measure );
		observer.observe( el );
		return () => observer.disconnect();
	}, [ tab, isMounted ] );

	// The summary card plays its exit before it unmounts.
	const picks = meta.categories.length + meta.products.length;
	const hasSummary = picks + meta.exclude.length > 0;
	useEffect( () => {
		clearTimeout( summaryTimer.current );
		if ( hadSummary.current && ! hasSummary ) {
			setSummaryLeaving( true );
			summaryTimer.current = setTimeout(
				() => setSummaryLeaving( false ),
				SUMMARY_OUT_MS
			);
		} else if ( hasSummary ) {
			setSummaryLeaving( false );
		}
		hadSummary.current = hasSummary;
		return () => clearTimeout( summaryTimer.current );
	}, [ hasSummary ] );

	const categoriesById = useMemo(
		() => indexCategories( categories ),
		[ categories ]
	);
	const labels = useMemo(
		() => ( { ...productsById, ...known } ),
		[ productsById, known ]
	);
	if ( ! isMounted ) {
		return null;
	}

	const close = () => setAssignDrawerOpen( false );
	// Whether "Show only unassigned / not excluded" has anything to hide.
	let canFilter =
		Object.keys( owners.byProduct ).length > 0 || meta.products.length > 0;
	if ( 'categories' === tab ) {
		canFilter =
			Object.keys( owners.byCategory ).length > 0 ||
			meta.categories.length > 0;
	} else if ( 'exclude' === tab ) {
		canFilter =
			Object.keys( owners.byExclude ).length > 0 ||
			meta.exclude.length > 0;
	}

	const search = query.trim().toLowerCase();
	const toggle = ( key, id ) => {
		const list = meta[ key ];
		const isAdding = ! list.includes( id );
		setLayoutMeta( {
			[ key ]: isAdding
				? [ ...list, id ]
				: list.filter( ( item ) => item !== id ),
			// A product picked one by one leaves the exclusions (the Exclude tab no longer lists it).
			...( isAdding && 'products' === key && meta.exclude.includes( id )
				? { exclude: meta.exclude.filter( ( item ) => item !== id ) }
				: {} ),
		} );
	};

	let rows = [];
	if ( 'categories' === tab ) {
		rows = categories
			.filter(
				( category ) =>
					! search || category.label.toLowerCase().includes( search )
			)
			.map( ( category ) => {
				const isOn = meta.categories.includes( category.value );
				const owner = isOn ? '' : owners.byCategory[ category.value ];
				return {
					id: category.value,
					label: category.label,
					meta: sprintf(
						/* translators: %d: number of products. */
						_n(
							'%d product',
							'%d products',
							category.count,
							'gallery-slider-for-woocommerce'
						),
						category.count
					),
					level: category.level,
					isOn,
					lockTip: owner
						? sprintf(
								/* translators: %s: layout name. */
								__(
									'Assigned to %s',
									'gallery-slider-for-woocommerce'
								),
								owner
						  )
						: '',
					onToggle: () => toggle( 'categories', category.value ),
				};
			} );
		if ( onlyFree ) {
			rows = rows.filter(
				( row ) =>
					! hiddenOwn.categories.includes( row.id ) &&
					( row.isOn || ! row.lockTip )
			);
		}
	} else if ( 'products' === tab ) {
		rows = products.items.map( ( item ) => {
			const isOn = meta.products.includes( item.value );
			const owner = isOn ? '' : owners.byProduct[ item.value ];
			const lockTip = owner
				? sprintf(
						/* translators: %s: layout name. */
						__(
							'Assigned to %s',
							'gallery-slider-for-woocommerce'
						),
						owner
				  )
				: '';
			return {
				id: item.value,
				label: item.label,
				meta: __( 'Product', 'gallery-slider-for-woocommerce' ),
				image: item.image,
				hasImage: true,
				isOn,
				lockTip,
				onToggle: () => toggle( 'products', item.value ),
			};
		} );
	} else {
		rows = exclusions.items.map( ( item ) => {
			const isOn = meta.exclude.includes( item.value );
			const owner = isOn ? '' : owners.byExclude[ item.value ];
			return {
				id: item.value,
				label: item.label,
				meta: item.category,
				image: item.image,
				hasImage: true,
				isOn,
				lockTip: owner
					? sprintf(
							/* translators: %s: layout name. */
							__(
								'Excluded in %s',
								'gallery-slider-for-woocommerce'
							),
							owner
					  )
					: '',
				onToggle: () => toggle( 'exclude', item.value ),
			};
		} );
	}

	const isPaged = 'categories' !== tab;
	const hasMore = isPaged && pages.items.length < pages.total;
	const affected = affectedCount( meta, categoriesById );
	const chips = [
		...meta.categories.map( ( id ) => ( {
			key: `c${ id }`,
			kind: __( 'Category:', 'gallery-slider-for-woocommerce' ),
			label: categoriesById[ id ]?.label || `#${ id }`,
			remove: () => toggle( 'categories', id ),
		} ) ),
		...meta.products.map( ( id ) => ( {
			key: `p${ id }`,
			kind: __( 'Product:', 'gallery-slider-for-woocommerce' ),
			label: productLabel( id, labels ),
			remove: () => toggle( 'products', id ),
		} ) ),
		...meta.exclude.map( ( id ) => ( {
			key: `e${ id }`,
			kind: __( 'Excluded:', 'gallery-slider-for-woocommerce' ),
			label: productLabel( id, labels ),
			remove: () => toggle( 'exclude', id ),
		} ) ),
	];

	let placeholder = __(
		'Search categories…',
		'gallery-slider-for-woocommerce'
	);
	if ( 'products' === tab ) {
		placeholder = __(
			'Search products…',
			'gallery-slider-for-woocommerce'
		);
	} else if ( 'exclude' === tab ) {
		placeholder = __(
			'Search products to exclude…',
			'gallery-slider-for-woocommerce'
		);
	}

	return (
		<div
			className={ `wcgs-assign-drawer${
				isClosing ? ' is-closing' : ''
			}` }
		>
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Scrim; Escape closes too. */ }
			<div className="wcgs-assign-drawer__scrim" onClick={ close } />
			<div
				className="wcgs-assign-drawer__panel sp-d-flex sp-flex-col"
				role="dialog"
				aria-modal="true"
				aria-labelledby="wcgs-assign-drawer-title"
			>
				<div className="wcgs-assign-drawer__head sp-d-flex sp-align-start sp-gap-12px">
					<div>
						<div
							id="wcgs-assign-drawer-title"
							className="wcgs-assign-drawer__title"
						>
							{ __(
								'Assign Layout',
								'gallery-slider-for-woocommerce'
							) }
						</div>
						<div className="wcgs-assign-drawer__subtitle">
							{ __(
								'Select the categories or specific products where this layout will appear.',
								'gallery-slider-for-woocommerce'
							) }
						</div>
					</div>
					<button
						type="button"
						className="wcgs-assign-drawer__close sp-d-flex sp-align-center sp-justify-center"
						title={ __(
							'Close',
							'gallery-slider-for-woocommerce'
						) }
						aria-label={ __(
							'Close',
							'gallery-slider-for-woocommerce'
						) }
						onClick={ close }
					>
						<CrossIcon size={ 15 } />
					</button>
				</div>
				<div className="wcgs-assign-drawer__controls sp-d-flex sp-flex-col sp-gap-12px">
					<div
						ref={ tabsRef }
						className="wcgs-assign-drawer__tabs sp-d-flex"
						role="tablist"
					>
						<span
							className="wcgs-assign-drawer__tab-pill"
							style={
								pill
									? {
											width: pill.w,
											transform: `translateX(${ pill.x }px)`,
									  }
									: { opacity: 0 }
							}
						/>
						{ TABS.map( ( item ) => (
							<button
								key={ item.key }
								type="button"
								role="tab"
								aria-selected={ tab === item.key }
								className={ `wcgs-assign-drawer__tab sp-min-w-0 sp-d-i-flex sp-align-center sp-justify-center${
									tab === item.key ? ' is-active' : ''
								}` }
								onClick={ () => {
									setTab( item.key );
									setQuery( '' );
									snapshotOwn();
									listRef.current?.scrollTo( 0, 0 );
								} }
							>
								{ item.label }
							</button>
						) ) }
					</div>
					<div className="wcgs-assign-drawer__search sp-d-flex sp-align-center sp-gap-8px">
						<SearchIcon size={ 15 } />
						<input
							ref={ searchInput }
							type="search"
							value={ query }
							onChange={ ( event ) =>
								setQuery( event.target.value )
							}
							placeholder={ placeholder }
							aria-label={ placeholder }
						/>
					</div>
					{ canFilter && (
						<button
							type="button"
							className="wcgs-assign-drawer__free sp-d-i-flex sp-align-center sp-gap-8px"
							role="checkbox"
							aria-checked={ onlyFree }
							onClick={ () => {
								if ( ! onlyFree ) {
									snapshotOwn();
								}
								setOnlyFree( ! onlyFree );
							} }
						>
							<span
								className={ `wcgs-check${
									onlyFree ? ' is-on' : ''
								}` }
							>
								<span className="wcgs-check__mark sp-d-i-flex">
									<CheckIcon
										size={ 10 }
										strokeWidth={ 3.4 }
									/>
								</span>
							</span>
							{ 'exclude' === tab
								? __(
										'Show only not excluded',
										'gallery-slider-for-woocommerce'
								  )
								: __(
										'Show only unassigned',
										'gallery-slider-for-woocommerce'
								  ) }
						</button>
					) }
				</div>
				<div
					ref={ listRef }
					className="wcgs-assign-drawer__list sp-flex-1"
				>
					{ 'exclude' === tab && (
						<div className="wcgs-assign-drawer__excl-hint">
							{ __(
								'Selected products never use this layout, even when their category is assigned.',
								'gallery-slider-for-woocommerce'
							) }
						</div>
					) }
					{ rows.map( ( row, index ) => (
						<DrawerRow
							key={ row.id }
							{ ...row }
							tipDown={ index < 3 }
						/>
					) ) }
					<div
						ref={ sentinelRef }
						className="wcgs-assign-drawer__sentinel"
					/>
					{ isPaged &&
						pages.isLoading &&
						( hasMore || ! rows.length ) && (
							<div className="wcgs-assign-drawer__loading sp-d-flex sp-align-center sp-justify-center sp-gap-8px">
								<span />
								{ __(
									'Loading more products…',
									'gallery-slider-for-woocommerce'
								) }
							</div>
						) }
					{ isPaged && pages.total > PER_PAGE && (
						<div className="wcgs-assign-drawer__hint">
							{ sprintf(
								/* translators: 1: products listed, 2: products found. */
								__(
									'Showing %1$s of %2$s',
									'gallery-slider-for-woocommerce'
								),
								pages.items.length.toLocaleString(),
								pages.total.toLocaleString()
							) }
						</div>
					) }
					{ ! rows.length && search && ! pages.isLoading && (
						<div className="wcgs-assign-drawer__state sp-d-flex sp-justify-center">
							{ sprintf(
								/* translators: %s: search text. */
								__(
									'Nothing matches “%s”.',
									'gallery-slider-for-woocommerce'
								),
								query.trim()
							) }
						</div>
					) }
				</div>
				{ ( hasSummary || isSummaryLeaving ) && (
					<div
						className={ `wcgs-assign-drawer__summary${
							hasSummary ? '' : ' is-leaving'
						}` }
					>
						<button
							type="button"
							className="wcgs-assign-drawer__summary-toggle sp-w-full sp-d-flex sp-align-center sp-gap-8px"
							onClick={ () =>
								setSummaryCollapsed( ! isSummaryCollapsed )
							}
							aria-expanded={ ! isSummaryCollapsed }
						>
							<span className="wcgs-assign-drawer__summary-count">
								{ sprintf(
									/* translators: %d: number of picked items. */
									__(
										'%d selected',
										'gallery-slider-for-woocommerce'
									),
									picks
								) }
							</span>
							<span className="wcgs-assign-drawer__summary-affected">
								{ sprintf(
									/* translators: %s: number of products. */
									_n(
										'≈ %s product',
										'≈ %s products',
										affected,
										'gallery-slider-for-woocommerce'
									),
									affected.toLocaleString()
								) }
							</span>
							<span
								className={ `wcgs-assign-drawer__summary-chevron sp-d-i-flex${
									isSummaryCollapsed ? '' : ' is-open'
								}` }
							>
								<ChevronDownIcon
									size={ 14 }
									strokeWidth={ 1.3 }
								/>
							</span>
						</button>
						<div
							className={ `wcgs-assign-drawer__chips-wrap${
								isSummaryCollapsed ? '' : ' is-open'
							}` }
						>
							<div>
								<div className="wcgs-assign-drawer__chips sp-d-flex sp-flex-wrap sp-gap-6px">
									{ chips.map( ( chip ) => (
										<span
											key={ chip.key }
											className="wcgs-assign-drawer__chip sp-d-i-flex sp-align-center sp-gap-4px"
										>
											<span className="wcgs-assign-drawer__chip-kind">
												{ chip.kind }
											</span>
											{ chip.label }
											<button
												type="button"
												className="wcgs-assign-drawer__chip-remove sp-d-i-flex sp-align-center sp-justify-center"
												onClick={ chip.remove }
												title={ __(
													'Remove',
													'gallery-slider-for-woocommerce'
												) }
												aria-label={ sprintf(
													/* translators: %s: item name. */
													__(
														'Remove %s',
														'gallery-slider-for-woocommerce'
													),
													chip.label
												) }
											>
												<CrossIcon
													size={ 10 }
													strokeWidth={ 2.6 }
												/>
											</button>
										</span>
									) ) }
								</div>
							</div>
						</div>
					</div>
				) }
				<div className="wcgs-assign-drawer__foot sp-d-flex sp-flex-col sp-gap-12px">
					<div className="wcgs-assign-drawer__buttons sp-d-flex sp-justify-end sp-gap-10px">
						<button
							type="button"
							className="wcgs-btn is-secondary wcgs-assign-drawer__clear"
							onClick={ () =>
								setLayoutMeta( {
									categories: [],
									products: [],
									exclude: [],
								} )
							}
						>
							{ __(
								'Clear All',
								'gallery-slider-for-woocommerce'
							) }
						</button>
						<button
							type="button"
							className="wcgs-btn is-primary"
							onClick={ close }
						>
							{ __( 'Done', 'gallery-slider-for-woocommerce' ) }
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AssignDrawer;
