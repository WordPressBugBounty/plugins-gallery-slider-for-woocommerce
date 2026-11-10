import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { STORE_NAME } from '../../../store/constants';
import { DeviceTypeControl } from '../../../components';
import ProductPicker from './ProductPicker';
import ProductPreview from './Product';
import LayoutDrawer from './LayoutDrawer';
import usePreviewData from './usePreviewData';
import useLayoutProducts from './useLayoutProducts';
import { buildPreview } from './engine';
import './editor.scss';

// localStorage key remembering the previewed product.
const PRODUCT_STORAGE_KEY = 'wcgs-preview-product';

const readStoredProduct = () => {
	try {
		return (
			parseInt(
				window.localStorage.getItem( PRODUCT_STORAGE_KEY ),
				10
			) || 0
		);
	} catch ( error ) {
		return 0;
	}
};

const ExternalIcon = () => (
	<svg
		width="13"
		height="13"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M7 17 17 7M8 7h9v9" />
	</svg>
);

const RefreshIcon = () => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />
	</svg>
);

/**
 * Main area of the Global Settings page and the layout editor: the product's
 * own page, framed without its gallery (`Product/`), with the gallery as the
 * unsaved panel values make it mounted into it and re-rendered by React on
 * every change (template and CSS, see `engine/`; the slider behavior in
 * `Product/engine.js`), with no request per edit. The toolbar picks the
 * product and the device (the
 * same device the responsive controls edit). In the layout editor the
 * product list holds only the layout's products; with none assigned, a
 * sample product shows and the toolbar asks to assign some.
 *
 * @param {Object} props
 * @param {number} props.initialProductId Product to open with, instead of the remembered one.
 */
