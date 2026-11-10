import { __ } from '@wordpress/i18n';
import { UpsellCard } from '../../../../components/Pro';

/**
 * Shop Page Video: a Pro feature, so the section is an upsell card (`UP.shopvideo`
 * in the free design).
 */
const ShopVideo = () => (
	<UpsellCard
		visual="shopvideo"
		title={ __(
			'Videos on the Shop Page',
			'gallery-slider-for-woocommerce'
		) }
		description={ __(
			'Show featured product videos right on Shop and archive product cards.',
			'gallery-slider-for-woocommerce'
		) }
		items={ [
			__( 'Inline or popup playback', 'gallery-slider-for-woocommerce' ),
			__( '10+ play icon styles', 'gallery-slider-for-woocommerce' ),
			__( 'Autoplay and loop', 'gallery-slider-for-woocommerce' ),
			__( 'Mobile-optimised playback', 'gallery-slider-for-woocommerce' ),
		] }
	/>
);

export default ShopVideo;
