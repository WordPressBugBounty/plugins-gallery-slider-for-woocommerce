import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../../../store/constants';
import {
	ButtonGroup,
	CardSelect,
	CheckboxControl,
	ColorControl,
	LayoutPicker,
	RadioControl,
	RangeControl,
	SelectControl,
	Subheading,
	ToggleControl,
} from '../../../../components';
import { ProToggleRow } from '../../../../components/Pro';
import { DeviceRow, Field, Fields, NumberField, Row, ShadowRow } from './Field';
import { ActiveThumbPreview } from './previews';
import {
	CLICK_OR_HOVER,
	THUMB_LAYOUTS,
	VERTICAL_LAYOUTS,
	imageSizeOptions,
	lockOptions,
} from './options';
import useGlobalSettings from './useGlobalSettings';

// Active thumbnail styles; the line and effect styles beyond Inner Line are Pro.
const ACTIVE_STYLES = lockOptions(
	[
		[
			'border_around',
			__( 'Border Around', 'gallery-slider-for-woocommerce' ),
		],
		[ 'top_line', __( 'Inner Line', 'gallery-slider-for-woocommerce' ) ],
		[ 'bottom_line', __( 'Outer Line', 'gallery-slider-for-woocommerce' ) ],
		[ 'zoom_out', __( 'Zoom Out', 'gallery-slider-for-woocommerce' ) ],
		[ 'opacity', __( 'Opacity', 'gallery-slider-for-woocommerce' ) ],
	].map( ( [ value, label ] ) => ( { value, label } ) ),
	[ 'bottom_line', 'zoom_out', 'opacity' ]
);

const HOVER_EFFECTS = lockOptions(
	[
		[ 'none', __( 'Normal', 'gallery-slider-for-woocommerce' ) ],
		[ 'zoom_in', __( 'Zoom In', 'gallery-slider-for-woocommerce' ) ],
		[ 'zoom_out', __( 'Zoom Out', 'gallery-slider-for-woocommerce' ) ],
		[ 'slide_up', __( 'Slide Up', 'gallery-slider-for-woocommerce' ) ],
		[ 'slide_down', __( 'Slide Down', 'gallery-slider-for-woocommerce' ) ],
	].map( ( [ value, label ] ) => ( { value, label } ) ),
	[ 'zoom_in', 'slide_up' ]
);

const INACTIVE_EFFECTS = lockOptions(
	[
		[ 'opacity', __( 'Opacity', 'gallery-slider-for-woocommerce' ) ],
		[ 'grayscale', __( 'Grayscale', 'gallery-slider-for-woocommerce' ) ],
		[ 'none', __( 'None', 'gallery-slider-for-woocommerce' ) ],
	].map( ( [ value, label ] ) => ( { value, label } ) ),
	[ 'opacity' ]
);

// Thumbnails activate on click; mouseover is Pro.
const ACTIVATE_ON = lockOptions( CLICK_OR_HOVER, [ 'mouseover' ] );

/**
 * General section: layout, thumbnails, gallery size and image source.
 */
