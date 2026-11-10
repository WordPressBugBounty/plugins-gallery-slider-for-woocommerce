/**
 * Dynamic gallery CSS, built in the browser.
 *
 * A line-for-line port of WCGS_Public_Style::wcgs_css() and wcgs_custom_css()
 * (public/partials/class/class-public-style.php), with the property setup of
 * WCGS_Public_Settings (setData() and fonts_map_func()). Property defaults
 * come from PHP (`styleDefaults`, get_class_vars() of WCGS_Public_Settings),
 * so only the CSS rules live here. Keep it in step with the PHP class: when a
 * rule changes there, change it here too.
 */
import {
	DEVICE_BREAKPOINTS,
	forDevice,
	getOverrides,
	hasOverrides,
} from '../../../../utils/deviceOverrides';

/**
 * A value as PHP prints it in a string: true → "1", false/null → "".
 *
 * @param {*} value Value.
 * @return {string} String.
 */
const str = ( value ) => {
	if ( true === value ) {
		return '1';
	}
	if ( false === value || null === value || undefined === value ) {
		return '';
	}
	if ( 'object' === typeof value ) {
		return 'Array';
	}
	return String( value );
};

/**
 * A float as PHP prints it: 14 significant digits (the `precision` ini).
 *
 * @param {number} value Number.
 * @return {number} Rounded number.
 */
const phpFloat = ( value ) => Number( Number( value ).toPrecision( 14 ) );

/**
 * PHP (int) cast.
 *
 * @param {*} value Value.
 * @return {number} Integer.
 */
const int = ( value ) => {
	if ( true === value ) {
		return 1;
	}
	const number = parseInt( str( value ), 10 );
	return Number.isNaN( number ) ? 0 : number;
};

/**
 * PHP empty().
 *
 * @param {*} value Value.
 * @return {boolean} Empty.
 */
const empty = ( value ) =>
	! value || '0' === value || ( Array.isArray( value ) && ! value.length );

/**
 * WCGS_Public_Settings: settings as properties. A nested setting fills the
 * properties named `<first two key segments>_<sub key>`; only declared
 * properties (the defaults) are set.
 *
 * @param {Object} settings Settings (stored shapes).
 * @param {Object} defaults Property defaults from PHP.
 * @return {Object} Properties.
 */
const toProperties = ( settings, defaults ) => {
	const props = { ...defaults };
	Object.entries( settings || {} ).forEach( ( [ key, value ] ) => {
		if ( value && 'object' === typeof value ) {
			const parts = key.split( '_' );
			const name =
				undefined !== parts[ 1 ]
					? `${ parts[ 0 ] }_${ parts[ 1 ] }`
					: parts[ 0 ];
			Object.entries( value ).forEach( ( [ subKey, subValue ] ) => {
				const property = `${ name }_${ subKey }`;
				if ( property in props ) {
					props[ property ] =
						null !== subValue && undefined !== subValue
							? subValue
							: property;
				}
			} );
		} else if ( key in props ) {
			props[ key ] = value;
		}
	} );
	// fonts_map_func().
	Object.entries( props.fonts_map || {} ).forEach( ( [ key, icons ] ) => {
		if ( key === props.navigation_icon ) {
			props.navigation_left_icon = icons[ 0 ];
			props.navigation_right_icon = icons[ 1 ];
		}
		if ( key === props.thumbnailnavigation_icon ) {
			props.thumbnailnavigation_left_icon = icons[ 0 ];
			props.thumbnailnavigation_right_icon = icons[ 1 ];
		}
	} );
	return props;
};

/**
 * lightenColor(): mix a `#rrggbb` color toward white. Like sscanf(), a
 * color that is not hex (rgba()) reads as missing channels, i.e. 0.
 *
 * @param {string} hex     Hex color.
 * @param {number} percent Percent.
 * @return {string} `#rrggbb`.
 */
