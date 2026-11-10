import { __ } from '@wordpress/i18n';
import { GALLERY_LAYOUTS, LayoutArt } from '../../components/LayoutPicker';
import { LockPill } from '../../components/Pro';
import { CHECK_PATH, StrokeIcon } from './icons';
import StepHeading from './StepHeading';

/**
 * Step 1: the gallery layout. Free layouts are selectable; Pro layouts show
 * a crown pill and are disabled (not clickable, no pricing redirect).
 *
 * @param {Object}   props
 * @param {string}   props.value    Selected layout key.
 * @param {Function} props.onChange Called with the picked layout key.
 */
const LayoutStep = ( { value, onChange } ) => {
	return (
		<div className="wcgs-wizard-step sp-d-flex sp-flex-col is-wide">
			<StepHeading
				title={ __(
					'Choose Your Gallery Layout',
					'gallery-slider-for-woocommerce'
				) }
				text={ __(
					'Pick how images appear on your product pages. Later you can give specific products their own layout.',
					'gallery-slider-for-woocommerce'
				) }
			/>
			<div
				className="wcgs-wizard-layouts sp-d-grid"
				role="radiogroup"
				aria-labelledby="wcgs-wizard-title"
			>
				{ GALLERY_LAYOUTS.map( ( option, i ) => {
					const isActive = ! option.locked && option.value === value;
					return (
						<button
							key={ option.value }
							type="button"
							role="radio"
							aria-checked={ isActive }
							disabled={ option.locked }
							aria-disabled={ option.locked ? 'true' : undefined }
							className={ `wcgs-wizard-layout sp-d-flex sp-flex-col sp-gap-8px${
								isActive ? ' is-active' : ''
							}${ option.locked ? ' is-locked' : '' }` }
							style={ { animationDelay: `${ i * 25 }ms` } }
							onClick={ () =>
								! option.locked && onChange( option.value )
							}
						>
							<span className="wcgs-wizard-layout__card sp-flex-center">
								<LayoutArt
									layout={ option.value }
									width={ 104 }
									height={ 78 }
								/>
								{ option.locked && (
									<LockPill className="is-corner" />
								) }
								{ isActive && (
									<span className="wcgs-wizard-layout__check sp-flex-center">
										<StrokeIcon
											path={ CHECK_PATH }
											size={ 9 }
											strokeWidth={ 3.6 }
											color="#fff"
										/>
									</span>
								) }
							</span>
							<span className="wcgs-wizard-layout__name">
								{ option.label }
							</span>
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default LayoutStep;
