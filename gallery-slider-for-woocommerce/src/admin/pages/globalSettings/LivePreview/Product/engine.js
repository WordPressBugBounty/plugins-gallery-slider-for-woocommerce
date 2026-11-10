/**
 * Runtime behavior of the preview gallery: a port of the WooGallerySlider
 * class (public/js/woo-gallery-slider-public.js) driving the React-mounted
 * markup directly, with no jQuery. The markup is mounted in the framed
 * product page (Product/index.jsx), and the engine runs against that page's
 * window and document, as the store's script does on the product page.
 *
 * Ported: the initial-state flags, gallery and summary widths, slider
 * heights, the SPSwiper thumbnail and main sliders with the frontend's exact
 * configs, the thumbnail top line, autoplay pausing on hover, the xZoom
 * inside zoom with the orphan-overlay sweep, the YouTube IFrame API and
 * video.js players with the slide-change video handling, the video icons,
 * and the Fancybox lightbox (the slider's lightbox button, the frontend's
 * exact Fancybox options, and the click proxies that open it from the image,
 * the video icon and the button).
 *
 * The libraries are the store's own files, loaded into the frame: xZoom
 * (`zoom.min.js`, a jQuery plugin run through the page's jQuery), video.js,
 * Fancybox (bound to the page's body, as on the store) and the YouTube API,
 * loaded on demand as the store's script does.
 *
 * Left out on purpose: the lightbox's `on.reveal` handler (an Elementor
 * workaround). One addition: when the YouTube API does not arrive within the
 * store's 5 s, inline videos fall back to plain embeds instead of staying
 * dead.
 *
 * Window-width checks use the device frame's width, so the simulated device
 * decides, as the real window would. The engine owns the
 * subtree for the life of one mount; the component remounts it (new key) for
 * any change of markup or of a BEHAVIOR_KEYS setting. The update path is
 * restart( group ), one per RESTART_GROUPS entry: the component swaps the
 * thumbnail subtree alone for an edit of the thumbnails (THUMB_BEHAVIOR_KEYS
 * or their markup) and the engine rebuilds that slider under the running
 * main slider; an edit of a carousel or lightbox setting re-runs that script
 * alone on the mounted markup.
 */

import { __, sprintf } from '@wordpress/i18n';
import { LIGHTBOX_ICONS } from '../engine/Gallery';
import { loadScript, loadStylesheet } from './assets';

/**
 * Fancybox `l10n` labels, the port of WCGS_Public_Helper::lightbox_l10n()
 * (same keys and msgids, so the store and the preview read the same
 * translations). Only what the free lightbox shows: arrows, fullscreen and
 * close buttons, error messages.
 *
 * @return {Object} Fancybox l10n map.
 */
const lightboxL10n = () => ( {
	CLOSE: __( 'Close', 'gallery-slider-for-woocommerce' ),
	NEXT: __( 'Next', 'gallery-slider-for-woocommerce' ),
	PREV: __( 'Previous', 'gallery-slider-for-woocommerce' ),
	MODAL: __(
		'You can close this modal content with the ESC key',
		'gallery-slider-for-woocommerce'
	),
	ERROR: __(
		'Something went wrong. Please try again later.',
		'gallery-slider-for-woocommerce'
	),
	IMAGE_ERROR: __( 'Image not found', 'gallery-slider-for-woocommerce' ),
	ELEMENT_NOT_FOUND: __(
		'HTML element not found',
		'gallery-slider-for-woocommerce'
	),
	AJAX_NOT_FOUND: __(
		'Error loading content: not found',
		'gallery-slider-for-woocommerce'
	),
	AJAX_FORBIDDEN: __(
		'Error loading content: forbidden',
		'gallery-slider-for-woocommerce'
	),
	IFRAME_ERROR: __( 'Error loading page', 'gallery-slider-for-woocommerce' ),
	TOGGLE_FULLSCREEN: __(
		'Toggle full-screen mode',
		'gallery-slider-for-woocommerce'
	),
	TOGGLEFS: __( 'Toggle full-screen mode', 'gallery-slider-for-woocommerce' ),
} );

/**
 * Accessible title of a video iframe, e.g. "YouTube video".
 *
 * @param {string} host Video host name, shown as is.
 * @return {string} The translated title.
 */
const hostVideoTitle = ( host ) =>
	/* translators: %s: video host name, e.g. Vimeo. */
	sprintf( __( '%s video', 'gallery-slider-for-woocommerce' ), host );

/* Fancybox renders the caption as HTML, so it must go in as text. React
 * writes the stored caption into data-caption as it is (entities such as
 * `&amp;` or `&lt;` included, which the store's esc_attr() + browser decoding
 * would resolve), so existing entities are kept and only bare `&`, `<`, `>`
 * and quotes are encoded. The caption then shows as on the store. */
