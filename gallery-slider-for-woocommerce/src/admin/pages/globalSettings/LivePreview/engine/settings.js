/**
 * Panel values → `wcgs_settings` in its stored shapes, and the free feature
 * set of WCGS_Public_Helper::free_settings().
 *
 * A port of Woo_Gallery_Slider_Global_Settings_API::merge_values() /
 * to_storage() (admin/dashboard/class-woo-gallery-slider-global-settings-api.php),
 * driven by the same field definitions the REST preview data sends, so the
 * preview renders exactly what Save would store.
 */
import {
	DEVICE_BREAKPOINTS,
	OVERRIDES_KEY,
	getOverrides,
} from '../../../../utils/deviceOverrides';

/**
 * A plain object (a PHP associative array; an empty one arrives as `[]`).
 *
 * @param {*} value Value.
 * @return {boolean} Whether it is a key → value map.
 */
const isMap = ( value ) =>
	!! value && 'object' === typeof value && ! Array.isArray( value );

/**
 * PHP is_scalar() (no null).
 *
 * @param {*} value Value.
 * @return {boolean} Whether it is a string, number or boolean.
 */
const isScalar = ( value ) =>
	[ 'string', 'number', 'boolean' ].includes( typeof value );

/**
 * An empty device value: missing, null or ''.
 *
 * @param {*} value Value.
 * @return {boolean} Whether the device inherits instead.
 */
const isUnset = ( value ) =>
	undefined === value || null === value || '' === value;

/**
 * PHP is_numeric().
 *
 * @param {*} value Value.
 * @return {boolean} Whether PHP treats it as a number.
 */