const lightenColor = ( hex, percent = 10 ) => {
	const value = str( hex ).replace( /^#+/, '' );
	const channels = [];
	let failed = false;
	for ( let i = 0; i < 3; i++ ) {
		const part = value.slice( i * 2, i * 2 + 2 ).match( /^[0-9a-f]+/i );
		if ( failed || ! part ) {
			failed = true;
			channels.push( 0 );
		} else {
			channels.push( parseInt( part[ 0 ], 16 ) );
		}
	}
	return (
		'#' +
		channels
			.map( ( c ) =>
				Math.round( c + ( percent / 100 ) * ( 255 - c ) )
					.toString( 16 )
					.padStart( 2, '0' )
			)
			.join( '' )
	);
};

/**
 * WCGS_Public_Helper::minify_output().
 *
 * @param {string} html Markup or CSS.
 * @return {string} Minified.
 */
export const minifyOutput = ( html ) => {
	let out = html
		.replace( /<!--(?!s*(?:\[if [^\]]+]|!|>))(?:(?!-->)[\s\S])*-->/g, '' )
		.replace( /\r\n|\r|\n|\t/g, '' );
	while ( out.includes( '  ' ) ) {
		out = out.split( '  ' ).join( ' ' );
	}
	return out;
};

/**
 * html_entity_decode().
 *
 * @param {string} text Text.
 * @return {string} Decoded.
 */
const decodeEntities = ( text ) => {
	const textarea = document.createElement( 'textarea' );
	textarea.innerHTML = text;
	return textarea.value;
};

/**
 * WCGS_Public_Style::build_css().
 *
 * @param {Object} settings Settings (stored shapes, free_settings() applied).
 * @param {Object} defaults Property defaults from PHP.
 * @return {string} CSS.
 */
