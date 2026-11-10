import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';

/**
 * Product photos of the page (`admin/img/swatches/`).
 */
export const PHOTOS = {
	pulloverModel: 'pullover-model.webp',
	pulloverCollar: 'pullover-collar.webp',
	pulloverDetail: 'pullover-detail.webp',
	pulloverCuff: 'pullover-cuff.webp',
	anorakModel: 'anorak-model.webp',
	anorakFlat: 'anorak-flat.webp',
};

/**
 * A product photo, painted as a cover background on a span, so it can be a
 * swatch, a thumbnail or a main image.
 *
 * @since 4.0.0
 * @param {Object} props
 * @param {string} props.name      Key of `PHOTOS`.
 * @param {string} props.className Extra class (shape and size).
 * @param {Object} props.style     Extra inline style.
 */
const Photo = ( { name, className = '', style } ) => {
	const pluginUrl = useSelect(
		( select ) => select( STORE_NAME ).getDashboardInfo().pluginUrl || '',
		[]
	);

	// Until the dashboard data loads, the URL would resolve against wp-admin.
	const image = pluginUrl
		? `url("${ pluginUrl }admin/img/swatches/${ PHOTOS[ name ] }")`
		: undefined;

	return (
		<span
			className={ `wcgs-sw-photo ${ className }`.trim() }
			style={ { ...style, backgroundImage: image } }
			aria-hidden="true"
		/>
	);
};

export default Photo;
