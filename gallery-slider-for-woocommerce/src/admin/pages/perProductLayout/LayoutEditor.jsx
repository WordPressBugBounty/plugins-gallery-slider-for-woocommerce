import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { STORE_NAME } from '../../store/constants';
import ConfirmDialog from '../settings/ConfirmDialog';
import SplitView from '../globalSettings/SplitView';
import LivePreview from '../globalSettings/LivePreview';
import { layoutLimitContent } from '../../components/Pro';
import AssignDrawer from './AssignDrawer';

/**
 * Layout editor: the split view of the Global Settings page (live preview
 * and settings panel) editing one layout's `wcgs_metabox` values, with the
 * "Assign Layout" drawer. The page header becomes the editor header
 * (`components/Header.jsx`). Leaving with unsaved changes asks first.
 */
const LayoutEditor = () => {
	const { target, isLoaded, meta, changeCount, leaveTarget } = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			return {
				target: store.getLayoutTarget(),
				isLoaded: store.isLayoutLoaded(),
				meta: store.getLayoutMeta(),
				changeCount: store.getLayoutChangeCount(),
				leaveTarget: store.getLeaveTarget(),
			};
		},
		[]
	);
	const { resolveLeave, closeLayoutEditor, setProPrompt } =
		useDispatch( STORE_NAME );
	const isNew = 'new' === target;

	// The free plugin keeps one layout: a new one (e.g. `#layouts/new`
	// opened directly) goes back to the list when the server says no more
	// layouts can be created (`canCreate` / `limit` of GET /layouts; any
	// layout counts, also one made in another tab since the list loaded).
	useEffect( () => {
		if ( ! isNew ) {
			return;
		}
		let isCurrent = true;
		apiFetch( { path: '/wcgs/v1/layouts' } )
			.then( ( data ) => {
				const layouts = Array.isArray( data?.layouts )
					? data.layouts
					: [];
				const isBlocked =
					undefined !== data?.canCreate
						? ! data.canCreate
						: layouts.length >= ( data?.limit || 1 );
				if ( isCurrent && isBlocked ) {
					closeLayoutEditor();
					setProPrompt( layoutLimitContent() );
				}
			} )
			// Saving still gets the server's `wcgs_layout_limit` error.
			.catch( () => {} );
		return () => {
			isCurrent = false;
		};
	}, [ isNew, closeLayoutEditor, setProPrompt ] );

	// Warn before the browser leaves the page with unsaved changes.
	useEffect( () => {
		if ( ! changeCount ) {
			return;
		}
		const onBeforeUnload = ( event ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () =>
			window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ changeCount ] );

	// Preview a product the layout applies to, when it picks one.
	const previewProduct = meta.products[ 0 ] || 0;

	return (
		<>
			<SplitView>
				{ isLoaded ? (
					<LivePreview
						key={ target }
						initialProductId={ previewProduct }
					/>
				) : (
					<div className="wcgs-layouts__loading sp-d-flex sp-align-center sp-justify-center sp-flex-1">
						<Spinner />
					</div>
				) }
			</SplitView>
			<AssignDrawer />
			{ leaveTarget && (
				<ConfirmDialog
					title={ __(
						'Save your changes?',
						'gallery-slider-for-woocommerce'
					) }
					message={ sprintf(
						/* translators: %s: "3 unsaved changes". */
						__(
							'You have %s in this layout. Save them before leaving, or discard them.',
							'gallery-slider-for-woocommerce'
						),
						sprintf(
							/* translators: %d: number of unsaved changes. */
							_n(
								'%d unsaved change',
								'%d unsaved changes',
								changeCount,
								'gallery-slider-for-woocommerce'
							),
							changeCount
						)
					) }
					confirmLabel={ __(
						'Save & Leave',
						'gallery-slider-for-woocommerce'
					) }
					secondaryLabel={ __(
						'Discard',
						'gallery-slider-for-woocommerce'
					) }
					onCancel={ () => resolveLeave( 'cancel' ) }
					onSecondary={ () => resolveLeave( 'discard' ) }
					onConfirm={ () => resolveLeave( 'save' ) }
				/>
			) }
		</>
	);
};

export default LayoutEditor;