const buildDynamicCss = ( settings, defaults ) => {
	const props = toProperties( settings, defaults );
	// Printed values (PHP string interpolation).
	const t = new Proxy( props, {
		get: ( target, key ) => str( target[ key ] ),
	} );

	const thumbnailsTop = t.thumbnails_sliders_height;
	let thumbPosition;
	let direction;
	let rtlDirection;
	if (
		'vertical' === t.gallery_layout ||
		'horizontal_top' === t.gallery_layout
	) {
		thumbPosition = '-1';
		direction = 'rtl';
		rtlDirection = 'ltr';
	} else {
		thumbPosition = '2';
		direction = 'ltr';
		rtlDirection = 'rtl';
	}
	props.lightbox_icon_size = ! empty( props.lightbox_icon_size )
		? props.lightbox_icon_size
		: 13;
	let thumbSliderMargin = `margin-top: ${ thumbnailsTop }px;`;
	if ( 'vertical' === t.gallery_layout ) {
		thumbSliderMargin = `margin-right: ${ thumbnailsTop }px;`;
	}
	if ( 'vertical_right' === t.gallery_layout ) {
		thumbSliderMargin = `margin-left: ${ thumbnailsTop }px;`;
	}
	if ( 'horizontal_top' === t.gallery_layout ) {
		thumbSliderMargin = `margin-bottom: ${ thumbnailsTop }px;`;
	}
	let css = '';
	const galleryWidth = int( props.gallery_width );
	const galleryWidthWithUnit =
		galleryWidth > 100 ? `${ galleryWidth }px` : `${ galleryWidth }%`;
	// At least 1: a malformed value (0, '', 'Array') would divide by zero.
	const thumbItemWidth = phpFloat(
		100 / Math.max( 1, int( props.thumbnails_item_to_show ) )
	);
	css += `.wcgs-spswiper-before-init.horizontal .gallery-navigation-carousel-wrapper .spswiper-wrapper>div {
				width: calc(${ thumbItemWidth }% - ${ t.thumbnails_sliders_width }px) !important;
		}`;
	css += `@media screen and (min-width:992px ){
  			#wpgs-gallery.wcgs-woocommerce-product-gallery:has(:not(+ .summary)) {
                max-width: 100%;
            }
           	#wpgs-gallery.wcgs-woocommerce-product-gallery:has( + .summary) {
                max-width: ${ galleryWidthWithUnit };
            }
        }`;
	// Block themes: size WooCommerce's stock 512px gallery column from the
	// setting and let the gallery fill its column; a full-width gallery wraps
	// the summary below.
	css += `@media screen and (min-width:782px ){
			.wp-block-columns:has(> .wp-block-column[style*="flex-basis:512px"] > .wp-block-woocommerce-product-image-gallery > #wpgs-gallery) {
				flex-wrap: wrap !important;
			}
			.wp-block-columns > .wp-block-column[style*="flex-basis:512px"]:has(> .wp-block-woocommerce-product-image-gallery > #wpgs-gallery) {
				flex-basis: ${ galleryWidthWithUnit } !important;
			}
			.wp-block-columns > .wp-block-column > .wp-block-woocommerce-product-image-gallery:has(> #wpgs-gallery) {
				max-width: none;
			}
		}`;
	if ( galleryWidth < 100 ) {
		const summaryWidthWithUnit = `calc(${ 100 - galleryWidth }% - 50px)`;
		css += `@media screen and (min-width:992px ){
                #wpgs-gallery.wcgs-woocommerce-product-gallery+.summary {
                    max-width: ${ summaryWidthWithUnit };
                }
            }`;
	}
	// The video play icon: 64px wide, 36px high, white.
	css += `#wpgs-gallery .vjs-big-play-button .wcgs-video-icon,
		#wpgs-gallery .wcgs-video-icon-wrapper .wcgs-video-icon{
			font-size: 64px;
			height: 64px;
			line-height: 1;
			width: auto;
		}#wpgs-gallery  .wcgs-video-icon{
			color:#fff;
			font-size: 36px;
		}`;
	if ( 'strokes' === t.pagination_type ) {
		css += `
			.wcgs-carousel .spswiper-pagination .spswiper-pagination-bullet span{
				display: none;
			}
			.wcgs-carousel .spswiper-pagination .spswiper-pagination-bullet{
				border-radius: 0;
				border-radius: 2px;
				height: 5px !important;
				min-height: 5px !important;
				width: 20px;
				margin-right: 5px !important;
			}`;
	}

	if ( 'top_line' === t.thumbnail_style ) {
		if ( 'horizontal_top' === t.gallery_layout ) {
			css += `#wpgs-gallery .wcgs-thumb {
					padding-top: 0;
					padding-bottom: 10px;
					transition: border-color 0.33s;
					border-bottom: ${ t.border_bottom_all }px solid transparent;
				}`;
		}
		if ( 'horizontal' === t.gallery_layout ) {
			css += `#wpgs-gallery .wcgs-thumb {
					padding-top: 10px;
					transition: border-color 0.33s;
					border-top: ${ t.border_bottom_all }px solid transparent;
				}`;
		}
		if ( 'vertical' === t.gallery_layout ) {
			css += `	#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-thumb{
					padding-left: 0px;
					padding-right: 10px;
					border-right: 2px solid transparent;
				}
				#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-border-bottom {
					right: 0;
				}`;
		}
		if ( 'vertical_right' === t.gallery_layout ) {
			css += `	#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-thumb{
				padding-right: 0px;
				padding-left: 10px;
				border-left: 2px solid transparent;
			}#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-border-bottom {
					right: auto;
					left: 0;
				}`;
		}

		css += `
			#wpgs-gallery .gallery-navigation-carousel-wrapper {
				position: relative;
			}

			#wpgs-gallery .wcgs-thumb img {
				border: 1px solid #dddddd;
				border-radius: 0px;
			}
			.gallery-navigation-carousel-wrapper .wcgs-border-bottom {
				position: absolute;
				content: "";
				z-index: 999;
				transition: left 400ms ease 0s;
				border-bottom: ${ t.border_bottom_all }px solid ${ t.border_bottom_color2 };
				bottom: 0;
				left: 0;
			}
			#wpgs-gallery .gallery-navigation-carousel-wrapper.vertical .wcgs-border-bottom {
				border-right: ${ t.border_bottom_all }px solid ${ t.border_bottom_color2 };
				border-bottom: none;
				bottom: auto;
				transition: top 400ms ease 0s;
			}
			#wpgs-gallery .wcgs-thumb.wcgs-thumb:hover{
				border-color: ${ lightenColor( t.border_bottom_color2, 45 ) };
			}`;
	}

	if ( 'border_around' === t.thumbnail_style ) {
		css += `#wpgs-gallery  .spswiper-slide-thumb-active.wcgs-thumb {
				box-shadow: ${ t.active_thumb_horizontal }px ${ t.active_thumb_vertical }px ${ t.active_thumb_blur }px ${ t.active_thumb_spread }px ${ t.active_thumb_color };
			}
			#wpgs-gallery  .spswiper-slide-thumb-active.wcgs-thumb::after{
				border: ${ t.border_width_all }px solid ${ t.border_width_color2 };

			}
			#wpgs-gallery  .wcgs-thumb.spswiper-slide-thumb-active.wcgs-thumb:hover::after {
				border-color: ${ t.border_width_color2 };
			}
			#wpgs-gallery .wcgs-thumb:hover::after {
				border-color: ${ t.border_normal_color3 };
			}
			#wpgs-gallery .wcgs-thumb::after {
				border: ${ t.border_normal_all }px solid ${ t.border_normal_color };
				border-radius: ${ t.border_normal_radius }px;
				overflow: hidden;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				content: "";
				position: absolute;
			}
			#wpgs-gallery .wcgs-thumb {
				border-radius: ${ t.border_normal_radius }px;
				padding: ${ t.thumbnails_inner_padding }px;
			}
			#wpgs-gallery .wcgs-thumb img {
				border-radius: ${ t.border_normal_radius }px;
			}
			`;
	}
	if ( 'grayscale' === t.inactive_thumbnails_effect ) {
		css += `#wpgs-gallery .wcgs-thumb img{
				opacity: 1;
				filter: grayscale(100%);
			}#wpgs-gallery .wcgs-thumb.spswiper-slide-thumb-active.wcgs-thumb img{
				opacity: 1;
				filter: grayscale(0);
			}`;
	}
	const lightboxBox = int( props.lightbox_icon_size ) + 17;
	css += `#wpgs-gallery.wcgs-woocommerce-product-gallery .gallery-navigation-carousel-wrapper {
			-ms-flex-order: ${ thumbPosition } !important;
			order: ${ thumbPosition } !important;
			position: relative;
		}
		#wpgs-gallery.wcgs-woocommerce-product-gallery .wcgs-carousel .wcgs-slider-image {
			border-radius: ${ t.image_border_radius }px;
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow {
			font-size: ${ t.navigation_icon_size }px;
			color: ${ t.navigation_icon_color };
			background-color: ${ t.navigation_icon_bg_color };
			border-radius: ${ t.navigation_icon_radius }px;
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow:hover,
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow:hover {
			color: ${ t.navigation_icon_hover_color };
			background-color: ${ t.navigation_icon_hover_bg_color };
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow::before {
			content: "${ t.navigation_left_icon }";
		}
		#wpgs-gallery .wcgs-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow::before {
			content: "${ t.navigation_right_icon }";
		}
		#wpgs-gallery .spswiper-pagination{
		margin: ${ t.pagination_margin_top }px ${ t.pagination_margin_right }px ${ t.pagination_margin_bottom }px ${ t.pagination_margin_left }px;
		}
		#wpgs-gallery .spswiper-pagination .spswiper-pagination-bullet {
			background-color: ${ t.pagination_icon_color };
		}
		#wpgs-gallery .spswiper-pagination .spswiper-pagination-bullet.spswiper-pagination-bullet-active {
			background-color: ${ t.pagination_icon_active_color };
		}
		#wpgs-gallery .wcgs-lightbox {
			height:${ lightboxBox }px;
			width: ${ lightboxBox }px;
			color: ${ t.lightbox_icon_color };
			background-color: ${ t.lightbox_icon_bg_color };
			font-size: ${ t.lightbox_icon_size }px;
			border: none;
		}
		#wpgs-gallery .wcgs-lightbox:hover {
			color: ${ t.lightbox_icon_hover_color };
			background-color: ${ t.lightbox_icon_hover_bg_color };
		}
		#wpgs-gallery .gallery-navigation-carousel.vertical  .wcgs-spswiper-button-next.wcgs-spswiper-arrow::before,
		#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow::before {
			content: "${ t.thumbnailnavigation_left_icon }";
		}
		#wpgs-gallery .gallery-navigation-carousel.vertical  .wcgs-spswiper-button-prev.wcgs-spswiper-arrow::before,
		#wpgs-gallery .gallery-navigation-carousel  .wcgs-spswiper-button-next.wcgs-spswiper-arrow::before {
			content: "${ t.thumbnailnavigation_right_icon }";
		}
		#wpgs-gallery .gallery-navigation-carousel-wrapper {
			${ thumbSliderMargin };
		}
		#wpgs-gallery {
			margin-bottom: ${ t.gallery_bottom_gap }px;
			--wcgs-lightbox-icon-size: ${ lightboxBox }px;
		}
		#wpgs-gallery .gallery-navigation-carousel.vertical .wcgs-thumb {
			width: auto !important;
		}
		.wcgs-fancybox-wrapper .fancybox__caption {
			color: ${ t.caption_color };
			font-size: ${ t.lightbox_caption_size }px;
			text-align: center;
		}
		.fancybox__backdrop {
			background: #1e1e1e !important;
		}`;

	if ( 'inner_right' === t.thumbnailnavigation_style ) {
		// The arrows are 30px square.
		css += `#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow{
				color: ${ t.thumbnailnavigation_icon_color };
				background-color: ${ t.thumbnailnavigation_icon_bg_color };
				font-size: ${ t.thumbnailnavigation_icon_size }px;
				border:  ${ t.thumbnail_navi_all }px solid ${ t.thumbnail_navi_color };
				border-radius: ${ t.thumbnail_navi_radius }px;
				width: 30px;
				height: 30px;

			}#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow:hover,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow:hover{
				border-color:  ${ t.thumbnail_navi_color3 };
				color: ${ t.thumbnailnavigation_icon_hover_color };
				background-color: ${ t.thumbnailnavigation_icon_hover_bg_color };
			}`;
	}

	if ( 'custom' === t.thumbnailnavigation_style ) {
		// The arrows are 25px wide and as high as the thumbnails.
		css += `#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow{
				font-size: ${ t.thumbnailnavigation_icon_size }px;
				color: ${ t.thumbnailnavigation_icon_color };
				background-color: ${ t.thumbnailnavigation_icon_bg_color };
				border:  ${ t.thumbnail_navi_all }px solid ${ t.thumbnail_navi_color };
				border-radius: ${ t.thumbnail_navi_radius }px;
				width: 25px;
				height: 100%;
			}#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow:hover,
			#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow:hover{
				border-color:  ${ t.thumbnail_navi_color3 };
				color: ${ t.thumbnailnavigation_icon_hover_color };
				background-color: ${ t.thumbnailnavigation_icon_hover_bg_color };
			}`;
		if (
			'vertical_right' === t.gallery_layout ||
			'vertical' === t.gallery_layout
		) {
			css += `#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
				#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow{
					left: calc(50% - 50%);
					height: 25px;
					width: 100%;
				}`;
		} else {
			css += `#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-next.wcgs-spswiper-arrow,
				#wpgs-gallery .gallery-navigation-carousel .wcgs-spswiper-button-prev.wcgs-spswiper-arrow{
					top: calc(50% - 50%);
					width: 25px;
					height: 100%;
				}`;
		}
	}

	switch ( t.thumbnails_hover_effect ) {
		case 'zoom_out':
			css += `.gallery-navigation-carousel .wcgs-thumb img{
					transform: scale(1.2);
				}
				.gallery-navigation-carousel .wcgs-thumb:hover img {
					transform: scale(1);
				}`;
			break;
		case 'slide_down':
			css += `.gallery-navigation-carousel .wcgs-thumb:hover {
					transform: translateY(5px);
				}
				.gallery-navigation-carousel .wcgs-thumb{
					margin-bottom: 5px;
				}`;
			break;
	}
	if ( 'vertical_right' === t.gallery_layout ) {
		css += `#wpgs-gallery[dir='rtl'] .gallery-navigation-carousel {
				margin-right: ${ thumbnailsTop }px;
				margin-left: 0px;
			}`;
		css += `#wpgs-gallery .overflow_y_auto{
				direction: ${ direction };
                overflow-y: scroll;
			}
			#wpgs-gallery[dir='rtl'] .overflow_y_auto {
				direction: ${ rtlDirection };
			}`;
	}
	if ( 'vertical' === t.gallery_layout ) {
		css += `#wpgs-gallery[dir='rtl'] .gallery-navigation-carousel {
					margin-left: ${ thumbnailsTop }px;
					margin-right: 0px;
				}`;
		css += `#wpgs-gallery .overflow_y_auto{
					direction: ${ direction };
					overflow-y: scroll;
				}
				#wpgs-gallery[dir='rtl'] .overflow_y_auto {
					direction: ${ rtlDirection };
				}.woocommerce-js div.product.first:has(#wpgs-gallery.vertical) span.onsale{
					left: 101px;
				}.woocommerce-js div.product.first:has(#wpgs-gallery.vertical) .product span.onsale{
					left: auto;
				}`;
	}

	// The inside zoom (in_side, zoom_2x).
	css += `.wcgs_xzoom-preview {
				border: none ;
				box-shadow: none;
				cursor: default;
				border-radius: ${ t.image_border_radius }px;
			}`;
	return css;
};

