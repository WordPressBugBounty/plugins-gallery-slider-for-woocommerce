import { cssToStyle } from './options';

/**
 * Row of small shapes drawn from the design's inline CSS (dropdown visuals).
 *
 * @param {Object} props
 * @param {Array}  props.parts `[ [ css, text ] ]`.
 */
export const Visual = ( { parts = [] } ) =>
	parts.map( ( [ css, text ], index ) => (
		<span key={ index } style={ cssToStyle( css ) }>
			{ text }
		</span>
	) );

const SHIRT_PATH =
	'M8.2 3.2 3.6 5.6 1.8 9.6l3.1 1.7 1.3-.9V21h11.6V10.4l1.3.9 3.1-1.7-1.8-4-4.6-2.4c-.7 1.5-2.1 2.4-3.8 2.4S8.9 4.7 8.2 3.2z';

// Middle tile of each active thumbnail style (the design's card art).
const ACTIVE_TILE = {
	border_around: ( color ) => ( { tile: `border:1.5px solid ${ color };` } ),
	top_line: () => ( { line: 'top:-6px;' } ),
	bottom_line: () => ( { line: 'bottom:-6px;' } ),
	zoom_out: ( color ) => ( {
		tile: `background:#fff;border:1.5px solid ${ color };`,
		size: 11,
	} ),
	opacity: () => ( { tile: 'background:#F1F2F4;', icon: 'opacity:.4;' } ),
};

/**
 * Three thumbnails with the middle one in the given active style.
 *
 * @param {Object} props
 * @param {string} props.style Legacy `thumbnail_style` value.
 * @param {string} props.color Active border or line color.
 */
export const ActiveThumbPreview = ( { style, color } ) =>
	[ 0, 1, 2 ].map( ( index ) => {
		const active =
			1 === index && ACTIVE_TILE[ style ]
				? ACTIVE_TILE[ style ]( color )
				: {};
		const size = active.size || 15;
		return (
			<span
				key={ index }
				className="wcgs-thumb-preview sp-flex-center"
				style={ cssToStyle( active.tile || '' ) }
			>
				<svg
					viewBox="0 0 24 24"
					aria-hidden="true"
					style={ {
						width: size,
						height: size,
						...cssToStyle( active.icon || '' ),
					} }
				>
					<path d={ SHIRT_PATH } />
				</svg>
				{ active.line && (
					<span
						className="wcgs-thumb-preview__line"
						style={ {
							background: color,
							...cssToStyle( active.line ),
						} }
					/>
				) }
			</span>
		);
	} );