const LivePreview = ( { initialProductId = 0 } ) => {
	const { values, isReady, device, layoutId, isLayout, layoutMeta } =
		useSelect( ( select ) => {
			const store = select( STORE_NAME );
			const editingLayout = 'layout' === store.getEditorScope();
			return {
				values: store.getPanelValues(),
				isReady: store.isPanelLoaded(),
				device: store.getDeviceType(),
				layoutId: editingLayout ? store.getLayoutId() : 0,
				isLayout: editingLayout,
				layoutMeta: store.getLayoutMeta(),
			};
		}, [] );
	const { setAssignDrawerOpen } = useDispatch( STORE_NAME );
	const layoutGroups = useLayoutProducts( {
		isLayout,
		layoutId,
		meta: layoutMeta,
	} );
	const [ productId, setProductId ] = useState(
		() => initialProductId || readStoredProduct()
	);
	const [ picked, setPicked ] = useState( null );
	const [ isPageLoading, setPageLoading ] = useState( false );
	const { data, error, isLoading, retry } = usePreviewData( {
		values,
		productId,
		isReady,
		layoutId,
		isLayout,
	} );
	// The gallery for the current values and device; no request involved.
	const { preview, buildError } = useMemo( () => {
		if ( ! data?.product || ! data.gallery ) {
			return { preview: null, buildError: '' };
		}
		try {
			return {
				preview: buildPreview( { data, values, device } ),
				buildError: '',
			};
		} catch ( exception ) {
			return { preview: null, buildError: String( exception ) };
		}
	}, [ data, values, device ] );

	const pickProduct = useCallback(
		( option ) => {
			setPicked( {
				id: option.value,
				name: option.label,
				image: option.image,
			} );
			setProductId( option.value );
			// A layout's product list is its own: the Global Settings keep their remembered product.
			if ( isLayout ) {
				return;
			}
			try {
				window.localStorage.setItem(
					PRODUCT_STORAGE_KEY,
					option.value
				);
			} catch ( storageError ) {
				// Private mode: the pick lasts for this visit only.
			}
		},
		[ isLayout ]
	);

	// In a layout, preview one of its products: the first, unless one of them is picked.
	const layoutItems = useMemo(
		() => ( layoutGroups || [] ).flatMap( ( group ) => group.items ),
		[ layoutGroups ]
	);
	const isSample = isLayout && null !== layoutGroups && ! layoutItems.length;
	useEffect( () => {
		if (
			layoutItems.length &&
			! layoutItems.some( ( item ) => item.value === productId )
		) {
			pickProduct( layoutItems[ 0 ] );
		}
	}, [ layoutItems, productId, pickProduct ] );
	const onBusy = useCallback( ( busy ) => setPageLoading( busy ), [] );

	// Until the new render arrives, show the product just picked.
	const product =
		picked && picked.id !== data?.product?.id ? picked : data?.product;
	// A sample product is not meant to use the layout: no notice about it.
	// The free plugin has no license, so a license notice never applies.
	const notices = ( data?.notices || [] ).filter(
		( notice ) =>
			'license' !== notice.id && ( ! isSample || 'layout' !== notice.id )
	);
	const hasPage = !! preview;

	let body;
	if ( ( error || buildError ) && ! hasPage ) {
		body = (
			<div className="wcgs-live-preview__state sp-d-flex sp-flex-col sp-align-center sp-gap-12px">
				<p>{ error || buildError }</p>
				<button
					type="button"
					className="wcgs-live-preview__retry"
					onClick={ retry }
				>
					<RefreshIcon />
					{ __( 'Try again', 'gallery-slider-for-woocommerce' ) }
				</button>
			</div>
		);
	} else if ( data && ! data.product ) {
		body = (
			<div className="wcgs-live-preview__state sp-d-flex sp-flex-col sp-align-center sp-gap-12px">
				<p>
					{ __(
						'Add a product with images to preview the gallery here.',
						'gallery-slider-for-woocommerce'
					) }
				</p>
				<a
					className="wcgs-live-preview__retry"
					href="post-new.php?post_type=product"
				>
					{ __( 'Add product', 'gallery-slider-for-woocommerce' ) }
				</a>
			</div>
		);
	} else if ( ! hasPage ) {
		body = (
			<div className="wcgs-live-preview__state sp-d-flex sp-flex-col sp-align-center sp-gap-12px">
				<Spinner />
			</div>
		);
	} else {
		body = (
			<ProductPreview
				data={ data }
				preview={ preview }
				device={ device }
				onBusy={ onBusy }
			/>
		);
	}

	const isBusy = hasPage && ( isLoading || isPageLoading );

	return (
		<div className="wcgs-live-preview sp-d-flex sp-flex-col">
			<div className="wcgs-live-preview__card sp-d-flex sp-flex-col sp-flex-1">
				<div className="wcgs-live-preview__toolbar sp-d-flex sp-flex-wrap sp-align-center sp-flex-none">
					{ isSample ? (
						<span className="wcgs-live-preview__sample sp-d-i-flex sp-align-center sp-gap-4px">
							{ __(
								'Sample product ·',
								'gallery-slider-for-woocommerce'
							) }
							<button
								type="button"
								onClick={ () => setAssignDrawerOpen( true ) }
							>
								{ __(
									'Assign products',
									'gallery-slider-for-woocommerce'
								) }
							</button>
							{ __(
								'to preview them here',
								'gallery-slider-for-woocommerce'
							) }
						</span>
					) : (
						<ProductPicker
							product={ product }
							onChange={ pickProduct }
							groups={ isLayout ? layoutGroups || [] : null }
						/>
					) }
					<div className="wcgs-live-preview__devices sp-d-flex sp-justify-center sp-flex-1">
						<DeviceTypeControl variant="toolbar" />
					</div>
					{ product?.permalink && (
						<a
							className="wcgs-live-preview__site"
							href={ product.permalink }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __(
								'View on Site',
								'gallery-slider-for-woocommerce'
							) }
							<ExternalIcon />
						</a>
					) }
				</div>
				{ notices.length > 0 && (
					<div className="wcgs-live-preview__notices sp-flex-none">
						{ notices.map( ( notice ) => (
							<p key={ notice.id }>{ notice.message }</p>
						) ) }
					</div>
				) }
				<div className="wcgs-live-preview__stage sp-d-flex sp-justify-center sp-flex-1">
					<div
						className={ `wcgs-live-preview__status sp-d-i-flex sp-align-center sp-gap-8px${
							isBusy ? ' is-visible' : ''
						}` }
						role="status"
						aria-live="polite"
					>
						<RefreshIcon />
						{ isBusy
							? __(
									'Updating preview…',
									'gallery-slider-for-woocommerce'
							  )
							: '' }
					</div>
					{ error && hasPage && (
						<div className="wcgs-live-preview__error sp-d-flex sp-align-center sp-gap-12px">
							{ error }
							<button type="button" onClick={ retry }>
								{ __(
									'Try again',
									'gallery-slider-for-woocommerce'
								) }
							</button>
						</div>
					) }
					{ body }
					{ isReady && <LayoutDrawer /> }
				</div>
			</div>
		</div>
	);
};

export default LivePreview;
