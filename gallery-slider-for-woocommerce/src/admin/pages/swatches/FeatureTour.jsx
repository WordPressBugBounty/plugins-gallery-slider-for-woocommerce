import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { CLOSE_PATH, StrokeIcon } from '../wizard/icons';
import Photo from './Photo';
import {
	COLORS,
	Chip,
	Dot,
	LABEL_COLOR,
	LABEL_SIZE,
	OptionLabel,
} from './atoms';

const CHEVRON_DOWN_PATH = 'm6 9 6 6 6-6';

/* ----- Stage panels, one per feature. ----- */

const ColorPanel = () => (
	<div className="wcgs-sw-stage__stack sp-d-flex sp-flex-col sp-gap-14px">
		<div className="wcgs-sw-before sp-d-flex sp-align-center sp-gap-12px">
			<span className="wcgs-sw-eyebrow is-muted">
				{ __( 'Before', 'gallery-slider-for-woocommerce' ) }
			</span>
			<span className="wcgs-sw-before__select sp-d-flex sp-align-center sp-justify-between">
				{ __( 'Choose an option', 'gallery-slider-for-woocommerce' ) }
				<StrokeIcon
					path={ CHEVRON_DOWN_PATH }
					size={ 12 }
					strokeWidth={ 2.4 }
				/>
			</span>
		</div>
		<div className="wcgs-sw-panel is-row sp-d-flex">
			<Photo name="pulloverModel" className="wcgs-sw-panel__image" />
			<div className="sp-d-flex sp-flex-col sp-justify-center sp-gap-12px sp-min-w-0">
				<span className="wcgs-sw-eyebrow">
					{ __( 'After', 'gallery-slider-for-woocommerce' ) }
				</span>
				<OptionLabel
					label={ LABEL_COLOR }
					value={ __( 'Forest', 'gallery-slider-for-woocommerce' ) }
				/>
				<div className="sp-d-flex sp-flex-wrap sp-gap-10px">
					{ [
						COLORS.forest,
						COLORS.navy,
						COLORS.burgundy,
						COLORS.stone,
						COLORS.twoTone,
					].map( ( color, i ) => (
						<Dot
							key={ color }
							color={ color }
							size={ 34 }
							active={ 0 === i }
						/>
					) ) }
				</div>
			</div>
		</div>
	</div>
);

const ImagePanel = () => {
	const tiles = [
		[ 'pulloverModel', __( 'Forest', 'gallery-slider-for-woocommerce' ) ],
		[ 'anorakFlat', __( 'Burgundy', 'gallery-slider-for-woocommerce' ) ],
		[ 'pulloverDetail', __( 'Navy', 'gallery-slider-for-woocommerce' ) ],
		[ 'pulloverCuff', __( 'Stone', 'gallery-slider-for-woocommerce' ) ],
	];
	return (
		<div className="wcgs-sw-panel sp-d-flex sp-flex-col sp-gap-16px">
			<OptionLabel label={ LABEL_COLOR } value={ tiles[ 1 ][ 1 ] } />
			<div className="wcgs-sw-tiles sp-d-grid sp-gap-12px">
				{ tiles.map( ( [ name, label ], i ) => (
					<div
						key={ name }
						className={ `wcgs-sw-tile sp-d-flex sp-flex-col sp-align-center sp-gap-8px${
							1 === i ? ' is-active' : ''
						}` }
					>
						<Photo name={ name } className="wcgs-sw-tile__image" />
						<span className="wcgs-sw-tile__name">{ label }</span>
					</div>
				) ) }
			</div>
		</div>
	);
};

