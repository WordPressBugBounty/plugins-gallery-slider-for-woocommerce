/**
 * The gallery markup, as React.
 *
 * A port of WCGS_Product_Gallery::render_gallery_container() and the methods
 * it calls (public/partials/product-images.php): same elements, classes and
 * attributes, so the frontend CSS and the gallery script treat it exactly as
 * the product page. Keep it in step with the PHP template; when the markup
 * changes there, change it here and in the script's own renderer
 * (generateGalleryItemHTML() and friends in woo-gallery-slider-public.js).
 *
 * Mounted by Product/GalleryMount (and rendered to a string for the remount
 * key in engine/index.jsx). It carries the template's own attributes
 * (thumbsslider, xoriginal, allowfullscreen on the lazy video placeholders)
 * as they are; React passes the unknown ones through as plain attributes.
 */
/* eslint-disable react/no-unknown-property */
import { __, sprintf } from '@wordpress/i18n';

import { isEmpty } from './settings';
import { truthy } from './items';

/**
 * Accessible title of a video iframe, e.g. "Vimeo video" (as the store's
 * `video_title()` in product-images.php).
 *
 * @param {string} host Video host name, shown as is.
 * @return {string} The translated title.
 */
const videoTitle = ( host ) =>
	/* translators: %s: video host name, e.g. Vimeo. */
	sprintf( __( '%s video', 'gallery-slider-for-woocommerce' ), host );

const SIZES = '(max-width: 520px) 400px, (max-width: 768px) 600px, 600px';

export const LIGHTBOX_ICONS = {
	'search-plus': 'zoom-in-1',
};

/**
 * Host of a URL (wp_parse_url()['host']): '' when it has none, e.g. a
 * scheme-less URL, which the template renders as a self-hosted video.
 *
 * @param {string} url URL.
 * @return {string} Host.
 */
const hostOf = ( url ) => {
	try {
		return new URL( url ).host;
	} catch ( error ) {
		return /^\/\//.test( url ) ? url.slice( 2 ).split( '/' )[ 0 ] : '';
	}
};

/**
 * Path of a URL (parse_url( $url, PHP_URL_PATH )).
 *
 * @param {string} url URL.
 * @return {string} Path.
 */
const pathOf = ( url ) => {
	try {
		return new URL( url ).pathname;
	} catch ( error ) {
		return '';
	}
};

/**
 * get_youtube_video_id().
 *
 * @param {string} video Video URL.
 * @return {string} Video ID.
 */
const youtubeId = ( video ) => {
	const url = video.replace( 'shorts/', 'watch?v=' );
	if ( url.includes( 'youtu.be' ) ) {
		return pathOf( url ).split( '/' ).pop();
	}
	try {
		return new URL( url ).searchParams.get( 'v' ) || '';
	} catch ( error ) {
		return '';
	}
};

/**
 * generateDailymotionEmbedURL().
 *
 * @param {string} url Video URL.
 * @return {string|boolean} Embed URL, or false.
 */
const dailymotionEmbed = ( url ) => {
	const match = url.match(
		/(?:dailymotion\.com\/video\/|player\.html\?video=|embed\/video\/)([a-zA-Z0-9]+)/
	);
	return match
		? `https://www.dailymotion.com/embed/video/${ match[ 1 ] }`
		: false;
};

/**
 * Only the attributes with a value (build_attributes_string() skips empty ones).
 *
 * @param {Object} attributes Attributes.
 * @return {Object} Non-empty attributes.
 */
const nonEmpty = ( attributes ) =>
	Object.fromEntries(
		Object.entries( attributes ).filter(
			( [ , value ] ) => ! isEmpty( value )
		)
	);

/**
 * The template's view of the settings and items.
 *
 * @param {Object} model Result of buildGalleryModel().
 * @return {Object} Helpers.
 */
export const templateHelpers = ( model ) => {
	const { settings } = model;
	return {
		settings,
		// get_gallery_layout_class().
		layoutClass: [ 'vertical', 'vertical_right' ].includes(
			settings.gallery_layout ?? 'horizontal'
		)
			? 'vertical'
			: 'horizontal',
		lazyAttribute: model.imageLazyLoad ? 'lazy' : undefined,
		lightboxIcon:
			LIGHTBOX_ICONS[ settings.lightbox_icon ?? 'search' ] ??
			settings.lightbox_icon ??
			'search',
	};
};

/**
 * Thumbnail data attributes of a video item (add_video_attributes()).
 *
 * @param {Object} item Item.
 * @return {Object} Attributes.
 */
