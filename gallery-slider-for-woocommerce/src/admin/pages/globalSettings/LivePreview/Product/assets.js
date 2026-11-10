/**
 * Script and stylesheet loading into the preview's framed product page.
 *
 * The frame is the product's own page (Woo_Gallery_Slider_Preview_Frame),
 * so the libraries the store's gallery script injects (SPSwiper, Fancybox,
 * xZoom, video.js) load into the frame's document, with the store's element
 * ids, and run in the frame's window, where the gallery lives.
 */

// Per document, one entry per script src / stylesheet href, so repeated
// mounts on one page load reuse them; a reloaded frame is a new document.
const loaded = new WeakMap();

const loadedIn = ( doc ) => {
	if ( ! loaded.has( doc ) ) {
		loaded.set( doc, new Map() );
	}
	return loaded.get( doc );
};

/**
 * Load a script once by URL into a document.
 *
 * @param {string}   src Script URL.
 * @param {string}   id  Element id.
 * @param {Document} doc Document to load it in (the frame's).
 * @return {Promise} Resolves on load; rejects when the script fails.
 */
export const loadScript = ( src, id, doc ) => {
	const cache = loadedIn( doc );
	if ( cache.has( src ) ) {
		return cache.get( src );
	}
	const promise = new Promise( ( resolve, reject ) => {
		const element = doc.createElement( 'script' );
		element.src = src;
		if ( id ) {
			element.id = id;
		}
		element.onload = resolve;
		element.onerror = () => reject( new Error( `Failed: ${ src }` ) );
		doc.head.appendChild( element );
	} );
	cache.set( src, promise );
	return promise;
};

/**
 * Put a stylesheet once by URL into a document.
 *
 * @param {string}   href Stylesheet URL.
 * @param {string}   id   Element id.
 * @param {Document} doc  Document to put it in (the frame's).
 * @return {void}
 */
export const loadStylesheet = ( href, id, doc ) => {
	const cache = loadedIn( doc );
	if ( cache.has( href ) ) {
		return;
	}
	const element = doc.createElement( 'link' );
	element.rel = 'stylesheet';
	element.href = href;
	if ( id ) {
		element.id = id;
	}
	doc.head.appendChild( element );
	cache.set( href, Promise.resolve() );
};