const LabelPanel = () => (
	<div className="wcgs-sw-panel sp-d-flex sp-flex-col sp-gap-20px">
		<div className="sp-d-flex sp-flex-col sp-gap-10px">
			<OptionLabel label={ LABEL_SIZE } value="M" />
			<div className="sp-d-flex sp-flex-wrap sp-gap-8px">
				<Chip>S</Chip>
				<Chip active>M</Chip>
				<Chip>L</Chip>
				<Chip>XL</Chip>
			</div>
		</div>
		<div className="sp-d-flex sp-flex-col sp-gap-10px">
			<OptionLabel
				label={ __( 'Fit:', 'gallery-slider-for-woocommerce' ) }
				value={ __( 'Regular', 'gallery-slider-for-woocommerce' ) }
			/>
			<div className="sp-d-flex sp-flex-wrap sp-gap-8px">
				<Chip variant="pill">
					{ __( 'Slim', 'gallery-slider-for-woocommerce' ) }
				</Chip>
				<Chip variant="pill" active>
					{ __( 'Regular', 'gallery-slider-for-woocommerce' ) }
				</Chip>
				<Chip variant="pill">
					{ __( 'Relaxed', 'gallery-slider-for-woocommerce' ) }
				</Chip>
			</div>
		</div>
		<div className="sp-d-flex sp-flex-col sp-gap-10px">
			<OptionLabel
				label={ __( 'Material:', 'gallery-slider-for-woocommerce' ) }
				value={ __( 'Fleece', 'gallery-slider-for-woocommerce' ) }
			/>
			<div className="sp-d-flex sp-flex-wrap sp-gap-8px">
				<Chip variant="blue">
					{ __( 'Cotton', 'gallery-slider-for-woocommerce' ) }
				</Chip>
				<Chip variant="blue" active>
					{ __( 'Fleece', 'gallery-slider-for-woocommerce' ) }
				</Chip>
				<Chip variant="blue">
					{ __( 'Shell', 'gallery-slider-for-woocommerce' ) }
				</Chip>
			</div>
		</div>
	</div>
);

const ShopPanel = () => {
	const cards = [
		{
			photo: 'pulloverModel',
			name: __( 'Course Anorak', 'gallery-slider-for-woocommerce' ),
			price: '$89.00',
			colors: [ COLORS.forest, COLORS.burgundy, COLORS.navy ],
		},
		{
			photo: 'anorakModel',
			name: __( 'Clima Shell', 'gallery-slider-for-woocommerce' ),
			price: '$104.00',
			colors: [ COLORS.burgundy, COLORS.charcoal ],
		},
		{
			photo: 'pulloverDetail',
			name: __( 'Half-Zip Pullover', 'gallery-slider-for-woocommerce' ),
			price: '$72.00',
			colors: [ COLORS.navy, COLORS.stone, COLORS.forest ],
			more: '+2',
		},
	];
	return (
		<div className="wcgs-sw-shop sp-d-grid sp-gap-14px">
			{ cards.map( ( card ) => (
				<div
					key={ card.photo }
					className="wcgs-sw-shop__card sp-d-flex sp-flex-col sp-gap-10px"
				>
					<Photo
						name={ card.photo }
						className="wcgs-sw-shop__image"
					/>
					<span className="wcgs-sw-shop__name">{ card.name }</span>
					<span className="wcgs-sw-shop__price">{ card.price }</span>
					<div className="sp-d-flex sp-align-center sp-gap-6px">
						{ card.colors.map( ( color, i ) => (
							<Dot
								key={ color }
								color={ color }
								size={ 16 }
								active={ 0 === i }
								className="is-tiny"
							/>
						) ) }
						{ card.more && (
							<span className="wcgs-sw-shop__more">
								{ card.more }
							</span>
						) }
					</div>
				</div>
			) ) }
		</div>
	);
};