const videoThumbAttributes = ( item ) => {
	const host = hostOf( item.video );
	const attributes = { 'data-videosrc': item.video };
	if ( host.includes( 'youtu' ) ) {
		attributes[ 'data-type' ] = 'youtube';
		attributes[ 'data-videoid' ] = youtubeId( item.video );
	} else if ( host.includes( 'vimeo' ) ) {
		attributes[ 'data-type' ] = 'vimeo';
		attributes[ 'data-videoid' ] = pathOf( item.video ).slice( 1 );
	} else if ( host.includes( 'dailymotion' ) ) {
		attributes[ 'data-type' ] = 'dailymotion';
	} else if ( host.includes( 'facebook' ) ) {
		attributes[ 'data-type' ] = 'facebook';
	} else if ( host.includes( 'mediadelivery' ) ) {
		attributes[ 'data-type' ] = 'iframe';
	} else {
		attributes[ 'data-type' ] = 'html5video';
		attributes[ 'data-videomp4' ] = item.video;
		attributes[ 'data-description' ] = 'Html5 Video Description';
	}
	return attributes;
};

/**
 * render_thumbnail().
 *
 * @param {Object} props
 * @param {Object} props.item Item.
 * @param {Object} props.tpl  Template helpers.
 */
const Thumbnail = ( { item, tpl } ) => (
	<div className="wcgs-thumb spswiper-slide">
		{ /* eslint-disable-next-line jsx-a11y/alt-text -- alt comes through nonEmpty(), as build_attributes_string() prints it. */ }
		<img
			{ ...nonEmpty( {
				className: 'skip-lazy wcgs-thumb-image',
				alt: item.alt_text,
				src: item.thumb_url,
				height: item.thumbHeight,
				width: item.thumbWidth,
				'data-cap': item.cap,
				'data-image': item.full_url,
				...( isEmpty( item.video )
					? {}
					: videoThumbAttributes( item ) ),
			} ) }
			loading={ tpl.lazyAttribute }
		/>
	</div>
);

/**
 * render_thumbnails() with render_thumbnail_navigation().
 *
 * @param {Object} props
 * @param {Object} props.model Gallery model.
 * @param {Object} props.tpl   Template helpers.
 */
export const Thumbnails = ( { model, tpl } ) => {
	const { settings } = tpl;
	const navStyle = isEmpty( settings.thumbnailnavigation_style )
		? 'custom'
		: settings.thumbnailnavigation_style;
	return (
		<div
			className={ `gallery-navigation-carousel-wrapper ${ tpl.layoutClass }` }
		>
			<div
				thumbsslider=""
				className={ `gallery-navigation-carousel spswiper ${
					tpl.layoutClass
				} thumbnailnavigation-${ navStyle } ${
					settings.thumb_nav_visibility ?? 'hover'
				}` }
			>
				<div className="spswiper-wrapper">
					{ model.items.map( ( item, index ) => (
						<Thumbnail key={ index } item={ item } tpl={ tpl } />
					) ) }
				</div>
				{ truthy( settings.thumbnailnavigation ) && (
					<>
						<div className="wcgs-spswiper-button-next wcgs-spswiper-arrow sp-wgsp-icon-right-open-3"></div>
						<div className="wcgs-spswiper-button-prev wcgs-spswiper-arrow sp-wgsp-icon-left-open-4"></div>
					</>
				) }
			</div>
			<div className="wcgs-border-bottom"></div>
		</div>
	);
};

/**
 * maybe_render_caption().
 *
 * @param {Object} props
 * @param {Object} props.item Item.
 * @param {Object} props.tpl  Template helpers.
 */
const Caption = ( { item, tpl } ) =>
	! isEmpty( item.cap ) && truthy( tpl.settings.show_caption ) ? (
		<div className="wcgs-slider-image-caption">
			<span>{ item.cap }</span>
		</div>
	) : null;

/**
 * get_image_srcset(): the attachment srcset of the Product Image Size.
 *
 * @param {Object} item Item.
 * @return {string} Srcset.
 */
const srcsetOf = ( item ) => item.srcset ?? '';

/**
 * render_image_item().
 *
 * @param {Object} props
 * @param {Object} props.item  Item.
 * @param {number} props.index Position.
 * @param {Object} props.tpl   Template helpers.
 */
