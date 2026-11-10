import { __ } from '@wordpress/i18n';

// Confetti colors (design `CC`).
const CONFETTI_COLORS = [
	'#7C3AED',
	'#A78BFA',
	'#C4B5FD',
	'#F5B83D',
	'#34D399',
	'#60A5FA',
];

/**
 * 28 confetti pieces with the design's pseudo-random spread.
 */
const CONFETTI = Array.from( { length: 28 }, ( _, i ) => {
	const width = 6 + ( i % 3 ) * 2;
	return {
		left: `${ ( i * 37 ) % 100 }%`,
		width,
		height: i % 2 ? width : width * 1.8,
		borderRadius: 0 === i % 4 ? '50%' : '2px',
		background: CONFETTI_COLORS[ i % CONFETTI_COLORS.length ],
		transform: `rotate(${ ( i * 47 ) % 360 }deg)`,
		animationDuration: `${ 2200 + ( ( i * 71 ) % 1400 ) }ms`,
		animationDelay: `${ 300 + ( ( i * 53 ) % 900 ) }ms`,
	};
} );

/**
 * Done screen: confetti, the green check, a summary of the choices, and the
 * next places to go.
 *
 * @param {Object}      props
 * @param {Array}       props.summary    `[ [ label, value ] ]` rows.
 * @param {Function}    props.onSettings Opens Global Settings.
 * @param {Function}    props.onLayouts  Opens Per-Product Layouts.
 * @param {string|null} props.productUrl A product page to view, if any.
 */
const DoneStep = ( { summary, onSettings, onLayouts, productUrl } ) => (
	<div className="wcgs-wizard-done sp-flex-center">
		{ CONFETTI.map( ( style, i ) => (
			<span
				key={ i }
				className="wcgs-wizard-done__confetti"
				style={ style }
			/>
		) ) }
		<div className="wcgs-wizard-done__inner sp-d-flex sp-flex-col sp-align-center">
			<span
				className="wcgs-wizard-done__badge sp-flex-center"
				aria-hidden="true"
			>
				<span className="wcgs-wizard-done__ring" />
				<svg
					width="96"
					height="96"
					viewBox="0 0 96 96"
					className="wcgs-wizard-done__circle sp-d-block"
				>
					<circle cx="48" cy="48" r="44" fill="#16A34A" />
					<path
						d="M31 49.5 43 61 66 37"
						fill="none"
						stroke="#fff"
						strokeWidth="6"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="wcgs-wizard-done__tick"
					/>
				</svg>
			</span>
			<div className="wcgs-wizard-done__text sp-d-flex sp-flex-col sp-gap-10px">
				<h1 className="wcgs-wizard-done__title" id="wcgs-wizard-title">
					{ __(
						'Your Gallery Is Ready',
						'gallery-slider-for-woocommerce'
					) }
				</h1>
				<p className="wcgs-wizard-done__lead">
					{ __(
						'Your choices are live on your product pages. Fine-tune anything in Settings.',
						'gallery-slider-for-woocommerce'
					) }
				</p>
			</div>
			<dl className="wcgs-wizard-done__summary sp-d-flex sp-w-full sp-flex-col">
				{ summary.map( ( [ label, value ], i ) => (
					<div
						key={ label }
						className="wcgs-wizard-done__row sp-d-flex sp-align-center sp-justify-between sp-gap-16px"
						style={ { animationDelay: `${ 820 + i * 110 }ms` } }
					>
						<dt>{ label }</dt>
						<dd>{ value }</dd>
					</div>
				) ) }
			</dl>
			<div className="wcgs-wizard-done__actions sp-d-flex sp-flex-wrap sp-justify-center sp-gap-10px">
				<button
					type="button"
					className="wcgs-wizard-done__primary"
					onClick={ onSettings }
					data-wcgs-autofocus
				>
					{ __( 'Go to Settings', 'gallery-slider-for-woocommerce' ) }
				</button>
				<button
					type="button"
					className="wcgs-wizard-done__secondary"
					onClick={ onLayouts }
				>
					{ __(
						'Per-Product Layouts',
						'gallery-slider-for-woocommerce'
					) }
				</button>
				{ productUrl && (
					<a
						className="wcgs-wizard-done__secondary"
						href={ productUrl }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __(
							'View a Product',
							'gallery-slider-for-woocommerce'
						) }
						<span className="screen-reader-text">
							{ __(
								'(opens in a new tab)',
								'gallery-slider-for-woocommerce'
							) }
						</span>
					</a>
				) }
			</div>
		</div>
	</div>
);

export default DoneStep;
