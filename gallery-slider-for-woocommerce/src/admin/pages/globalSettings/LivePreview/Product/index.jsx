import { __ } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import GalleryMount from './GalleryMount';
import { loadScript } from './assets';

// Bumped by every frame load, so a reloaded page remounts the gallery.
let frameLoads = 0;

/**
 * The element in the gallery's place on the framed page: the template's
 * empty slot (Woo_Gallery_Slider_Preview_Frame). A theme that builds the
 * single product page without WooCommerce's gallery template gets one in
 * front of the summary.
 *
 * @param {Document} doc Framed page.
 * @return {Element|null} Slot, or null when the page has no product summary.
 */
const findSlot = ( doc ) => {
	const slot = doc.querySelector( '[data-wcgs-preview-gallery]' );
	if ( slot ) {
		return slot;
	}
	const summary = doc.querySelector( '.product .summary' );
	if ( ! summary ) {
		return null;
	}
	const element = doc.createElement( 'div' );
	summary.before( element );
	return element;
};

/**
 * The `<style>` of the gallery's dynamic CSS on the framed page, where the
 * store prints it: the gallery stylesheet's inline style (holding the saved
 * settings' CSS), else a new one after the stylesheet.
 *
 * @param {Document} doc Framed page.
 * @return {Element} Style element.
 */
const dynamicStyleElement = ( doc ) => {
	let style = doc.getElementById(
		'gallery-slider-for-woocommerce-inline-css'
	);
	if ( style ) {
		return style;
	}
	style = doc.createElement( 'style' );
	style.id = 'gallery-slider-for-woocommerce-inline-css';
	const stylesheet = doc.getElementById(
		'gallery-slider-for-woocommerce-css'
	);
	if ( stylesheet ) {
		stylesheet.after( style );
	} else {
		doc.head.appendChild( style );
	}
	return style;
};

/**
 * The preview is a display: links, add to cart and form submits on the
 * framed page must not leave it or change the store. In-page links (product
 * tabs, reviews, reset variations) are left to the page's scripts, lightbox
 * anchors to Fancybox (it bails on a prevented click and prevents the
 * default itself). A press in the frame counts as a press outside for the
 * dashboard's popovers, which listen on the admin document.
 *
 * @param {Document}          doc    Framed page.
 * @param {HTMLIFrameElement} iframe The frame.
 */
const guardFrame = ( doc, iframe ) => {
	const win = doc.defaultView;
	doc.addEventListener(
		'click',
		( event ) => {
			const target = event.target.closest ? event.target : null;
			if ( ! target ) {
				return;
			}
			if (
				target.closest(
					'.single_add_to_cart_button, .add_to_cart_button, .ajax_add_to_cart, .wc-block-components-product-button__button'
				)
			) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			const link = target.closest( 'a[href]' );
			if ( ! link ) {
				return;
			}
			if (
				link.hasAttribute( 'data-fancybox' ) &&
				'undefined' !== typeof win.Fancybox
			) {
				return;
			}
			if ( '#' === ( link.getAttribute( 'href' ) || '' ).charAt( 0 ) ) {
				return;
			}
			event.preventDefault();
		},
		true
	);
	doc.addEventListener(
		'submit',
		( event ) => {
			event.preventDefault();
			event.stopPropagation();
		},
		true
	);
	doc.addEventListener(
		'pointerdown',
		() => {
			iframe.dispatchEvent(
				new window.PointerEvent( 'pointerdown', { bubbles: true } )
			);
		},
		true
	);
};

/**
 * Main area of the preview: the product's own page (theme template, styles
 * and scripts, Woo_Gallery_Slider_Preview_Frame) framed at the device
 * width, without the site header and footer, with the gallery of the
 * unsaved settings mounted into the gallery's place on it. Only the gallery
 * and its dynamic CSS are live; the frame reloads only for another product.
 *
 * @param {Object}   props
 * @param {Object}   props.data    REST preview data.
 * @param {Object}   props.preview Result of buildPreview().
 * @param {string}   props.device  'desktop', 'tablet' or 'mobile'.
 * @param {Function} props.onBusy  Called with whether the page is still loading.
 */