const StockPanel = () => (
	<div className="wcgs-sw-stock sp-d-grid sp-gap-14px">
		<div className="wcgs-sw-panel is-compact sp-d-flex sp-flex-col sp-gap-14px">
			<span className="wcgs-sw-eyebrow">
				{ __( 'Crossed out', 'gallery-slider-for-woocommerce' ) }
			</span>
			<div className="sp-d-flex sp-gap-10px">
				<Dot color={ COLORS.forest } />
				<Dot color={ COLORS.burgundy } className="is-out" />
				<Dot color={ COLORS.navy } />
			</div>
			<div className="sp-d-flex sp-flex-wrap sp-gap-6px">
				<Chip className="is-xs">M</Chip>
				<Chip className="is-xs">L</Chip>
				<Chip className="is-xs" out>
					XL
				</Chip>
			</div>
		</div>
		<div className="wcgs-sw-panel is-compact sp-d-flex sp-flex-col sp-gap-14px">
			<span className="wcgs-sw-eyebrow">
				{ __( 'Hidden', 'gallery-slider-for-woocommerce' ) }
			</span>
			<div className="sp-d-flex sp-gap-10px">
				<Dot color={ COLORS.forest } />
				<Dot color={ COLORS.navy } />
			</div>
			<div className="sp-d-flex sp-flex-wrap sp-gap-6px">
				<Chip className="is-xs">M</Chip>
				<Chip className="is-xs">L</Chip>
			</div>
		</div>
	</div>
);

// Colors of the synced-gallery demo, each with its own gallery image.
const SYNC_COLORS = [
	{
		name: __( 'Green / Navy', 'gallery-slider-for-woocommerce' ),
		swatch: 'linear-gradient(135deg, #1F5F4A 50%, #1E2A44 50%)',
		photo: 'pulloverModel',
	},
	{
		name: __( 'Burgundy', 'gallery-slider-for-woocommerce' ),
		swatch: COLORS.burgundy,
		photo: 'anorakFlat',
	},
];

const SyncPanel = () => {
	const [ index, setIndex ] = useState( 0 );
	const color = SYNC_COLORS[ index ];
	return (
		<div className="wcgs-sw-panel is-row is-sync sp-d-flex">
			<Photo
				key={ color.photo }
				name={ color.photo }
				className="wcgs-sw-panel__image is-large"
			/>
			<div className="sp-d-flex sp-flex-col sp-justify-center sp-gap-12px sp-min-w-0">
				<OptionLabel label={ LABEL_COLOR } value={ color.name } />
				<div
					className="sp-d-flex sp-gap-10px"
					role="group"
					aria-label={ __(
						'Color',
						'gallery-slider-for-woocommerce'
					) }
				>
					{ SYNC_COLORS.map( ( item, i ) => (
						<button
							key={ item.name }
							type="button"
							title={ item.name }
							aria-label={ item.name }
							aria-pressed={ i === index }
							className={ `wcgs-sw-dot is-button${
								i === index ? ' is-active' : ''
							}` }
							style={ { background: item.swatch } }
							onClick={ () => setIndex( i ) }
						/>
					) ) }
				</div>
				<span className="wcgs-sw-panel__hint">
					{ __(
						'Pick a color. The gallery switches to its photos.',
						'gallery-slider-for-woocommerce'
					) }
				</span>
			</div>
		</div>
	);
};

const TooltipPanel = () => (
	<div className="wcgs-sw-panel sp-d-flex sp-flex-col sp-gap-14px">
		<OptionLabel
			label={ LABEL_COLOR }
			value={ __( 'Forest', 'gallery-slider-for-woocommerce' ) }
		/>
		<div className="wcgs-sw-tips sp-d-flex sp-gap-12px">
			<Dot color={ COLORS.forest } size={ 34 } active />
			<Dot color={ COLORS.burgundy } size={ 34 } className="has-tip">
				<span className="wcgs-sw-tip sp-d-flex sp-flex-col sp-gap-6px">
					<Photo name="anorakFlat" className="wcgs-sw-tip__image" />
					<span className="wcgs-sw-tip__name">
						{ __( 'Burgundy', 'gallery-slider-for-woocommerce' ) }
					</span>
				</span>
			</Dot>
			<Dot color={ COLORS.navy } size={ 34 } />
			<Dot color={ COLORS.stone } size={ 34 } />
		</div>
	</div>
);

