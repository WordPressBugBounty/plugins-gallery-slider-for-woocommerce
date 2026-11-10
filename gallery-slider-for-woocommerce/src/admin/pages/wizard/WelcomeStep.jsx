import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { ARROW_RIGHT_PATH, StrokeIcon } from './icons';

/**
 * Product photo of the hero mock (`admin/img/setup-wizard/`).
 *
 * @param {Object} props
 * @param {string} props.src       Photo file name.
 * @param {string} props.className Extra class.
 */
const Photo = ( { src, className = '' } ) => {
	const pluginUrl = useSelect(
		( select ) => select( STORE_NAME ).getDashboardInfo().pluginUrl || '',
		[]
	);

	// Until the dashboard data loads, the URL would resolve against wp-admin.
	if ( ! pluginUrl ) {
		return null;
	}

	return (
		<img
			className={ `wcgs-wizard-hero__photo sp-d-block ${ className }`.trim() }
			src={ `${ pluginUrl }admin/img/setup-wizard/${ src }` }
			alt=""
			decoding="async"
			draggable="false"
		/>
	);
};

/**
 * Product page mock of the welcome screen: a gallery of six photos (zoom
 * lens, expand button, video play button), the product summary, and a phone
 * with the mobile slider.
 */
const HeroArt = () => (
	<div className="wcgs-wizard-hero sp-flex-center" aria-hidden="true">
		<span className="wcgs-wizard-hero__glow" />
		<div className="wcgs-wizard-hero__stage">
			<div className="wcgs-wizard-hero__page sp-d-grid">
				<div className="wcgs-wizard-hero__gallery">
					<div className="wcgs-wizard-hero__grid sp-d-grid sp-gap-8px">
						<span className="wcgs-wizard-hero__tile">
							<Photo src="kd17-lateral.jpg" />
							<span className="wcgs-wizard-hero__expand sp-flex-center">
								<StrokeIcon
									path="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"
									size={ 14 }
								/>
							</span>
						</span>
						<span className="wcgs-wizard-hero__tile">
							<Photo src="kd17-pair-front.jpg" />
							<span className="wcgs-wizard-hero__lens">
								<Photo
									src="kd17-pair-front.jpg"
									className="wcgs-wizard-hero__lens-image"
								/>
							</span>
						</span>
						<span className="wcgs-wizard-hero__tile">
							<Photo src="kd17-medial.jpg" />
						</span>
						<span className="wcgs-wizard-hero__tile">
							<Photo src="kd17-laces.jpg" />
							<span className="wcgs-wizard-hero__play sp-flex-center">
								<svg width="20" height="20" viewBox="0 0 24 24">
									<path
										d="M8.5 5.6v12.8a1.2 1.2 0 0 0 1.8 1l10-6.4a1.2 1.2 0 0 0 0-2l-10-6.4a1.2 1.2 0 0 0-1.8 1z"
										fill="#1D1D1F"
										stroke="#1D1D1F"
										strokeWidth="1.2"
										strokeLinejoin="round"
									/>
								</svg>
							</span>
						</span>
						<span className="wcgs-wizard-hero__tile">
							<Photo src="kd17-outsole.jpg" />
						</span>
						<span className="wcgs-wizard-hero__tile">
							<Photo src="kd17-pair-back.jpg" />
						</span>
					</div>
				</div>
				<div className="wcgs-wizard-hero__summary sp-d-flex sp-min-w-0 sp-flex-col sp-gap-14px">
					<div className="wcgs-wizard-hero__title sp-d-flex sp-flex-col sp-gap-4px">
						<span className="wcgs-wizard-hero__category">
							{ __(
								'Basketball',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span className="wcgs-wizard-hero__name">
							{ __(
								'KD17 Multi-Colour',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span className="wcgs-wizard-hero__price">$150.00</span>
					</div>
					<div className="wcgs-wizard-hero__rating sp-d-flex sp-align-center sp-gap-4px">
						<span className="wcgs-wizard-hero__stars">★★★★★</span>
						{ __(
							'4.8 · 126 reviews',
							'gallery-slider-for-woocommerce'
						) }
					</div>
					<div className="wcgs-wizard-hero__option sp-d-flex sp-flex-col">
						<span className="wcgs-wizard-hero__label">
							{ __( 'Color:', 'gallery-slider-for-woocommerce' ) }{ ' ' }
							<b>
								{ __(
									'Multi-Colour',
									'gallery-slider-for-woocommerce'
								) }
							</b>
						</span>
						<div className="wcgs-wizard-hero__colors sp-d-flex sp-gap-8px">
							{ [
								'conic-gradient(#F472B6, #FBBF24, #4ADE80, #38BDF8, #A78BFA, #F472B6)',
								'#1D1D1F',
								'#F5F5F5',
							].map( ( color, i ) => (
								<span
									key={ color }
									className={ `wcgs-wizard-hero__color${
										0 === i ? ' is-active' : ''
									}` }
									style={ { background: color } }
								/>
							) ) }
						</div>
					</div>
					<div className="wcgs-wizard-hero__option sp-d-flex sp-flex-col">
						<span className="wcgs-wizard-hero__label">
							{ __( 'Size', 'gallery-slider-for-woocommerce' ) }
						</span>
						<div className="wcgs-wizard-hero__sizes sp-d-flex">
							{ [ 'US 8', 'US 9', 'US 10', 'US 11' ].map(
								( size, i ) => (
									<span
										key={ size }
										className={ `wcgs-wizard-hero__size sp-flex-center sp-flex-1${
											1 === i ? ' is-active' : ''
										}` }
									>
										{ size }
									</span>
								)
							) }
						</div>
					</div>
					<span className="wcgs-wizard-hero__cart sp-flex-center">
						{ __(
							'Add to cart',
							'gallery-slider-for-woocommerce'
						) }
					</span>
				</div>
			</div>
			<div className="wcgs-wizard-phone">
				<div className="wcgs-wizard-phone__screen sp-d-flex sp-flex-col">
					<div className="wcgs-wizard-phone__status sp-d-flex sp-align-center sp-justify-between">
						<span>9:41</span>
						<span className="wcgs-wizard-phone__notch" />
						<span className="wcgs-wizard-phone__battery" />
					</div>
					<div className="wcgs-wizard-phone__bar sp-d-flex sp-flex-none sp-align-center sp-justify-between">
						<span className="wcgs-wizard-phone__menu sp-d-flex sp-flex-col sp-gap-2px">
							<span className="wcgs-wizard-phone__menu-line" />
							<span className="wcgs-wizard-phone__menu-line" />
							<span className="wcgs-wizard-phone__menu-line" />
						</span>
						<span className="wcgs-wizard-phone__brand">
							{ __( 'STORE', 'gallery-slider-for-woocommerce' ) }
						</span>
						<svg
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#1D1D1F"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M6 7h12l-1 13H7z" />
							<path d="M9 7a3 3 0 0 1 6 0" />
						</svg>
					</div>
					<div className="wcgs-wizard-phone__slider">
						<Photo src="kd17-lateral.jpg" />
						{ [
							'kd17-lateral.jpg',
							'kd17-medial.jpg',
							'kd17-pair-front.jpg',
							'kd17-laces.jpg',
						].map( ( src, i ) => (
							<Photo
								key={ src }
								src={ src }
								className={ `wcgs-wizard-phone__slide is-slide-${ i }` }
							/>
						) ) }
						<span className="wcgs-wizard-phone__arrow sp-flex-center is-prev">
							<StrokeIcon
								path="M15 5l-7 7 7 7"
								size={ 9 }
								strokeWidth={ 3 }
							/>
						</span>
						<span className="wcgs-wizard-phone__arrow sp-flex-center is-next">
							<StrokeIcon
								path="M9 5l7 7-7 7"
								size={ 9 }
								strokeWidth={ 3 }
							/>
						</span>
						<span className="wcgs-wizard-phone__dots sp-d-flex">
							<span className="wcgs-wizard-phone__dots-track sp-d-flex sp-gap-4px">
								<span className="wcgs-wizard-phone__dot" />
								<span className="wcgs-wizard-phone__dot" />
								<span className="wcgs-wizard-phone__dot" />
								<span className="wcgs-wizard-phone__dot" />
								<span className="wcgs-wizard-phone__dot is-current" />
							</span>
						</span>
					</div>
					<div className="wcgs-wizard-phone__info sp-d-flex sp-flex-col sp-gap-3px">
						<span className="wcgs-wizard-phone__name">
							{ __(
								'KD17 Multi-Colour',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<span className="wcgs-wizard-phone__price">
							$150.00
						</span>
						<span className="wcgs-wizard-phone__rating sp-d-flex sp-align-center sp-gap-3px">
							<span className="wcgs-wizard-phone__stars">
								★★★★★
							</span>
							4.8 (126)
						</span>
					</div>
					<div className="wcgs-wizard-phone__cart">
						<span className="wcgs-wizard-phone__cart-button sp-flex-center">
							{ __(
								'Add to cart',
								'gallery-slider-for-woocommerce'
							) }
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
);

/**
 * Welcome screen: headline, "Set Up My Gallery" and "Skip setup", and the
 * product page mock.
 *
 * @param {Object}   props
 * @param {Function} props.onStart Opens the first step.
 * @param {Function} props.onSkip  Closes the wizard.
 */
const WelcomeStep = ( { onStart, onSkip } ) => (
	<div className="wcgs-wizard-welcome sp-d-grid">
		<div className="wcgs-wizard-welcome__intro sp-d-flex sp-flex-col sp-justify-center">
			<div className="wcgs-wizard-welcome__text">
				<h1
					className="wcgs-wizard-welcome__title"
					id="wcgs-wizard-title"
				>
					{ __(
						'Product Pages That Show Off Every Detail',
						'gallery-slider-for-woocommerce'
					) }
				</h1>
				<p className="wcgs-wizard-welcome__lead">
					{ __(
						'Beautiful gallery layouts, zoom, lightbox and video for your WooCommerce store. Set up the basics in under a minute.',
						'gallery-slider-for-woocommerce'
					) }
				</p>
			</div>
			<div className="wcgs-wizard-welcome__actions sp-flex-wrap sp-align-center">
				<button
					type="button"
					className="wcgs-wizard-welcome__start"
					onClick={ onStart }
					data-wcgs-autofocus
				>
					{ __(
						'Set Up My Gallery',
						'gallery-slider-for-woocommerce'
					) }
					<StrokeIcon path={ ARROW_RIGHT_PATH } strokeWidth={ 2.2 } />
				</button>
				<button
					type="button"
					className="wcgs-wizard-welcome__skip"
					onClick={ onSkip }
				>
					{ __( 'Skip setup', 'gallery-slider-for-woocommerce' ) }
				</button>
			</div>
		</div>
		<HeroArt />
	</div>
);

export default WelcomeStep;
