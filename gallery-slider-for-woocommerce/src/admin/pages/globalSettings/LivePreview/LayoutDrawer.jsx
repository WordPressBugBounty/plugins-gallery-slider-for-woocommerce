import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../../store/constants';
import { GALLERY_LAYOUTS, LayoutGrid } from '../../../components';
import { ChevronDownIcon } from '../../../components/Icons';

const GridIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<rect x="3" y="3" width="7" height="7" rx="1.5" />
		<rect x="14" y="3" width="7" height="7" rx="1.5" />
		<rect x="3" y="14" width="7" height="7" rx="1.5" />
		<rect x="14" y="14" width="7" height="7" rx="1.5" />
	</svg>
);

/**
 * "Gallery Layouts" drawer at the bottom of the preview, as in the design:
 * a pill names the current layout and opens the drawer, which "Change
 * Layout" in the General section opens too. Picking a card switches the
 * layout live and leaves the drawer open; a press outside it, a click in
 * the preview page or Escape closes it. The Pro layouts follow the free ones,
 * locked (a click opens the pricing page).
 */
const LayoutDrawer = () => {
	const { layout, isOpen } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			layout: store.getPanelValues().gallery_layout,
			isOpen: store.isLayoutDrawerOpen(),
		};
	}, [] );
	const { setPanelValues, setLayoutDrawerOpen } = useDispatch( STORE_NAME );
	const drawer = useRef();
	const pill = useRef();

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		const close = () => setLayoutDrawerOpen( false );
		const onPointerDown = ( event ) => {
			const target = event.target;
			if (
				drawer.current?.contains( target ) ||
				pill.current?.contains( target ) ||
				( target.closest &&
					target.closest( '[data-wcgs-layouts-toggle]' ) )
			) {
				return;
			}
			close();
		};
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key ) {
				close();
			}
		};
		document.addEventListener( 'pointerdown', onPointerDown, true );
		document.addEventListener( 'keydown', onKeyDown );
		return () => {
			document.removeEventListener( 'pointerdown', onPointerDown, true );
			document.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ isOpen, setLayoutDrawerOpen ] );

	const current =
		GALLERY_LAYOUTS.find(
			( option ) => option.value === layout && ! option.locked
		) || GALLERY_LAYOUTS[ 0 ];

	return (
		<>
			<div className="wcgs-layout-drawer__dock sp-d-flex sp-justify-center">
				<button
					ref={ pill }
					type="button"
					className={ `wcgs-layout-drawer__pill sp-d-i-flex sp-align-center sp-gap-10px${
						isOpen ? ' is-hidden' : ''
					}` }
					onClick={ () => setLayoutDrawerOpen( true ) }
					aria-expanded={ isOpen }
					tabIndex={ isOpen ? -1 : 0 }
				>
					<GridIcon />
					<span className="wcgs-layout-drawer__pill-label">
						{ __(
							'Gallery Layout',
							'gallery-slider-for-woocommerce'
						) }
					</span>
					<span className="wcgs-layout-drawer__pill-value">
						{ current.label }
					</span>
					<span className="wcgs-layout-drawer__pill-chevron sp-d-flex">
						<ChevronDownIcon size={ 14 } strokeWidth={ 1.3 } />
					</span>
				</button>
			</div>
			<div
				ref={ drawer }
				className={ `wcgs-layout-drawer${ isOpen ? ' is-open' : '' }` }
				aria-hidden={ ! isOpen }
			>
				<div className="wcgs-layout-drawer__box">
					<div className="wcgs-layout-drawer__head sp-d-flex sp-align-center sp-gap-10px">
						<span className="wcgs-layout-drawer__title">
							{ __(
								'Gallery Layouts',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span className="wcgs-layout-drawer__meta sp-min-w-0">
							{ sprintf(
								/* translators: %s: layout name. */
								__(
									'%s selected',
									'gallery-slider-for-woocommerce'
								),
								current.label
							) }
						</span>
						<button
							type="button"
							className="wcgs-layout-drawer__hide sp-d-i-flex sp-align-center sp-gap-6px"
							onClick={ () => setLayoutDrawerOpen( false ) }
							title={ __(
								'Hide layouts',
								'gallery-slider-for-woocommerce'
							) }
							tabIndex={ isOpen ? 0 : -1 }
						>
							{ __( 'Hide', 'gallery-slider-for-woocommerce' ) }
							<ChevronDownIcon size={ 13 } strokeWidth={ 1.3 } />
						</button>
					</div>
					<LayoutGrid
						className="wcgs-layout-drawer__grid"
						value={ current.value }
						onPick={ ( next ) =>
							setPanelValues( { gallery_layout: next } )
						}
						isFocusable={ isOpen }
					/>
				</div>
			</div>
		</>
	);
};

export default LayoutDrawer;
