import { __ } from '@wordpress/i18n';
import {
	ButtonGroup,
	IconPicker,
	SelectControl,
	Subheading,
	ToggleControl,
} from '../../../../components';
import { MoreInPro } from '../../../../components/Pro';
import { Field, Fields } from './Field';
import { INLINE_OR_POPUP, VIDEO_ICONS, lockOptions } from './options';
import useGlobalSettings from './useGlobalSettings';

// Videos play in the gallery; the playlist button is Pro.
const PRESENTATIONS = [
	{
		value: 'in_gallery',
		label: __( 'In Gallery', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'playlist',
		label: __( 'Playlist Button', 'gallery-slider-for-woocommerce' ),
		locked: true,
		popover: {
			title: __( 'Playlist Button', 'gallery-slider-for-woocommerce' ),
			text: __(
				'Group product videos behind one button. Shoppers open a tidy playlist right on the gallery.',
				'gallery-slider-for-woocommerce'
			),
			visual: 'playlist',
		},
	},
];

const VIDEO_ORDERS = lockOptions(
	[
		[
			'video_come_first',
			__( 'At Starting of the Slider', 'gallery-slider-for-woocommerce' ),
		],
		[
			'usual',
			__(
				'Keep Videos in Default Position',
				'gallery-slider-for-woocommerce'
			),
		],
		[
			'video_come_last',
			__( 'End of the Slider', 'gallery-slider-for-woocommerce' ),
		],
	].map( ( [ value, label ] ) => ( { value, label } ) ),
	[ 'video_come_first' ]
);

const MORE_ITEMS = [
	__( 'Playlist button', 'gallery-slider-for-woocommerce' ),
	__( 'Custom video icon upload', 'gallery-slider-for-woocommerce' ),
	__( 'Video icon position & size', 'gallery-slider-for-woocommerce' ),
	__( 'Autoplay & loop', 'gallery-slider-for-woocommerce' ),
	__( 'Self-hosted player style', 'gallery-slider-for-woocommerce' ),
	__( 'YouTube player controls', 'gallery-slider-for-woocommerce' ),
].map( ( label ) => ( { label } ) );

/**
 * Product Gallery › Product Video Gallery: the master switch, how videos
 * play, the play icon and where the videos go in the gallery, then the
 * video options of Pro.
 */
const Video = () => {
	const { v, bind } = useGlobalSettings();
	const isOn = !! v.video_gallery;

	return (
		<Fields>
			<Field>
				<ToggleControl
					label={ __(
						'Product Video Gallery',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'video_gallery' ) }
				/>
			</Field>

			<Field show={ isOn }>
				<Subheading
					label={ __(
						'Presentation',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field show={ isOn }>
				<ButtonGroup
					label={ __(
						'Video Presentation',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'video_presentation' ) }
					options={ PRESENTATIONS }
				/>
			</Field>
			<Field show={ isOn }>
				<ButtonGroup
					label={ __(
						'Video Play Mode',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'video_popup_place' ) }
					options={ INLINE_OR_POPUP }
				/>
			</Field>

			<Field show={ isOn }>
				<Subheading
					label={ __(
						'Play Icon',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field show={ isOn }>
				<IconPicker
					label={ __(
						'Video Icon Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'video_icon' ) }
					options={ VIDEO_ICONS }
					columns={ 6 }
				/>
			</Field>

			<Field show={ isOn }>
				<Subheading
					label={ __(
						'Gallery Order',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field show={ isOn }>
				<SelectControl
					label={ __(
						'Place of the Videos in Gallery',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'video_order' ) }
					options={ VIDEO_ORDERS }
				/>
			</Field>
			<Field show={ isOn }>
				<MoreInPro
					title={ __(
						'More Video Options in Pro',
						'gallery-slider-for-woocommerce'
					) }
					description={ __(
						'More ways to present and play product videos.',
						'gallery-slider-for-woocommerce'
					) }
					items={ MORE_ITEMS }
				/>
			</Field>
		</Fields>
	);
};

export default Video;
