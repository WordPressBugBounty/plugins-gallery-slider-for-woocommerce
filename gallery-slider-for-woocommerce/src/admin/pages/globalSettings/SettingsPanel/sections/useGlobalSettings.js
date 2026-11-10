import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../../../store/constants';
import { isSameValue } from '../../../../utils/responsive';
import {
	DEVICE_BREAKPOINTS,
	hasDeviceValue,
	valueForDevice,
} from '../../../../utils/deviceOverrides';
import useDeviceType from '../../../../hooks/useDeviceType';
import { DEVICE_ICONS } from './options';

/**
 * Values of the settings panel and helpers that bind them to controls. Keys
 * are the `wcgs_settings` keys of the legacy settings page; in the layout
 * editor they are the same keys of the layout's `wcgs_metabox`.
 *
 * Responsive settings (utils/deviceOverrides.js) are edited on the device
 * picked in the store: `dv`, `setDevice`, `setDeviceSub`, `bindDevice` and
 * `resetDevice` read and write that device's value.
 *
 * @return {Object} `{ v, d, choices, pluginUrl, device, bind, bindSub, set, setMany, setSub, reset, dv, setDevice, setDeviceSub, bindDevice, spacing, resetDevice }`.
 */
const useGlobalSettings = () => {
	const { v, d, choices, pluginUrl } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			v: store.getPanelValues(),
			d: store.getPanelDefaults(),
			choices: store.getPanelChoices(),
			pluginUrl: store.getDashboardInfo().pluginUrl || '',
		};
	}, [] );
	const device = useDeviceType();
	const {
		setPanelValues,
		setPanelSubValue,
		setPanelDeviceValue,
		setPanelDeviceSubValue,
		clearPanelDeviceValue,
	} = useDispatch( STORE_NAME );

	const set = ( key, value ) => setPanelValues( { [ key ]: value } );
	const setSub = ( key, sub, value ) => setPanelSubValue( key, sub, value );

	// The value a device sees: its own, or the one it inherits.
	const valueOn = ( key, on ) => valueForDevice( v, key, on );
	// The device a value is inherited from.
	const largerThan = ( on ) => {
		const index = DEVICE_BREAKPOINTS.findIndex(
			( [ name ] ) => name === on
		);
		return index > 0 ? DEVICE_BREAKPOINTS[ index - 1 ][ 0 ] : 'desktop';
	};
	// Name of a responsive reset button: on tablet and mobile it drops the
	// device's own value, so the device inherits the larger one's again.
	const resetLabel =
		'desktop' === device
			? undefined
			: sprintf(
					/* translators: %s: device name, e.g. "Desktop". */
					__( 'Use the %s value', 'gallery-slider-for-woocommerce' ),
					DEVICE_ICONS[ largerThan( device ) ].title
			  );

	return {
		v,
		d,
		choices,
		pluginUrl,
		device,
		set,
		setMany: setPanelValues,
		setSub,
		// Props of a control that edits a whole key.
		bind: ( key ) => ( {
			attributes: v[ key ],
			onChange: ( value ) => set( key, value ),
		} ),
		// Props of a control that edits one nested key.
		bindSub: ( key, sub ) => ( {
			attributes: v[ key ]?.[ sub ],
			onChange: ( value ) => setSub( key, sub, value ),
		} ),
		// Reset button props of a row that edits a whole key.
		reset: ( key ) => ( {
			onReset: () => set( key, d[ key ] ),
			showReset: ! isSameValue( v[ key ], d[ key ] ),
		} ),
		// A responsive setting's value on the picked device.
		dv: ( key ) => valueOn( key, device ),
		setDevice: ( key, value, on = device ) =>
			setPanelDeviceValue( key, on, value ),
		setDeviceSub: ( key, sub, value ) =>
			setPanelDeviceSubValue( key, sub, device, value ),
		// Props of a RangeControl over a responsive setting. The value is
		// responsive, so the control shows the device switch; on tablet and
		// mobile the default is the inherited value, so reset clears the
		// device's own value.
		bindDevice: ( key, unit ) => {
			const withUnit = ( map ) =>
				unit ? { device: map, unit } : { device: map };
			return {
				attributes: withUnit( {
					desktop: v[ key ],
					tablet: valueOn( key, 'tablet' ),
					mobile: valueOn( key, 'mobile' ),
				} ),
				onChange: ( next ) =>
					setPanelDeviceValue(
						key,
						device,
						next?.device?.[ device ]
					),
				defaultValue: withUnit( {
					desktop: d[ key ],
					tablet: v[ key ],
					mobile: valueOn( key, 'tablet' ),
				} ),
				resetLabel,
			};
		},
		// Props of a SpacingField over a responsive setting: every device's
		// value, and as reset targets the default (desktop) or the inherited value.
		spacing: ( key ) => ( {
			deviceValues: {
				desktop: v[ key ],
				tablet: valueOn( key, 'tablet' ),
				mobile: valueOn( key, 'mobile' ),
			},
			deviceDefaults: {
				desktop: d[ key ],
				tablet: v[ key ],
				mobile: valueOn( key, 'tablet' ),
			},
			resetLabel,
		} ),
		// Reset button props of a row over a responsive setting: desktop goes
		// back to the default, tablet and mobile to the inherited value.
		resetDevice: ( key ) =>
			'desktop' === device
				? {
						onReset: () => set( key, d[ key ] ),
						showReset: ! isSameValue( v[ key ], d[ key ] ),
				  }
				: {
						onReset: () => clearPanelDeviceValue( key, device ),
						resetLabel,
						showReset:
							hasDeviceValue( v, key, device ) &&
							! isSameValue(
								valueOn( key, device ),
								valueOn( key, largerThan( device ) )
							),
				  },
	};
};

export default useGlobalSettings;
