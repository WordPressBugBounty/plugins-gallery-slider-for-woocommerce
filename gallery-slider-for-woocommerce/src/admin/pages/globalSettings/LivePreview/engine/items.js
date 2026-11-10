/**
 * Gallery items, picked from the product's raw gallery data in the browser.
 *
 * Port of WCGS_Product_Gallery::prepare_gallery_items() and its helpers
 * (public/partials/product-images.php). Image URLs and sizes come from the
 * REST preview data (`media`), computed by the same PHP classes.
 */
import { isEmpty } from './settings';

/**
 * PHP truthiness of a setting (`if ( $settings['x'] )`).
 *
 * @param {*} value Value.
 * @return {boolean} Truthy.
 */
export const truthy = ( value ) => ! isEmpty( value );

/**
 * PHP intval() of an attachment ID.
 *
 * @param {*} id ID.
 * @return {number} ID, or 0.
 */
const toId = ( id ) => parseInt( id, 10 ) || 0;

/**
 * Whether the featured image joins the gallery in a context
 * (should_include_featured_image()).
 *
 * @param {Object} settings Settings.
 * @param {string} context  'default_gl' or 'variable_gl'.
 * @return {boolean} Included.
 */
const includesFeatured = ( settings, context ) => {
	const include = settings.include_feature_image_to_gallery ?? [
		'default_gl',
	];
	return Array.isArray( include )
		? include.includes( context )
		: include === context;
};

/**
 * Sort videos last when `video_order` says so, keeping the order otherwise.
 *
 * @param {Array}  items      Items.
 * @param {string} videoOrder `video_come_last` or other.
 * @return {Array} Sorted items.
 */
const sortVideos = ( items, videoOrder ) => {
	const isVideo = ( item ) => ( item && 'video' in item ? 1 : 0 );
	if ( 'video_come_last' === videoOrder ) {
		return [ ...items ].sort( ( a, b ) => isVideo( a ) - isVideo( b ) );
	}
	return items;
};

/**
 * How the videos are shown (WCGS_Public_Helper::video_presentation()).
 *
 * @param {Object} settings Settings.
 * @return {string} 'none' (video gallery off) or 'in_gallery'.
 */
export const videoPresentation = ( settings ) => {
	const enabled = settings.video_gallery;
	if ( undefined !== enabled && null !== enabled && ! truthy( enabled ) ) {
		return 'none';
	}
	return 'in_gallery';
};

/**
 * Settings and items of the gallery template
 * (WCGS_Product_Gallery::__construct() → prepare_gallery_items()).
 *
 * @param {Object} args
 * @param {Object} args.settings Settings (stored shapes, free_settings() applied).
 * @param {Object} args.gallery  Raw gallery data from the REST preview data.
 * @param {Object} args.media    Image data by attachment ID.
 * @return {Object} `{ settings, items, imageLazyLoad }`.
 */
export const buildGalleryModel = ( { settings: base, gallery, media } ) => {
	const settings = { ...base };
	let items = [];

	const addImage = ( id ) => {
		const image = media[ toId( id ) ];
		if ( ! toId( id ) || ! image || ! image.image.url ) {
			return;
		}
		items.push( { ...image.image, srcset: image.srcset } );
	};
	// add_gallery_images(): the Gallery Image Source picks the images
	// (WCGS_Public_Helper::gallery_image_ids()).
	const addGalleryImages = () =>
		( 'attached' === ( settings.gallery_image_source ?? 'uploaded' )
			? gallery.contentIds
			: gallery.galleryIds
		).forEach( addImage );
	const addDefaultImages = () => {
		if (
			includesFeatured( settings, 'default_gl' ) &&
			gallery.featuredId
		) {
			addImage( gallery.featuredId );
		}
		addGalleryImages();
	};

	// prepare_gallery_items().
	const imageLazyLoad = 'ondemand' === settings.wcgs_image_lazy_load;

	if ( 'variable' === gallery.type ) {
		// handle_variation_gallery().
		const variation = gallery.defaultVariation;
		if ( variation ) {
			// add_variation_images().
			if (
				includesFeatured( settings, 'variable_gl' ) &&
				gallery.featuredId
			) {
				addImage( gallery.featuredId );
			}
			if ( variation.id ) {
				if ( variation.imageId ) {
					addImage( variation.imageId );
				}
				// The variation gallery's first images
				// (WCGS_Public_Helper::variation_gallery_ids(), capped by the API).
				( variation.galleryIds || [] ).forEach( addImage );
			}
		} else {
			addDefaultImages();
		}
		if ( ! items.length ) {
			addImage( gallery.featuredId );
		}
	} else {
		// handle_simple_product_gallery().
		addDefaultImages();
		if ( ! items.length ) {
			addImage( gallery.featuredId );
		}
	}

	// sort_gallery_items(): drop repeated URLs, then order videos. With the
	// video gallery off, the video images show as plain images.
	const seen = new Set();
	items = items.filter( ( item ) => {
		if ( ! item.url || seen.has( item.url ) ) {
			return false;
		}
		seen.add( item.url );
		return true;
	} );
	if ( 'in_gallery' === videoPresentation( settings ) ) {
		items = sortVideos( items, settings.video_order );
	} else {
		items = items.map( ( item ) => {
			const { video, ...image } = item;
			return image;
		} );
	}

	return { settings, items, imageLazyLoad };
};
