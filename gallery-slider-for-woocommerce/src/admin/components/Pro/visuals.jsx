import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { PointerIcon } from './shared';

/**
 * Animated visuals of the feature popover and of the section upsell card,
 * ported from the free design (`fpop*` and `upVis*`). Every animation is CSS
 * (keyframes in `editor.scss`); the product pictures are the photos of the
 * Setup Wizard (`admin/img/setup-wizard/`).
 *
 * @since 4.0.0
 */

// Photo of each picture: 1–4 are the gallery images, 'bag' a second product.
const PHOTOS = {
	1: 'kd17-lateral.jpg',
	2: 'kd17-medial.jpg',
	3: 'kd17-pair-front.jpg',
	4: 'kd17-top.jpg',
	bag: 'kd17-pair-back.jpg',
};

/**
 * Product picture.
 *
 * @param {Object} props
 * @param {string} props.art       1–4 or 'bag'.
 * @param {string} props.size      `background-size`.
 * @param {string} props.className Class with the box and the animation.
 * @param {Object} props.style     Extra style.
 * @param {*}      props.children  Content drawn over the picture.
 */
const Art = ( { art = 1, size = '100%', className = '', style, children } ) => {
	const pluginUrl = useSelect(
		( select ) => select( STORE_NAME ).getDashboardInfo().pluginUrl || '',
		[]
	);
	// Until the dashboard data loads, the URL would resolve against wp-admin.
	const photo = PHOTOS[ art ] || PHOTOS[ 1 ];
	const backgroundImage = pluginUrl
		? `url("${ pluginUrl }admin/img/setup-wizard/${ photo }")`
		: undefined;

	return (
		<span
			className={ `wcgs-pa sp-d-block ${ className }`.trim() }
			style={ { backgroundImage, backgroundSize: size, ...style } }
		>
			{ children }
		</span>
	);
};

/**
 * The four product thumbnails under a main picture; the first is active.
 *
 * @param {Object} props
 * @param {number} props.size Tile size in px.
 */
const Thumbs = ( { size } ) => (
	<span className="wcgs-fpv__thumbs sp-d-flex">
		{ [ 1, 2, 3, 4 ].map( ( art ) => (
			<Art
				key={ art }
				art={ art }
				size="contain"
				className={ `wcgs-fpv__thumb${
					1 === art ? ' is-active' : ''
				}` }
				style={ { width: size, height: size, flexBasis: size } }
			/>
		) ) }
	</span>
);

/**
 * Pill with labels that take turns (the design's `tnLbl` badges).
 *
 * @param {Object} props
 * @param {number} props.width  Pill width in px.
 * @param {Array}  props.labels Three label elements.
 */
const CycleBadge = ( { width, labels } ) => (
	<span className="wcgs-fpv__badge" style={ { width } }>
		{ labels.map( ( label, index ) => (
			<span
				key={ index }
				className="wcgs-fpv__badge-item sp-d-flex sp-align-center sp-justify-center"
				style={ { animationDelay: `${ index * 3 }s` } }
			>
				{ label }
			</span>
		) ) }
	</span>
);

const Value = ( { name, value } ) => (
	<span>
		{ name } <b>{ value }</b>
	</span>
);

// Default: the gallery cycles through its images while a pointer picks thumbnails.
const ProductCycle = () => (
	<div className="wcgs-fpv-cycle sp-d-flex sp-flex-col sp-gap-6px">
		<div className="wcgs-fpv-cycle__main">
			<Art size="contain" className="wcgs-fpv-cycle__layer" />
			{ [ 1, 2, 3, 4 ].map( ( art, index ) => (
				<Art
					key={ art }
					art={ art }
					size="contain"
					className="wcgs-fpv-cycle__layer is-fading"
					style={ { animationDelay: `${ 1.2 + index * 2 }s` } }
				/>
			) ) }
			<span className="wcgs-fpv-cycle__ring" />
		</div>
		<div className="wcgs-fpv-cycle__thumbs sp-d-flex sp-gap-6px">
			{ [ 1, 2, 3, 4 ].map( ( art ) => (
				<Art
					key={ art }
					art={ art }
					size="contain"
					className="wcgs-fpv-cycle__thumb sp-flex-1 sp-min-w-0"
				/>
			) ) }
			{ [ 0, 1, 2, 3 ].map( ( index ) => (
				<span
					key={ index }
					className="wcgs-fpv-cycle__active"
					style={ {
						left: `calc(${ index } * ((100% - 18px) / 4 + 6px))`,
						animationDelay: `${ 1.2 + index * 2 }s`,
					} }
				/>
			) ) }
			<span className="wcgs-fpv-cycle__pointer-in">
				<span className="wcgs-fpv-cycle__pointer">
					<span className="wcgs-fpv-cycle__glow" />
					<PointerIcon size={ 20 } />
				</span>
			</span>
		</div>
	</div>
);

