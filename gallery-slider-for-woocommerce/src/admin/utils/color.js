/**
 * Color conversion helpers for the color control.
 *
 * Colors are stored as `#RRGGBB`, or `#RRGGBBAA` when alpha is below 100%.
 */

const HEX_RE = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

export const isValidHex = ( value ) => HEX_RE.test( value );

/**
 * Split a stored color into its `#RRGGBB` base and alpha percent.
 *
 * @param {string} color Stored color.
 * @return {{base: string, alpha: number}} Base hex and alpha (0–100).
 */
export const parseColor = ( color ) => {
	const raw = isValidHex( color || '' ) ? color : '#000000';
	return {
		base: raw.slice( 0, 7 ).toUpperCase(),
		alpha:
			9 === raw.length
				? Math.round( parseInt( raw.slice( 7, 9 ), 16 ) / 2.55 )
				: 100,
	};
};

/**
 * Join a base hex and alpha percent into a stored color.
 *
 * @param {string} base  `#RRGGBB`.
 * @param {number} alpha Alpha percent.
 * @return {string} Stored color.
 */
export const composeColor = ( base, alpha = 100 ) =>
	base.slice( 0, 7 ).toUpperCase() +
	( alpha < 100
		? Math.round( alpha * 2.55 )
				.toString( 16 )
				.padStart( 2, '0' )
				.toUpperCase()
		: '' );

export const hexToRgb = ( hex ) =>
	[ 1, 3, 5 ].map( ( i ) => parseInt( hex.slice( i, i + 2 ), 16 ) );

const toHex = ( n ) =>
	Math.round( n ).toString( 16 ).padStart( 2, '0' ).toUpperCase();

export const rgbToHex = ( r, g, b ) =>
	'#' + toHex( r ) + toHex( g ) + toHex( b );

/**
 * @param {string} hex `#RRGGBB`.
 * @return {{h: number, s: number, v: number}} Hue 0–360, saturation and value 0–100.
 */
export const hexToHsv = ( hex ) => {
	const [ r, g, b ] = hexToRgb( hex ).map( ( x ) => x / 255 );
	const max = Math.max( r, g, b );
	const min = Math.min( r, g, b );
	const d = max - min;
	let h = 0;
	if ( d ) {
		if ( max === r ) {
			h = ( ( g - b ) / d ) % 6;
		} else if ( max === g ) {
			h = ( b - r ) / d + 2;
		} else {
			h = ( r - g ) / d + 4;
		}
		h *= 60;
		if ( h < 0 ) {
			h += 360;
		}
	}
	return { h, s: max ? ( d / max ) * 100 : 0, v: max * 100 };
};

/**
 * @param {number} h Hue 0–360.
 * @param {number} s Saturation 0–100.
 * @param {number} v Value 0–100.
 * @return {string} `#RRGGBB`.
 */
export const hsvToHex = ( h, s, v ) => {
	const sat = s / 100;
	const val = v / 100;
	const f = ( n ) => {
		const k = ( n + h / 60 ) % 6;
		return val - val * sat * Math.max( 0, Math.min( k, 4 - k, 1 ) );
	};
	return rgbToHex( f( 5 ) * 255, f( 3 ) * 255, f( 1 ) * 255 );
};

/**
 * @param {string} hex `#RRGGBB`.
 * @return {number[]} [ hue 0–360, saturation 0–100, lightness 0–100 ].
 */
export const hexToHsl = ( hex ) => {
	const [ r, g, b ] = hexToRgb( hex ).map( ( x ) => x / 255 );
	const max = Math.max( r, g, b );
	const min = Math.min( r, g, b );
	const l = ( max + min ) / 2;
	const d = max - min;
	let h = 0;
	let s = 0;
	if ( d ) {
		s = d / ( 1 - Math.abs( 2 * l - 1 ) );
		if ( max === r ) {
			h = ( ( g - b ) / d ) % 6;
		} else if ( max === g ) {
			h = ( b - r ) / d + 2;
		} else {
			h = ( r - g ) / d + 4;
		}
		h = Math.round( h * 60 );
		if ( h < 0 ) {
			h += 360;
		}
	}
	return [ h, Math.round( s * 100 ), Math.round( l * 100 ) ];
};

/**
 * @param {number} h Hue 0–360.
 * @param {number} s Saturation 0–100.
 * @param {number} l Lightness 0–100.
 * @return {string} `#RRGGBB`.
 */
export const hslToHex = ( h, s, l ) => {
	const sat = s / 100;
	const light = l / 100;
	const c = ( 1 - Math.abs( 2 * light - 1 ) ) * sat;
	const x = c * ( 1 - Math.abs( ( ( h / 60 ) % 2 ) - 1 ) );
	const m = light - c / 2;
	let rgb;
	if ( h < 60 ) {
		rgb = [ c, x, 0 ];
	} else if ( h < 120 ) {
		rgb = [ x, c, 0 ];
	} else if ( h < 180 ) {
		rgb = [ 0, c, x ];
	} else if ( h < 240 ) {
		rgb = [ 0, x, c ];
	} else if ( h < 300 ) {
		rgb = [ x, 0, c ];
	} else {
		rgb = [ c, 0, x ];
	}
	return rgbToHex( ...rgb.map( ( q ) => ( q + m ) * 255 ) );
};