const General = () => {
	const {
		v,
		d,
		choices,
		set,
		setSub,
		bind,
		bindSub,
		reset,
		dv,
		setDeviceSub,
		bindDevice,
		resetDevice,
	} = useGlobalSettings();
	const isLayoutDrawerOpen = useSelect(
		( select ) => select( STORE_NAME ).isLayoutDrawerOpen(),
		[]
	);
	const { setLayoutDrawerOpen } = useDispatch( STORE_NAME );
	const layout = v.gallery_layout;
	const isVertical = VERTICAL_LAYOUTS.includes( layout );
	// Thumbnail settings apply to the layouts with a thumbnail strip.
	const hasThumbs = THUMB_LAYOUTS.includes( layout );
	const style = v.thumbnail_style;
	const isLine = 'top_line' === style;
	const activeKey = isLine
		? 'border_bottom_for_active_thumbnail'
		: 'border_width_for_active_thumbnail';

	return (
		<Fields>
			<Field>
				<LayoutPicker
					label={ __(
						'Gallery Layout',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'gallery_layout' ) }
					onOpen={ () => setLayoutDrawerOpen( true ) }
					isOpen={ isLayoutDrawerOpen }
				/>
			</Field>
			<Field show={ hasThumbs }>
				<Subheading
					label={ __(
						'Thumbnails',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field show={ hasThumbs && ! isVertical }>
				<RangeControl
					label={ __(
						'Thumbnail Items per View',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bindDevice( 'thumbnails_item_to_show' ) }
					min={ 1 }
					max={ 10 }
				/>
			</Field>
			<Field show={ isVertical }>
				<RangeControl
					label={ __(
						'Vertical Thumbnails Width',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bindDevice( 'vertical_thumbs_width', '%' ) }
					min={ 1 }
					max={ 100 }
				/>
			</Field>
			<Field show={ hasThumbs }>
				<Row
					label={ __(
						'Thumbnails Space',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Horizontal and vertical spacing between thumbnails.',
						'gallery-slider-for-woocommerce'
					) }
					cols={ 2 }
					isResponsive
					{ ...resetDevice( 'thumbnails_sliders_space' ) }
				>
					<NumberField
						label={ __(
							'Horizontal',
							'gallery-slider-for-woocommerce'
						) }
						value={ dv( 'thumbnails_sliders_space' )?.width }
						onChange={ ( n ) =>
							setDeviceSub(
								'thumbnails_sliders_space',
								'width',
								n
							)
						}
						max={ 50 }
						unit="px"
					/>
					<NumberField
						label={ __(
							'Vertical',
							'gallery-slider-for-woocommerce'
						) }
						value={ dv( 'thumbnails_sliders_space' )?.height }
						onChange={ ( n ) =>
							setDeviceSub(
								'thumbnails_sliders_space',
								'height',
								n
							)
						}
						max={ 50 }
						unit="px"
					/>
				</Row>
			</Field>
			<Field show={ hasThumbs }>
				<RangeControl
					label={ __(
						'Thumbnails Inner Padding',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Padding inside each thumbnail, around the image.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bindDevice( 'thumbnails_inner_padding', 'px' ) }
					max={ 20 }
				/>
			</Field>
			<Field show={ hasThumbs }>
				<SelectControl
					label={ __(
						'Thumbnails Size',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Width and height of each thumbnail.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumbnails_sizes' ) }
					options={ imageSizeOptions( choices.imageSizes ) }
				/>
			</Field>
			<Field show={ hasThumbs }>
				<Row
					label={ __(
						'Thumbnails Border',
						'gallery-slider-for-woocommerce'
					) }
					cols={ 2 }
					{ ...reset( 'border_normal_width_for_thumbnail' ) }
				>
					<NumberField
						label={ __(
							'Width',
							'gallery-slider-for-woocommerce'
						) }
						value={ v.border_normal_width_for_thumbnail?.all }
						onChange={ ( n ) =>
							setSub(
								'border_normal_width_for_thumbnail',
								'all',
								n
							)
						}
						max={ 10 }
						unit="px"
					/>
					<NumberField
						label={ __(
							'Radius',
							'gallery-slider-for-woocommerce'
						) }
						value={ v.border_normal_width_for_thumbnail?.radius }
						onChange={ ( n ) =>
							setSub(
								'border_normal_width_for_thumbnail',
								'radius',
								n
							)
						}
						max={ 40 }
						unit="px"
					/>
					<ColorControl
						small
						label={ __(
							'Color',
							'gallery-slider-for-woocommerce'
						) }
						{ ...bindSub(
							'border_normal_width_for_thumbnail',
							'color'
						) }
					/>
					<ColorControl
						small
						align="right"
						label={ __(
							'Hover',
							'gallery-slider-for-woocommerce'
						) }
						{ ...bindSub(
							'border_normal_width_for_thumbnail',
							'color3'
						) }
					/>
				</Row>
			</Field>
			<Field show={ hasThumbs }>
				<SelectControl
					label={ __(
						'Thumbnails Hover Effect',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumbnails_hover_effect' ) }
					options={ HOVER_EFFECTS }
				/>
			</Field>
			<Field show={ hasThumbs }>
				<ButtonGroup
					label={ __(
						'Thumbnails Activate On',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumb_active_on' ) }
					options={ ACTIVATE_ON }
				/>
			</Field>

			<Field show={ hasThumbs }>
				<Subheading
					label={ __(
						'Active & Inactive Thumbnails',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field show={ hasThumbs }>
				<CardSelect
					label={ __(
						'Active Thumbnail Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumbnail_style' ) }
					options={ ACTIVE_STYLES.map( ( option ) => ( {
						...option,
						preview: (
							<ActiveThumbPreview
								style={ option.value }
								color={
									[ 'top_line', 'bottom_line' ].includes(
										option.value
									)
										? v.border_bottom_for_active_thumbnail
												?.color2
										: v.border_width_for_active_thumbnail
												?.color2
								}
							/>
						),
					} ) ) }
				/>
			</Field>
			{ /* Inner Line uses the bottom-line key. */ }
			<Field show={ hasThumbs }>
				<Row
					label={
						isLine
							? __(
									'Active Thumbnails Bottom Line',
									'gallery-slider-for-woocommerce'
							  )
							: __(
									'Active Thumbnail Border',
									'gallery-slider-for-woocommerce'
							  )
					}
					cols={ 2 }
					{ ...reset( activeKey ) }
				>
					<NumberField
						label={ __(
							'Width',
							'gallery-slider-for-woocommerce'
						) }
						value={ v[ activeKey ]?.all }
						onChange={ ( n ) => setSub( activeKey, 'all', n ) }
						max={ 10 }
						unit="px"
					/>
					<ColorControl
						small
						align="right"
						label={ __(
							'Active Color',
							'gallery-slider-for-woocommerce'
						) }
						{ ...bindSub( activeKey, 'color2' ) }
					/>
				</Row>
			</Field>
			<Field show={ hasThumbs && 'border_around' === style }>
				<ShadowRow
					label={ __(
						'Active Thumbnail Box Shadow',
						'gallery-slider-for-woocommerce'
					) }
					value={ v.active_thumb_shadow }
					onChange={ ( key, n ) =>
						setSub( 'active_thumb_shadow', key, n )
					}
					{ ...reset( 'active_thumb_shadow' ) }
				/>
			</Field>
			<Field show={ hasThumbs && 'border_around' === style }>
				<ColorControl
					label={ __(
						'Active Thumbnail Box Shadow Color',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bindSub( 'active_thumb_shadow', 'color' ) }
					defaultValue={ d.active_thumb_shadow?.color }
				/>
			</Field>
			<Field show={ hasThumbs }>
				<SelectControl
					label={ __(
						'Inactive Thumbnails Effect',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Visual effect applied to thumbnails that are not currently selected.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'inactive_thumbnails_effect' ) }
					options={ INACTIVE_EFFECTS }
				/>
			</Field>

			<Field>
				<RangeControl
					label={ __(
						'Gallery Width',
						'gallery-slider-for-woocommerce'
					) }
					attributes={ { value: v.gallery_width, unit: '%' } }
					onChange={ ( next ) => set( 'gallery_width', next.value ) }
					min={ 1 }
					max={ 100 }
					defaultValue={ { value: d.gallery_width, unit: '%' } }
				/>
			</Field>
			<Field>
				<DeviceRow
					label={ __(
						'Responsive Gallery Width',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Desktop and laptop 0 keeps the Gallery Width above. Tablet applies below 768px, mobile below 480px.',
						'gallery-slider-for-woocommerce'
					) }
					devices={ [
						[ 'desktop', 'width' ],
						[ 'tablet', 'height' ],
						[ 'mobile', 'height2' ],
					].map( ( [ device, key ] ) => [
						device,
						v.gallery_responsive_width?.[ key ],
						( n ) => setSub( 'gallery_responsive_width', key, n ),
					] ) }
					unit={ v.gallery_responsive_width?.unit }
					units={ [ 'px', '%', 'em' ] }
					onUnitChange={ ( unit ) =>
						setSub( 'gallery_responsive_width', 'unit', unit )
					}
					{ ...reset( 'gallery_responsive_width' ) }
				/>
			</Field>
			<Field>
				<RangeControl
					label={ __(
						'Gallery Bottom Gap',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Space below the gallery before the page content continues.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bindDevice( 'gallery_bottom_gap', 'px' ) }
					max={ 200 }
				/>
			</Field>

			<Field>
				<Subheading
					label={ __(
						'Image Source',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field>
				<RadioControl
					label={ __(
						'Gallery Image Source',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'All Images: shows the Product Gallery images plus every image inserted in the product description. Gallery Images: shows only the images added to the Product Gallery box.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'gallery_image_source' ) }
					options={ [
						{
							value: 'attached',
							label: __(
								'All Images',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'uploaded',
							label: __(
								'Gallery Images',
								'gallery-slider-for-woocommerce'
							),
						},
					] }
				/>
			</Field>
			<Field>
				<CheckboxControl
					label={ __(
						'Include Featured Image & Video',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Choose where the product’s featured image and video are added. To default gallery: they appear in the gallery shown before any variation is picked. To variation gallery: they stay in the gallery after a shopper selects a variation, alongside that variation’s images.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'include_feature_image_to_gallery' ) }
					options={ [
						{
							value: 'default_gl',
							label: __(
								'To default gallery',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'variable_gl',
							label: __(
								'To variation gallery',
								'gallery-slider-for-woocommerce'
							),
						},
					] }
				/>
			</Field>
			<Field>
				<ProToggleRow
					label={ __(
						'Default Gallery with Variation Images',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field>
				<ToggleControl
					label={ __(
						'Gallery Image Caption',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Show the image caption beneath the main gallery image.',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'show_caption' ) }
				/>
			</Field>
		</Fields>
	);
};

export default General;
