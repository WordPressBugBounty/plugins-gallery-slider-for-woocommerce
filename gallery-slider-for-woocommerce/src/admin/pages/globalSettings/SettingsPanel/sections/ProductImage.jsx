import { __ } from '@wordpress/i18n';
import {
	ButtonGroup,
	SelectControl,
	ToggleControl,
} from '../../../../components';
import { Field, Fields, NumberField, Row } from './Field';
import { imageSizeOptions } from './options';
import useGlobalSettings from './useGlobalSettings';

/**
 * Product Gallery › Product Image: main image size, loading and image mode.
 * A custom image size is Pro.
 */
const ProductImage = () => {
	const { v, choices, set, bind } = useGlobalSettings();

	return (
		<Fields>
			<Field>
				<SelectControl
					label={ __(
						'Image Size',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'image_sizes' ) }
					options={ imageSizeOptions( choices.imageSizes ) }
				/>
			</Field>
			<Field>
				<ButtonGroup
					label={ __(
						'Lazy Load',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Loads images only as shoppers reach them.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'wcgs_image_lazy_load' ) }
					options={ [
						{
							value: 'false',
							label: __(
								'Off',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'ondemand',
							label: __(
								'On Demand',
								'gallery-slider-for-woocommerce'
							),
						},
					] }
				/>
			</Field>
			<Field>
				<ToggleControl
					label={ __(
						'Preloader',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'preloader' ) }
				/>
			</Field>
			<Field show={ !! v.preloader }>
				<SelectControl
					label={ __(
						'Preload Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'preloader_style' ) }
					options={ [
						{
							value: 'normal',
							label: __(
								'Normal',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'fade',
							label: __(
								'Fade',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'gray',
							label: __(
								'Gray',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'blur',
							label: __(
								'Blur',
								'gallery-slider-for-woocommerce'
							),
						},
					] }
				/>
			</Field>
			<Field>
				<Row cols={ 2 }>
					<NumberField
						small={ false }
						label={ __(
							'Border Radius',
							'gallery-slider-for-woocommerce'
						) }
						value={ v.image_border_radius }
						onChange={ ( n ) => set( 'image_border_radius', n ) }
						max={ 60 }
						unit="px"
					/>
				</Row>
			</Field>
			<Field>
				<SelectControl
					label={ __(
						'Image Mode',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'grayscale' ) }
					options={ [
						{
							value: 'gray_off',
							label: __(
								'Original',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'gray_always',
							label: __(
								'Grayscale',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'gray_onhover',
							label: __(
								'Grayscale on hover',
								'gallery-slider-for-woocommerce'
							),
						},
					] }
				/>
			</Field>
		</Fields>
	);
};

export default ProductImage;