// Outside zoom: a lens moves over the image, the zoom window follows.
const ZoomOut = () => (
	<div className="wcgs-fpv-center sp-d-flex sp-align-center sp-justify-center is-gap">
		<div className="wcgs-fpv__col sp-d-flex sp-flex-col">
			<Art className="wcgs-fpv-zoomout__main">
				<span className="wcgs-fpv-zoomout__lens">
					<PointerIcon size={ 18 } className="is-centered" />
				</span>
			</Art>
			<Thumbs size={ 28.3 } />
		</div>
		<div className="wcgs-fpv-zoomout__side sp-d-flex sp-flex-col sp-gap-4px">
			<span className="wcgs-fpv-zoomout__label">
				{ __( 'Zoom window', 'gallery-slider-for-woocommerce' ) }
			</span>
			<Art size="291%" className="wcgs-fpv-zoomout__window" />
		</div>
	</div>
);

// Magnific zoom: a round lens enlarges what is under the pointer.
const ZoomLens = () => (
	<div className="wcgs-fpv-center sp-d-flex sp-align-center sp-justify-center">
		<div className="wcgs-fpv__col sp-d-flex sp-flex-col">
			<Art size="150px 150px" className="wcgs-fpv__main is-150">
				<Art size="300px 300px" className="wcgs-fpv-zoomlens__lens">
					<PointerIcon size={ 18 } className="is-centered" />
				</Art>
			</Art>
			<Thumbs size={ 33.8 } />
		</div>
	</div>
);

// Mouse-wheel zoom: the image grows while the wheel turns.
const ZoomWheel = () => (
	<div className="wcgs-fpv-center sp-d-flex sp-align-center sp-justify-center">
		<div className="wcgs-fpv__col sp-d-flex sp-flex-col">
			<Art className="wcgs-fpv__main is-150 wcgs-fpv-zwheel__main">
				<span className="wcgs-fpv-zwheel__mouse sp-d-flex sp-align-center sp-justify-center">
					<span className="wcgs-fpv-zwheel__body">
						<span className="wcgs-fpv-zwheel__wheel" />
					</span>
				</span>
			</Art>
			<Thumbs size={ 33.75 } />
		</div>
	</div>
);

// Zoom scale: the lens magnifies 1.5x, 2x, then 3x.
const ZoomScale = () => (
	<div className="wcgs-fpv-center sp-d-flex sp-align-center sp-justify-center">
		<CycleBadge
			width={ 92 }
			labels={ [ '1.5x', '2x', '3x' ].map( ( value ) => (
				<Value
					key={ value }
					name={ __( 'Scale', 'gallery-slider-for-woocommerce' ) }
					value={ value }
				/>
			) ) }
		/>
		<div className="wcgs-fpv__col sp-d-flex sp-flex-col">
			<Art className="wcgs-fpv__main is-150">
				<Art
					size="225px 225px"
					className="wcgs-fpv-lens is-round wcgs-fpv-zscale__lens"
				/>
			</Art>
			<Thumbs size={ 33.75 } />
		</div>
	</div>
);

// Lens style: round, rounded and square lenses.
const LensStyle = () => (
	<div className="wcgs-fpv-center sp-d-flex sp-align-center sp-justify-center">
		<CycleBadge
			width={ 82 }
			labels={ [
				__( 'Round', 'gallery-slider-for-woocommerce' ),
				__( 'Rounded', 'gallery-slider-for-woocommerce' ),
				__( 'Square', 'gallery-slider-for-woocommerce' ),
			] }
		/>
		<div className="wcgs-fpv__col sp-d-flex sp-flex-col">
			<Art className="wcgs-fpv__main is-150">
				<Art
					size="300px 300px"
					className="wcgs-fpv-lens wcgs-fpv-zlstyle__lens"
				/>
			</Art>
			<Thumbs size={ 33.75 } />
		</div>
	</div>
);

