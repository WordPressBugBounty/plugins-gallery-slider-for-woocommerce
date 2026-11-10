import {
	createPortal,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { GalleryContent, galleryRootAttributes } from '../engine/Gallery';
import createGalleryEngine, { RESTART_GROUPS } from './engine';

/**
 * One life of the gallery: the template markup (engine/Gallery.jsx) mounted
 * as React into the framed product page, run by the gallery engine
 * (engine.js). The parent keys this component on everything the main
 * slider's markup or the engine depends on, so a structural edit remounts a
 * fresh gallery, exactly as the store starts the gallery script on a fresh
 * page. The thumbnails are keyed apart (`thumbsKey`): an edit of them alone
 * swaps only the thumbnail subtree, and the engine rebuilds only that slider
 * under the untouched main slider, so the main image does not reload. The
 * script settings of the carousel and the lightbox are keyed apart too
 * (`scriptKeys`): an edit of them re-runs that script alone on the
 * mounted markup, as a style-only edit swaps the `<style>` alone. Within one
 * mount the rendered output outside the thumbnails never changes (it is in
 * the key), except the lightbox icon classes on the anchors, which nothing
 * else touches, so React never reconciles the parts the engine and SPSwiper
 * mutate.
 *
 * Each mount makes its own `#wpgs-gallery` element in the frame and puts it
 * in the place of the previous mount's (the first takes the place of the
 * template's empty slot), so it sits where the store prints it: the theme's
 * and the dynamic CSS's `+ .summary` and `> #wpgs-gallery` selectors apply,
 * and the engine measures the real parent. The content is a portal into it.
 *
 * @param {Object}  props
 * @param {Object}  props.frame         The framed page (`doc`, `slot`: ref of the element in the gallery's place).
 * @param {Object}  props.model         Gallery model (buildGalleryModel()).
 * @param {Object}  props.settings      Effective settings (mobile-forced).
 * @param {string}  props.thumbsKey     Key of the thumbnail slider (buildPreview()).
 * @param {Object}  props.scriptKeys    Keys of the carousel and lightbox scripts (buildPreview()).
 * @param {number}  props.productId     Product ID.
 * @param {string}  props.device        'desktop', 'tablet' or 'mobile'.
 * @param {boolean} props.isMobile      Whether the device counts as wp_is_mobile().
 * @param {boolean} props.isRtl         Whether the site is right to left.
 * @param {Object}  props.page          Page data from the REST preview data (for the on-demand libraries).
 * @param {boolean} props.showPreloader Whether this mount renders the preloader.
 */
const GalleryMount = ( {
	frame,
	model,
	settings,
	thumbsKey,
	scriptKeys,
	productId,
	device,
	isMobile,
	isRtl,
	page,
	showPreloader,
} ) => {
	// This mount's `#wpgs-gallery`. Its attributes are in the key, so they
	// are set once.
	const [ root ] = useState( () => {
		const attributes = galleryRootAttributes( {
			model,
			productId,
			isMobile,
			isRtl,
			showPreloader,
		} );
		const element = frame.doc.createElement( 'div' );
		element.id = attributes.id;
		if ( attributes.dir ) {
			element.dir = attributes.dir;
		}
		element.className = attributes.className;
		element.style.maxWidth = attributes.maxWidth;
		element.style.overflow = 'hidden';
		element.setAttribute( 'data-id', attributes.dataId );
		return element;
	} );
	const engineRef = useRef( null );
	// Per restart group, the key of what the running engine has initialized.
	const restartKeys = { ...scriptKeys, thumbnails: thumbsKey };
	const restartSignature = JSON.stringify( restartKeys );
	const engineKeysRef = useRef( restartKeys );
	// The nodes React put in the root, as of the last commit.
	const reactNodesRef = useRef( [] );

	// Into the page, in the place of the previous gallery. On unmount it
	// stays until the next mount replaces it, so the page never jumps.
	useLayoutEffect( () => {
		const previous = frame.slot.current;
		if ( previous && previous !== root ) {
			previous.replaceWith( root );
			frame.slot.current = root;
		}
		// The engine removes or moves some of React's top-level nodes (the
		// mobile rewrites); React removes them from the root on unmount, so
		// put them back first.
		return () => {
			reactNodesRef.current.forEach( ( node ) => {
				if ( node.parentNode !== root ) {
					root.appendChild( node );
				}
			} );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useLayoutEffect( () => {
		reactNodesRef.current = Array.from( root.childNodes );
	} );

	useEffect( () => {
		if ( ! root.parentElement ) {
			return;
		}
		const engine = createGalleryEngine( {
			container: root.parentElement,
			settings,
			device,
			page,
		} );
		engineRef.current = engine;
		engineKeysRef.current = restartKeys;
		engine.start();
		return () => {
			engine.destroy();
			engineRef.current = null;
		};
		// One engine per mount; a change of anything but the thumbnails
		// changes the key.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// A restart group changed in the commit just before this (the thumbnails
	// were swapped, or a carousel or lightbox setting was edited):
	// re-run that part of the engine. Before the engine runs there is
	// nothing to re-run; start() takes the settings as they are then.
	useLayoutEffect( () => {
		const engine = engineRef.current;
		if ( ! engine ) {
			return;
		}
		const previous = engineKeysRef.current;
		engineKeysRef.current = restartKeys;
		Object.keys( RESTART_GROUPS ).forEach( ( group ) => {
			if ( previous[ group ] !== restartKeys[ group ] ) {
				engine.restart( group, settings );
			}
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ restartSignature ] );

	return createPortal(
		<GalleryContent
			model={ model }
			showPreloader={ showPreloader }
			thumbsKey={ thumbsKey }
		/>,
		root
	);
};

export default GalleryMount;
