/**
 * The live preview, built in the browser from the panel values and the
 * REST preview data, with no request per edit.
 *
 * - settings.js: panel values → stored `wcgs_settings` (the Save sanitizing),
 *                and freeSettings() (WCGS_Public_Helper::free_settings()).
 * - style.js:    WCGS_Public_Style → CSS.
 * - items.js:    product-images.php item picking.
 * - Gallery.jsx: product-images.php markup, mounted by Product/GalleryMount
 *   into the framed product page (the rest of the page is the store's own).
 *
 * As on the product page, the template, the CSS and the engine all use the
 * merged settings with free_settings() applied.
 */
import { renderToString } from '@wordpress/element';
import { mergeValues, freeSettings } from './settings';
import { forDevice } from '../../../../utils/deviceOverrides';
import { buildCss, minifyOutput } from './style';
import { buildGalleryModel } from './items';
import {
	BEHAVIOR_KEYS,
	CAROUSEL_KEYS,
	LIGHTBOX_KEYS,
	THUMB_BEHAVIOR_KEYS,
} from '../Product/engine';
import Gallery, {
	Thumbnails,
	rendersThumbnails,
	templateHelpers,
} from './Gallery';

/**
 * Build the gallery for the current values and device.
 *
 * @param {Object} args
 * @param {Object} args.data   REST preview data (`wcgs/v1/preview`).
 * @param {Object} args.values Global Settings panel values.
 * @param {string} args.device 'desktop', 'tablet' or 'mobile'.
 * @return {Object} `{ model, settings, css, key, thumbsKey, scriptKeys }`
 *                  for the Product preview: the gallery model and effective
 *                  settings, the dynamic CSS, a `key` that changes whenever
 *                  the markup outside the thumbnails or a setting the gallery
 *                  engine reads for the main slider changes — anything a
 *                  `<style>` swap or a script restart cannot cover, so the
 *                  whole gallery remounts —, a `thumbsKey` for the thumbnail
 *                  slider alone, so an edit of the thumbnails rebuilds them
 *                  under the untouched main slider, and `scriptKeys`, one per
 *                  script (carousel, lightbox) whose settings change
 *                  neither markup nor CSS, so an edit re-runs that script
 *                  alone.
 */
export const buildPreview = ( { data, values, device } ) => {
	const { product, gallery, media, page } = data;
	// wp_is_mobile() is true on phones and tablets.
	const isMobile = 'desktop' !== device;

	const stored = { ...data.stored, gallery_cache: '' };
	// Free features only (WCGS_Public_Helper::free_settings()), as every
	// entry point on the store applies it.
	const settings = freeSettings( mergeValues( stored, values, data.fields ) );

	// The template (product-images.php).
	const model = buildGalleryModel( { settings, gallery, media } );
	// Rendered only for the keys: the exact change detectors for the markup,
	// the thumbnails apart from the rest.
	// The lightbox icon and its position are classes on the lightbox anchors,
	// which the engine leaves alone: React updates them in place and the
	// engine restyles its slider button (the lightbox restart), so they are
	// left out of the markup key.
	const keyModel = {
		...model,
		settings: {
			...model.settings,
			lightbox_icon: '',
			lightbox_icon_position: '',
		},
	};
	const galleryHtml = minifyOutput(
		renderToString(
			<Gallery
				model={ keyModel }
				productId={ product.id }
				isMobile={ isMobile }
				isRtl={ page.isRtl }
				withThumbnails={ false }
			/>
		)
	);
	const tpl = templateHelpers( model );
	const thumbsHtml = rendersThumbnails( tpl )
		? minifyOutput(
				renderToString( <Thumbnails model={ model } tpl={ tpl } /> )
		  )
		: '';

	// The enqueue step: the dynamic CSS.
	const css = buildCss( settings, data.styleDefaults, device );
	// The gallery script starts with the device's values put in.
	const engineSettings = forDevice( settings, device );
	const behaviorOf = ( keys ) =>
		keys
			.map( ( key ) => JSON.stringify( engineSettings[ key ] ) )
			.join( '|' );

	return {
		model,
		settings: engineSettings,
		css,
		key: [ device, galleryHtml, behaviorOf( BEHAVIOR_KEYS ) ].join( '\n' ),
		thumbsKey: thumbsHtml
			? [ thumbsHtml, behaviorOf( THUMB_BEHAVIOR_KEYS ) ].join( '\n' )
			: '',
		scriptKeys: {
			carousel: behaviorOf( CAROUSEL_KEYS ),
			lightbox: behaviorOf( LIGHTBOX_KEYS ),
		},
	};
};
