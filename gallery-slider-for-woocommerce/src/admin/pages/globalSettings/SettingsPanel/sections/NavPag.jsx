import { __ } from '@wordpress/i18n';
import {
	ButtonGroup,
	IconPicker,
	SelectControl,
	Subheading,
	ToggleControl,
} from '../../../../components';
import {
	Field,
	Fields,
	GroupColors,
	NumberField,
	Row,
	SpacingField,
} from './Field';
import { Visual } from './previews';
import { ARROW_ICONS, VISIBILITY, lockOptions } from './options';
import { PAGINATION_VISUALS } from './visuals';
import useGlobalSettings from './useGlobalSettings';

// Bullets, Dynamic and Strokes are free; the other styles are Pro.
const PAGINATION_STYLES = lockOptions(
	[
		[ 'bullets', __( 'Bullets', 'gallery-slider-for-woocommerce' ) ],
		[ 'dynamic', __( 'Dynamic', 'gallery-slider-for-woocommerce' ) ],
		[ 'strokes', __( 'Strokes', 'gallery-slider-for-woocommerce' ) ],
		[ 'numbers', __( 'Numbers', 'gallery-slider-for-woocommerce' ) ],
		[
			'progressbar',
			__( 'Progress Bar', 'gallery-slider-for-woocommerce' ),
		],
		[ 'dot-hopper', __( 'Dot Hopper', 'gallery-slider-for-woocommerce' ) ],
		[
			'expanding-dot',
			__( 'Expanding Dot', 'gallery-slider-for-woocommerce' ),
		],
		[
			'fraction',
			__( 'Flexing Fraction', 'gallery-slider-for-woocommerce' ),
		],
	].map( ( [ value, label ] ) => ( {
		value,
		label,
		preview: <Visual parts={ PAGINATION_VISUALS[ value ] } />,
	} ) ),
	[ 'numbers', 'progressbar', 'dot-hopper', 'expanding-dot', 'fraction' ]
);

// Vertically Center and Bottom Left are free.
const NAV_POSITIONS = lockOptions(
	[
		[
			'center_center',
			__( 'Vertically Center', 'gallery-slider-for-woocommerce' ),
		],
		[
			'bottom_right',
			__( 'Bottom Right', 'gallery-slider-for-woocommerce' ),
		],
		[
			'bottom_left',
			__( 'Bottom Left', 'gallery-slider-for-woocommerce' ),
		],
		[
			'bottom_center',
			__( 'Bottom Center', 'gallery-slider-for-woocommerce' ),
		],
	].map( ( [ value, label ] ) => ( { value, label } ) ),
	[ 'bottom_right', 'bottom_center' ]
);

/**
 * Product Gallery › Navigation & Pagination: slider arrows and pagination.
 */
const NavPag = () => {
	const { v, d, set, bind, dv, setDevice, resetDevice } = useGlobalSettings();
	const hasNav = !! v.navigation;
	const hasPagination = !! v.pagination;

	return (
		<Fields>
			<Field>
				<ToggleControl
					label={ __(
						'Slider Navigation',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'navigation' ) }
				/>
			</Field>
			<Field show={ hasNav }>
				<IconPicker
					label={ __(
						'Navigation Icon Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'navigation_icon' ) }
					options={ ARROW_ICONS }
					columns={ 6 }
				/>
			</Field>
			<Field show={ hasNav }>
				<ButtonGroup
					label={ __(
						'Navigation Visibility',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'navigation_visibility' ) }
					options={ VISIBILITY }
				/>
			</Field>
			<Field show={ hasNav }>
				<SelectControl
					label={ __(
						'Navigation Position',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'navigation_position' ) }
					options={ NAV_POSITIONS }
				/>
			</Field>
			<Field show={ hasNav }>
				<Row cols={ 2 }>
					<NumberField
						small={ false }
						label={ __(
							'Icon Size',
							'gallery-slider-for-woocommerce'
						) }
						value={ dv( 'navigation_icon_size' ) }
						onChange={ ( n ) =>
							setDevice( 'navigation_icon_size', n )
						}
						isResponsive
						{ ...resetDevice( 'navigation_icon_size' ) }
						min={ 8 }
						max={ 60 }
						unit="px"
					/>
					<NumberField
						small={ false }
						label={ __(
							'Nav Box Radius',
							'gallery-slider-for-woocommerce'
						) }
						value={ v.navigation_icon_radius }
						onChange={ ( n ) => set( 'navigation_icon_radius', n ) }
						max={ 50 }
						unit="px"
					/>
				</Row>
			</Field>
			<Field show={ hasNav }>
				<GroupColors
					groupKey="navigation_icon_color_group"
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

			<Field>
				<Subheading
					label={ __(
						'Pagination',
						'gallery-slider-for-woocommerce'
					) }
				/>
			</Field>
			<Field>
				<ToggleControl
					label={ __(
						'Slider Pagination',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'pagination' ) }
				/>
			</Field>
			<Field show={ hasPagination }>
				<SelectControl
					label={ __(
						'Pagination Style',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'pagination_type' ) }
					options={ PAGINATION_STYLES }
				/>
			</Field>
			<Field show={ hasPagination }>
				<GroupColors
					groupKey="pagination_icon_color_group"
					items={ [
						[
							'color',
							__( 'Color', 'gallery-slider-for-woocommerce' ),
						],
						[
							'active_color',
							__(
								'Active Color',
								'gallery-slider-for-woocommerce'
							),
						],
					] }
				/>
			</Field>
			<Field show={ hasPagination }>
				<ButtonGroup
					label={ __(
						'Pagination Visibility',
						'gallery-slider-for-woocommerce'
					) }
					{ ...bind( 'pagination_visibility' ) }
					options={ VISIBILITY }
				/>
			</Field>
			<Field show={ hasPagination }>
				<SpacingField
					label={ __(
						'Pagination Margin',
						'gallery-slider-for-woocommerce'
					) }
					value={ v.pagination_margin }
					onChange={ ( next ) => set( 'pagination_margin', next ) }
					defaultValue={ d.pagination_margin }
					min={ -100 }
				/>
			</Field>
		</Fields>
	);
};

export default NavPag;
