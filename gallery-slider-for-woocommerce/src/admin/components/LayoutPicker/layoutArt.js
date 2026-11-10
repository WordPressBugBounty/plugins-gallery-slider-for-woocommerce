/**
 * Wireframe art of each gallery layout, ported from `_layArt` in the Reno
 * settings design. Shapes are drawn on a small grid (W × H units), then scaled
 * to fit the frame.
 */

const GAP = 1.6;

// Layouts without a thumbnail strip use one flat shade for every tile.
const FLAT_LAYOUTS = [
	'hide_thumb',
	'grid',
	'modern',
	'modern_grid',
	'anchor_navigation',
	'vertical_scroll',
	'multi_row_thumb',
];

/**
 * Raw shapes of a layout: `[ kind, x, y, w, h, flag ]` in grid units.
 * Kinds: 'm' main image (flag: draw slider arrows), 't' thumbnail,
 * 'ti' large tile, 'd' dot (flag: active).
 *
 * @param {string} key Layout key.
 * @return {Object} `{ W, H, shapes }`.
 */
const layoutShapes = ( key ) => {
	const S = [];
	const m = ( x, y, w, h, slider ) => S.push( [ 'm', x, y, w, h, slider ] );
	const t = ( x, y, w, h ) => S.push( [ 't', x, y, w, h ] );
	const ti = ( x, y, w, h ) => S.push( [ 'ti', x, y, w, h ] );
	const d = ( x, y, r, active ) => S.push( [ 'd', x, y, r, r, active ] );
	const row = ( n, x, y, w, h, kind = 't' ) => {
		const cw = ( w - GAP * ( n - 1 ) ) / n;
		for ( let i = 0; i < n; i++ ) {
			S.push( [ kind, x + i * ( cw + GAP ), y, cw, h ] );
		}
	};
	const col = ( n, x, y, w, h ) => {
		const ch = ( h - GAP * ( n - 1 ) ) / n;
		for ( let i = 0; i < n; i++ ) {
			t( x, y + i * ( ch + GAP ), w, ch );
		}
	};

	switch ( key ) {
		case 'vertical':
			col( 3, 0, 0, 7.4, 24 );
			m( 9, 0, 24, 24, true );
			return { W: 33, H: 24, shapes: S };
		case 'vertical_right':
			m( 0, 0, 24, 24, true );
			col( 3, 25.6, 0, 7.4, 24 );
			return { W: 33, H: 24, shapes: S };
		case 'horizontal_top':
			row( 3, 0, 0, 24, 7.4 );
			m( 0, 9, 24, 24, true );
			return { W: 24, H: 33, shapes: S };
		case 'hide_thumb':
			m( 0, 0, 26, 26, true );
			return { W: 26, H: 26, shapes: S };
		case 'grid':
			ti( 0, 0, 12.2, 12.2 );
			ti( 13.8, 0, 12.2, 12.2 );
			ti( 0, 13.8, 12.2, 12.2 );
			ti( 13.8, 13.8, 12.2, 12.2 );
			return { W: 26, H: 26, shapes: S };
		case 'modern':
			ti( 0, 0, 26, 14 );
			ti( 0, 15.6, 12.2, 14.4 );
			ti( 13.8, 15.6, 12.2, 14.4 );
			return { W: 26, H: 30, shapes: S };
		case 'modern_grid':
			row( 3, 0, 0, 26, 7 );
			ti( 0, 8.6, 26, 11 );
			row( 2, 0, 21.2, 26, 8, 'ti' );
			row( 3, 0, 30.8, 26, 7 );
			return { W: 26, H: 36, shapes: S };
		case 'anchor_navigation':
			d( 0, 5, 2.4, true );
			d( 0, 9.6, 2.4 );
			d( 0, 14.2, 2.4 );
			ti( 5.4, 0, 27.6, 14.2 );
			ti( 5.4, 15.8, 27.6, 14.2 );
			return { W: 33, H: 30, shapes: S };
		case 'vertical_scroll':
			col( 3, 0, 0, 7.4, 22 );
			ti( 9, 0, 24, 12.4 );
			ti( 9, 14, 24, 12.4 );
			ti( 9, 28, 24, 12.4 );
			return { W: 33, H: 30, shapes: S };
		case 'multi_row_thumb':
			ti( 0, 0, 28, 17 );
			row( 4, 0, 18.6, 28, 4.9 );
			row( 4, 0, 25.1, 28, 4.9 );
			return { W: 28, H: 30, shapes: S };
		default:
			// 'horizontal': thumbs below the main image.
			m( 0, 0, 26, 24, true );
			row( 3, 0, 25.6, 26, 7.4 );
			return { W: 26, H: 33, shapes: S };
	}
};

/**
 * Art of a layout scaled to fit `frameWidth` × `frameHeight` px.
 *
 * @param {string} key         Layout key.
 * @param {number} frameWidth  Max width in px.
 * @param {number} frameHeight Max height in px.
 * @return {Object} `{ width, height, shapes: [ { style, slider } ] }`.
 */
export const layoutArt = ( key, frameWidth, frameHeight ) => {
	const { W, H, shapes } = layoutShapes( key );
	const scale = Math.min( frameWidth / W, frameHeight / H );
	const flat = FLAT_LAYOUTS.includes( key );

	return {
		width: +( W * scale ).toFixed( 1 ),
		height: +( H * scale ).toFixed( 1 ),
		shapes: shapes.map( ( [ kind, x, y, w, h, flag ] ) => {
			const isDot = 'd' === kind;
			const isBig = 'm' === kind || 'ti' === kind;
			let background = '#C8CACF';
			if ( isDot ) {
				background = flag ? '#6B6E75' : '#C4C6CB';
			} else if ( ! flat ) {
				background = isBig ? '#D8D9DD' : '#BFC1C6';
			}
			return {
				slider: 'm' === kind && !! flag,
				style: {
					left: `${ ( x / W ) * 100 }%`,
					top: `${ ( y / H ) * 100 }%`,
					width: `${ ( w / W ) * 100 }%`,
					height: `${ ( h / H ) * 100 }%`,
					borderRadius: isDot
						? '50%'
						: `${ Math.max(
								1,
								scale * 0.6 * ( isBig ? 1 : 0.6 )
						  ).toFixed( 1 ) }px`,
					background,
				},
			};
		} ),
	};
};
