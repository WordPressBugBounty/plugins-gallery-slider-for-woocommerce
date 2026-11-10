import { __ } from '@wordpress/i18n';
import {
	ButtonGroup,
	ColorControl,
	ControlNote,
	IconPicker,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '../../../../components';
import { ProDimensionRow } from '../../../../components/Pro';
import { Field, Fields, GroupColors, NumberField, Row } from './Field';
import { Visual } from './previews';
import { ARROW_ICONS, THUMB_LAYOUTS, VISIBILITY, lockOptions } from './options';
import { THUMB_NAV_VISUALS } from './visuals';
import useGlobalSettings from './useGlobalSettings';

// Custom and Inner Right are free; Outer and Inner are Pro.
const STYLES = lockOptions(
	[
		[ 'outer', __( 'Outer', 'gallery-slider-for-woocommerce' ) ],
		[
			'inner_right',
			__( 'Inner Right', 'gallery-slider-for-woocommerce' ),
		],
		[ 'inner', __( 'Inner', 'gallery-slider-for-woocommerce' ) ],
		[ 'custom', __( 'Custom', 'gallery-slider-for-woocommerce' ) ],
	].map( ( [ value, label ] ) => ( {
		value,
		label,
		preview: <Visual parts={ THUMB_NAV_VISUALS[ value ] } />,
	} ) ),
	[ 'outer', 'inner' ]
);

/**
 * Product Gallery › Thumbnails Navigation: the thumbnail strip arrows.
 */
const ThumbsNav = () => {
	const { v, d, set, setSub, bind, bindSub, reset } = useGlobalSettings();
	// The Slider layout has no thumbnails.
	const hasThumbNav = THUMB_LAYOUTS.includes( v.gallery_layout );
	const isOn = hasThumbNav && !! v.thumbnailnavigation;

	return (
		<Fields>
			<Field show={ ! hasThumbNav }>
				<ControlNote>
					{ __(
						'This layout has no thumbnail arrows, so these settings do not apply to it.',
						'gallery-slider-for-woocommerce'
					) }
				</ControlNote>
			</Field>
			<Field show={ hasThumbNav }>
				<ToggleControl
					label={ __(
						'Thumbnails Navigation',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumbnailnavigation' ) }
				/>
			</Field>
			<Field show={ isOn }>
				<ButtonGroup
					label={ __(
						'Thumbnails Navigation Visibility',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumb_nav_visibility' ) }
					options={ VISIBILITY }
				/>
			</Field>
			<Field show={ isOn }>
				<SelectControl
					label={ __(
						'Thumbnails Navigation Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumbnailnavigation_style' ) }
					options={ STYLES }
				/>
			</Field>
			<Field show={ isOn }>
				<IconPicker
					label={ __(
						'Thumbnail Navigation Icon',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'thumbnailnavigation_icon' ) }
					options={ ARROW_ICONS }
					columns={ 6 }
				/>
			</Field>
			<Field show={ isOn }>
				<RangeControl
					label={ __(
						'Icon Size',
						'gallery-slider-for-woocommerce'
					) }
					attributes={ {
						value: v.thumbnailnavigation_icon_size,
						unit: 'px',
					} }
					onChange={ ( next ) =>
						set( 'thumbnailnavigation_icon_size', next.value )
					}
					min={ 8 }
					max={ 40 }
					defaultValue={ {
						value: d.thumbnailnavigation_icon_size,
						unit: 'px',
					} }
				/>
			</Field>
			<Field show={ isOn }>
				<GroupColors
					groupKey="thumbnailnavigation_icon_color_group"
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
				<Row
					label={ __(
						'Thumbnails Navigation Border',
						'gallery-slider-for-woocommerce'
					) }
					cols={ 2 }
					{ ...reset( 'thumbnail_navi_border' ) }
				>
					<NumberField
						label={ __(
							'Width',
							'gallery-slider-for-woocommerce'
						) }
						value={ v.thumbnail_navi_border?.all }
						onChange={ ( n ) =>
							setSub( 'thumbnail_navi_border', 'all', n )
						}
						max={ 10 }
						unit="px"
					/>
					<NumberField
						label={ __(
							'Radius',
							'gallery-slider-for-woocommerce'
						) }
						value={ v.thumbnail_navi_border?.radius }
						onChange={ ( n ) =>
							setSub( 'thumbnail_navi_border', 'radius', n )
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
						{ ...bindSub( 'thumbnail_navi_border', 'color' ) }
					/>
					<ColorControl
						small
						align="right"
						label={ __(
							'Hover Color',
							'gallery-slider-for-woocommerce'
						) }
						{ ...bindSub( 'thumbnail_navi_border', 'color3' ) }
					/>
				</Row>
			</Field>
			<Field show={ isOn }>
				<ProDimensionRow
					label={ __(
						'Thumbnails Navigation Box Size',
						'gallery-slider-for-woocommerce'
					) }
					popover={ {
						title: __(
							'Thumbnails Navigation Box Size',
							'gallery-slider-for-woocommerce'
						),
						text: __(
							'Set the width and height of the thumbnail arrows to match your gallery style.',
							'gallery-slider-for-woocommerce'
						),
						visual: 'tnbox',
					} }
				/>
			</Field>
		</Fields>
	);
};

export default ThumbsNav;