const escapeCaption = ( value ) =>
	String( value ?? '' )
		.replace( /&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#039;' );

/* Settings the engine reads that do not change the rendered markup or CSS.
 * The remount key includes them (buildPreview()), so an edit re-runs the
 * engine; keep the list in step with the reads below. `thumbnailnavigation`
 * is markup of the thumbnails, but the main slider's navigation config
 * points at those arrows, so it belongs to the main key. `zoom` and
 * `mobile_zoom` decide whether the zoom is set up at all. The script
 * settings of the sliders and the lightbox are not here: they are in
 * RESTART_GROUPS. `gallery_layout` usually changes the markup too; it is
 * listed so that a layout switch always starts a fresh engine. */
export const BEHAVIOR_KEYS = [
	'gallery_layout',
	'gallery_responsive_width',
	'slider_height_type',
	'thumbnailnavigation',
	'lightbox',
	'zoom',
	'mobile_zoom',
	'video_icon',
	'video_popup_place',
	'grayscale',
	'gallery_width',
];

/* Settings the engine reads for the thumbnail slider only. An edit keys the
 * thumbnails alone (buildPreview()), and restartThumbnails() takes the new
 * values; the main slider keeps running. */
export const THUMB_BEHAVIOR_KEYS = [
	'thumbnail_style',
	'thumbnails_item_to_show',
	'thumbnails_sliders_space',
	'vertical_thumbs_width',
];

/* Script settings that change neither the markup nor the dynamic CSS, by the
 * script that reads them. An edit re-runs that script alone on the mounted
 * gallery (restart()), as a style-only edit swaps the `<style>` alone:
 * - carousel: the SPSwiper configs and the hover handlers of the sliders,
 *   rebuilt on the same slides at the same slide.
 * - lightbox: the Fancybox options, re-bound; the icon and its position are
 *   classes React updates on the anchors and the engine on the slider's
 *   button (buildPreview() leaves them out of the markup key).
 * Turning the lightbox on or off changes the markup, so it remounts. */
export const CAROUSEL_KEYS = [
	'accessibility',
	'autoplay',
	'autoplay_interval',
	'autoplay_speed',
	'fade_slide',
	'free_mode',
	'infinite_loop',
	'mouse_wheel',
	'pagination_visibility',
	'navigation_visibility',
];

export const LIGHTBOX_KEYS = [
	'lightbox_icon',
	'lightbox_icon_position',
	'lightbox_sliding_effect',
	'lightbox_caption',
	'l_img_counter',
	'gallery_fs_btn',
];

// restart() groups, in the order the component runs them. The thumbnails
// go first: a carousel restart rebuilds them too.
export const RESTART_GROUPS = {
	thumbnails: THUMB_BEHAVIOR_KEYS,
	carousel: CAROUSEL_KEYS,
	lightbox: LIGHTBOX_KEYS,
};

/**
 * Computed style in the element's own window (the framed page).
 *
 * @param {Element} element Element.
 * @return {CSSStyleDeclaration} Computed style.
 */
const styleOf = ( element ) =>
	element.ownerDocument.defaultView.getComputedStyle( element );

/**
 * jQuery .height() / .width(): the content-box size, with padding and
 * border taken off when the element is `box-sizing: border-box`.
 *
 * @param {Element} element Element.
 * @param {string}  axis    `height` or `width`.
 * @return {number} Size.
 */
const contentSize = ( element, axis ) => {
	const style = styleOf( element );
	const size = parseFloat( style[ axis ] ) || 0;
	if ( 'border-box' !== style.boxSizing ) {
		return size;
	}
	const sides = 'height' === axis ? [ 'Top', 'Bottom' ] : [ 'Left', 'Right' ];
	return sides.reduce(
		( total, side ) =>
			total -
			( parseFloat( style[ `padding${ side }` ] ) || 0 ) -
			( parseFloat( style[ `border${ side }Width` ] ) || 0 ),
		size
	);
};

/**
 * jQuery .height(): the content-box height.
 *
 * @param {Element} element Element.
 * @return {number} Height.
 */
const heightOf = ( element ) => contentSize( element, 'height' );

/**
 * jQuery .width(): the content-box width.
 *
 * @param {Element} element Element.
 * @return {number} Width.
 */
const widthOf = ( element ) => contentSize( element, 'width' );

/**
 * jQuery .position(): the offset within the offset parent, less the
 * element's own margin.
 *
 * @param {Element} element Element.
 * @return {Object} `{ top, left }`.
 */
const positionOf = ( element ) => {
	const style = styleOf( element );
	return {
		top: element.offsetTop - ( parseFloat( style.marginTop ) || 0 ),
		left: element.offsetLeft - ( parseFloat( style.marginLeft ) || 0 ),
	};
};

/**
 * xZoom's defaultScale for a zoom level (zoomScale() of the public script):
 * at 0 it shows the full image at its own size, at 1 at the shown size, and
 * scales linearly in between.
 *
 * @param {number} fullWidth  Width of the full image.
 * @param {number} shownWidth Width of the shown image.
 * @param {number} level      Zoom level (1.5 or 2).
 * @return {number} defaultScale.
 */
const zoomScale = ( fullWidth, shownWidth, level ) => {
	if ( ! fullWidth || ! shownWidth ) {
		return 0;
	}
	const ratio = fullWidth / shownWidth;
	if ( Math.abs( ratio - 1 ) < 0.01 ) {
		return 0;
	}
	return Math.max( -30, Math.min( 1, ( ratio - level ) / ( ratio - 1 ) ) );
};

/**
 * Field defaults of the settings the script reads as numbers or nested
 * values (settingDefaults in the public script): a missing one is filled in,
 * a nested one per sub key.
 */
const SETTING_DEFAULTS = {
	gallery_layout: 'horizontal',
	gallery_width: 50,
	gallery_responsive_width: {
		width: 0,
		height: 720,
		height2: 480,
		unit: 'px',
	},
	thumbnails_item_to_show: 4,
	vertical_thumbs_width: 20,
	thumbnails_sliders_space: { width: 6, height: 6 },
	slide_orientation: 'horizontal',
	fade_slide: 'slide',
	autoplay_interval: 3000,
	autoplay_speed: 300,
	lightbox_icon: 'search',
	lightbox_icon_position: 'top_right',
	grayscale: 'gray_off',
};

/**
 * The settings with SETTING_DEFAULTS put in (withSettingDefaults() of the
 * public script).
 *
 * @param {Object} values Settings.
 * @return {Object} The same object.
 */
const withSettingDefaults = ( values ) => {
	const isMap = ( value ) =>
		!! value && 'object' === typeof value && ! Array.isArray( value );
	Object.entries( SETTING_DEFAULTS ).forEach( ( [ key, fallback ] ) => {
		if ( isMap( fallback ) ) {
			values[ key ] = {
				...fallback,
				...( isMap( values[ key ] ) ? values[ key ] : {} ),
			};
		} else if (
			undefined === values[ key ] ||
			null === values[ key ] ||
			'' === values[ key ]
		) {
			values[ key ] = fallback;
		}
	} );
	return values;
};

/**
 * The gallery engine of one mounted gallery.
 *
 * @param {Object}  args
 * @param {Element} args.container Parent of `#wpgs-gallery` in the framed page.
 * @param {Object}  args.settings  Effective settings (what
 *                                 `wcgs_object.wcgs_settings` would hold).
 * @param {string}  args.device    'desktop', 'tablet' or 'mobile'.
 * @param {Object}  [args.page]    Page data from the REST preview data
 *                                 (`publicUrl`, `scripts`), for the on-demand
 *                                 libraries.
 * @return {Object} `{ start, destroy, restart }`.
 */
const createGalleryEngine = ( {
	container,
	settings: baseSettings,
	device,
	page,
} ) => {
	// The framed product page's document and window, the store's `document`
	// and `window`.
	const doc = container.ownerDocument;
	const win = doc.defaultView;
	const stage = win.frameElement?.closest( '.wcgs-live-preview__stage' );
	const gallery = container.querySelector( '#wpgs-gallery' );
	const settings = withSettingDefaults( { ...baseSettings } );
	const state = {
		isMobileDevice: false,
		slidesPerView: 1,
		slideSpaceBetween: 1,
		isHideThumbLayout: false,
		videoOnlyPopup: true,
		isPreloader: false,
		iconPosition: 'top_right',
		lightboxIcon: 'search',
		// The video play icon sits in the middle of the slides.
		videoIconPosition: 'middle',
	};
	// mainSwiper's slideChange → thumb line hook, bound once per main slider.
	let thumbLineBound = false;
	// Elements whose click handlers are bound for good, so a slider restart
	// does not bind them twice.
	const activationBound = new WeakSet();
	// Hover handlers of the sliders (arrow and pagination visibility, autoplay
	// pause), removed by a slider restart.
	const sliderListeners = [];
	let thumbSwiper = null;
	let mainSwiper = null;
	let galleryWidth = 100;
	let destroyed = false;
	const timers = new Set();
	const intervals = new Set();
	const observers = [];
	// Delegated click handlers on the gallery, removed on destroy.
	const galleryListeners = [];
	let lightboxBound = false;
	let videoPopupOpened = false;
	// xZoom instances and YouTube players (`this.players`), torn down on destroy.
	const zoomInstances = [];
	const players = new Map();
	const zoomHoverBound = new WeakSet();
	const publicUrl = page?.publicUrl || '';
	// A store-injected script's URL (`page.scripts` carries the store's list).
	const scriptSrc = ( id, fallback ) =>
		page?.scripts?.find( ( item ) => id === item.id )?.src ||
		( publicUrl ? `${ publicUrl }js/${ fallback }` : '' );

	const find = ( selector, root = gallery ) =>
		root ? Array.from( root.querySelectorAll( selector ) ) : [];
	const first = ( selector, root = gallery ) =>
		root ? root.querySelector( selector ) : null;
	const later = ( callback, delay ) => {
		const timer = setTimeout( () => {
			timers.delete( timer );
			if ( ! destroyed ) {
				callback();
			}
		}, delay );
		timers.add( timer );
	};
	// The simulated device's window width, $( window ).width() on the store.
	// The frame's width animates on a device switch, so the target width is
	// taken from the device, not from the live width (the frame is
	// 768px/390px wide, capped by the stage less the frame's 1px borders).
	// The page's scrollbar is taken off, as jQuery does.
	const stageWidth = () => ( stage ? stage.clientWidth : win.innerWidth );
	const scrollbar = () => win.innerWidth - doc.documentElement.clientWidth;
	const frameWidth = () => {
		if ( 'tablet' === device ) {
			return Math.min( 768, stageWidth() - 2 ) - scrollbar();
		}
		if ( 'mobile' === device ) {
			return Math.min( 390, stageWidth() - 2 ) - scrollbar();
		}
		return stageWidth() - scrollbar();
	};
	const carousel = () => first( '.wcgs-carousel' );

	// The slider's lightbox button: its icon and position.
	const readLightboxIcon = () => {
		state.iconPosition = settings.lightbox_icon_position || 'top_right';
		const lightboxIcon = settings.lightbox_icon || 'search';
		state.lightboxIcon = LIGHTBOX_ICONS[ lightboxIcon ] ?? lightboxIcon;
	};

	// ------------------------------------------------------------------
	// setupInitialState().
	// ------------------------------------------------------------------
	const setupInitialState = () => {
		state.isHideThumbLayout = 'hide_thumb' === settings.gallery_layout;
		state.videoOnlyPopup = 'inline' !== settings.video_popup_place;
		state.isPreloader = '1' === settings.preloader;
		readLightboxIcon();
		state.isMobileDevice = frameWidth() < 768;
	};

	// ------------------------------------------------------------------
	// Widths: calculateGalleryWidth() / setGalleryWidth() /
	// updateSummaryWidth(), without the theme-specific branches.
	// ------------------------------------------------------------------
	const emToPx = ( em ) => {
		const fontSize =
			doc.documentElement.style.fontSize ||
			win.getComputedStyle( doc.documentElement ).fontSize ||
			'16px';
		return em * parseFloat( fontSize );
	};

	const calculateGalleryWidth = () => {
		let width = settings.gallery_width;
		const windowWidth = frameWidth();
		const wrapper = gallery.parentElement;
		const wrapperWidth = wrapper ? wrapper.clientWidth : windowWidth;
		let unit = '%';
		if (
			'vertical' === settings.gallery_layout ||
			'vertical_right' === settings.gallery_layout ||
			'hide_thumb' === settings.gallery_layout ||
			width > 100
		) {
			width = ( width * wrapperWidth ) / 100;
			if ( settings.gallery_width > 100 ) {
				width = settings.gallery_width;
			}
		}
		// No summary next to the gallery (block themes, page builders): the
		// gallery takes its parent's width.
		if (
			wrapper &&
			! wrapper.querySelector( ':scope > #wpgs-gallery ~ .summary' )
		) {
			const parentWidth = wrapper.getBoundingClientRect().width;
			if ( parentWidth ) {
				width = parentWidth;
			}
		}
		const responsive = settings.gallery_responsive_width || {};
		if ( windowWidth < 992 && responsive.width > 0 ) {
			width = responsive.width;
			unit = responsive.unit;
		}
		if ( windowWidth < 768 ) {
			width = responsive.height;
			unit = responsive.unit;
		}
		if ( windowWidth < 480 ) {
			width = responsive.height2;
			unit = responsive.unit;
		}
		if ( 'em' === unit ) {
			width = emToPx( width );
		}
		galleryWidth = width;
		return width;
	};

	const updateSummaryWidth = ( width, unit ) => {
		const summary = gallery.parentElement.querySelector(
			'.summary.entry-summary'
		);
		if ( ! summary ) {
			return;
		}
		let summaryWidth = '';
		if ( '%' === unit ) {
			const rest = 100 - width;
			summaryWidth = rest > 20 ? `calc(${ rest }% - 50px)` : '';
		} else {
			const parentWidth = gallery.parentElement.clientWidth;
			if ( parentWidth > gallery.getBoundingClientRect().width + 100 ) {
				const rest = parentWidth - width;
				if ( rest > 150 ) {
					summaryWidth = `${ rest - 50 }${ unit }`;
				}
			}
		}
		summary.style.maxWidth = summaryWidth;
	};

	const setGalleryWidth = ( width ) => {
		let unit = '%';
		const isVerticalLayout =
			'vertical' === settings.gallery_layout ||
			'vertical_right' === settings.gallery_layout;
		if (
			isVerticalLayout ||
			'hide_thumb' === settings.gallery_layout ||
			width > 100
		) {
			unit = 'px';
			const parentWidth = gallery.parentElement.clientWidth;
			width = parentWidth > width ? width : parentWidth;
			gallery.style.maxWidth = '100%';
		}
		gallery.style.minWidth = 'auto';
		gallery.style.width = `${ width }${ unit }`;

		const imageCount = find( '.wcgs-carousel .wcgs-slider-image' ).length;
		if ( 1 === imageCount || 'hide_thumb' === settings.gallery_layout ) {
			// initializeHideThumbLayout(): full-width carousel, no thumbnails.
			carousel().style.width = '100%';
			find(
				'.gallery-navigation-carousel, .gallery-navigation-carousel-wrapper'
			).forEach( ( nav ) => {
				nav.style.display = 'none';
			} );
			find( '.wcgs-spswiper-arrow' ).forEach( ( arrow ) => {
				arrow.style.display = 1 === imageCount ? 'none' : '';
			} );
		}
		updateSummaryWidth( width, unit );
	};

	// ------------------------------------------------------------------
	// Heights: calculateGalleryHeights() and friends.
	// ------------------------------------------------------------------
	const getMaxImageHeight = () => {
		let maxHeight = 0;
		find( '.wcgs-carousel img' ).forEach( ( img ) => {
			const attrWidth = parseInt( img.getAttribute( 'width' ), 10 );
			const attrHeight = parseInt( img.getAttribute( 'height' ), 10 );
			if ( attrWidth && attrHeight ) {
				const estimated =
					img.getBoundingClientRect().width *
					( attrHeight / attrWidth );
				maxHeight = Math.max( maxHeight, estimated );
			} else {
				maxHeight = Math.max( maxHeight, img.clientHeight );
			}
		} );
		return maxHeight;
	};

	const handleHorizontalLayout = () => {
		if ( 'vertical' !== settings.slide_orientation ) {
			return;
		}
		const maxHeight = getMaxImageHeight();
		// A vertical Swiper sizes slides from the container height; without one,
		// the container grows to all slides stacked and each slide gets that height.
		if ( carousel() ) {
			carousel().style.height = `${ maxHeight }px`;
		}
		find( '.wcgs-carousel .spswiper-slide' ).forEach( ( slide ) => {
			slide.style.minHeight = `${ maxHeight }px`;
			slide.style.display = 'flex';
			slide.style.justifyContent = 'center';
			slide.style.alignItems = 'center';
		} );
	};

	const handleVerticalLayout = ( thumbCount, thumbWidth, gap ) => {
		if ( thumbCount <= 1 ) {
			return;
		}
		const parentWidth = gallery.parentElement.clientWidth;
		galleryWidth = parentWidth > galleryWidth ? galleryWidth : parentWidth;
		const slider = first( '.wcgs-carousel.spswiper' );
		if ( slider ) {
			const width = galleryWidth - thumbWidth - gap;
			slider.style.maxWidth = `${ width }px`;
			slider.style.width = `${ width }px`;
		}
		const maxHeight = getMaxImageHeight();
		const targets = find( '.wcgs-carousel .spswiper-slide' ).concat(
			carousel() ? [ carousel() ] : []
		);
		if ( 'vertical' === settings.slide_orientation ) {
			targets.forEach( ( element ) => {
				element.style.minHeight = `${ maxHeight }px`;
			} );
		}
		const nav = first( '.gallery-navigation-carousel-wrapper' );
		if ( nav ) {
			nav.style.width = `${ thumbWidth }px`;
			nav.style.maxHeight = `${ maxHeight }px`;
		}
		// Center the images vertically (the images are never hard-cropped).
		carousel()?.classList.add( 'vertically-center' );
		targets.forEach( ( element ) => {
			element.style.height = `${ maxHeight }px`;
		} );
	};

	const calculateGalleryHeights = () => {
		const thumbCount = find(
			'.gallery-navigation-carousel .wcgs-thumb'
		).length;
		const verticalThumbsWidth = settings.vertical_thumbs_width || 20;
		const parentWidth = gallery.parentElement.clientWidth;
		galleryWidth = parentWidth > galleryWidth ? galleryWidth : parentWidth;
		const thumbWidth = ( galleryWidth / 100 ) * verticalThumbsWidth;
		const verticalGap =
			settings.thumbnails_sliders_space?.height !== undefined
				? parseInt( settings.thumbnails_sliders_space.height, 10 )
				: 6;
		if (
			[ 'horizontal', 'horizontal_top' ].includes(
				settings.gallery_layout
			)
		) {
			handleHorizontalLayout();
		} else if ( 'hide_thumb' === settings.gallery_layout ) {
			carousel().style.width = `${ galleryWidth }px`;
		} else {
			handleVerticalLayout( thumbCount, thumbWidth, verticalGap );
			later(
				() =>
					handleVerticalLayout( thumbCount, thumbWidth, verticalGap ),
				600
			);
		}
	};

	// ------------------------------------------------------------------
	// SPSwiper sliders.
	// ------------------------------------------------------------------
	const getAutoplaySettings = () => {
		if ( '1' !== settings.autoplay ) {
			return false;
		}
		return {
			delay: parseInt( settings.autoplay_interval, 10 ) || 3000,
			pauseOnMouseEnter: false,
		};
	};

	const getAccessibilitySettings = () => {
		if ( '1' !== settings.accessibility ) {
			return false;
		}
		return {
			prevSlideMessage: __(
				'Previous slide',
				'gallery-slider-for-woocommerce'
			),
			nextSlideMessage: __(
				'Next slide',
				'gallery-slider-for-woocommerce'
			),
		};
	};

	const removeBeforeInit = () =>
		later(
			() => gallery.classList.remove( 'wcgs-spswiper-before-init' ),
			400
		);

	const checkArrowsVisibility = () => {
		if ( ! thumbSwiper ) {
			return;
		}
		const visible =
			thumbSwiper.allowSlidePrev || thumbSwiper.allowSlideNext;
		find(
			'.gallery-navigation-carousel-wrapper .wcgs-spswiper-arrow'
		).forEach( ( arrow ) => {
			arrow.style.display = visible ? '' : 'none';
		} );
	};

	// The top line style's line on the active thumbnail.
	const setThumbnailBorderPosition = () => {
		if ( 'top_line' !== settings.thumbnail_style ) {
			return;
		}
		const isVertical =
			'vertical' === settings.gallery_layout ||
			'vertical_right' === settings.gallery_layout;
		const activeThumb = first(
			'.gallery-navigation-carousel-wrapper .wcgs-thumb.spswiper-slide-thumb-active'
		);
		const border = first(
			'.gallery-navigation-carousel-wrapper .wcgs-border-bottom'
		);
		if ( ! activeThumb || ! border || ! thumbSwiper ) {
			return;
		}
		// The store measures with .height() / .width(): the content box,
		// without the thumb's line padding and transparent border.
		const height = heightOf( activeThumb );
		const offset = positionOf( activeThumb );
		const top = 10 + height + offset.top;
		const position =
			( isVertical ? offset.top : offset.left ) + thumbSwiper.translate;
		const dimension = isVertical ? height : widthOf( activeThumb );

		if ( isVertical ) {
			Object.assign( border.style, {
				height: `${ dimension }px`,
				top: `${ position }px`,
			} );
		} else if ( 'horizontal_top' === settings.gallery_layout ) {
			Object.assign( border.style, {
				width: `${ dimension }px`,
				left: `${ position }px`,
				bottom: '0px',
				top: 'auto',
			} );
		} else {
			Object.assign( border.style, {
				width: `${ dimension }px`,
				left: `${ position }px`,
				bottom: `${ top }px`,
				top: 'auto',
			} );
		}
	};

	const setupThumbnailBottomLine = () => {
		if ( 'hide_thumb' === settings.gallery_layout ) {
			return;
		}
		later( () => {
			thumbSwiper?.on( 'sliderMove', setThumbnailBorderPosition );
			if ( mainSwiper && ! thumbLineBound ) {
				thumbLineBound = true;
				mainSwiper.on( 'slideChange', () =>
					later( setThumbnailBorderPosition, 50 )
				);
			}
		}, 100 );
		later( setThumbnailBorderPosition, 1000 );
	};

	const initializeThumbnailSlider = () => {
		if ( state.isHideThumbLayout ) {
			return;
		}
		const element = first(
			'.gallery-navigation-carousel.spswiper:not(.spswiper-initialized)'
		);
		if ( ! element || ! find( '.wcgs-thumb', element ).length ) {
			return;
		}
		const galleryLayout =
			'vertical' === settings.gallery_layout ||
			'vertical_right' === settings.gallery_layout
				? 'vertical'
				: 'horizontal';
		// Vertical thumbnails size themselves; horizontal ones show the set number.
		let itemsToShow = parseInt( settings.thumbnails_item_to_show, 10 );
		const space =
			settings.thumbnails_sliders_space?.width !== undefined
				? settings.thumbnails_sliders_space.width
				: 6;
		if ( 'vertical' === galleryLayout ) {
			itemsToShow = 'auto';
		}
		thumbSwiper = new win.SPSwiper( element, {
			slidesPerView: itemsToShow,
			direction: galleryLayout,
			autoplay: getAutoplaySettings(),
			speed: parseInt( settings.autoplay_speed, 10 ),
			watchSlidesVisibility: true,
			watchSlidesProgress: true,
			autoHeight: false,
			watchOverflow: true,
			loop: '1' === settings.infinite_loop,
			spaceBetween: parseInt( space, 10 ),
			freeMode: '1' === settings.free_mode,
			mousewheel: '1' === settings.mouse_wheel,
			simulateTouch: true,
			a11y: getAccessibilitySettings(),
			on: { init: removeBeforeInit },
		} );
		checkArrowsVisibility();
		if ( 'top_line' === settings.thumbnail_style ) {
			setupThumbnailBottomLine();
		}
	};

	const getNavigationSettings = () => {
		if ( ! settings.navigation && ! settings.thumbnailnavigation ) {
			return;
		}
		if ( '1' === settings.navigation ) {
			return {
				nextEl: first( '.wcgs-carousel .wcgs-spswiper-button-next' ),
				prevEl: first( '.wcgs-carousel .wcgs-spswiper-button-prev' ),
			};
		}
		if ( '1' === settings.thumbnailnavigation ) {
			return {
				nextEl: first(
					'.gallery-navigation-carousel .wcgs-spswiper-button-next'
				),
				prevEl: first(
					'.gallery-navigation-carousel .wcgs-spswiper-button-prev'
				),
			};
		}
	};

	const getPaginationSettings = () => {
		if ( '1' !== settings.pagination ) {
			return;
		}
		// Bullets, dynamic bullets or strokes (bullets styled as bars).
		return {
			el: first( '.wcgs-carousel .spswiper-pagination' ),
			type: 'bullets',
			clickable: true,
			dynamicBullets: 'dynamic' === settings.pagination_type,
			renderBullet: ( index, className ) =>
				`<span class="${ className }"><span class="number">${
					index + 1
				}</span></span>`,
		};
	};

	// Thumbnail-nav arrows drive the main slider.
	const bindThumbnailArrows = () => {
		if ( ! settings.navigation ) {
			return;
		}
		find(
			'.gallery-navigation-carousel .wcgs-spswiper-button-next, .gallery-navigation-carousel .wcgs-spswiper-button-prev'
		).forEach( ( arrow ) => {
			// Bound already, before a slider restart.
			if ( activationBound.has( arrow ) ) {
				return;
			}
			activationBound.add( arrow );
			arrow.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				event.stopPropagation();
				if ( ! mainSwiper ) {
					return;
				}
				if ( arrow.classList.contains( 'wcgs-spswiper-button-next' ) ) {
					mainSwiper.slideNext();
				} else {
					mainSwiper.slidePrev();
				}
			} );
		} );
	};

	const handleMainSliderInit = () => {
		bindThumbnailArrows();
		removeBeforeInit();
	};

	const initializeMainSlider = () => {
		const element = first( '.wcgs-carousel.spswiper' );
		if ( ! element || ! find( '.spswiper-slide', element ).length ) {
			return;
		}
		let adaptiveHeight = 'adaptive' === settings.slider_height_type;
		adaptiveHeight =
			'vertical' === settings.slide_orientation ? true : adaptiveHeight;
		const config = {
			slidesPerView: state.slidesPerView,
			spaceBetween: state.slideSpaceBetween,
			lazyPreloadPrevNext: 0,
			autoHeight: adaptiveHeight,
			speed: parseInt( settings.autoplay_speed, 10 ),
			direction: settings.slide_orientation,
			effect: settings.fade_slide,
			loop: '1' === settings.infinite_loop,
			autoplay: getAutoplaySettings(),
			mousewheel: '1' === settings.mouse_wheel,
			thumbs: ! state.isHideThumbLayout
				? { spswiper: thumbSwiper }
				: null,
			on: {
				init: handleMainSliderInit,
				slideChange: () => {
					later( setThumbnailBorderPosition, 50 );
					handleMainSliderChange();
				},
				transitionEnd: () => sweepOrphanedZoomOverlays(),
				// loopFix's slideTo runs with runCallbacks=false, so only
				// this event covers its DOM moves.
				loopFix: () => sweepOrphanedZoomOverlays(),
			},
		};
		const navigation = getNavigationSettings();
		if ( navigation ) {
			config.navigation = navigation;
		}
		const pagination = getPaginationSettings();
		if ( pagination ) {
			config.pagination = pagination;
		}
		try {
			mainSwiper = new win.SPSwiper( element, config );
		} catch ( error ) {
			// A broken slider leaves the first image shown.
		}
	};

	const onSliderHover = ( element, type, handler ) => {
		element.addEventListener( type, handler );
		sliderListeners.push( [ element, type, handler ] );
	};

	const navigationArrowsVisibility = () => {
		const slider = carousel();
		if ( ! slider ) {
			return;
		}
		const pagination = first( '.wcgs-carousel .spswiper-pagination' );
		if ( 'hover' === settings.pagination_visibility && pagination ) {
			pagination.style.display = 'none';
			onSliderHover( slider, 'mouseenter', () => {
				pagination.style.display = '';
				// Swiper sizes dynamic bullets from their rendered width,
				// which is 0 while hidden: re-measure once shown.
				if (
					mainSwiper &&
					! mainSwiper.destroyed &&
					mainSwiper.params.pagination?.dynamicBullets
				) {
					mainSwiper.pagination?.update();
				}
			} );
			onSliderHover( slider, 'mouseleave', () => {
				pagination.style.display = 'none';
			} );
		}
		// The slider arrows hide until hover too, when there is something to slide to.
		const arrows = find( '.wcgs-carousel .wcgs-spswiper-arrow' );
		if (
			'hover' === settings.navigation_visibility &&
			arrows.length &&
			find( '.wcgs-carousel .spswiper-slide' ).length > 1
		) {
			const show = ( shown ) =>
				arrows.forEach( ( arrow ) => {
					arrow.style.display = shown ? '' : 'none';
				} );
			show( false );
			onSliderHover( slider, 'mouseenter', () => show( true ) );
			onSliderHover( slider, 'mouseleave', () => show( false ) );
		}
	};

	// AddLightboxIcon(): the slider's single lightbox button. The per-slide
	// anchors stay in the markup for Fancybox, hidden by the stylesheet.
	const addLightboxIcon = () => {
		if ( '1' !== settings.lightbox ) {
			return;
		}
		const slider = carousel();
		if ( ! slider || slider.querySelector( ':scope > .wcgs-lightbox' ) ) {
			return;
		}
		const button = doc.createElement( 'button' );
		button.className = `wcgs-lightbox grid-lightbox ${ state.iconPosition }`;
		button.setAttribute(
			'aria-label',
			__( 'Open lightbox', 'gallery-slider-for-woocommerce' )
		);
		const icon = doc.createElement( 'span' );
		icon.className = `sp-wgsp-icon-${ state.lightboxIcon }`;
		button.appendChild( icon );
		slider.prepend( button );
	};

	// handleAutoplayEvents(): autoplay pauses while the pointer is over the
	// gallery; handleMouseLeaveAutoplay() binds the zoom overlays the same way.
	const stopAutoplay = () => {
		mainSwiper?.autoplay?.stop();
		thumbSwiper?.autoplay?.stop();
	};
	const handleMouseLeaveAutoplay = () => {
		doc.querySelectorAll( '.wcgs_xzoom-source' ).forEach( ( element ) => {
			if ( zoomHoverBound.has( element ) ) {
				return;
			}
			zoomHoverBound.add( element );
			element.addEventListener( 'mouseenter', stopAutoplay );
			element.addEventListener( 'mouseleave', () => {
				// Turned off by a slider restart since.
				if ( '1' !== settings.autoplay ) {
					return;
				}
				if ( thumbSwiper ) {
					mainSwiper?.autoplay?.start();
				}
				thumbSwiper?.autoplay?.start();
			} );
		} );
	};
	const handleAutoplayEvents = () => {
		if ( '1' !== settings.autoplay ) {
			return;
		}
		onSliderHover( gallery, 'mouseenter', stopAutoplay );
		onSliderHover( gallery, 'mouseleave', () => {
			mainSwiper?.autoplay?.start();
			thumbSwiper?.autoplay?.start();
			handleMouseLeaveAutoplay();
		} );
	};

	const initializeSliderGallery = () => {
		initializeThumbnailSlider();
		initializeMainSlider();
		navigationArrowsVisibility();
		handleAutoplayEvents();
		addLightboxIcon();
	};

	const whenSPSwiperReady = () => {
		if ( 'function' === typeof win.SPSwiper ) {
			initializeSliderGallery();
			return;
		}
		const interval = setInterval( () => {
			if ( 'function' === typeof win.SPSwiper ) {
				clearInterval( interval );
				intervals.delete( interval );
				if ( ! destroyed ) {
					initializeSliderGallery();
				}
			}
		}, 300 );
		intervals.add( interval );
		later( () => {
			clearInterval( interval );
			intervals.delete( interval );
		}, 10000 );
	};

	// ------------------------------------------------------------------
	// Lightbox: initializeLightbox() / getLightboxButtons() and the click
	// proxy setupVideoPopup(). The anchors are the
	// `a.wcgs-slider-lightbox[data-fancybox="view"]` of the markup.
	// ------------------------------------------------------------------
	const onGalleryClick = ( selector, handler ) => {
		const listener = ( event ) => {
			const target = event.target.closest( selector );
			if ( target && gallery.contains( target ) ) {
				handler( event, target );
			}
		};
		gallery.addEventListener( 'click', listener );
		galleryListeners.push( listener );
	};

	const getLightboxButtons = () => {
		const buttons = [];
		if ( '1' === settings.gallery_fs_btn ) {
			buttons.push( 'fullscreen' );
		}
		buttons.push( 'close' );
		return buttons;
	};

	// Fancybox merges an option group (`Carousel`, `Image`, `Thumbs`, …) into
	// its defaults only when the group is a plain object of the frame's own
	// realm (`value.constructor === Object`). The engine runs in the
	// dashboard's window, so its literals fail that test and replace the
	// defaults whole: without `Carousel.classes` the slides got Carousel's
	// `f-carousel__slide` instead of `fancybox__slide`, which the stylesheet
	// lays out, and an image smaller than the frame sat at the left edge.
	// Copy the options into the frame's realm before handing them over.
	const toFrameRealm = ( value ) => {
		if ( Array.isArray( value ) ) {
			return value.map( toFrameRealm );
		}
		if (
			! value ||
			'object' !== typeof value ||
			'[object Object]' !== Object.prototype.toString.call( value )
		) {
			return value;
		}
		const copy = new win.Object();
		Object.keys( value ).forEach( ( key ) => {
			copy[ key ] = toFrameRealm( value[ key ] );
		} );
		return copy;
	};

	const initializeLightbox = () => {
		if ( 'undefined' === typeof win.Fancybox ) {
			return;
		}
		const options = {
			backdropClick: 'close',
			mainClass: 'wcgs-fancybox-wrapper',
			animated: true,
			hideClass: 'f-fadeOut',
			showClass: 'f-fadeIn',
			animationDuration: 1000,
			Toolbar: {
				display: {
					left: '1' === settings.l_img_counter ? [ 'infobar' ] : '',
					middle: [],
					right: getLightboxButtons(),
				},
			},
			Thumbs: false,
			Carousel: {
				Panzoom: {
					decelFriction: 0.5,
				},
				// Fancybox has no "no animation" transition: an unknown name
				// never ends, so the previous slide stays stacked under the new
				// one. Jump to the page instead (friction 0 = instant).
				...( 'no_animation' === settings.lightbox_sliding_effect
					? { transition: false, friction: 0 }
					: { transition: settings.lightbox_sliding_effect } ),
				transitionDuration: 1000,
			},
			Image: {
				zoom: true,
				preload: 3,
				click: 'toggleZoom',
				wheel: 'zoom',
				imageProtection: true,
			},
			Video: {
				autoplay: true,
				loop: true,
				mute: true,
				ratio: 16 / 9,
			},
			caption: ( fancybox, slide ) => {
				if ( '1' === settings.lightbox_caption ) {
					return escapeCaption( slide.caption || '' );
				}
				return '';
			},
			dragToClose: true,
		};
		// Bound to the page's body, as on the store.
		win.Fancybox.bind(
			doc.body,
			'[data-fancybox]',
			toFrameRealm( { ...options, l10n: lightboxL10n() } )
		);
		lightboxBound = true;
	};

	// stopVideos(): pause the slide's player before the lightbox covers it.
	const stopVideos = ( slide ) => {
		const video = slide.querySelector( 'video, iframe' );
		if ( ! video ) {
			return;
		}
		if ( 'video' === video.tagName.toLowerCase() ) {
			video.pause();
		} else {
			// Reset the iframe source to stop the video.
			const { src } = video;
			video.src = src;
		}
	};

	// The play icon of a popup video card (the store's bindEvents()): with the
	// lightbox off it opens the video on its own; with it on, the lightbox
	// proxy opens the lightbox at the video.
	const POPUP_PLAY_ICON =
		'.wcgs-slider-image.video[data-video-popup] .wcgs-video-icon-wrapper';

	// openVideoPopup(): the card's video on its own (lightbox off).
	const openVideoPopup = ( card ) => {
		const src = card?.getAttribute( 'data-video-popup' );
		if ( ! src || 'undefined' === typeof win.Fancybox ) {
			return;
		}
		const item = {
			src,
			thumbSrc: card.querySelector( '.wcgs-slider-image-tag' )?.src || '',
		};
		if ( card.getAttribute( 'data-video-type' ) ) {
			item.type = card.getAttribute( 'data-video-type' );
		}
		const options = {
			mainClass: 'wcgs-fancybox-wrapper wcgs-video-popup',
			backdropClick: 'close',
			dragToClose: true,
			Toolbar: {
				display: {
					left: [],
					middle: [],
					right: [ 'close' ],
				},
			},
			Thumbs: false,
			Html: {
				videoAutoplay: true,
			},
		};
		win.Fancybox.show(
			toFrameRealm( [ item ] ),
			toFrameRealm( { ...options, l10n: lightboxL10n() } )
		);
		videoPopupOpened = true;
	};

	const setupVideoPlayIcon = () => {
		onGalleryClick( POPUP_PLAY_ICON, ( event, wrapper ) => {
			if ( '1' === settings.lightbox ) {
				return;
			}
			event.preventDefault();
			openVideoPopup( wrapper.closest( '.wcgs-slider-image.video' ) );
		} );
	};

	// setupVideoPopup(): the slider's button, image, video icon or video
	// slide opens the lightbox at the active slide.
	const setupVideoPopup = () => {
		onGalleryClick(
			'.wcgs-carousel .wcgs-lightbox, .wcgs-slider-image .wcgs-video-icon, .wcgs-slider-image .wcgs-slider-image-tag, .wcgs_xzoom-source, .wcgs-slider-image.video',
			( event ) => {
				const activeSlide = first(
					'.wcgs-carousel .spswiper-slide-active'
				);
				// The lightbox anchor's own click (also the one forwarded
				// below) is Fancybox's. The store's handler sits on the
				// document, after Fancybox's; this one sits on the gallery,
				// before Fancybox's on the body, and `.wcgs-slider-image.video`
				// matches inside the anchor, so a prevented click there would
				// make Fancybox bail.
				if ( event.target.closest( 'a[data-fancybox]' ) ) {
					if ( activeSlide && event.isTrusted ) {
						stopVideos( activeSlide );
					}
					return;
				}
				event.preventDefault();
				if ( event.target.closest( '.wcgs-iframe-wrapper' ) ) {
					return;
				}
				const link = activeSlide?.querySelector( 'a' );
				if ( link ) {
					link.click();
					stopVideos( activeSlide );
				}
			}
		);
	};

	// ------------------------------------------------------------------
	// Videos: the YouTube IFrame API, video.js for self-hosted files, the
	// slide-change handling, and plain embeds as the fallback.
	// ------------------------------------------------------------------
	const activateIframePlaceholder = ( placeholder, autoplay ) => {
		const iframe = doc.createElement( 'iframe' );
		iframe.className = placeholder.className;
		let src = placeholder.dataset.src || '';
		if ( autoplay && src ) {
			src += `${ src.includes( '?' ) ? '&' : '?' }autoplay=1&mute=1`;
		}
		iframe.src = src;
		iframe.width = placeholder.dataset.width || '100%';
		iframe.height = placeholder.dataset.height || '100%';
		iframe.title = placeholder.dataset.title || '';
		iframe.frameBorder = placeholder.dataset.frameborder || '0';
		iframe.allow = placeholder.dataset.allow || 'autoplay; fullscreen';
		iframe.allowFullscreen = true;
		placeholder.replaceWith( iframe );
	};

	const activateYouTubePlaceholder = ( placeholder, autoplay ) => {
		const id = placeholder.dataset.videoId;
		if ( ! id ) {
			return;
		}
		const iframe = doc.createElement( 'iframe' );
		iframe.className = 'skip-lazy wcgs-iframe wcgs-youtube-video';
		iframe.title = hostVideoTitle( 'YouTube' );
		iframe.width = '600';
		iframe.height = '400';
		iframe.frameBorder = '0';
		iframe.allow = 'autoplay; fullscreen';
		iframe.allowFullscreen = true;
		iframe.src = `https://www.youtube.com/embed/${ id }?controls=1${
			autoplay ? '&autoplay=1&mute=1' : ''
		}`;
		placeholder.replaceWith( iframe );
	};

	const hasYouTubeAPI = () =>
		'object' === typeof win.YT && 'function' === typeof win.YT.Player;

	const getYouTubePlayerVars = () => ( {
		controls: 1,
		modestbranding: 1,
		showinfo: 0,
		rel: 0,
		fs: 1,
	} );

	const initializeYouTubeAPI = () => {
		if ( ! doc.getElementById( 'youtube-api' ) ) {
			const tag = doc.createElement( 'script' );
			tag.src = 'https://www.youtube.com/iframe_api';
			tag.id = 'youtube-api';
			doc.head.appendChild( tag );
		}
	};

	// $(el).fadeOut() / fadeIn() of the play icon.
	const fadeOut = ( element ) => {
		if ( ! element ) {
			return;
		}
		element.style.transition = 'opacity 400ms';
		element.style.opacity = 0;
		later( () => {
			element.style.display = 'none';
		}, 400 );
	};
	const fadeIn = ( element ) => {
		if ( ! element ) {
			return;
		}
		element.style.display = '';
		element.style.transition = 'opacity 400ms';
		element.style.opacity = 1;
	};

	// Without the YouTube API (or for the other providers' lazy
	// placeholders) the preview plays a plain embed.
	const activatePlainEmbed = ( videoWrapper ) => {
		const youtube = videoWrapper.querySelector( 'div.wcgs-youtube-video' );
		const placeholder = videoWrapper.querySelector( 'div.wcgs-iframe' );
		if ( youtube ) {
			activateYouTubePlaceholder( youtube, true );
		} else if ( placeholder ) {
			activateIframePlaceholder( placeholder, true );
		}
	};

	// Inline videos play on a click of their play icon.
	const initializeVideos = () => {
		if ( state.videoOnlyPopup ) {
			return;
		}
		let youtubeIndex = 0;
		find(
			'.wcgs-carousel .wcgs-slider-image .wcgs-video-icon-wrapper'
		).forEach( ( iconWrapper ) => {
			const videoWrapper = iconWrapper.closest( '.wcgs-iframe-wrapper' );
			if ( ! videoWrapper ) {
				return;
			}
			const image = videoWrapper.querySelector( 'img' );
			if ( image ) {
				image.style.visibility = 'visible';
			}
			const play = ( event ) => {
				event.preventDefault();
				const videoElement = videoWrapper.querySelector(
					'.wcgs-youtube-video'
				);
				if ( image ) {
					image.style.visibility = 'hidden';
				}
				if ( videoElement && hasYouTubeAPI() ) {
					const videoId = videoElement.dataset.videoId;
					videoElement.classList.add( 'initialized' );
					videoElement.setAttribute( 'data-unique-id', youtubeIndex );
					const uniqueId =
						videoElement.getAttribute( 'data-unique-id' );
					youtubeIndex++;
					const player = new win.YT.Player( videoElement, {
						videoId,
						playerVars: getYouTubePlayerVars(),
						events: {
							onReady: ( ready ) => {
								ready.target.playVideo();
								fadeOut( iconWrapper );
							},
							onStateChange: ( change ) => {
								const { PlayerState } = win.YT;
								if (
									change.data === PlayerState.ENDED ||
									change.data === PlayerState.PAUSED
								) {
									fadeIn( iconWrapper );
								}
							},
						},
					} );
					players.set( videoId + uniqueId, player );
					return;
				}
				activatePlainEmbed( videoWrapper );
				iconWrapper.remove();
				videoWrapper.querySelector( '.wcgs-touch-layer' )?.remove();
			};
			// The play icon only, as the store's script.
			iconWrapper.addEventListener( 'click', play );
		} );
	};

	// checkYouTubeAPIReady(): the API is loaded only when a YouTube slide
	// exists; the store polls it for 5 s. Past that, the preview falls back
	// to plain embeds instead of leaving the videos dead.
	const checkYouTubeAPIReady = () => {
		let done = false;
		const finish = ( interval ) => {
			done = true;
			clearInterval( interval );
			intervals.delete( interval );
		};
		const interval = setInterval( () => {
			if ( destroyed ) {
				finish( interval );
				return;
			}
			if ( first( '.wcgs-slider-image .wcgs-youtube-video' ) ) {
				initializeYouTubeAPI();
				if ( hasYouTubeAPI() ) {
					finish( interval );
					initializeVideos();
				}
			} else {
				finish( interval );
				initializeVideos();
			}
		}, 300 );
		intervals.add( interval );
		later( () => {
			if ( ! done ) {
				finish( interval );
				initializeVideos();
			}
		}, 5000 );
	};

	// handleMainSliderChange(): videos stop on the slide left, 500 ms after
	// the change.
	const stopVideosOnPreviousSlide = ( previousSlide ) => {
		const youtubeVideo = previousSlide.querySelector(
			'.wcgs-youtube-video'
		);
		if ( youtubeVideo ) {
			const player = players.get(
				youtubeVideo.dataset.videoId +
					youtubeVideo.getAttribute( 'data-unique-id' )
			);
			if ( player && 'function' === typeof player.pauseVideo ) {
				player.pauseVideo();
			}
			return;
		}
		find( 'iframe, video', previousSlide ).forEach( ( video ) => {
			if ( 'video' === video.tagName.toLowerCase() ) {
				video.pause();
			} else {
				// Reset the iframe source to stop the video.
				const { src } = video;
				video.src = src;
			}
		} );
	};

	const stopBunnyVideo = ( slide ) => {
		const iframe = slide.querySelector( 'iframe.wcgs-bunny-iframe' );
		if ( ! iframe ) {
			return;
		}
		if ( ! iframe.dataset.originalSrc ) {
			iframe.dataset.originalSrc = iframe.src;
		}
		try {
			const url = new URL( iframe.dataset.originalSrc );
			url.searchParams.set( 'autoplay', 'false' );
			url.searchParams.set( 'mute', 'true' );
			iframe.src = url.toString();
		} catch ( error ) {
			// Not an absolute URL; nothing to rewrite.
		}
	};

	const handleMainSliderChange = () => {
		// Both cleanups run at event time, before the deferred work.
		sweepOrphanedZoomOverlays();
		clearGallerySelection();
		later( () => {
			if (
				! mainSwiper ||
				! Number.isInteger( mainSwiper.activeIndex )
			) {
				return;
			}
			const slides = find( '.wcgs-carousel .spswiper-slide' );
			const currentIndex = mainSwiper.activeIndex;
			const previousIndex = mainSwiper.previousIndex
				? mainSwiper.previousIndex
				: currentIndex - 1;
			const previousSlide = slides[ previousIndex ];
			if ( previousSlide ) {
				stopVideosOnPreviousSlide( previousSlide );
				stopBunnyVideo( previousSlide );
			}
		}, 500 );
	};

	// checkVideoJSAPIReady() / initializeSelfHostedVideos(): video.js and
	// its stylesheet load when a self-hosted video exists.
	const initializeSelfHostedVideos = () => {
		const selfHostedVideos = find( '.wcgs-carousel .video-js' );
		if ( ! selfHostedVideos.length || 'function' !== typeof win.videojs ) {
			return;
		}
		selfHostedVideos.forEach( ( element ) => {
			try {
				win.videojs( element );
			} catch ( error ) {
				// An element video.js refuses stays a plain <video>.
			}
		} );
	};

	const checkVideoJSAPIReady = () => {
		if ( ! find( '.wcgs-carousel .video-js' ).length ) {
			return;
		}
		const ready = () => {
			if ( ! destroyed ) {
				initializeSelfHostedVideos();
			}
		};
		if ( 'function' === typeof win.videojs ) {
			ready();
			return;
		}
		const src = scriptSrc( 'wcgs-videojs-js', 'video.min.js' );
		if ( ! src ) {
			return;
		}
		// Speed Optimization: the video.js stylesheet unless saved off
		// (isStylesheetEnabled() of the store's script).
		if ( publicUrl && isStylesheetEnabled( 'enqueue_video_css' ) ) {
			loadStylesheet(
				`${ publicUrl }css/video.min.css`,
				'wcgs-videojs-css',
				doc
			);
		}
		loadScript( src, 'wcgs-videojs-js', doc )
			.then( ready )
			.catch( () => {} );
	};

	// Whether the store's script loads a library's stylesheet (on unless saved off).
	const isStylesheetEnabled = ( key ) => {
		const value = settings[ key ];
		return (
			undefined === value ||
			null === value ||
			! [ false, '', '0', 0 ].includes( value )
		);
	};

	// The video icon element of addVideoIcons(), by the item's video type.
	const createVideoIcon = ( videoType ) => {
		const type = settings.video_icon ?? 'play-01';
		const icon = doc.createElement( 'i' );
		const native = {
			vimeo: 'sp-wgsp-icon-vimeo',
			facebook: 'sp-wgsp-icon-facebook-circled',
			youtube: 'sp-wgsp-icon-youtube-play',
			dailymotion: 'sp-wgsp-icon-dailymotion',
			html5video: 'sp-wgsp-icon-play-01',
		};
		icon.className = `wcgs-video-icon ${
			'native' === type && native[ videoType ]
				? native[ videoType ]
				: `sp-wgsp-icon-${ 'native' === type ? 'play-01' : type }`
		}`;
		return icon;
	};

	// Thumbnails of video items get the icon the slides already carry.
	const addThumbVideoIcons = () => {
		find( '.wcgs-thumb' ).forEach( ( thumb ) => {
			const videoType = thumb.querySelector( 'img' )?.dataset.type;
			if ( ! videoType || thumb.querySelector( '.wcgs-video-icon' ) ) {
				return;
			}
			thumb.appendChild( createVideoIcon( videoType ) );
		} );
	};

	const addVideoIcons = () => {
		addThumbVideoIcons();
		// video.js big play buttons get the icon 1500 ms later.
		later( () => {
			find( '.wcgs-slider-image' ).forEach( ( slide ) => {
				if ( ! slide.querySelector( '.wcgs-video-self-hosted' ) ) {
					return;
				}
				const button = slide.querySelector( '.vjs-big-play-button' );
				if ( ! button ) {
					return;
				}
				button.classList.add( state.videoIconPosition );
				if ( ! button.querySelector( '.wcgs-video-icon' ) ) {
					button.appendChild(
						createVideoIcon(
							slide.querySelector( 'img' )?.dataset.type
						)
					);
				}
			} );
		}, 1500 );
	};

	// initializeVideoFeatures().
	const initializeVideoFeatures = () => {
		checkVideoJSAPIReady();
		if ( '1' === settings.lightbox ) {
			setupVideoPopup();
		}
		addVideoIcons();
		setupVideoPlayIcon();
	};

	// ------------------------------------------------------------------
	// Zoom: checkZoomAPIReady() / setupZoomEffect() with the store's xZoom
	// jQuery plugin, and the orphan-overlay sweep.
	// ------------------------------------------------------------------

	// The hover zoom runs on small screens (below 480px) only with "Zoom on
	// Mobile" (isZoomEnabled()).
	const isZoomEnabled = () =>
		'1' === settings.zoom &&
		( '1' === settings.mobile_zoom || frameWidth() >= 480 );

	// The inside zoom (both zoom types) at the default zoom level.
	const setupZoomEffect = () => {
		const $ = win.jQuery;
		if ( ! $ || ! carousel() || 'function' !== typeof $.fn.wcgs_xzoom ) {
			return;
		}
		// 1.5x for 'in_side', 2x for 'zoom_2x'.
		const level = 'zoom_2x' === settings.zoom_type ? 2 : 1.5;
		find( '.wcgs_xzoom' ).forEach( ( element ) => {
			const $image = $( element );
			if ( ! $image.data( 'wcgsZoomLevel' ) ) {
				$image.data( 'wcgsZoomLevel', true );
				const full = new win.Image();
				full.src = element.getAttribute( 'xoriginal' ) || '';
				// Bound before xZoom's own mouseenter (which opens the zoom), so it runs first.
				$image.on( 'mouseenter.wcgsZoomLevel', () => {
					const zoom = $image.data( 'wcgs_xzoom' );
					if ( zoom && zoom.options ) {
						zoom.options.defaultScale = zoomScale(
							full.naturalWidth,
							$image.width(),
							level
						);
					}
				} );
			}
			$( element ).wcgs_xzoom( {
				position: 'inside',
				defaultScale: 0,
				lensCollision: true,
				smoothZoomMove: 12,
				rootOutput: false,
			} );
			const instance = $( element ).data( 'wcgs_xzoom' );
			if ( instance ) {
				zoomInstances.push( instance );
			}
		} );
	};

	const checkZoomAPIReady = () => {
		const $ = win.jQuery;
		if ( ! $ ) {
			return;
		}
		// The store waits 100 ms, then polls every 300 ms.
		const ready = () => later( setupZoomEffect, 100 );
		if ( 'function' === typeof $.fn.wcgs_xzoom ) {
			ready();
			return;
		}
		const src = scriptSrc( 'wcgs-xzoom-js', 'zoom.min.js' );
		if ( ! src ) {
			return;
		}
		loadScript( src, 'wcgs-xzoom-js', doc )
			.then( () => {
				if ( ! destroyed ) {
					ready();
				}
			} )
			.catch( () => {} );
	};

	// Zoom overlays orphaned on non-active slides: loopFix can move a slide
	// mid-hover, swallowing the mouseleave that closes its overlay.
	const sweepOrphanedZoomOverlays = () => {
		if ( '1' !== settings.zoom ) {
			return;
		}
		const orphanSelector =
			'.wcgs_xzoom-source, .wcgs_xzoom-preview, .zoom-tint, [class*="xzoom-caption"]';
		find( '.wcgs-carousel .spswiper-slide' ).forEach( ( slide ) => {
			if ( slide.classList.contains( 'spswiper-slide-active' ) ) {
				return;
			}
			if ( ! slide.querySelector( orphanSelector ) ) {
				return;
			}
			const image = slide.querySelector( 'img.wcgs_xzoom' );
			const zoomInstance =
				image && win.jQuery
					? win.jQuery( image ).data( 'wcgs_xzoom' )
					: null;
			if (
				zoomInstance &&
				'function' === typeof zoomInstance.closezoom
			) {
				zoomInstance.closezoom();
			}
			find( orphanSelector, slide ).forEach( ( orphan ) =>
				orphan.remove()
			);
		} );
	};

	// Double-clicks on the arrows can extend a text selection across slides.
	const clearGallerySelection = () => {
		const view = gallery.ownerDocument.defaultView;
		const selection = view?.getSelection ? view.getSelection() : null;
		if ( selection && ! selection.isCollapsed ) {
			selection.removeAllRanges();
		}
	};

	// The xZoom instances, closed and destroyed.
	const removeZoomRemnants = () => {
		const $ = win.jQuery;
		zoomInstances.forEach( ( instance ) => {
			try {
				instance.closezoom();
				instance.destroy();
				// destroy() leaves the window resize handler bound, which
				// would pin the image back to its old size.
				$?.( win ).off( 'resize', instance.adaptive );
			} catch ( error ) {
				// A half-torn-down instance goes with the subtree.
			}
		} );
		zoomInstances.length = 0;
	};

	/**
	 * Tear down the xZoom instances and set them up again on the same images.
	 * xZoom measures an image once, on init, and pins that width and height
	 * on it (adaptive), so a frame resize (a device switch, the panel
	 * collapse) needs fresh instances: the inline size is cleared first so
	 * the image is measured at its new size.
	 */
	const rebuildZoom = () => {
		const $ = win.jQuery;
		if ( ! zoomInstances.length || ! $ ) {
			return;
		}
		removeZoomRemnants();
		// The inside zoom's overlays sit next to the image.
		find(
			'.wcgs_xzoom-source, .wcgs_xzoom-preview, .wcgs_xzoom-lens, .zoom-tint, [class*="xzoom-caption"]'
		).forEach( ( element ) => element.remove() );
		find( '.wcgs_xzoom' ).forEach( ( element ) => {
			// destroy() unbinds every mouseenter, the zoom level's too, so
			// setupZoomEffect() binds it again.
			$( element )
				.removeData( 'wcgs_xzoom' )
				.removeData( 'wcgsZoomLevel' );
			element.style.width = '';
			element.style.height = '';
		} );
		setupZoomEffect();
	};

	const addGrayscale = () => {
		if ( 'gray_off' === settings.grayscale || ! settings.grayscale ) {
			return;
		}
		find( '.wcgs-slider-image img' ).forEach( ( img ) =>
			img.classList.add( settings.grayscale )
		);
	};

	// ------------------------------------------------------------------
	// Boot.
	// ------------------------------------------------------------------
	const removePreloader = () => {
		const preloader = first( '.wcgs-gallery-preloader' );
		if ( ! preloader ) {
			return;
		}
		// Held until the slider drops wcgs-spswiper-before-init, so the
		// preload style lasts as long as the loading; 10 s at most.
		const startedAt = Date.now();
		const check = () => {
			if (
				gallery.classList.contains( 'wcgs-spswiper-before-init' ) &&
				Date.now() - startedAt < 10000
			) {
				later( check, 100 );
				return;
			}
			preloader.style.transition = 'opacity 300ms';
			preloader.style.opacity = 0;
			find(
				'.wcgs-carousel, .gallery-navigation-carousel-wrapper'
			).forEach( ( element ) => {
				element.style.visibility = 'visible';
			} );
			later( () => {
				preloader.style.zIndex = -99;
			}, 300 );
		};
		later( check, 100 );
	};

	const whenImagesLoaded = ( callback ) => {
		// wpgspimagesLoaded(): waits on the first image only.
		const img = first( '.wcgs-carousel img[src]' );
		if ( ! img || img.complete ) {
			callback();
			return;
		}
		let done = false;
		const finish = () => {
			if ( ! done && ! destroyed ) {
				done = true;
				callback();
			}
		};
		img.addEventListener( 'load', finish );
		img.addEventListener( 'error', finish );
		later( finish, 3000 );
	};

	const initializeComponents = () => {
		whenSPSwiperReady();
		if ( isZoomEnabled() ) {
			checkZoomAPIReady();
		}
		initializeLightbox();
		initializeVideoFeatures();
		addGrayscale();
	};

	const refreshLayout = () => {
		state.isMobileDevice = frameWidth() < 768;
		setGalleryWidth( calculateGalleryWidth() );
		calculateGalleryHeights();
		thumbSwiper?.update();
		mainSwiper?.update();
		setThumbnailBorderPosition();
		rebuildZoom();
	};

	const start = () => {
		if ( ! gallery ) {
			return;
		}
		gallery.classList.add( 'wcgs-visible' );
		setupInitialState();
		setGalleryWidth( calculateGalleryWidth() );
		whenImagesLoaded( () => {
			calculateGalleryHeights();
			initializeComponents();
		} );
		if ( ! state.videoOnlyPopup ) {
			checkYouTubeAPIReady();
		}
		if ( state.isPreloader ) {
			removePreloader();
		}
		// The panel collapse and the device animation resize the frame; the
		// store reloads the page then (handleResize()), the preview re-lays
		// out instead.
		if ( 'undefined' !== typeof win.ResizeObserver ) {
			const root = doc.documentElement;
			let width = root.clientWidth;
			let timer;
			const observer = new win.ResizeObserver( () => {
				if ( destroyed || root.clientWidth === width ) {
					return;
				}
				width = root.clientWidth;
				clearTimeout( timer );
				timer = setTimeout( () => {
					if ( ! destroyed ) {
						refreshLayout();
					}
				}, 150 );
				timers.add( timer );
			} );
			observer.observe( root );
			observers.push( observer );
		}
	};

	// The thumbs module's tap handler (onThumbClick), which the module binds
	// only in its own init(): a thumb click moves the main slider.
	const onThumbTap = () => {
		const thumbs = mainSwiper?.thumbs?.spswiper;
		if ( ! thumbs || thumbs.destroyed ) {
			return;
		}
		const { clickedIndex, clickedSlide } = thumbs;
		if (
			clickedSlide?.classList.contains( 'spswiper-slide-thumb-active' ) ||
			null === clickedIndex ||
			undefined === clickedIndex
		) {
			return;
		}
		const index = thumbs.params.loop
			? parseInt(
					clickedSlide.getAttribute( 'data-spswiper-slide-index' ),
					10
			  )
			: clickedIndex;
		if ( mainSwiper.params.loop ) {
			mainSwiper.slideToLoop( index );
		} else {
			mainSwiper.slideTo( index );
		}
	};

	// Point the running main slider at a new thumbnail slider: what the
	// thumbs module's init() does, which runs once per main slider, plus
	// the navigation arrows when the main slider's live in the thumbnails.
	const relinkThumbnails = () => {
		if ( ! mainSwiper || ! thumbSwiper ) {
			return;
		}
		Object.assign( thumbSwiper.params, {
			watchSlidesProgress: true,
			slideToClickedSlide: false,
		} );
		thumbSwiper.update();
		thumbSwiper.el.classList.add( 'spswiper-thumbs' );
		thumbSwiper.on( 'tap', onThumbTap );
		mainSwiper.thumbs.spswiper = thumbSwiper;
		mainSwiper.thumbs.update( true );
		if (
			'1' !== settings.navigation &&
			'1' === settings.thumbnailnavigation &&
			mainSwiper.navigation &&
			mainSwiper.params.navigation
		) {
			const navigation = getNavigationSettings();
			mainSwiper.navigation.destroy();
			Object.assign( mainSwiper.params.navigation, navigation );
			mainSwiper.navigation.init();
			mainSwiper.navigation.update();
		}
	};

	// The engine's copy of the settings takes a group's new values.
	const takeSettings = ( keys, next ) =>
		keys.forEach( ( key ) => {
			settings[ key ] = next[ key ];
		} );

	/**
	 * The component swapped the thumbnail subtree for an edit of the
	 * thumbnails: drop the slider of the old one, build one on the new, and
	 * link it to the main slider, which keeps running. The engine's copy of
	 * the settings takes the new thumbnail values; everything else is in the
	 * main key or another restart group, so it is unchanged.
	 *
	 * @param {Object} next The new effective settings.
	 */
	const restartThumbnails = ( next ) => {
		if ( destroyed || ! gallery ) {
			return;
		}
		takeSettings( THUMB_BEHAVIOR_KEYS, next );
		if ( mainSwiper?.thumbs ) {
			mainSwiper.thumbs.spswiper = null;
		}
		try {
			thumbSwiper?.destroy( true, true );
		} catch ( error ) {
			// The old subtree is gone already.
		}
		thumbSwiper = null;
		addThumbVideoIcons();
		// The slider gallery has not initialized yet (assets or the first
		// image pending): initializeSliderGallery() takes the thumbnails as
		// they are when it runs.
		if ( ! mainSwiper ) {
			return;
		}
		initializeThumbnailSlider();
		relinkThumbnails();
		bindThumbnailArrows();
		refreshLayout();
	};

	/**
	 * A carousel setting changed: rebuild both sliders on the same slides
	 * with the new configs, at the slide shown. Zoom, lightbox and videos
	 * live on the slides and stay; only the sliders' hover handlers are
	 * bound again. Before the sliders are up the new values are simply
	 * taken: initializeSliderGallery() reads them when it runs.
	 *
	 * @param {Object} next The new effective settings.
	 */
	const restartCarousel = ( next ) => {
		if ( destroyed || ! gallery ) {
			return;
		}
		takeSettings( CAROUSEL_KEYS, next );
		if ( ! mainSwiper ) {
			return;
		}
		const index = mainSwiper.params.loop
			? mainSwiper.realIndex
			: mainSwiper.activeIndex;
		sliderListeners.forEach( ( [ element, type, handler ] ) =>
			element.removeEventListener( type, handler )
		);
		sliderListeners.length = 0;
		find(
			'.wcgs-carousel .spswiper-pagination, .wcgs-carousel .wcgs-spswiper-arrow'
		).forEach( ( element ) => {
			element.style.display = '';
		} );
		// destroy() cleans the slides' and the wrapper's styles, which are
		// the slider's, and the containers', which also hold the engine's
		// sizes and the preloader's visibility: keep those.
		const containers = [ mainSwiper.el, thumbSwiper?.el ].filter( Boolean );
		const containerStyles = containers.map( ( element ) =>
			element.getAttribute( 'style' )
		);
		try {
			thumbSwiper?.destroy( true, true );
			mainSwiper.destroy( true, true );
		} catch ( error ) {
			// A half-destroyed slider is rebuilt below all the same.
		}
		containers.forEach( ( element, i ) => {
			if ( null !== containerStyles[ i ] ) {
				element.setAttribute( 'style', containerStyles[ i ] );
			}
		} );
		mainSwiper = null;
		thumbSwiper = null;
		thumbLineBound = false;
		initializeThumbnailSlider();
		initializeMainSlider();
		if ( mainSwiper && index > 0 ) {
			if ( mainSwiper.params.loop ) {
				mainSwiper.slideToLoop( index, 0, false );
			} else {
				mainSwiper.slideTo( index, 0, false );
			}
			// An API slide counts as interaction: autoplay stops on it.
			if ( '1' === settings.autoplay ) {
				mainSwiper.autoplay?.start();
			}
		}
		navigationArrowsVisibility();
		handleAutoplayEvents();
		refreshLayout();
	};

	/**
	 * A lightbox setting changed: re-bind Fancybox with the new options and
	 * restyle the slider's lightbox button. The anchors stay; React updates
	 * their icon classes. An open lightbox closes, as it does on a remount.
	 *
	 * @param {Object} next The new effective settings.
	 */
	const restartLightbox = ( next ) => {
		if ( destroyed || ! gallery ) {
			return;
		}
		takeSettings( LIGHTBOX_KEYS, next );
		readLightboxIcon();
		const button = carousel()?.querySelector( ':scope > .wcgs-lightbox' );
		if ( button ) {
			button.className = `wcgs-lightbox grid-lightbox ${ state.iconPosition }`;
			const icon = button.querySelector( 'span' );
			if ( icon ) {
				icon.className = `sp-wgsp-icon-${ state.lightboxIcon }`;
			}
		}
		// Not bound yet: initializeLightbox() reads the new values when it runs.
		if ( ! lightboxBound || 'undefined' === typeof win.Fancybox ) {
			return;
		}
		win.Fancybox.close( true );
		videoPopupOpened = false;
		win.Fancybox.unbind( doc.body, '[data-fancybox]' );
		lightboxBound = false;
		initializeLightbox();
	};

	const restarts = {
		thumbnails: restartThumbnails,
		carousel: restartCarousel,
		lightbox: restartLightbox,
	};

	/**
	 * Re-run one script on the mounted gallery for an edit of its settings.
	 *
	 * @param {string} group A RESTART_GROUPS key.
	 * @param {Object} next  The new effective settings.
	 */
	const restart = ( group, next ) => restarts[ group ]?.( next );

	const destroy = () => {
		destroyed = true;
		timers.forEach( clearTimeout );
		timers.clear();
		intervals.forEach( clearInterval );
		intervals.clear();
		observers.forEach( ( observer ) => observer.disconnect() );
		galleryListeners.forEach( ( listener ) =>
			gallery?.removeEventListener( 'click', listener )
		);
		galleryListeners.length = 0;
		players.forEach( ( player ) => {
			try {
				player.destroy();
			} catch ( error ) {
				// The player's iframe goes with the subtree.
			}
		} );
		players.clear();
		if ( 'function' === typeof win.videojs?.getPlayer ) {
			find( '.wcgs-carousel .video-js' ).forEach( ( element ) => {
				try {
					win.videojs.getPlayer( element )?.dispose();
				} catch ( error ) {
					// Not a player element.
				}
			} );
		}
		removeZoomRemnants();
		// An open video popup would outlive the gallery it came from.
		if ( videoPopupOpened && 'undefined' !== typeof win.Fancybox ) {
			win.Fancybox.close( true );
			videoPopupOpened = false;
		}
		if ( lightboxBound && 'undefined' !== typeof win.Fancybox ) {
			// The anchors go with the subtree; an open lightbox would show
			// slides of a gallery that no longer exists.
			win.Fancybox.close( true );
			win.Fancybox.unbind( doc.body, '[data-fancybox]' );
			lightboxBound = false;
		}
		try {
			mainSwiper?.destroy( true, true );
			thumbSwiper?.destroy( true, true );
		} catch ( error ) {
			// The subtree is unmounted next; a half-destroyed swiper goes with it.
		}
		mainSwiper = null;
		thumbSwiper = null;
	};

	return { start, destroy, restart };
};

export default createGalleryEngine;
