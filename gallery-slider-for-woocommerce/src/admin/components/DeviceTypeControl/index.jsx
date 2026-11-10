import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { STORE_NAME } from '../../store/constants';
import useDeviceType from '../../hooks/useDeviceType';
import useClickOutside from '../../hooks/useClickOutside';
import { DEVICES } from '../../utils/responsive';
import { DeviceIcon } from '../Icons';
import './editor.scss';

const DEVICE_LABELS = {
	desktop: __( 'Desktop', 'gallery-slider-for-woocommerce' ),
	tablet: __( 'Tablet', 'gallery-slider-for-woocommerce' ),
	mobile: __( 'Mobile', 'gallery-slider-for-woocommerce' ),
};

/**
 * Device switch shared by every responsive control. The device lives in the
 * dashboard store, so switching it in one control switches all of them.
 *
 * @param {Object}   props
 * @param {string}   props.variant  'dropdown' (label row, default) or 'toolbar' (segmented).
 * @param {Function} props.onChange Optional callback after the device changes.
 */
const DeviceTypeControl = ( { variant = 'dropdown', onChange } ) => {
	const deviceType = useDeviceType();
	const { setDeviceType } = useDispatch( STORE_NAME );
	const [ isOpen, setIsOpen ] = useState( false );
	const ref = useRef();
	const close = useCallback( () => setIsOpen( false ), [] );
	useClickOutside( ref, isOpen, close );

	const pick = ( device ) => {
		setDeviceType( device );
		setIsOpen( false );
		if ( onChange ) {
			onChange( device );
		}
	};

	if ( 'toolbar' === variant ) {
		const index = Math.max( 0, DEVICES.indexOf( deviceType ) );
		return (
			<div
				className="wcgs-device-toolbar sp-d-i-flex"
				role="radiogroup"
				aria-label={ __(
					'Preview device',
					'gallery-slider-for-woocommerce'
				) }
			>
				<span
					className="wcgs-device-toolbar__pill"
					style={ { transform: `translateX(${ index * 36 }px)` } }
				/>
				{ DEVICES.map( ( device ) => (
					<button
						key={ device }
						type="button"
						role="radio"
						aria-checked={ deviceType === device }
						title={ DEVICE_LABELS[ device ] }
						className={ `wcgs-device-toolbar__item sp-flex-center${
							deviceType === device ? ' is-active' : ''
						}` }
						onClick={ () => pick( device ) }
					>
						<DeviceIcon device={ device } size={ 17 } />
					</button>
				) ) }
			</div>
		);
	}

	return (
		<span
			className="wcgs-device-switch sp-d-i-flex sp-flex-none"
			ref={ ref }
		>
			<button
				type="button"
				className={ `wcgs-device-switch__toggle sp-d-i-flex sp-align-center sp-justify-center${
					isOpen ? ' is-open' : ''
				}` }
				onClick={ () => setIsOpen( ! isOpen ) }
				title={ __(
					'Responsive value',
					'gallery-slider-for-woocommerce'
				) }
				aria-label={ sprintf(
					/* translators: %s: device name, e.g. "Tablet". */
					__(
						'Responsive value: %s',
						'gallery-slider-for-woocommerce'
					),
					DEVICE_LABELS[ deviceType ] || DEVICE_LABELS.desktop
				) }
				aria-haspopup="true"
				aria-expanded={ isOpen }
			>
				<DeviceIcon device={ deviceType } />
			</button>
			<div
				className={ `wcgs-device-switch__menu sp-d-flex sp-flex-col${
					isOpen ? ' is-open' : ''
				}` }
			>
				{ DEVICES.map( ( device ) => (
					<button
						key={ device }
						type="button"
						title={ DEVICE_LABELS[ device ] }
						aria-label={ DEVICE_LABELS[ device ] }
						aria-pressed={ deviceType === device }
						className={ `wcgs-device-switch__item sp-flex-center sp-w-full${
							deviceType === device ? ' is-active' : ''
						}` }
						onClick={ () => pick( device ) }
						tabIndex={ isOpen ? 0 : -1 }
					>
						<DeviceIcon device={ device } strokeWidth={ 1.6 } />
					</button>
				) ) }
			</div>
		</span>
	);
};

export default DeviceTypeControl;
