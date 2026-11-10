import { __ } from '@wordpress/i18n';
import {
	ColorControl,
	IconPicker,
	RangeControl,
	SelectControl,
	Subheading,
	ToggleControl,
} from '../../../../components';
import { MoreInPro } from '../../../../components/Pro';
import { Field, Fields, GroupColors, NumberField, Row } from './Field';
import { LIGHTBOX_ICONS, lockOptions } from './options';
import useGlobalSettings from './useGlobalSettings';

const EFFECTS = lockOptions(
	[
		[ 'slide', __( 'Slide', 'gallery-slider-for-woocommerce' ) ],
		[ 'fade', __( 'Fade', 'gallery-slider-for-woocommerce' ) ],
		[ 'classic', __( 'Classic', 'gallery-slider-for-woocommerce' ) ],
		[ 'crossfade', __( 'Crossfade', 'gallery-slider-for-woocommerce' ) ],
		[
			'no_animation',
			__( 'No Animation', 'gallery-slider-for-woocommerce' ),
		],
	].map( ( [ value, label ] ) => ( { value, label } ) ),
	[ 'fade' ]
);

const MORE_ITEMS = [
	__( 'Overlay background', 'gallery-slider-for-woocommerce' ),
	__( 'Icon visibility', 'gallery-slider-for-woocommerce' ),
	__( 'Slideshow', 'gallery-slider-for-woocommerce' ),
	__( 'Thumbnail gallery', 'gallery-slider-for-woocommerce' ),
	__( 'Image download', 'gallery-slider-for-woocommerce' ),
	__( 'Zoom & rotate', 'gallery-slider-for-woocommerce' ),
].map( ( label ) => ( { label } ) );

/**
 * Lightbox: effect, the open icon, caption and toolbar controls, then the
 * lightbox options of Pro.
 */
const Lightbox = () => {
	const { v, d, set, bind, bindDevice } = useGlobalSettings();
	const isOn = !! v.lightbox;

	return (
		<Fields>
			<Field>
				<ToggleControl
					label={ __(
						'Enable Lightbox',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'lightbox' ) }
				/>
			</Field>
			<Field show={ isOn }>
				<SelectControl
					label={ __(
						'Sliding Effect',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'lightbox_sliding_effect' ) }
					options={ EFFECTS }
				/>
			</Field>
			<Field show={ isOn }>
				<SelectControl
					label={ __(
						'Icon Display Position',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'lightbox_icon_position' ) }
					options={ [
						{
							value: 'top_right',
							label: __(
								'Top Right',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'top_left',
							label: __(
								'Top Left',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'bottom_right',
							label: __(
								'Bottom Right',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'bottom_left',
							label: __(
								'Bottom Left',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'middle',
							label: __(
								'Middle',
								'gallery-slider-for-woocommerce'
							),
						},
					] }
				/>
			</Field>
			<Field show={ isOn }>
				<IconPicker
					label={ __(
						'Lightbox Icon Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'lightbox_icon' ) }
					options={ LIGHTBOX_ICONS }
				/>
			</Field>
			<Field show={ isOn }>
				<RangeControl
					label={ __(
						'Lightbox Icon Size',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bindDevice( 'lightbox_icon_size', 'px' ) }
					min={ 8 }
					max={ 48 }
				/>
			</Field>
			<Field show={ isOn }>
				<GroupColors
					groupKey="lightbox_icon_color_group"
					items={ [
						[
							'color',
							__( 'Color', 'gallery-slider-for-woocommerce' ),
						],
						[
							'hover_color',
							__(
								'Hover Color',
								'gallery-slider-for-woocommerce'
							),
						],
						[
							'bg_color',
							__(
								'Background',
								'gallery-slider-for-woocommerce'
							),
						],
						[
							'hover_bg_color',
							__(
								'Hover Background',
								'gallery-slider-for-woocommerce'
							),
						],
					] }
				/>
			</Field>
			<Field show={ isOn }>
				<ToggleControl
					label={ __(
						'Lightbox Caption',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'lightbox_caption' ) }
				/>
			</Field>
			<Field show={ isOn && !! v.lightbox_caption }>
				<Row cols={ 2 }>
					<NumberField
						small={ false }
						label={ __(
							'Caption Size',
							'gallery-slider-for-woocommerce'
						) }
						value={ v.lightbox_caption_size }
						onChange={ ( n ) => set( 'lightbox_caption_size', n ) }
						min={ 10 }
						max={ 30 }
						unit="px"
					/>
					<ColorControl
						align="right"
						label={ __(
							'Caption Color',
							'gallery-slider-for-woocommerce'
						) }
						{ ...bind( 'caption_color' ) }
						defaultValue={ d.caption_color }
					/>
				</Row>
			</Field>

			<Field show={ isOn }>
				<Subheading
					label={ __( 'Controls', 'gallery-slider-for-woocommerce' ) }
				/>
			</Field>
			<Field show={ isOn }>
				<ToggleControl
					label={ __(
						'Image Counter',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'l_img_counter' ) }
				/>
			</Field>
			<Field show={ isOn }>
				<ToggleControl
					label={ __(
						'Full Screen Button',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'gallery_fs_btn' ) }
				/>
			</Field>
			<Field show={ isOn }>
				<MoreInPro
					title={ __(
						'More Lightbox Options in Pro',
						'gallery-slider-for-woocommerce'
					) }
					description={ __(
						'Richer controls for the full-screen view.',
						'gallery-slider-for-woocommerce'
					) }
					items={ MORE_ITEMS }
				/>
			</Field>
		</Fields>
	);
};

export default Lightbox;