const ImageItem = ( { item, index, tpl } ) => (
	<div className="wcgs-slider-image">
		{ truthy( tpl.settings.lightbox ) && (
			<ImageLightbox item={ item } tpl={ tpl } />
		) }
		<img
			className="skip-lazy wcgs-slider-image-tag wcgs_xzoom wcgs-lazyloaded"
			alt={ item.alt_text }
			data-cap={ item.cap }
			src={ item.url }
			data-image={ item.full_url }
			xoriginal={ item.full_url }
			height={ item.imageHeight }
			width={ item.imageWidth }
			srcSet={ srcsetOf( item ) }
			fetchpriority={ 0 === index ? 'high' : undefined }
			loading={ tpl.lazyAttribute }
			sizes={ SIZES }
		/>
		<Caption item={ item } tpl={ tpl } />
	</div>
);

/**
 * render_image_lightbox(): the lightbox anchor of an image (also of a video
 * card's image).
 *
 * @param {Object} props
 * @param {Object} props.item Item.
 * @param {Object} props.tpl  Template helpers.
 */
const ImageLightbox = ( { item, tpl } ) => (
	<a
		className="wcgs-slider-lightbox"
		aria-label={ __( 'Open lightbox', 'gallery-slider-for-woocommerce' ) }
		data-caption={ item.cap }
		data-fancybox="view"
		href={ item.full_url }
		data-thumb={ item.thumb_url ?? item.url }
	>
		<div
			className={ `wcgs-lightbox grid-lightbox ${
				tpl.settings.lightbox_icon_position ?? 'top_right'
			}` }
			data-caption={ item.cap }
		>
			<span className={ `sp-wgsp-icon-${ tpl.lightboxIcon }` }></span>
		</div>
	</a>
);

/**
 * render_video_lightbox(): the lightbox anchor of a video card, which opens
 * the video.
 *
 * @param {Object} props
 * @param {Object} props.item Item.
 * @param {string} props.host Video host.
 * @param {Object} props.tpl  Template helpers.
 */
const VideoLightbox = ( { item, host, tpl } ) => {
	const popup = videoPopupAttributes( item, host );
	return (
		<a
			className="wcgs-slider-lightbox"
			aria-label={ __(
				'Open lightbox',
				'gallery-slider-for-woocommerce'
			) }
			data-caption={ item.cap }
			data-fancybox="view"
			href={ popup[ 'data-video-popup' ] }
			data-thumb={ item.thumb_url ?? item.url }
			data-type={ popup[ 'data-video-type' ] || undefined }
		>
			<div
				className={ `wcgs-lightbox grid-lightbox ${
					tpl.settings.lightbox_icon_position ?? 'top_right'
				}` }
				data-caption={ item.cap }
			>
				<span className={ `sp-wgsp-icon-${ tpl.lightboxIcon }` }></span>
			</div>
		</a>
	);
};

/**
 * The popup attributes of a video card: get_video_embed_link() and
 * get_video_popup_type().
 *
 * @param {Object} item Item.
 * @param {string} host Video host.
 * @return {Object} `data-video-popup` / `data-video-type` attributes.
 */
const videoPopupAttributes = ( item, host ) => {
	let link = item.video;
	if ( host.includes( 'youtu' ) ) {
		link = `https://www.youtube.com/embed/${ youtubeId( item.video ) }`;
	} else if ( host.includes( 'dailymotion' ) ) {
		link = dailymotionEmbed( item.video ) || '';
	} else if ( host.includes( 'mediadelivery' ) ) {
		link = item.video.replace( '/play/', '/embed/' );
	}
	const isIframe = [
		'facebook',
		'dailymotion',
		'wistia',
		'sproutvideo',
		'mediadelivery',
	].some( ( name ) => host.includes( name ) );
	return {
		'data-video-popup': link,
		'data-video-type': isIframe ? 'iframe' : '',
	};
};

/**
 * render_inline_video(): a placeholder the gallery script turns into the
 * player when the play icon is clicked.
 *
 * @param {Object} props
 * @param {Object} props.item Item.
 * @param {string} props.host Video host.
 * @param {Object} props.tpl  Template helpers.
 */