const ShapesPanel = () => {
	const shapes = [
		[ __( 'Circle', 'gallery-slider-for-woocommerce' ), '', 0 ],
		[ __( 'Rounded', 'gallery-slider-for-woocommerce' ), 'is-rounded', 1 ],
		[ __( 'Square', 'gallery-slider-for-woocommerce' ), 'is-square', 2 ],
	];
	const colors = [ COLORS.forest, COLORS.burgundy, COLORS.navy ];
	return (
		<div className="wcgs-sw-panel sp-d-flex sp-flex-col wcgs-sw-gap-18">
			{ shapes.map( ( [ label, shape, active ] ) => (
				<div
					key={ label }
					className="sp-d-flex sp-align-center sp-gap-16px"
				>
					<span className="wcgs-sw-panel__key">{ label }</span>
					<div className="sp-d-flex sp-gap-10px">
						{ colors.map( ( color, i ) => (
							<Dot
								key={ color }
								color={ color }
								size={ 32 }
								active={ i === active }
								className={ `is-flat ${ shape }` }
							/>
						) ) }
					</div>
				</div>
			) ) }
			<div className="sp-d-flex sp-align-center sp-gap-16px">
				<span className="wcgs-sw-panel__key">
					{ __( 'Size', 'gallery-slider-for-woocommerce' ) }
				</span>
				<div className="sp-d-flex sp-align-center sp-gap-10px">
					{ [ 22, 32, 42 ].map( ( size ) => (
						<Dot
							key={ size }
							color={ COLORS.forest }
							size={ size }
							className="is-flat"
						/>
					) ) }
				</div>
			</div>
		</div>
	);
};

const ClearPanel = () => (
	<div className="wcgs-sw-panel sp-d-flex sp-flex-col wcgs-sw-gap-18">
		<div className="sp-d-flex sp-flex-col sp-gap-10px">
			<OptionLabel
				label={ LABEL_COLOR }
				value={ __( 'Navy', 'gallery-slider-for-woocommerce' ) }
			/>
			<div className="sp-d-flex sp-gap-10px">
				<Dot color={ COLORS.forest } size={ 32 } />
				<Dot color={ COLORS.navy } size={ 32 } active />
				<Dot color={ COLORS.burgundy } size={ 32 } />
			</div>
		</div>
		<div className="sp-d-flex sp-flex-col sp-gap-10px">
			<OptionLabel label={ LABEL_SIZE } value="L" />
			<div className="sp-d-flex sp-gap-8px">
				<Chip>M</Chip>
				<Chip active>L</Chip>
				<Chip>XL</Chip>
			</div>
		</div>
		<div className="wcgs-sw-clear sp-d-flex sp-align-center sp-justify-between">
			<span className="wcgs-sw-clear__price">$89.00</span>
			<span className="wcgs-sw-clear__reset sp-d-i-flex sp-align-center sp-gap-6px">
				<StrokeIcon
					path={ CLOSE_PATH }
					size={ 13 }
					strokeWidth={ 2.4 }
				/>
				{ __( 'Clear selection', 'gallery-slider-for-woocommerce' ) }
			</span>
		</div>
	</div>
);

