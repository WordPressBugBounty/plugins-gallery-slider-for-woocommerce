import { __ } from '@wordpress/i18n';
import { CardSelect, Subheading, ToggleControl } from '../../../../components';
import { MoreInPro } from '../../../../components/Pro';
import { Field, Fields } from './Field';
import useGlobalSettings from './useGlobalSettings';

// Zoom styles with the legacy page's pictures (admin/img). Outside and
// Magnific are Pro, each with its own demo.
const ZOOM_STYLES = [
	[
		'in_side',
		__( 'Default', 'gallery-slider-for-woocommerce' ),
		'zoom_default.svg',
	],
	[
		'zoom_2x',
		__( 'Inside (2×)', 'gallery-slider-for-woocommerce' ),
		'zoom_style_inside.svg',
	],
	[
		'right_side',
		__( 'Outside', 'gallery-slider-for-woocommerce' ),
		'zoom_style_right_side.svg',
		{
			title: __( 'Outside Zoom', 'gallery-slider-for-woocommerce' ),
			text: __(
				'A magnified view opens in a window beside the main image as shoppers move across it.',
				'gallery-slider-for-woocommerce'
			),
			visual: 'zoomout',
		},
	],
	[
		'lens',
		__( 'Magnific', 'gallery-slider-for-woocommerce' ),
		'zoom_style_magnify.svg',
		{
			title: __( 'Magnific Zoom', 'gallery-slider-for-woocommerce' ),
			text: __(
				'A round magnifying lens follows the cursor and enlarges the detail beneath it.',
				'gallery-slider-for-woocommerce'
			),
			visual: 'zoomlens',
		},
	],
];

// "More Zoom Options in Pro"; three items have demos.
const MORE_ITEMS = [
	{ label: __( 'Cursor style', 'gallery-slider-for-woocommerce' ) },
	{ label: __( 'Exclude zoom', 'gallery-slider-for-woocommerce' ) },
	{
		label: __( 'Mouse-wheel zoom', 'gallery-slider-for-woocommerce' ),
		popover: {
			title: __( 'Mouse-Wheel Zoom', 'gallery-slider-for-woocommerce' ),
			text: __(
				'Shoppers scroll to zoom in and out right on the image.',
				'gallery-slider-for-woocommerce'
			),
			visual: 'zwheel',
		},
	},
	{
		label: __( 'Zoom scale', 'gallery-slider-for-woocommerce' ),
		popover: {
			title: __( 'Zoom Scale', 'gallery-slider-for-woocommerce' ),
			text: __(
				'Set how far the image magnifies, from a subtle 1.5x to a close 3x.',
				'gallery-slider-for-woocommerce'
			),
			visual: 'zscale',
		},
	},
	{
		label: __( 'Lens style', 'gallery-slider-for-woocommerce' ),
		popover: {
			title: __( 'Lens Style', 'gallery-slider-for-woocommerce' ),
			text: __(
				'Choose the lens shape and border to match your store.',
				'gallery-slider-for-woocommerce'
			),
			visual: 'zlstyle',
		},
	},
	{ label: __( 'Image overlay', 'gallery-slider-for-woocommerce' ) },
	{
		label: __(
			'Zoom window size & shadow',
			'gallery-slider-for-woocommerce'
		),
	},
];

/**
 * Product Gallery › Zoom: the zoom switch, its style and mobile zoom, then
 * the zoom options of Pro.
 */
const Zoom = () => {
	const { v, pluginUrl, bind } = useGlobalSettings();
	const isOn = !! v.zoom;

	return (
		<Fields>
			<Field>
				<ToggleControl
					label={ __(
						'Enable Image Zoom',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'zoom' ) }
				/>
			</Field>
			<Field show={ isOn }>
				<Subheading
					label={ __(
						'Zoom Behavior',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field show={ isOn }>
				<CardSelect
					label={ __(
						'Zoom Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'zoom_type' ) }
					columns={ 2 }
					previewHeight={ 84 }
					options={ ZOOM_STYLES.map(
						( [ value, label, image, popover ] ) => ( {
							value,
							label,
							image: pluginUrl
								? `${ pluginUrl }admin/img/${ image }`
								: '',
							locked: !! popover,
							popover,
						} )
					) }
				/>
			</Field>
			<Field show={ isOn }>
				<ToggleControl
					label={ __(
						'Zoom on Mobile',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'mobile_zoom' ) }
				/>
			</Field>
			<Field show={ isOn }>
				<MoreInPro
					title={ __(
						'More Zoom Options in Pro',
						'gallery-slider-for-woocommerce'
					) }
					description={ __(
						'Finer control over how shoppers inspect details.',
						'gallery-slider-for-woocommerce'
					) }
					items={ MORE_ITEMS }
				/>
			</Field>
		</Fields>
	);
};

export default Zoom;
