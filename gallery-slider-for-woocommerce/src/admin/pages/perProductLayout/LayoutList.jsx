import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { STORE_NAME } from '../../store/constants';
import { CheckIcon, SearchIcon } from '../../components/Icons';
import { Icon } from '../settings/controls';
import ConfirmDialog from '../settings/ConfirmDialog';
import { downloadJson, exportFilename } from '../../utils/download';
import {
	CrownIcon,
	GoldCheckIcon,
	UpgradeButton,
	layoutLimitContent,
	useFeaturePopover,
} from '../../components/Pro';
import EmptyState from './EmptyState';
import LayoutRow from './LayoutRow';
import { indexCategories } from './utils';

const ImportIcon = () => (
	<Icon size={ 15 } strokeWidth={ 1.9 }>
		<path d="M12 15V4M7 10l5 5 5-5M4 20h16" />
	</Icon>
);

const ExportIcon = () => (
	<Icon size={ 14 } strokeWidth={ 1.9 }>
		<path d="M12 4v11M7 10l5 5 5-5M4 20h16" />
	</Icon>
);

const TrashIcon = () => (
	<Icon size={ 14 } strokeWidth={ 1.9 }>
		<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
	</Icon>
);

/**
 * Gold banner of the one-layout limit (`layLimitOn` in the free design).
 * Its Upgrade to Pro button opens the pricing page directly.
 *
 * @since 4.0.0
 */
const LimitBanner = () => (
	<div className="wcgs-layouts-limit sp-d-flex sp-flex-wrap sp-align-center sp-justify-between">
		<div className="wcgs-layouts-limit__text sp-d-flex sp-flex-col sp-gap-10px sp-min-w-0">
			<div className="wcgs-layouts-limit__title sp-d-flex sp-align-center sp-gap-8px">
				<CrownIcon size={ 18 } />
				<span>
					{ __(
						'Create Unlimited Per-Product Layouts',
						'gallery-slider-for-woocommerce'
					) }
				</span>
			</div>
			<span className="wcgs-layouts-limit__description">
				{ __(
					'Free includes one per-product layout. Upgrade to give every product and category its own gallery.',
					'gallery-slider-for-woocommerce'
				) }
			</span>
			<div className="wcgs-layouts-limit__checks sp-d-flex sp-flex-wrap">
				{ [
					__( 'Unlimited layouts', 'gallery-slider-for-woocommerce' ),
					__(
						'Assign to any product or category',
						'gallery-slider-for-woocommerce'
					),
					__(
						'Duplicate & bulk actions',
						'gallery-slider-for-woocommerce'
					),
				].map( ( label ) => (
					<span key={ label }>
						<GoldCheckIcon />
						{ label }
					</span>
				) ) }
			</div>
		</div>
		<UpgradeButton size="large" />
	</div>
);

/**
 * The list of layouts (`layPopulated` in the design) or the empty state:
 * search, bulk actions on the selected rows, the table with drag-to-reorder
 * rows, and the row menus. The free plugin keeps one layout, so once it
 * exists, creating or importing another opens the upgrade popover instead.
 */