const InlineVideo = ( { item, host, tpl } ) => {
	const video = item.video;
	const loading = tpl.lazyAttribute;
	const frame = ( className, title, width, src, allow ) => (
		<div
			className={ className }
			data-title={ title }
			data-width={ width }
			data-height="400"
			data-frameborder="0"
			data-allow={ allow }
			data-src={ src }
			allowfullscreen=""
			loading={ loading }
		></div>
	);

	if ( host.includes( 'youtu' ) ) {
		return (
			<div
				className="skip-lazy wcgs-iframe wcgs-youtube-video"
				data-video-id={ youtubeId( video ) }
				data-src={ video }
			></div>
		);
	}
	if ( host.includes( 'vimeo' ) ) {
		const id = pathOf( video ).slice( 1 );
		// Unlisted videos: "id/hash".
		const src = id.includes( '/' )
			? `https://player.vimeo.com/video/${ id.replace(
					'/',
					'?h='
			  ) }&autoplay=0&controls=1&loop=0`
			: `https://player.vimeo.com/video/${ id }?autoplay=0&controls=1&loop=0`;
		return frame(
			'skip-lazy wcgs-iframe',
			videoTitle( 'Vimeo' ),
			'600',
			src,
			'autoplay; fullscreen'
		);
	}
	if ( host.includes( 'dailymotion' ) ) {
		return frame(
			'skip-lazy wcgs-iframe',
			videoTitle( 'Dailymotion' ),
			'560',
			`${ dailymotionEmbed( video ) || '' }?autoplay=1&mute=1`,
			'autoplay; fullscreen'
		);
	}
	if ( host.includes( 'facebook' ) ) {
		return frame(
			'skip-lazy wcgs-iframe facebook-iframe',
			videoTitle( 'Facebook' ),
			'560',
			video,
			'autoplay; fullscreen'
		);
	}
	if ( host.includes( 'wistia' ) ) {
		return frame(
			'skip-lazy wcgs-iframe wistia-iframe',
			videoTitle( 'Wistia' ),
			'560',
			video,
			'autoplay; fullscreen'
		);
	}
	if ( host.includes( 'mediadelivery' ) ) {
		return frame(
			'skip-lazy wcgs-iframe wcgs-bunny-iframe',
			videoTitle( 'Bunny Stream' ),
			'560',
			video.replace( '/play/', '/embed/' ),
			'autoplay'
		);
	}
	if ( host.includes( 'sproutvideo' ) ) {
		return frame(
			'skip-lazy wcgs-iframe sproutvideo-iframe',
			videoTitle( 'SproutVideo' ),
			'560',
			video,
			'autoplay; fullscreen'
		);
	}
	// Self-hosted video.
	return (
		<div className="wcgs-video-self-hosted">
			<video
				playsInline
				preload="auto"
				className="video-js"
				poster={ item.url }
				controls
				loading={ loading }
				data-setup="{}"
			>
				<source src={ video } type="video/mp4" />
			</video>
		</div>
	);
};

/**
 * render_video_icon(): the play icon in the middle of the image.
 *
 * @param {Object} props
 * @param {string} props.host Video host.
 * @param {Object} props.tpl  Template helpers.
 */
const VideoIcon = ( { host, tpl } ) => {
	const type = tpl.settings.video_icon ?? 'play-01';
	let icon = <i className={ `wcgs-video-icon sp-wgsp-icon-${ type }` }></i>;
	if ( 'native' === type ) {
		const native = [
			[ 'vimeo', 'sp-wgsp-icon-vimeo wcgs-video-icon' ],
			[ 'facebook', 'sp-wgsp-icon-facebook-circled wcgs-video-icon' ],
			[ 'youtu', 'sp-wgsp-icon-youtube-play wcgs-video-icon' ],
			[ 'dailymotion', 'sp-wgsp-icon-dailymotion wcgs-video-icon' ],
		].find( ( [ name ] ) => host.includes( name ) );
		icon = (
			<i
				className={
					native
						? native[ 1 ]
						: 'wcgs-video-icon sp-wgsp-icon-play-01'
				}
			></i>
		);
	}
	return <div className="wcgs-video-icon-wrapper middle">{ icon }</div>;
};

/**
 * render_video_thumbnail().
 *
 * The image never zooms (a click opens the video).
 *
 * @param {Object}  props
 * @param {Object}  props.item   Item.
 * @param {number}  props.index  Position.
 * @param {boolean} props.inline Inline player (the image stays hidden).
 * @param {Object}  props.tpl    Template helpers.
 */
const VideoThumbnail = ( { item, index, inline, tpl } ) => (
	<img
		className="skip-lazy wcgs-slider-image-tag wcgs-lazyloaded"
		alt={ item.alt_text }
		data-cap={ item.cap }
		data-videosrc={ item.video }
		data-image-src={ item.url }
		src={ item.url }
		data-image={ item.full_url }
		height={ item.imageHeight }
		width={ item.imageWidth }
		srcSet={ srcsetOf( item ) }
		loading={ tpl.lazyAttribute }
		sizes={ SIZES }
		fetchpriority={ 0 === index ? 'high' : undefined }
		style={ inline ? { visibility: 'hidden' } : undefined }
	/>
);