// Thumbnails navigation box size: the arrows' boxes change size.
const ThumbNavBox = () => (
	<div className="wcgs-fpv-center sp-d-flex sp-align-center sp-justify-center">
		<CycleBadge
			width={ 156 }
			labels={ [
				[ '16px', '100%' ],
				[ '16px', '50%' ],
				[ '24px', '50%' ],
			].map( ( [ width, height ] ) => (
				<span
					key={ width + height }
					className="wcgs-fpv__pair sp-d-flex sp-gap-10px"
				>
					<Value
						name={ __( 'Width', 'gallery-slider-for-woocommerce' ) }
						value={ width }
					/>
					<Value
						name={ __(
							'Height',
							'gallery-slider-for-woocommerce'
						) }
						value={ height }
					/>
				</span>
			) ) }
		/>
		<div className="wcgs-fpv-tnbox sp-d-flex sp-flex-col sp-gap-6px">
			<Art size="contain" className="wcgs-fpv-tnbox__main" />
			<div className="wcgs-fpv-tnbox__strip sp-d-flex sp-gap-6px">
				{ [ 1, 2, 3, 4 ].map( ( art ) => (
					<Art
						key={ art }
						art={ art }
						size="contain"
						className={ `wcgs-fpv-tnbox__thumb sp-flex-1 sp-min-w-0${
							1 === art ? ' is-active' : ''
						}` }
					/>
				) ) }
				<span className="wcgs-fpv-tnbox__arrow sp-d-flex sp-align-center sp-justify-center is-left">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M15 5l-7 7 7 7" />
					</svg>
				</span>
				<span className="wcgs-fpv-tnbox__arrow sp-d-flex sp-align-center sp-justify-center is-right">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M9 5l7 7-7 7" />
					</svg>
				</span>
			</div>
		</div>
	</div>
);

const PlayGlyph = ( { size } ) => (
	<svg width={ size } height={ size } viewBox="0 0 24 24" aria-hidden="true">
		<path d="M8 5.5v13l10.5-6.5z" fill="#fff" />
	</svg>
);

// Playlist button: the button opens a playlist of the product's videos.
// The videos are a static mock (no embedded players).
const Playlist = () => {
	const videos = [
		__( 'First Look — On-Body Review', 'gallery-slider-for-woocommerce' ),
		__( 'Fabric & Fit Close-Up', 'gallery-slider-for-woocommerce' ),
		__( 'Three Ways to Style It', 'gallery-slider-for-woocommerce' ),
	];
	return (
		<div className="wcgs-fpv-playlist">
			<div className="wcgs-fpv-center sp-d-flex sp-align-center sp-justify-center">
				<div className="wcgs-fpv__col sp-d-flex sp-flex-col">
					<Art className="wcgs-fpv__main is-150">
						<span className="wcgs-fpv-playlist__button sp-d-flex sp-align-center sp-gap-6px">
							<PlayGlyph size={ 14 } />
							<span className="wcgs-fpv-playlist__button-label">
								{ __(
									'Watch Videos',
									'gallery-slider-for-woocommerce'
								) }
							</span>
						</span>
					</Art>
					<Thumbs size={ 33.75 } />
				</div>
			</div>
			<div className="wcgs-fpv-playlist__overlay sp-d-flex sp-align-center sp-justify-center">
				<div className="wcgs-fpv-playlist__panel sp-d-flex sp-w-full">
					<div className="wcgs-fpv-playlist__video">
						<Art
							size="contain"
							className="wcgs-fpv-playlist__frame"
						/>
						<Art
							art={ 2 }
							size="contain"
							className="wcgs-fpv-playlist__frame is-next"
						/>
						<span className="wcgs-fpv-playlist__progress">
							<span />
						</span>
					</div>
					<div className="wcgs-fpv-playlist__list sp-flex-1 sp-min-w-0 sp-d-flex sp-flex-col">
						<div className="wcgs-fpv-playlist__head sp-d-flex sp-flex-col sp-gap-2px">
							<div className="wcgs-fpv-playlist__title sp-d-flex sp-align-center sp-justify-between sp-gap-4px">
								<span>
									{ __(
										'Classic Crew Pullover',
										'gallery-slider-for-woocommerce'
									) }
								</span>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M6 6l12 12M18 6 6 18" />
								</svg>
							</div>
							<span className="wcgs-fpv-playlist__count">
								{ __(
									'Product Videos · 3',
									'gallery-slider-for-woocommerce'
								) }
							</span>
						</div>
						<div className="wcgs-fpv-playlist__rows sp-d-flex sp-flex-col sp-gap-2px">
							{ videos.map( ( title, index ) => (
								<div
									key={ title }
									className={ `wcgs-fpv-playlist__row sp-d-flex sp-align-center is-${
										index + 1
									}` }
								>
									<span className="wcgs-fpv-playlist__index">
										{ index + 1 }
									</span>
									<Art
										art={ index + 1 }
										size="contain"
										className="wcgs-fpv-playlist__thumb"
									/>
									<span className="wcgs-fpv-playlist__name sp-flex-1 sp-min-w-0">
										{ title }
									</span>
								</div>
							) ) }
						</div>
					</div>
				</div>
			</div>
			<PointerIcon size={ 16 } className="wcgs-fpv-playlist__pointer" />
		</div>
	);
};

