import { __ } from '@wordpress/i18n';
import { CrownIcon, openPricing, useProUrl } from '../../components/Pro';
import { CHEVRON_RIGHT_PATH, StrokeIcon } from './icons';
import { FEATURES } from './constants';
import StepHeading from './StepHeading';

/**
 * Step 2: switch features on. Free cards toggle a setting; the Pro card
 * (Shop Page Video) opens the pricing page.
 *
 * @param {Object}   props
 * @param {Object}   props.values   `{ zoom, lightbox, video_gallery }` booleans.
 * @param {Function} props.onToggle Called with the toggled settings key.
 */
const FeaturesStep = ( { values, onToggle } ) => {
	const proUrl = useProUrl();
	return (
		<div className="wcgs-wizard-step sp-d-flex sp-flex-col is-wide is-roomy">
			<StepHeading
				title={ __(
					'Turn On the Features You Want',
					'gallery-slider-for-woocommerce'
				) }
				text={ __(
					'Switch features on now. You can fine-tune each one later in Settings.',
					'gallery-slider-for-woocommerce'
				) }
			/>
			<div className="wcgs-wizard-features sp-d-grid sp-gap-14px">
				{ FEATURES.map( ( feature, i ) => {
					const isOn = ! feature.locked && !! values[ feature.key ];
					const className = `wcgs-wizard-feature sp-d-flex sp-align-center sp-gap-16px${
						isOn ? ' is-on' : ''
					}${ feature.locked ? ' is-locked' : '' }`;
					return (
						<button
							key={ feature.key }
							type="button"
							role={ feature.locked ? undefined : 'switch' }
							aria-checked={ feature.locked ? undefined : isOn }
							className={ className }
							style={ { animationDelay: `${ i * 40 }ms` } }
							onClick={ () =>
								feature.locked
									? openPricing( proUrl )
									: onToggle( feature.key )
							}
						>
							<span className="wcgs-wizard-feature__tile sp-flex-center">
								<StrokeIcon
									path={ feature.icon }
									size={ 20 }
									strokeWidth={ 1.7 }
								/>
							</span>
							<span className="wcgs-wizard-feature__body sp-d-flex sp-flex-1 sp-min-w-0 sp-flex-col sp-gap-3px">
								<span className="wcgs-wizard-feature__name sp-d-flex sp-align-center sp-gap-8px">
									{ feature.name }
									{ feature.locked && (
										<CrownIcon
											size={ 14 }
											strokeWidth={ 1.7 }
										/>
									) }
								</span>
								<span className="wcgs-wizard-feature__text">
									{ feature.description }
								</span>
							</span>
							{ feature.locked ? (
								<span className="wcgs-wizard-feature__upgrade sp-d-i-flex sp-align-center sp-gap-4px">
									{ __(
										'Upgrade',
										'gallery-slider-for-woocommerce'
									) }
									<StrokeIcon
										path={ CHEVRON_RIGHT_PATH }
										size={ 12 }
										strokeWidth={ 2.4 }
									/>
								</span>
							) : (
								<span
									className="wcgs-wizard-toggle"
									aria-hidden="true"
								>
									<span className="wcgs-wizard-toggle__knob" />
								</span>
							) }
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default FeaturesStep;