export const isNumeric = ( value ) =>
	( 'number' === typeof value && Number.isFinite( value ) ) ||
	( 'string' === typeof value &&
		/^\s*[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?\s*$/i.test( value ) );

/**
 * rest_sanitize_boolean().
 *
 * @param {*} value Value.
 * @return {boolean} Boolean.
 */
const toBoolean = ( value ) => {
	if ( 'string' === typeof value ) {
		return ! [ '', '0', 'false' ].includes( value.toLowerCase() );
	}
	return !! value;
};

/**
 * PHP round( $n, 2 ) cast to string.
 *
 * @param {number} number Number.
 * @return {string} Rounded number.
 */
const roundString = ( number ) =>
	String(
		( Math.sign( number ) * Math.round( Math.abs( number ) * 100 ) ) / 100
	);

/**
 * color_to_hex(): a CSS color as `#RRGGBB` or `#RRGGBBAA`, or null.
 *
 * @param {*} value Color.
 * @return {string|null} Hex color.
 */
export const colorToHex = ( value ) => {
	if ( 'string' !== typeof value ) {
		return null;
	}
	let color = value.trim().replace( /;+$/, '' ).trim().toLowerCase();
	if ( 'transparent' === color ) {
		return '#00000000';
	}
	let match = color.match( /^#([0-9a-f]{3,4})$/ );
	if ( match ) {
		color =
			'#' +
			match[ 1 ]
				.split( '' )
				.map( ( c ) => c + c )
				.join( '' );
	}
	match = color.match( /^#([0-9a-f]{6})([0-9a-f]{2})?$/ );
	if ( match ) {
		const alpha = match[ 2 ] || 'ff';
		return (
			'#' +
			match[ 1 ] +
			( 'ff' === alpha ? '' : alpha )
		).toUpperCase();
	}
	match = color.match(
		/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/
	);
	if ( match ) {
		const rgb = match.slice( 1, 4 ).map( Number );
		const alpha =
			undefined !== match[ 4 ] && '' !== match[ 4 ]
				? parseFloat( match[ 4 ] )
				: 1;
		if ( Math.max( ...rgb ) > 255 || alpha > 1 ) {
			return null;
		}
		const hex =
			'#' +
			rgb
				.map( ( n ) => n.toString( 16 ).padStart( 2, '0' ) )
				.join( '' )
				.toUpperCase();
		return alpha < 1
			? hex +
					Math.round( alpha * 255 )
						.toString( 16 )
						.padStart( 2, '0' )
						.toUpperCase()
			: hex;
	}
	return null;
};

/**
 * hex_to_storage(): `#rrggbb` when opaque, else `rgba(r, g, b, a)`.
 *
 * @param {string} hex `#RRGGBB` or `#RRGGBBAA`.
 * @return {string} Stored color.
 */
const hexToStorage = ( hex ) => {
	if ( 7 === hex.length ) {
		return hex.toLowerCase();
	}
	const [ r, g, b, a ] = [ 1, 3, 5, 7 ].map( ( i ) =>
		parseInt( hex.slice( i, i + 2 ), 16 )
	);
	return `rgba(${ r }, ${ g }, ${ b }, ${ roundString( a / 255 ) })`;
};

/**
 * Settings_API::parse_id_list().
 *
 * @param {*} value Comma list or array.
 * @return {number[]} Unique positive IDs.
 */
const parseIdList = ( value ) => {
	let list = value;
	if ( 'string' === typeof list ) {
		list = list.replace( /^[\[\] ]+|[\[\] ]+$/g, '' ).split( ',' );
	}
	if ( ! Array.isArray( list ) ) {
		return [];
	}
	return [
		...new Set(
			list
				.map( ( id ) => Math.abs( parseInt( id, 10 ) || 0 ) )
				.filter( Boolean )
		),
	];
};

/**
 * from_storage(): a stored value in the app shape.
 *
 * @param {*}      value Stored value.
 * @param {Object} field Field definition.
 * @return {*} App value.
 */
const fromStorage = ( value, field ) => {
	switch ( field.type ) {
		case 'switch':
			return !! value && '0' !== value;
		case 'number':
			return isNumeric( value )
				? Number( value )
				: fromStorage( field.default, field );
		case 'enum':
			return field.options.includes( String( value ) )
				? String( value )
				: field.default;
		case 'color': {
			const hex = colorToHex( value );
			return null !== hex ? hex : String( colorToHex( field.default ) );
		}
		case 'multi':
			return field.options.filter( ( option ) =>
				( Array.isArray( value ) ? value : [ value ] )
					.map( String )
					.includes( option )
			);
		case 'ids':
			return parseIdList( value );
		case 'group': {
			const result = {};
			Object.entries( field.fields ).forEach( ( [ key, sub ] ) => {
				if ( value && 'object' === typeof value && key in value ) {
					result[ key ] = fromStorage( value[ key ], sub );
				} else if ( 'string' === typeof value && '' !== value ) {
					result[ key ] = fromStorage( value, sub );
				} else {
					result[ key ] = defaultValue( sub );
				}
			} );
			return result;
		}
		case 'responsive': {
			const result = {};
			const all = isMap( value ) ? value : {};
			DEVICE_BREAKPOINTS.forEach( ( [ device ] ) => {
				const values = isMap( all[ device ] ) ? all[ device ] : {};
				result[ device ] = {};
				Object.entries( field.fields ).forEach( ( [ key, sub ] ) => {
					if ( ! ( key in values ) ) {
						return;
					}
					if ( 'group' === sub.type ) {
						const group = {};
						Object.entries( sub.fields ).forEach(
							( [ subKey, groupField ] ) => {
								if (
									isMap( values[ key ] ) &&
									subKey in values[ key ]
								) {
									group[ subKey ] = fromStorage(
										values[ key ][ subKey ],
										groupField
									);
								}
							}
						);
						if ( Object.keys( group ).length ) {
							result[ device ][ key ] = group;
						}
					} else if (
						isScalar( values[ key ] ) &&
						'' !== values[ key ]
					) {
						result[ device ][ key ] = fromStorage(
							values[ key ],
							sub
						);
					}
				} );
			} );
			return result;
		}
		default:
			return null === value ||
				undefined === value ||
				'object' === typeof value
				? ''
				: String( value );
	}
};

/**
 * default_value(): a field's default in the app shape.
 *
 * @param {Object} field Field definition.
 * @return {*} Default.
 */
function defaultValue( field ) {
	if ( 'group' === field.type ) {
		const result = {};
		Object.entries( field.fields ).forEach( ( [ key, sub ] ) => {
			result[ key ] = defaultValue( sub );
		} );
		return result;
	}
	return fromStorage( field.default, field );
}

/**
 * to_storage(): an app value in the stored shape.
 *
 * @param {*}      value  App value.
 * @param {Object} field  Field definition.
 * @param {*}      stored Value stored now, or null.
 * @return {*} Stored value.
 */
const toStorage = ( value, field, stored = null ) => {
	switch ( field.type ) {
		case 'switch':
			return toBoolean( value ) ? '1' : '';
		case 'number':
			if ( ! isNumeric( value ) ) {
				return String( field.default );
			}
			return roundString(
				Math.min( Math.max( Number( value ), field.min ), field.max )
			);
		case 'enum':
			return field.options.includes( String( value ) )
				? String( value )
				: String( field.default );
		case 'image_size':
			return String( value );
		case 'color': {
			const hex = colorToHex( value );
			if ( null === hex ) {
				return null !== stored && null !== colorToHex( stored )
					? stored
					: field.default;
			}
			// Keep the stored notation when the color did not change.
			if ( null !== stored && colorToHex( stored ) === hex ) {
				return stored;
			}
			return hexToStorage( hex );
		}
		case 'multi':
			return fromStorage( value, field );
		case 'ids': {
			const ids = parseIdList( value ).map( String );
			return ids.length ? ids : '';
		}
		case 'group': {
			const result =
				stored &&
				'object' === typeof stored &&
				! Array.isArray( stored )
					? { ...stored }
					: {};
			const next = value && 'object' === typeof value ? value : {};
			Object.entries( field.fields ).forEach( ( [ key, sub ] ) => {
				if ( key in next ) {
					result[ key ] = toStorage(
						next[ key ],
						sub,
						key in result ? result[ key ] : null
					);
				} else if ( ! ( key in result ) ) {
					result[ key ] = toStorage( defaultValue( sub ), sub );
				}
			} );
			return result;
		}
		case 'responsive': {
			// Only the values a device sets; an empty or missing one inherits.
			const result = {};
			const all = isMap( value ) ? value : {};
			DEVICE_BREAKPOINTS.forEach( ( [ device ] ) => {
				const values = isMap( all[ device ] ) ? all[ device ] : {};
				result[ device ] = {};
				Object.entries( field.fields ).forEach( ( [ key, sub ] ) => {
					if ( ! ( key in values ) || isUnset( values[ key ] ) ) {
						return;
					}
					if ( 'group' === sub.type ) {
						const group = {};
						Object.entries( sub.fields ).forEach(
							( [ subKey, groupField ] ) => {
								if (
									isMap( values[ key ] ) &&
									subKey in values[ key ] &&
									! isUnset( values[ key ][ subKey ] )
								) {
									group[ subKey ] = toStorage(
										values[ key ][ subKey ],
										groupField
									);
								}
							}
						);
						if ( Object.keys( group ).length ) {
							result[ device ][ key ] = group;
						}
					} else if ( ! isMap( values[ key ] ) ) {
						result[ device ][ key ] = toStorage(
							values[ key ],
							sub
						);
					}
				} );
			} );
			return result;
		}
		case 'url':
			// esc_url_raw() keeps a URL the panel's media picker gives.
			return null === value || undefined === value ? '' : String( value );
		default:
			return sanitizeTextField( value );
	}
};

/**
 * sanitize_text_field(): tags stripped, whitespace runs collapsed, trimmed,
 * percent-encoded octets removed (the entity step is left out, see below).
 *
 * @param {*} value Value.
 * @return {string} Sanitized text.
 */
const sanitizeTextField = ( value ) => {
	if ( null === value || undefined === value || 'object' === typeof value ) {
		return '';
	}
	let text = String( value );
	if ( text.includes( '<' ) ) {
		// wp_strip_all_tags(): script/style blocks, then every tag. A stray
		// '<' is kept as is: PHP stores it as &lt; and the store decodes it.
		text = text
			.replace( /<(script|style)[^>]*?>.*?<\/\1>/gis, '' )
			.replace( /<[^>]*>/g, '' );
	}
	text = text.replace( /[\r\n\t ]+/g, ' ' ).trim();
	if ( /%[a-f0-9]{2}/i.test( text ) ) {
		text = text
			.replace( /%[a-f0-9]{2}/gi, '' )
			.replace( / +/g, ' ' )
			.trim();
	}
	return text;
};

/**
 * merge_values(): the stored settings with the panel values put in.
 *
 * @param {Object} stored Stored `wcgs_settings` (no license key).
 * @param {Object} values Panel values (app shapes).
 * @param {Object} fields Field definitions, keyed by setting id.
 * @return {Object} Settings in the stored shapes.
 */
export const mergeValues = ( stored, values, fields ) => {
	const settings = { ...stored };
	Object.entries( fields ).forEach( ( [ key, field ] ) => {
		if ( values && key in values ) {
			settings[ key ] = toStorage(
				values[ key ],
				field,
				key in stored ? stored[ key ] : null
			);
		}
	} );
	return settings;
};

/**
 * PHP empty().
 *
 * @param {*} value Value.
 * @return {boolean} Whether PHP considers it empty.
 */
export const isEmpty = ( value ) =>
	undefined === value ||
	null === value ||
	false === value ||
	0 === value ||
	'' === value ||
	'0' === value ||
	( Array.isArray( value ) && ! value.length );

/**
 * Settings of features the free plugin does not have
 * (WCGS_Public_Helper::REMOVED_KEYS); keys starting with `shop` or
 * `playlist_` go too.
 */
export const FREE_REMOVED_KEYS = [
	// General.
	'grid_orientation',
	'columns',
	'gallery_item',
	'gallery_item_to_show',
	'gallery_expansion',
	'gallery_image_space',
	'slider_layout_on_mobile',
	'gallery_layout_on_mobile',
	'thumbnails_item_show_type',
	'thumb_crop_size',
	'thumbnails_load_2x_image',
	'active_thumb_opacity',
	'inactive_thumb_opacity',
	'inactive_thumb_grayscale',
	'include_variation_and_default_gallery',
	// Gallery slider, thumbnails navigation, product image.
	'slider_height',
	'adaptive_height',
	'thumbnail_navi_box_size',
	'thumbnailIcon_box_size',
	'thumbnailnavigation_outer_color_group',
	'image_crop_size',
	'load_2x_image',
	// Show more button.
	'expand_collapse',
	'show_more_font_size',
	'show_more_font_color',
	'button_border',
	'bottom_box_shadow',
	'show_more_padding',
	'bottom_margine',
	// Zoom.
	'zoom_level',
	'mouse_wheel_zoom',
	'cursor_type',
	'lens_shape',
	'lens_color',
	'lens_border',
	'product_image_overlay',
	'overlay_color',
	'lens_opacity',
	'zoom_size_type',
	'zoom_size',
	'zoom_window_distance',
	'zoom_border_right_side',
	'zoom_boxshadow_right_side',
	'exclude_zoom_by_products_type',
	'exclude_zoom_by_products',
	'exclude_zoom_by_category',
	// Video.
	'video_presentation',
	'video_image_icon',
	'video_icon_position_for',
	'video_icon_size',
	'video_icon_color',
	'autoplay_video_on_sliding',
	'video_looping',
	'video_controls',
	'video_volume',
	'player_style',
	'video_font_color',
	'video_control_bgcolor',
	'video_progress_color',
	'video_progress_bg',
	'yt_video_controls',
	'yt_related_video',
	'autoplay_video_shop',
	'video_play_event',
	'wcgs_video_shop',
	// Lightbox.
	'lightbox_bg',
	'lightbox_icon_visibility',
	'lightbox_icon_visibility_slider',
	'slide_play_btn',
	'thumb_gallery_show',
	'side_gallery_btn',
	'lightbox_thumb_style',
	'gallery_dl_btn',
	'gallery_middle_btn',
	// Advanced.
	'disable_gallery',
	'disable_specific_product_type',
	'disable_product_terms',
	'disable_specific_product',
	'wcgs_ajax_variation_threshold',
	'license_key',
];

/**
 * Free values of the settings with locked (Pro) choices, and the value a
 * locked choice falls back to (WCGS_Public_Helper::FREE_VALUES; `null`: any
 * value but `custom`).
 */
export const FREE_VALUES = {
	gallery_layout: [
		[
			'horizontal',
			'vertical',
			'vertical_right',
			'horizontal_top',
			'hide_thumb',
		],
		'horizontal',
	],
	thumbnails_hover_effect: [ [ 'none', 'zoom_out', 'slide_down' ], 'none' ],
	thumb_active_on: [ [ 'click' ], 'click' ],
	thumbnail_style: [ [ 'border_around', 'top_line' ], 'border_around' ],
	inactive_thumbnails_effect: [ [ 'grayscale', 'none' ], 'none' ],
	fade_slide: [ [ 'slide', 'flip', 'cube' ], 'slide' ],
	slider_height_type: [ [ 'adaptive', 'max_image' ], 'max_image' ],
	navigation_position: [
		[ 'center_center', 'bottom_left' ],
		'center_center',
	],
	pagination_type: [ [ 'bullets', 'dynamic', 'strokes' ], 'bullets' ],
	thumbnailnavigation_style: [ [ 'custom', 'inner_right' ], 'custom' ],
	zoom_type: [ [ 'in_side', 'zoom_2x' ], 'in_side' ],
	video_order: [ [ 'usual', 'video_come_last' ], 'usual' ],
	lightbox_sliding_effect: [
		[ 'slide', 'classic', 'crossfade', 'no_animation' ],
		'slide',
	],
	lightbox_icon: [ [ 'search', 'search-plus', 'plus', 'info' ], 'search' ],
	video_icon: [
		[
			'play-01',
			'play-02',
			'play-03',
			'play-04',
			'play-05',
			'play-06',
			'play-07',
			'play-08',
			'play-09',
			'native',
		],
		'play-01',
	],
	thumbnails_sizes: [ null, 'shop_thumbnail' ],
	image_sizes: [ null, 'woocommerce_single' ],
};

/**
 * WCGS_Public_Helper::free_settings(): the settings the free gallery runs
 * on. Keys of features the free plugin does not have are dropped, and a
 * locked choice falls back to its free value.
 *
 * @param {Object} settings Effective settings.
 * @return {Object} Settings.
 */
export const freeSettings = ( settings ) => {
	if ( ! isMap( settings ) ) {
		return {};
	}
	const result = { ...settings };
	FREE_REMOVED_KEYS.forEach( ( key ) => delete result[ key ] );
	Object.keys( result ).forEach( ( key ) => {
		if ( key.startsWith( 'shop' ) || key.startsWith( 'playlist_' ) ) {
			delete result[ key ];
		}
	} );
	// Device values of the responsive settings only.
	if ( undefined !== result[ OVERRIDES_KEY ] ) {
		result[ OVERRIDES_KEY ] = getOverrides( result );
	}
	Object.entries( FREE_VALUES ).forEach(
		( [ key, [ values, fallback ] ] ) => {
			if ( undefined === result[ key ] || null === result[ key ] ) {
				return;
			}
			const value = isScalar( result[ key ] )
				? String( result[ key ] )
				: '';
			const isFree =
				null === values
					? 'custom' !== value && '' !== value
					: values.includes( value );
			if ( ! isFree ) {
				result[ key ] = fallback;
			}
		}
	);
	return result;
};