const LayoutList = () => {
	const { items, isLoaded, categories, productsById } = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			return {
				items: store.getLayouts(),
				isLoaded: store.areLayoutsLoaded(),
				categories: store.getLayoutCategories(),
				productsById: store.getLayoutProducts(),
			};
		},
		[]
	);
	const {
		fetchLayouts,
		requestNavigate,
		deleteLayouts,
		setLayoutsActive,
		reorderLayouts,
		showToast,
		setNotice,
	} = useDispatch( STORE_NAME );
	const { bindTrigger } = useFeaturePopover();
	const [ query, setQuery ] = useState( '' );
	const [ selected, setSelected ] = useState( [] );
	const [ menuId, setMenuId ] = useState( null );
	// `{ ids }` of the layouts waiting for the delete confirmation.
	const [ pendingDelete, setPendingDelete ] = useState( null );
	const [ dragId, setDragId ] = useState( null );
	const [ overId, setOverId ] = useState( null );
	const [ isBusy, setBusy ] = useState( false );
	// The bulk bar keeps the last count while it fades out.
	const lastCount = useRef( 0 );

	// The classic pages may have changed layouts meanwhile: load again on each visit.
	useEffect( () => {
		fetchLayouts();
	}, [ fetchLayouts ] );

	// Forget selected or menu rows that are gone.
	useEffect( () => {
		setSelected( ( current ) =>
			current.filter( ( id ) => items.some( ( item ) => item.id === id ) )
		);
		setMenuId( ( current ) =>
			items.some( ( item ) => item.id === current ) ? current : null
		);
	}, [ items ] );

	const categoriesById = useMemo(
		() => indexCategories( categories ),
		[ categories ]
	);
	const search = query.trim().toLowerCase();
	const list = search
		? items.filter( ( item ) => item.name.toLowerCase().includes( search ) )
		: items;
	const visibleIds = list.map( ( item ) => item.id );
	const allOn =
		visibleIds.length > 0 &&
		visibleIds.every( ( id ) => selected.includes( id ) );
	const someOn =
		! allOn && visibleIds.some( ( id ) => selected.includes( id ) );
	const activeCount = items.filter(
		( item ) => 'publish' === item.status && false !== item.isActiveInFree
	).length;

	const openEditor = ( target ) =>
		requestNavigate( { tab: 'layouts', layoutTarget: target } );

	const toggleAll = () =>
		setSelected(
			allOn
				? selected.filter( ( id ) => ! visibleIds.includes( id ) )
				: [ ...new Set( [ ...selected, ...visibleIds ] ) ]
		);

	const exportIds = async ( ids ) => {
		setBusy( true );
		try {
			const data = await apiFetch( {
				path: '/wcgs/v1/settings/export',
				method: 'POST',
				data: { what: 'selected_layouts', layouts: ids },
			} );
			const filename = exportFilename( 'layouts' );
			downloadJson( data, filename );
			showToast(
				sprintf(
					/* translators: %s: file name. */
					__( 'Downloaded %s', 'gallery-slider-for-woocommerce' ),
					filename
				)
			);
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error?.message ||
					__( 'Export failed.', 'gallery-slider-for-woocommerce' ),
			} );
		}
		setBusy( false );
	};

	const onRowAction = ( layout, action ) => {
		setMenuId( null );
		if ( 'export' === action ) {
			exportIds( [ layout.id ] );
		} else if ( 'delete' === action ) {
			setPendingDelete( { ids: [ layout.id ] } );
		}
	};

	const confirmDelete = async () => {
		const ids = pendingDelete.ids;
		setPendingDelete( null );
		await deleteLayouts( ids );
	};

	const dropOn = ( targetId ) => {
		if ( null === dragId || dragId === targetId ) {
			return;
		}
		const ids = items.map( ( item ) => item.id );
		const from = ids.indexOf( dragId );
		const to = ids.indexOf( targetId );
		if ( from < 0 || to < 0 ) {
			return;
		}
		ids.splice( from, 1 );
		ids.splice( to, 0, dragId );
		reorderLayouts( ids );
	};

	if ( ! isLoaded ) {
		return (
			<div className="wcgs-layouts sp-flex-1">
				<div className="wcgs-layouts__loading sp-d-flex sp-align-center sp-justify-center sp-flex-1">
					<Spinner />
				</div>
			</div>
		);
	}

	if ( ! items.length ) {
		return (
			<div className="wcgs-layouts sp-flex-1">
				<div className="wcgs-layouts__inner">
					<EmptyState onCreate={ () => openEditor( 'new' ) } />
				</div>
			</div>
		);
	}

	const hasSelection = selected.length > 0;
	if ( hasSelection ) {
		lastCount.current = selected.length;
	}
	// The one free layout exists: Create and Import open the upgrade popover;
	// the banner's Upgrade to Pro button goes straight to the pricing page.
	const limitTrigger = bindTrigger( layoutLimitContent(), {
		onHover: false,
	} );
	const countLabel = `${ sprintf(
		/* translators: %d: number of layouts. */
		_n(
			'%d layout',
			'%d layouts',
			items.length,
			'gallery-slider-for-woocommerce'
		),
		items.length
	) } · ${ sprintf(
		/* translators: %d: number of active layouts. */
		_n(
			'%d active',
			'%d active',
			activeCount,
			'gallery-slider-for-woocommerce'
		),
		activeCount
	) }`;

	return (
		<div className="wcgs-layouts sp-flex-1" aria-busy={ isBusy }>
			<div className="wcgs-layouts__inner">
				<div className="wcgs-layouts-head sp-d-flex sp-flex-wrap sp-align-start sp-justify-between">
					<div>
						<h1>
							{ __(
								'Per-Product Layouts',
								'gallery-slider-for-woocommerce'
							) }
						</h1>
						<p>
							{ __(
								'Custom galleries for specific products and categories.',
								'gallery-slider-for-woocommerce'
							) }
						</p>
					</div>
					<button
						type="button"
						className="wcgs-btn is-primary is-large is-locked"
						title={ __(
							'Free includes one per-product layout',
							'gallery-slider-for-woocommerce'
						) }
						aria-disabled="true"
						{ ...limitTrigger }
					>
						{ __(
							'Create New Layout',
							'gallery-slider-for-woocommerce'
						) }
					</button>
				</div>

				<LimitBanner />

				<div className="wcgs-layouts-toolbar sp-d-grid">
					<div
						className={ `wcgs-layouts-toolbar__row sp-d-flex sp-align-center sp-flex-wrap sp-gap-12px${
							hasSelection ? ' is-hidden' : ''
						}` }
						aria-hidden={ hasSelection }
					>
						<div className="wcgs-layouts-toolbar__search sp-d-flex sp-align-center sp-gap-8px">
							<SearchIcon size={ 15 } />
							<input
								type="search"
								value={ query }
								onChange={ ( event ) =>
									setQuery( event.target.value )
								}
								placeholder={ __(
									'Search layouts…',
									'gallery-slider-for-woocommerce'
								) }
								aria-label={ __(
									'Search layouts',
									'gallery-slider-for-woocommerce'
								) }
								tabIndex={ hasSelection ? -1 : 0 }
							/>
						</div>
						<button
							type="button"
							className="wcgs-btn is-secondary wcgs-layouts-toolbar__import is-locked"
							title={ __(
								'Free includes one per-product layout',
								'gallery-slider-for-woocommerce'
							) }
							aria-disabled="true"
							tabIndex={ hasSelection ? -1 : 0 }
							{ ...limitTrigger }
						>
							<ImportIcon />
							{ __( 'Import', 'gallery-slider-for-woocommerce' ) }
						</button>
						<span className="wcgs-layouts-toolbar__count">
							{ countLabel }
						</span>
					</div>
					<div
						className={ `wcgs-layouts-bulk sp-d-flex sp-align-center sp-flex-wrap sp-gap-4px${
							hasSelection ? ' is-visible' : ''
						}` }
						aria-hidden={ ! hasSelection }
					>
						<span className="wcgs-layouts-bulk__label">
							{ sprintf(
								/* translators: %d: number of selected layouts. */
								__(
									'%d selected',
									'gallery-slider-for-woocommerce'
								),
								selected.length || lastCount.current
							) }
						</span>
						<span className="wcgs-layouts-bulk__divider" />
						<button
							type="button"
							className="wcgs-layouts-bulk__button sp-d-i-flex sp-align-center"
							onClick={ () => setLayoutsActive( selected, true ) }
							tabIndex={ hasSelection ? 0 : -1 }
						>
							{ __(
								'Activate',
								'gallery-slider-for-woocommerce'
							) }
						</button>
						<button
							type="button"
							className="wcgs-layouts-bulk__button sp-d-i-flex sp-align-center"
							onClick={ () =>
								setLayoutsActive( selected, false )
							}
							tabIndex={ hasSelection ? 0 : -1 }
						>
							{ __(
								'Deactivate',
								'gallery-slider-for-woocommerce'
							) }
						</button>
						<button
							type="button"
							className="wcgs-layouts-bulk__button sp-d-i-flex sp-align-center"
							onClick={ () => {
								exportIds( selected );
								setSelected( [] );
							} }
							tabIndex={ hasSelection ? 0 : -1 }
						>
							<ExportIcon />
							{ __( 'Export', 'gallery-slider-for-woocommerce' ) }
						</button>
						<button
							type="button"
							className="wcgs-layouts-bulk__button is-danger sp-d-i-flex sp-align-center"
							onClick={ () =>
								setPendingDelete( { ids: selected } )
							}
							tabIndex={ hasSelection ? 0 : -1 }
						>
							<TrashIcon />
							{ __( 'Delete', 'gallery-slider-for-woocommerce' ) }
						</button>
						<button
							type="button"
							className="wcgs-layouts-bulk__button wcgs-layouts-bulk__clear sp-d-i-flex sp-align-center"
							onClick={ () => setSelected( [] ) }
							tabIndex={ hasSelection ? 0 : -1 }
						>
							{ __(
								'Clear Selection',
								'gallery-slider-for-woocommerce'
							) }
						</button>
					</div>
				</div>

				<div className="wcgs-layouts-table" role="table">
					<div
						className="wcgs-layouts-table__head sp-d-grid sp-align-center sp-gap-12px"
						role="row"
					>
						<button
							type="button"
							className={ `wcgs-check${
								allOn || someOn ? ' is-on' : ''
							}` }
							role="checkbox"
							aria-checked={ someOn ? 'mixed' : allOn }
							title={ __(
								'Select all',
								'gallery-slider-for-woocommerce'
							) }
							aria-label={ __(
								'Select all',
								'gallery-slider-for-woocommerce'
							) }
							onClick={ toggleAll }
						>
							<span className="wcgs-check__mark sp-d-i-flex">
								{ someOn ? (
									<svg
										width="10"
										height="10"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#fff"
										strokeWidth="3.4"
										strokeLinecap="round"
										aria-hidden="true"
									>
										<path d="M6 12h12" />
									</svg>
								) : (
									<CheckIcon size={ 10 } />
								) }
							</span>
						</button>
						<span />
						<span>
							{ __( 'Layout', 'gallery-slider-for-woocommerce' ) }
						</span>
						<span>
							{ __(
								'Assigned To',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span>
							{ __(
								'Products',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span>
							{ __( 'Status', 'gallery-slider-for-woocommerce' ) }
						</span>
						<span>
							{ __(
								'Updated',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span />
					</div>
					{ list.map( ( layout, index ) => (
						<LayoutRow
							key={ layout.id }
							layout={ layout }
							categoriesById={ categoriesById }
							productsById={ productsById }
							isSelected={ selected.includes( layout.id ) }
							isMenuOpen={ menuId === layout.id }
							isDragOver={
								overId === layout.id && dragId !== layout.id
							}
							isLast={ index === list.length - 1 }
							onEdit={ () => openEditor( layout.id ) }
							onSelect={ () =>
								setSelected(
									selected.includes( layout.id )
										? selected.filter(
												( id ) => id !== layout.id
										  )
										: [ ...selected, layout.id ]
								)
							}
							onToggleStatus={ () =>
								setLayoutsActive(
									[ layout.id ],
									'publish' !== layout.status
								)
							}
							onMenu={ () =>
								setMenuId(
									menuId === layout.id ? null : layout.id
								)
							}
							onAction={ ( action ) =>
								onRowAction( layout, action )
							}
							onDragStart={ ( event ) => {
								event.dataTransfer.effectAllowed = 'move';
								event.dataTransfer.setData(
									'text/plain',
									String( layout.id )
								);
								setDragId( layout.id );
							} }
							onDragOver={ ( event ) => {
								if ( null === dragId ) {
									return;
								}
								event.preventDefault();
								event.dataTransfer.dropEffect = 'move';
								setOverId( layout.id );
							} }
							onDrop={ ( event ) => {
								event.preventDefault();
								dropOn( layout.id );
								setDragId( null );
								setOverId( null );
							} }
							onDragEnd={ () => {
								setDragId( null );
								setOverId( null );
							} }
						/>
					) ) }
					{ ! list.length && (
						<div className="wcgs-layouts-table__empty">
							{ sprintf(
								/* translators: %s: search text. */
								__(
									'No layouts match “%s”.',
									'gallery-slider-for-woocommerce'
								),
								query.trim()
							) }
						</div>
					) }
				</div>
				{ null !== menuId && (
					// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Backdrop that closes the row menu.
					<div
						className="wcgs-layouts__backdrop"
						onClick={ () => setMenuId( null ) }
					/>
				) }
			</div>
			{ pendingDelete && (
				<ConfirmDialog
					tone="danger"
					icon={ <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /> }
					title={
						1 === pendingDelete.ids.length
							? __(
									'Delete this layout?',
									'gallery-slider-for-woocommerce'
							  )
							: sprintf(
									/* translators: %d: number of layouts. */
									__(
										'Delete %d layouts?',
										'gallery-slider-for-woocommerce'
									),
									pendingDelete.ids.length
							  )
					}
					message={ __(
						'Products using it go back to your Global Settings. The layout is moved to the trash.',
						'gallery-slider-for-woocommerce'
					) }
					confirmLabel={ __(
						'Delete',
						'gallery-slider-for-woocommerce'
					) }
					onCancel={ () => setPendingDelete( null ) }
					onConfirm={ confirmDelete }
				/>
			) }
		</div>
	);
};

export default LayoutList;