/**
 * render_video_item(). The lightbox anchor opens the video; the image doesn't
 * zoom. With the lightbox off the play icon opens the video from
 * `data-video-popup`.
 *
 * @param {Object} props
 * @param {Object} props.item  Item.
 * @param {number} props.index Position.
 * @param {Object} props.tpl   Template helpers.
 */
const VideoItem = ( { item, index, tpl } ) => {
	const { settings } = tpl;
	const host = hostOf( item.video );
	const isInline = 'inline' === ( settings.video_popup_place ?? 'popup' );
	const content = isInline ? (
		<>
			{ truthy( settings.lightbox ) && (
				<VideoLightbox item={ item } host={ host } tpl={ tpl } />
			) }
			<div className="wcgs-iframe-wrapper">
				<InlineVideo item={ item } host={ host } tpl={ tpl } />
				<VideoIcon host={ host } tpl={ tpl } />
				<VideoThumbnail
					item={ item }
					index={ index }
					inline
					tpl={ tpl }
				/>
				{ ! host.includes( 'facebook' ) && (
					<div className="wcgs-touch-layer"></div>
				) }
			</div>
		</>
	) : (
		<>
			{ truthy( settings.lightbox ) && (
				<VideoLightbox item={ item } host={ host } tpl={ tpl } />
			) }
			<VideoIcon host={ host } tpl={ tpl } />
			<VideoThumbnail
				item={ item }
				index={ index }
				inline={ false }
				tpl={ tpl }
			/>
		</>
	);
	return (
		<div
			className="wcgs-slider-image video"
			{ ...( ! isInline ? videoPopupAttributes( item, host ) : {} ) }
		>
			{ content }
			<Caption item={ item } tpl={ tpl } />
		</div>
	);
};

/**
 * render_main_gallery() with the items, arrows and pagination.
 *
 * @param {Object} props
 * @param {Object} props.model Gallery model.
 * @param {Object} props.tpl   Template helpers.
 */
const MainGallery = ( { model, tpl } ) => {
	const { settings } = tpl;
	// get_carousel_classes().
	const carouselClasses = [
		settings.navigation_position ?? 'center_center',
		settings.zoom_type ?? 'in_side',
		settings.slide_orientation ?? 'horizontal',
		'wcgs_xzoom_wrapper',
		'spswiper spswiper-container',
	]
		.filter( ( value ) => ! isEmpty( value ) )
		.join( ' ' );
	const paginationType = isEmpty( settings.pagination_type )
		? 'bullets'
		: settings.pagination_type;

	return (
		<div className={ `wcgs-carousel ${ carouselClasses }` }>
			<div className="spswiper-wrapper">
				{ model.items.map( ( item, index ) => (
					<div
						key={ index }
						className="spswiper-slide"
						id={ `wcgs-control-item${ index }` }
					>
						{ undefined !== item.video ? (
							<VideoItem
								item={ item }
								index={ index }
								tpl={ tpl }
							/>
						) : (
							<ImageItem
								item={ item }
								index={ index }
								tpl={ tpl }
							/>
						) }
					</div>
				) ) }
			</div>
			{ truthy( settings.navigation ) && (
				<>
					<div
						className="wcgs-spswiper-button-next wcgs-spswiper-arrow"
						tabIndex="0"
						role="button"
						aria-label={ __(
							'Next slide',
							'gallery-slider-for-woocommerce'
						) }
					></div>
					<div
						className="wcgs-spswiper-button-prev wcgs-spswiper-arrow"
						tabIndex="0"
						role="button"
						aria-label={ __(
							'Previous slide',
							'gallery-slider-for-woocommerce'
						) }
					></div>
				</>
			) }
			{ truthy( settings.pagination ) && (
				<div
					className={ `spswiper-pagination ${ paginationType }` }
				></div>
			) }
		</div>
	);
};

/**
 * maybe_render_thumbnails(): whether the gallery has a thumbnail slider.
 *
 * @param {Object} tpl Template helpers.
 * @return {boolean} Whether thumbnails render.
 */
export const rendersThumbnails = ( tpl ) =>
	'hide_thumb' !== ( tpl.settings.gallery_layout ?? 'horizontal' );

