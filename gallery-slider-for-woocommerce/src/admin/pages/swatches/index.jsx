import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { SWATCHES_ADMIN_URL, SWATCHES_SLUG } from '../wizard/addons';
import {
	ARROW_RIGHT_PATH,
	CHECK_PATH,
	Spinner,
	StrokeIcon,
} from '../wizard/icons';
import FeatureTour from './FeatureTour';
import HeroMock from './HeroMock';
import useSwatchesPlugin from './useSwatchesPlugin';
import './editor.scss';

// Smart Swatches on WordPress.org, and the live demo its page links to.
const WPORG_URL = `https://wordpress.org/plugins/${ SWATCHES_SLUG }/`;
const DEMO_URL = 'https://demo.shapedplugin.com/smart-swatches-pro/';

const DOWNLOAD_PATH = 'M12 4v11M7 10l5 5 5-5M5 20h14';
const POWER_PATH = 'M12 3v9M6.4 6.4a8 8 0 1 0 11.2 0';

/**
 * Button that installs and activates Smart Swatches, then opens it.
 *
 * @param {Object}   props
 * @param {string}   props.status       Plugin status from `useSwatchesPlugin`.
 * @param {boolean}  props.isActivating Whether the busy state only activates.
 * @param {boolean}  props.canInstall   Whether the user may install plugins.
 * @param {Function} props.onInstall    Installs or activates the plugin.
 */
const InstallButton = ( { status, isActivating, canInstall, onInstall } ) => {
	const arrow = (
		<StrokeIcon path={ ARROW_RIGHT_PATH } size={ 16 } strokeWidth={ 2.2 } />
	);
	if ( ! canInstall ) {
		return (
			<a
				className="wcgs-sw-button"
				href={ WPORG_URL }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Get Smart Swatches', 'gallery-slider-for-woocommerce' ) }
				{ arrow }
			</a>
		);
	}
	if ( 'active' === status ) {
		return (
			<a className="wcgs-sw-button" href={ SWATCHES_ADMIN_URL }>
				{ __(
					'Open Smart Swatches',
					'gallery-slider-for-woocommerce'
				) }
				{ arrow }
			</a>
		);
	}
	const isBusy = 'busy' === status || 'loading' === status;
	let label = __(
		'Install Smart Swatches',
		'gallery-slider-for-woocommerce'
	);
	let icon = DOWNLOAD_PATH;
	if ( 'busy' === status ) {
		label = isActivating
			? __( 'Activating…', 'gallery-slider-for-woocommerce' )
			: __( 'Installing…', 'gallery-slider-for-woocommerce' );
	} else if ( 'inactive' === status ) {
		label = __(
			'Activate Smart Swatches',
			'gallery-slider-for-woocommerce'
		);
		icon = POWER_PATH;
	}
	return (
		<button
			type="button"
			className={ `wcgs-sw-button${ isBusy ? ' is-busy' : '' }` }
			aria-disabled={ isBusy ? 'true' : undefined }
			onClick={ () => ! isBusy && onInstall() }
		>
			{ 'busy' === status ? (
				<Spinner className="is-light" />
			) : (
				<StrokeIcon path={ icon } size={ 16 } strokeWidth={ 2.2 } />
			) }
			{ label }
		</button>
	);
};

/**
 * Variation Swatches page (`#swatches`, no plugin header): the promo page of
 * Smart Swatches, the team's free swatches plugin. Its button installs and
 * activates it through the core REST API, then opens its settings page.
 *
 * @since 4.0.0
 */
const SwatchesPage = () => {
	const canInstall = useSelect(
		( select ) =>
			!! select( STORE_NAME ).getDashboardInfo().canInstallPlugins,
		[]
	);
	const { status, isActivating, error, install } =
		useSwatchesPlugin( canInstall );

	return (
		<div className="wcgs-swatches-page sp-flex-1">
			<div className="wcgs-sw sp-d-flex sp-flex-col">
				<section className="wcgs-sw-hero sp-d-grid sp-align-center">
					<div className="wcgs-sw-hero__text sp-d-flex sp-flex-col">
						<span className="wcgs-sw-hero__pill sp-d-i-flex sp-align-center sp-gap-6px">
							<StrokeIcon
								path={ CHECK_PATH }
								size={ 13 }
								strokeWidth={ 2.8 }
							/>
							{ __(
								'Free plugin',
								'gallery-slider-for-woocommerce'
							) }
						</span>
						<h1 className="wcgs-sw-hero__title">
							{ __(
								'Smart Variation Swatches',
								'gallery-slider-for-woocommerce'
							) }
						</h1>
						<p className="wcgs-sw-hero__lead">
							{ __(
								'A free plugin that turns WooCommerce variation dropdowns into color, image and label swatches. Shoppers see every option up front and pick faster.',
								'gallery-slider-for-woocommerce'
							) }
						</p>
						<div className="wcgs-sw-hero__actions sp-d-flex sp-flex-wrap sp-align-center sp-gap-20px">
							<InstallButton
								status={ status }
								isActivating={ isActivating }
								canInstall={ canInstall }
								onInstall={ install }
							/>
							<a
								className="wcgs-sw-hero__demo"
								href={ DEMO_URL }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __(
									'See Live Demo →',
									'gallery-slider-for-woocommerce'
								) }
							</a>
						</div>
						{ error && (
							<span className="wcgs-sw-hero__error" role="alert">
								{ error }
							</span>
						) }
					</div>
					<HeroMock />
				</section>

				<section className="wcgs-sw-features sp-d-flex sp-flex-col">
					<div className="wcgs-sw-features__head sp-d-flex sp-flex-col sp-gap-12px">
						<h2 className="wcgs-sw-h2">
							{ __(
								'Show every option. Sell every variant.',
								'gallery-slider-for-woocommerce'
							) }
						</h2>
						<p className="wcgs-sw-features__lead">
							{ __(
								'Replace clunky dropdowns with swatches shoppers read at a glance. Works with your theme and any variable product. No code.',
								'gallery-slider-for-woocommerce'
							) }
						</p>
					</div>
					<FeatureTour />
				</section>
			</div>
		</div>
	);
};

export default SwatchesPage;
