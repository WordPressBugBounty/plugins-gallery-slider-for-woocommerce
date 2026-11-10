import { __ } from '@wordpress/i18n';
import {
	ButtonGroup,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '../../../../components';
import { Field, Fields } from './Field';
import { lockOptions } from './options';
import useGlobalSettings from './useGlobalSettings';

const SWITCHES = [
	[
		'infinite_loop',
		__( 'Infinite Loop', 'gallery-slider-for-woocommerce' ),
	],
	[
		'accessibility',
		__( 'Accessibility', 'gallery-slider-for-woocommerce' ),
	],
	[ 'slider_dir', __( 'RTL Mode', 'gallery-slider-for-woocommerce' ) ],
	[ 'free_mode', __( 'Free Mode', 'gallery-slider-for-woocommerce' ) ],
	[ 'mouse_wheel', __( 'Mouse Wheel', 'gallery-slider-for-woocommerce' ) ],
];

const EFFECTS = lockOptions(
	[
		[ 'slide', __( 'Slide', 'gallery-slider-for-woocommerce' ) ],
		[ 'fade', __( 'Fade', 'gallery-slider-for-woocommerce' ) ],
		[ 'flip', __( 'Flip', 'gallery-slider-for-woocommerce' ) ],
		[ 'cube', __( 'Cube', 'gallery-slider-for-woocommerce' ) ],
	].map( ( [ value, label ] ) => ( { value, label } ) ),
	[ 'fade' ]
);

/**
 * Product Gallery › Slider: autoplay, effect, height and slider behavior.
 * Every free layout is a slider. Fade and Fixed Height are Pro.
 */
const Slider = () => {
	const { v, d, set, bind } = useGlobalSettings();

	return (
		<Fields>
			<Field>
				<ToggleControl
					label={ __( 'AutoPlay', 'gallery-slider-for-woocommerce' ) }
					{ ...bind( 'autoplay' ) }
				/>
			</Field>
			<Field show={ !! v.autoplay }>
				<RangeControl
					label={ __(
						'AutoPlay Interval',
						'gallery-slider-for-woocommerce'
					) }
					attributes={ { value: v.autoplay_interval, unit: 'ms' } }
					onChange={ ( next ) =>
						set( 'autoplay_interval', next.value )
					}
					min={ 0 }
					max={ 12000 }
					step={ 50 }
					defaultValue={ { value: d.autoplay_interval, unit: 'ms' } }
				/>
			</Field>
			<Field>
				<RangeControl
					label={ __(
						'AutoPlay Speed',
						'gallery-slider-for-woocommerce'
					) }
					help={ __(
						'Duration of the slide transition between images, in milliseconds.',
						'gallery-slider-for-woocommerce'
					) }
					attributes={ { value: v.autoplay_speed, unit: 'ms' } }
					onChange={ ( next ) => set( 'autoplay_speed', next.value ) }
					min={ 0 }
					max={ 2000 }
					step={ 50 }
					defaultValue={ { value: d.autoplay_speed, unit: 'ms' } }
				/>
			</Field>
			<Field>
				<SelectControl
					label={ __(
						'Slide Orientation',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'slide_orientation' ) }
					options={ [
						{
							value: 'horizontal',
							label: __(
								'Horizontal',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'vertical',
							label: __(
								'Vertical',
								'gallery-slider-for-woocommerce'
							),
						},
					] }
				/>
			</Field>
			<Field>
				<SelectControl
					label={ __(
						'Sliding Effect',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'fade_slide' ) }
					options={ EFFECTS }
				/>
			</Field>
			<Field>
				<ButtonGroup
					label={ __(
						'Gallery Height',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'slider_height_type' ) }
					fitContent
					options={ [
						{
							value: 'adaptive',
							label: __(
								'Adaptive',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'max_image',
							label: __(
								'Max Image Height',
								'gallery-slider-for-woocommerce'
							),
						},
						{
							value: 'fix_height',
							label: __(
								'Fixed Height',
								'gallery-slider-for-woocommerce'
							),
							locked: true,
						},
					] }
				/>
			</Field>
			{ SWITCHES.map( ( [ key, label ] ) => (
				<Field key={ key }>
					<ToggleControl label={ label } { ...bind( key ) } />
				</Field>
			) ) }
		</Fields>
	);
};

export default Slider;