/**
 * Grid of the locked options behind a "+N" tile.
 *
 * @param {Object} props
 * @param {Array}  props.items `[ { label, path, fillPath, preview } ]`: icons
 *                             have `path`/`fillPath`, cards a `preview` element.
 */
const PreviewGrid = ( { items } ) => {
	const isIcons = items.some( ( item ) => item.path || item.fillPath );
	const columns = isIcons ? 5 : Math.min( 3, items.length || 1 );
	return (
		<div
			className="wcgs-fpv-grid sp-d-grid sp-gap-8px"
			style={ {
				gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
			} }
		>
			{ items.map( ( item, index ) => (
				<div
					key={ index }
					className="wcgs-fpv-grid__item sp-min-w-0 sp-d-flex sp-flex-col sp-align-center sp-gap-6px"
					title={ item.title || item.label }
				>
					{ isIcons && (
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#45464A"
							strokeWidth="1.6"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							{ item.path && <path d={ item.path } /> }
							{ item.fillPath && (
								<path
									d={ item.fillPath }
									fill="#45464A"
									fillRule="evenodd"
									stroke="none"
								/>
							) }
						</svg>
					) }
					{ item.preview && (
						<span className="wcgs-fpv-grid__preview sp-d-flex sp-align-center sp-justify-center sp-gap-3px">
							{ item.preview }
						</span>
					) }
					{ item.label && (
						<span className="wcgs-fpv-grid__label">
							{ item.label }
						</span>
					) }
				</div>
			) ) }
		</div>
	);
};

const VISUALS = {
	product: ProductCycle,
	zoomout: ZoomOut,
	zoomlens: ZoomLens,
	zwheel: ZoomWheel,
	zscale: ZoomScale,
	zlstyle: LensStyle,
	tnbox: ThumbNavBox,
	playlist: Playlist,
};

/**
 * Visual area of the feature popover.
 *
 * @param {Object} props
 * @param {string} props.visual  Variant key (see `VISUALS`).
 * @param {Array}  props.preview Locked options to show in a grid instead.
 */
export const PopoverVisual = ( { visual = 'product', preview } ) => {
	const Visual = VISUALS[ visual ] || ProductCycle;
	return (
		<div className="wcgs-fpop__visual">
			<div className="wcgs-fpop__visual-box">
				{ preview ? <PreviewGrid items={ preview } /> : <Visual /> }
			</div>
		</div>
	);
};

/**
 * Shop Page Video upsell: three product cards; the middle one turns and
 * plays its video after a click.
 */
export const ShopVideoVisual = () => (
	<div className="wcgs-upv-shop sp-d-flex sp-align-center sp-justify-center sp-gap-12px">
		{ [ 'bag', 1, 3 ].map( ( art, index ) => (
			<div
				key={ art }
				className="wcgs-upv-shop__card sp-d-flex sp-flex-col"
			>
				{ 1 === index ? (
					<span className="wcgs-upv-shop__tile is-video">
						<span className="wcgs-upv-shop__stage">
							<Art
								size="contain"
								className="wcgs-upv-shop__orbit"
								style={ { backgroundColor: 'transparent' } }
							/>
						</span>
						<span className="wcgs-upv-shop__sheen" />
						<span className="wcgs-upv-shop__vignette" />
						<span className="wcgs-upv-shop__bar">
							<span />
						</span>
						<Art size="contain" className="wcgs-upv-shop__cover" />
						<span className="wcgs-upv-shop__click" />
						<span className="wcgs-upv-shop__play">
							<span>
								<PlayGlyph size={ 10 } />
							</span>
						</span>
					</span>
				) : (
					<Art
						art={ art }
						size="contain"
						className="wcgs-upv-shop__tile"
					/>
				) }
				<span className="wcgs-upv-shop__line sp-d-block" />
				<span className="wcgs-upv-shop__line sp-d-block is-price" />
			</div>
		) ) }
		<PointerIcon size={ 16 } className="wcgs-upv-shop__pointer" />
	</div>
);