const ProductPreview = ( { data, preview, device, onBusy } ) => {
	const { product, page, frameUrl } = data;
	const iframeRef = useRef();
	const [ frame, setFrame ] = useState( null );
	const [ frameError, setFrameError ] = useState( null );
	const isFrameReady = !! frame && frame.url === frameUrl;
	const hasError = !! frameError && frameError.url === frameUrl;

	const onBusyRef = useRef( onBusy );
	onBusyRef.current = onBusy;
	useEffect( () => {
		onBusyRef.current( ! isFrameReady && ! hasError );
	}, [ isFrameReady, hasError ] );

	const onLoad = useCallback( () => {
		const iframe = iframeRef.current;
		const url = iframe?.getAttribute( 'src' );
		let doc = null;
		try {
			doc = iframe.contentDocument;
		} catch ( error ) {
			// Another origin.
		}
		if ( ! doc || ! doc.body ) {
			setFrameError( {
				url,
				message: __(
					'The preview needs your store on the same address as this dashboard. Use View on Site to see the product page.',
					'gallery-slider-for-woocommerce'
				),
			} );
			return;
		}
		const slot = findSlot( doc );
		if ( ! slot ) {
			setFrameError( {
				url,
				message: __(
					'This product page has no place for the gallery. Use View on Site to see the product page.',
					'gallery-slider-for-woocommerce'
				),
			} );
			return;
		}
		guardFrame( doc, iframe );
		const win = doc.defaultView;
		// The libraries the store's gallery script injects (the engine loads
		// the zoom and video.js ones on demand); the store injects Fancybox
		// whatever the lightbox setting, so does the preview.
		const script = ( id, file, isLoaded ) => {
			if ( isLoaded ) {
				return Promise.resolve();
			}
			const entry = page.scripts?.find( ( item ) => id === item.id );
			return loadScript(
				entry?.src || `${ page.publicUrl }js/${ file }`,
				id,
				doc
			).catch( () => {} );
		};
		const style = dynamicStyleElement( doc );
		Promise.all( [
			script(
				'wcgs-swiper-js',
				'swiper.min.js',
				'function' === typeof win.SPSwiper
			),
			script(
				'wcgs-fancybox-js',
				'fancybox-bundle.min.js',
				'undefined' !== typeof win.Fancybox
			),
		] ).then( () => {
			// Not if the frame moved on to another page meanwhile.
			if ( iframe.contentDocument !== doc ) {
				return;
			}
			frameLoads += 1;
			setFrameError( null );
			setFrame( {
				id: frameLoads,
				url,
				doc,
				style,
				slot: { current: slot },
			} );
		} );
		// `page` only matters for the URLs, which don't change.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// The unsaved settings' dynamic CSS, in before the engine measures (its
	// effects run after this one).
	useLayoutEffect( () => {
		if ( isFrameReady ) {
			frame.style.textContent = preview.css;
		}
	}, [ isFrameReady, frame, preview.css ] );

	// The store shows the preloader on every page load; a live edit remounts
	// the gallery the same way, but a spinner on each change would get in the
	// way. Show it only when the product is first loaded and when the
	// Preloader settings change, so they can still be previewed. Decided once
	// per mount (keyed on preview.key) so re-renders of one mount keep it.
	const preloaderRef = useRef( { key: null, signature: null, show: true } );
	const mountKey = `${ frame?.id }|${ preview.key }`;
	const signature = [
		product.id,
		frame?.id,
		preview.settings.preloader,
		preview.settings.preloader_style,
	].join( '|' );
	if ( preloaderRef.current.key !== mountKey ) {
		preloaderRef.current = {
			key: mountKey,
			signature,
			show: preloaderRef.current.signature !== signature,
		};
	}
	const showPreloader = preloaderRef.current.show;

	return (
		<div className={ `wcgs-preview-frame is-${ device }` }>
			<iframe
				ref={ iframeRef }
				className="wcgs-preview-frame__page"
				src={ frameUrl }
				title={ __(
					'Product page preview',
					'gallery-slider-for-woocommerce'
				) }
				onLoad={ onLoad }
			/>
			{ hasError && (
				<div className="wcgs-live-preview__state wcgs-preview-frame__error sp-d-flex sp-flex-col sp-align-center sp-gap-12px">
					<p>{ frameError.message }</p>
				</div>
			) }
			{ isFrameReady && (
				<GalleryMount
					key={ mountKey }
					frame={ frame }
					thumbsKey={ preview.thumbsKey }
					scriptKeys={ preview.scriptKeys }
					model={ preview.model }
					settings={ preview.settings }
					productId={ product.id }
					device={ device }
					isMobile={ 'desktop' !== device }
					isRtl={ page.isRtl }
					page={ page }
					showPreloader={ showPreloader }
				/>
			) }
		</div>
	);
};

export default ProductPreview;