/**
 * WCGS_Public_Style::css_blocks(): the top-level blocks of CSS (rules and
 * whole at-rules), skipping braces in comments and strings.
 *
 * @param {string} css CSS.
 * @return {string[]} Blocks.
 */
const cssBlocks = ( css ) => {
	const blocks = [];
	let depth = 0;
	let start = 0;
	let quote = '';
	for ( let i = 0; i < css.length; i++ ) {
		const char = css[ i ];
		if ( '' !== quote ) {
			if ( '\\' === char ) {
				i++;
			} else if ( char === quote ) {
				quote = '';
			}
			continue;
		}
		if ( '/' === char && '*' === css[ i + 1 ] ) {
			const end = css.indexOf( '*/', i + 2 );
			i = -1 === end ? css.length : end + 1;
			continue;
		}
		if ( '"' === char || "'" === char ) {
			quote = char;
		} else if ( '{' === char ) {
			depth++;
		} else if ( '}' === char && depth > 0 ) {
			depth--;
			if ( 0 === depth ) {
				blocks.push( css.slice( start, i + 1 ).trim() );
				start = i + 1;
			}
		}
	}
	return blocks;
};

/**
 * WCGS_Public_Style::responsive_css(): the tablet and mobile values in media
 * queries, each device's changed rule blocks against the larger device's.
 *
 * The preview shows the device picked in the dashboard, so only the media
 * queries of that device and the larger ones are added: a desktop preview
 * narrower than the tablet breakpoint still shows the desktop values. With
 * `device` 'mobile' the CSS is the product page's.
 *
 * @param {Object} settings   Settings (stored shapes, free_settings() applied).
 * @param {Object} defaults   Property defaults from PHP.
 * @param {string} desktopCss CSS of the desktop values.
 * @param {string} device     'desktop', 'tablet' or 'mobile'.
 * @return {string} CSS.
 */