const FEATURES = [
	{
		title: __( 'Color swatches', 'gallery-slider-for-woocommerce' ),
		text: __(
			'Solid or two-tone colors in place of dropdowns.',
			'gallery-slider-for-woocommerce'
		),
		Panel: ColorPanel,
	},
	{
		title: __( 'Image swatches', 'gallery-slider-for-woocommerce' ),
		text: __(
			'Use product photos as the swatch itself.',
			'gallery-slider-for-woocommerce'
		),
		Panel: ImagePanel,
	},
	{
		title: __(
			'Label and button swatches',
			'gallery-slider-for-woocommerce'
		),
		text: __(
			'Sizes, fits and materials as tap-ready buttons.',
			'gallery-slider-for-woocommerce'
		),
		Panel: LabelPanel,
	},
	{
		title: __(
			'Swatches on the Shop page',
			'gallery-slider-for-woocommerce'
		),
		text: __(
			'Shoppers preview colors right on product cards.',
			'gallery-slider-for-woocommerce'
		),
		Panel: ShopPanel,
	},
	{
		title: __( 'Out-of-stock handling', 'gallery-slider-for-woocommerce' ),
		text: __(
			'Unavailable options are crossed out or hidden.',
			'gallery-slider-for-woocommerce'
		),
		Panel: StockPanel,
	},
	{
		title: __(
			'Synced with your gallery',
			'gallery-slider-for-woocommerce'
		),
		text: __(
			'A swatch click switches Reno Product Gallery images.',
			'gallery-slider-for-woocommerce'
		),
		Panel: SyncPanel,
	},
	{
		title: __( 'Tooltips on hover', 'gallery-slider-for-woocommerce' ),
		text: __(
			'Show the variant name or a photo preview above each swatch.',
			'gallery-slider-for-woocommerce'
		),
		Panel: TooltipPanel,
	},
	{
		title: __( 'Shapes and sizes', 'gallery-slider-for-woocommerce' ),
		text: __(
			'Circle, rounded or square swatches at any size.',
			'gallery-slider-for-woocommerce'
		),
		Panel: ShapesPanel,
	},
	{
		title: __( 'Clear selection', 'gallery-slider-for-woocommerce' ),
		text: __(
			'One tap resets every chosen option.',
			'gallery-slider-for-woocommerce'
		),
		Panel: ClearPanel,
	},
];

/**
 * Feature tour of the Variation Swatches page: a numbered list of features
 * that plays through on its own (a progress bar under the active one; paused
 * while the pointer or focus is inside), next to a sticky stage that
 * illustrates the active feature.
 *
 * @since 4.0.0
 */
const FeatureTour = () => {
	const [ active, setActive ] = useState( 0 );
	// Bumped on every switch, so the progress bar restarts.
	const [ cycle, setCycle ] = useState( 0 );
	const { Panel, title } = FEATURES[ active ];

	const show = ( index ) => {
		setActive( index );
		setCycle( ( value ) => value + 1 );
	};

	return (
		<div className="wcgs-sw-tour sp-d-flex sp-flex-wrap">
			<div className="wcgs-sw-tour__list sp-d-flex sp-flex-col">
				{ FEATURES.map( ( feature, i ) => (
					<button
						key={ feature.title }
						type="button"
						className={ `wcgs-sw-feat sp-d-flex sp-gap-16px sp-w-full${
							i === active ? ' is-active' : ''
						}` }
						aria-pressed={ i === active }
						onClick={ () => show( i ) }
					>
						<span className="wcgs-sw-feat__num">
							{ String( i + 1 ).padStart( 2, '0' ) }
						</span>
						<span className="sp-d-flex sp-flex-col sp-gap-3px sp-min-w-0">
							<span className="wcgs-sw-feat__title">
								{ feature.title }
							</span>
							<span className="wcgs-sw-feat__text">
								{ feature.text }
							</span>
						</span>
						<span
							className="wcgs-sw-feat__track"
							aria-hidden="true"
						>
							{ i === active && (
								<span
									key={ cycle }
									className="wcgs-sw-feat__bar"
									onAnimationEnd={ () =>
										show( ( i + 1 ) % FEATURES.length )
									}
								/>
							) }
						</span>
					</button>
				) ) }
			</div>
			<div
				className="wcgs-sw-stage sp-d-flex sp-align-center sp-justify-center"
				role="group"
				aria-label={ title }
			>
				<div
					key={ active }
					className="wcgs-sw-stage__panel sp-d-flex sp-justify-center sp-w-full"
				>
					<Panel />
				</div>
			</div>
		</div>
	);
};

export default FeatureTour;
