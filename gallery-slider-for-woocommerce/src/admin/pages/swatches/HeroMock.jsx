import { __ } from '@wordpress/i18n';
import Photo from './Photo';
import {
	COLORS,
	Chip,
	Dot,
	LABEL_COLOR,
	LABEL_SIZE,
	OptionLabel,
} from './atoms';

const THUMBS = [
	'pulloverModel',
	'pulloverCollar',
	'pulloverDetail',
	'pulloverCuff',
];
const STYLES = [
	'pulloverModel',
	'pulloverCollar',
	'pulloverDetail',
	'anorakModel',
];

/**
 * Product card of the hero: a gallery, then color, image and label swatches
 * in a dashed box (what Smart Swatches adds to the product page).
 *
 * @since 4.0.0
 */
const HeroMock = () => (
	<div className="wcgs-sw-card sp-d-grid" aria-hidden="true">
		<div className="sp-d-flex sp-flex-col sp-gap-8px sp-min-w-0">
			<Photo name="pulloverModel" className="wcgs-sw-card__main" />
			<div className="wcgs-sw-card__thumbs sp-d-grid sp-gap-8px">
				{ THUMBS.map( ( name, i ) => (
					<Photo
						key={ name }
						name={ name }
						className={ `wcgs-sw-card__thumb${
							0 === i ? ' is-active' : ''
						}` }
					/>
				) ) }
			</div>
		</div>
		<div className="wcgs-sw-card__info sp-d-flex sp-flex-col sp-min-w-0">
			<div className="sp-d-flex sp-flex-col sp-gap-6px">
				<span className="wcgs-sw-card__name">
					{ __(
						'Course Control Anorak',
						'gallery-slider-for-woocommerce'
					) }
				</span>
				<span className="wcgs-sw-card__price">$89.00</span>
			</div>
			<div className="wcgs-sw-card__options sp-d-flex sp-flex-col">
				<div className="sp-d-flex sp-flex-col sp-gap-8px">
					<OptionLabel
						small
						label={ LABEL_COLOR }
						value={ __(
							'Forest',
							'gallery-slider-for-woocommerce'
						) }
					/>
					<div className="sp-d-flex sp-flex-wrap sp-gap-10px">
						{ [
							COLORS.forest,
							COLORS.burgundy,
							COLORS.navy,
							COLORS.sand,
						].map( ( color, i ) => (
							<Dot
								key={ color }
								color={ color }
								active={ 0 === i }
								className="is-bright"
							/>
						) ) }
					</div>
				</div>
				<div className="sp-d-flex sp-flex-col sp-gap-8px">
					<OptionLabel
						small
						label={ __(
							'Style:',
							'gallery-slider-for-woocommerce'
						) }
						value={ __(
							'Front',
							'gallery-slider-for-woocommerce'
						) }
					/>
					<div className="sp-d-flex sp-flex-wrap sp-gap-8px">
						{ STYLES.map( ( name, i ) => (
							<Photo
								key={ name }
								name={ name }
								className={ `wcgs-sw-card__style${
									0 === i ? ' is-active' : ''
								}` }
							/>
						) ) }
					</div>
				</div>
				<div className="sp-d-flex sp-flex-col sp-gap-8px">
					<OptionLabel small label={ LABEL_SIZE } value="M" />
					<div className="sp-d-flex sp-flex-wrap sp-gap-6px">
						<Chip variant="bright" className="is-sm">
							S
						</Chip>
						<Chip variant="bright" className="is-sm" active>
							M
						</Chip>
						<Chip variant="bright" className="is-sm">
							L
						</Chip>
						<Chip variant="bright" className="is-sm" out>
							XL
						</Chip>
					</div>
				</div>
			</div>
			<span className="wcgs-sw-card__add sp-flex-center">
				{ __( 'Add to cart', 'gallery-slider-for-woocommerce' ) }
			</span>
		</div>
	</div>
);

export default HeroMock;