const responsiveCss = ( settings, defaults, desktopCss, device ) => {
	if ( 'desktop' === device || ! hasOverrides( settings ) ) {
		return '';
	}
	let css = '';
	let previous = cssBlocks( desktopCss );
	const overrides = getOverrides( settings );
	for ( const [ name, maxWidth ] of DEVICE_BREAKPOINTS ) {
		// A device with no values of its own inherits the larger one's media query.
		if ( Object.keys( overrides[ name ] ).length ) {
			const values = forDevice( settings, name );
			const blocks = cssBlocks( buildDynamicCss( values, defaults ) );
			// A setting that changes which rules print: take the device's CSS whole.
			const changed =
				blocks.length === previous.length
					? blocks.filter(
							( block, index ) => block !== previous[ index ]
					  )
					: [ ...blocks ];
			if ( changed.length ) {
				css += `@media screen and (max-width:${ maxWidth }px ){${ changed.join(
					''
				) }}`;
			}
			previous = blocks;
		}
		if ( name === device ) {
			break;
		}
	}
	return css;
};

/**
 * The inline style the product page gets: dynamic CSS with its device media
 * queries, then the Additional CSS (wcgs_stylesheet_include()), minified as
 * Woo_Gallery_Slider_Public prints it.
 *
 * @param {Object} settings Settings (stored shapes, free_settings() applied).
 * @param {Object} defaults Property defaults from PHP.
 * @param {string} device   Previewed device (see responsiveCss()).
 * @return {string} CSS.
 */
export const buildCss = ( settings, defaults, device = 'mobile' ) => {
	const additional = decodeEntities(
		str( settings.wcgs_additional_css ?? defaults.wcgs_additional_css )
	)
		.trim()
		// Break "</" so it can't close the inline <style>.
		.split( '</' )
		.join( '<\\/' );
	const dynamic = buildDynamicCss( settings, defaults );
	return minifyOutput(
		dynamic +
			responsiveCss( settings, defaults, dynamic, device ) +
			additional
	);
};