/**
 * The attributes of `#wpgs-gallery` (render_gallery_container()).
 *
 * @param {Object}  args
 * @param {Object}  args.model         Result of buildGalleryModel().
 * @param {number}  args.productId     Product ID.
 * @param {boolean} args.isMobile      Whether the request counts as wp_is_mobile().
 * @param {boolean} args.isRtl         Whether the site is right to left (is_rtl()).
 * @param {boolean} args.showPreloader Whether the preloader is rendered this mount.
 * @return {Object} `{ id, dir, className, maxWidth, dataId }`.
 */
export const galleryRootAttributes = ( {
	model,
	productId,
	isMobile,
	isRtl,
	showPreloader = true,
} ) => {
	const { settings } = model;
	const tpl = templateHelpers( model );
	const hasPreloader = showPreloader && truthy( settings.preloader );
	let width = isEmpty( settings.gallery_width ) ? 50 : settings.gallery_width;
	if ( isMobile ) {
		width = 100;
	}

	// get_gallery_classes().
	const classes = [ 'wcgs-spswiper-before-init', tpl.layoutClass ];
	if ( hasPreloader ) {
		classes.push(
			`wcgs_preloader_${
				isEmpty( settings.preloader_style )
					? 'normal'
					: settings.preloader_style
			}`
		);
	}

	return {
		id: 'wpgs-gallery',
		dir: truthy( settings.slider_dir ) || isRtl ? 'rtl' : undefined,
		className: `wcgs-woocommerce-product-gallery ${ classes.join( ' ' ) }`,
		maxWidth: `${ width }%`,
		dataId: productId,
	};
};

/**
 * Everything in `#wpgs-gallery`. The live preview mounts it into the
 * framed page's `#wpgs-gallery` element (Product/GalleryMount), whose
 * attributes come from galleryRootAttributes().
 *
 * @param {Object}  props
 * @param {Object}  props.model          Result of buildGalleryModel().
 * @param {boolean} props.showPreloader  Whether to render the preloader this mount
 *                                       (the store always does; the preview only
 *                                       on a product's first load and when the
 *                                       preloader settings change).
 * @param {string}  props.thumbsKey      Key of the thumbnail slider: a change
 *                                       remounts the thumbnails alone, and the
 *                                       engine rebuilds only that slider.
 * @param {boolean} props.withThumbnails Whether to render the thumbnails at all
 *                                       (false for the main remount key).
 */
export const GalleryContent = ( {
	model,
	showPreloader = true,
	thumbsKey = 'thumbs',
	withThumbnails = true,
} ) => {
	const tpl = templateHelpers( model );
	const hasPreloader = showPreloader && truthy( tpl.settings.preloader );

	return (
		<>
			{ withThumbnails && rendersThumbnails( tpl ) && (
				<Thumbnails key={ thumbsKey } model={ model } tpl={ tpl } />
			) }
			<MainGallery model={ model } tpl={ tpl } />
			{ hasPreloader && (
				<div
					className="wcgs-gallery-preloader"
					style={ { opacity: 1, zIndex: 9999 } }
				></div>
			) }
		</>
	);
};

/**
 * render_gallery_container(): `#wpgs-gallery` and everything in it.
 *
 * @param {Object}  props
 * @param {Object}  props.model          Result of buildGalleryModel().
 * @param {number}  props.productId      Product ID.
 * @param {boolean} props.isMobile       Whether the request counts as wp_is_mobile().
 * @param {boolean} props.isRtl          Whether the site is right to left (is_rtl()).
 * @param {boolean} props.showPreloader  Whether to render the preloader.
 * @param {string}  props.thumbsKey      Key of the thumbnail slider.
 * @param {boolean} props.withThumbnails Whether to render the thumbnails at all
 *                                       (false for the main remount key).
 */
const Gallery = ( {
	model,
	productId,
	isMobile,
	isRtl,
	showPreloader = true,
	thumbsKey = 'thumbs',
	withThumbnails = true,
} ) => {
	const root = galleryRootAttributes( {
		model,
		productId,
		isMobile,
		isRtl,
		showPreloader,
	} );

	return (
		<div
			id={ root.id }
			dir={ root.dir }
			className={ root.className }
			style={ { maxWidth: root.maxWidth, overflow: 'hidden' } }
			data-id={ root.dataId }
		>
			<GalleryContent
				model={ model }
				showPreloader={ showPreloader }
				thumbsKey={ thumbsKey }
				withThumbnails={ withThumbnails }
			/>
		</div>
	);
};

export default Gallery;
