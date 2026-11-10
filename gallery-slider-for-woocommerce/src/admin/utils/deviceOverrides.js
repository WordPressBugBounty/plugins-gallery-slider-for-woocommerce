/**
 * Tablet and mobile values of the responsive settings, a port of
 * Woo_Gallery_Slider_Responsive (includes/class-woo-gallery-slider-responsive.php).
 *
 * Each responsive setting keeps its legacy key, and that value is the desktop
 * value. `device_overrides` holds, per device, only the values that differ:
 * `{ tablet: { gallery_bottom_gap: 20, thumbnails_sliders_space: { width: 4 } }, mobile: {} }`.
 * A missing key (or sub key of a nested value) inherits the next larger
 * device: mobile → tablet → desktop.
 */

export const OVERRIDES_KEY = 'device_overrides';

/**
 * Devices that can override the desktop value, largest first, with the
 * largest viewport width each covers (TABLET_MAX / MOBILE_MAX in PHP).
 */
export const DEVICE_BREAKPOINTS = [
	[ 'tablet', 1024 ],
	[ 'mobile', 767 ],
];

/**
 * Settings that can differ per device, in the order PHP stores them
 * (Woo_Gallery_Slider_Responsive::KEYS).
 */
export const RESPONSIVE_KEYS = [
	'gallery_bottom_gap',
	'thumbnails_item_to_show',
	'vertical_thumbs_width',
	'thumbnails_sliders_space',
	'thumbnails_inner_padding',
	'navigation_icon_size',
	'lightbox_icon_size',
];

const isMap = ( value ) =>
	!! value && 'object' === typeof value && ! Array.isArray( value );

const isUnset = ( value ) =>
	undefined === value || null === value || '' === value;

/**
 * The device values of a settings object, cleaned (get() in PHP): both
 * devices, only RESPONSIVE_KEYS, an empty PHP array (`[]`) read as none.
 *
 * @param {Object} settings Settings or panel values.
 * @return {Object} `{ tablet: {}, mobile: {} }`.
 */
export const getOverrides = ( settings ) => {
	const all = isMap( settings?.[ OVERRIDES_KEY ] )
		? settings[ OVERRIDES_KEY ]
		: {};
	const result = {};
	DEVICE_BREAKPOINTS.forEach( ( [ device ] ) => {
		const values = isMap( all[ device ] ) ? all[ device ] : {};
		result[ device ] = {};
		RESPONSIVE_KEYS.forEach( ( key ) => {
			if ( ! ( key in values ) ) {
				return;
			}
			const value = values[ key ];
			if ( isMap( value ) ) {
				const scalars = Object.fromEntries(
					Object.entries( value ).filter(
						( [ , sub ] ) => null !== sub && 'object' !== typeof sub
					)
				);
				if ( Object.keys( scalars ).length ) {
					result[ device ][ key ] = scalars;
				}
			} else if (
				! isUnset( value ) &&
				! Array.isArray( value ) &&
				'object' !== typeof value
			) {
				result[ device ][ key ] = value;
			}
		} );
	} );
	return result;
};

/**
 * Whether a settings object has any tablet or mobile value.
 *
 * @param {Object} settings Settings.
 * @return {boolean} True when a device sets a value.
 */
export const hasOverrides = ( settings ) =>
	Object.values( getOverrides( settings ) ).some(
		( values ) => Object.keys( values ).length > 0
	);

/**
 * The settings as a device sees them (for_device() in PHP).
 *
 * @param {Object} settings Settings or panel values.
 * @param {string} device   'desktop', 'tablet' or 'mobile'.
 * @return {Object} Settings with the device's values put in (a copy).
 */
export const forDevice = ( settings, device ) => {
	if ( ! DEVICE_BREAKPOINTS.some( ( [ name ] ) => name === device ) ) {
		return settings;
	}
	const overrides = getOverrides( settings );
	const result = { ...settings };
	for ( const [ step ] of DEVICE_BREAKPOINTS ) {
		Object.entries( overrides[ step ] ).forEach( ( [ key, value ] ) => {
			result[ key ] = isMap( value )
				? {
						...( isMap( result[ key ] ) ? result[ key ] : {} ),
						...value,
				  }
				: value;
		} );
		if ( step === device ) {
			break;
		}
	}
	return result;
};

/**
 * The value one device sees, with inheritance.
 *
 * @param {Object} settings Settings or panel values.
 * @param {string} key      Setting key.
 * @param {string} device   Device.
 * @return {*} Value.
 */
export const valueForDevice = ( settings, key, device ) =>
	forDevice( settings, device )[ key ];

/**
 * Write one device's value of a setting into the panel values.
 *
 * Desktop writes the setting's own key. Tablet and mobile write
 * `device_overrides`; a value equal to the one the device would inherit is
 * dropped, so the device follows the larger one again (the reset button
 * clears a device value this way). Nested values are compared per sub key.
 *
 * @param {Object} values Panel values.
 * @param {string} key    Setting key.
 * @param {string} device Device.
 * @param {*}      value  New value (same shape as the setting).
 * @return {Object} The keys to set: `{ [key]: … }` or `{ device_overrides: … }`.
 */
export const writeDeviceValue = ( values, key, device, value ) => {
	const index = DEVICE_BREAKPOINTS.findIndex(
		( [ name ] ) => name === device
	);
	if ( -1 === index ) {
		return { [ key ]: value };
	}
	const larger = index ? DEVICE_BREAKPOINTS[ index - 1 ][ 0 ] : 'desktop';
	const inherited = valueForDevice( values, key, larger );
	const overrides = getOverrides( values );
	const own = overrides[ device ];

	let next;
	if ( isMap( value ) ) {
		const base = isMap( inherited ) ? inherited : {};
		// Sub keys in the order of the setting's own value (the stored order).
		const order = [
			...Object.keys( base ),
			...Object.keys( value ).filter( ( sub ) => ! ( sub in base ) ),
		];
		next = {};
		order.forEach( ( sub ) => {
			if (
				sub in value &&
				! isUnset( value[ sub ] ) &&
				String( value[ sub ] ) !== String( base[ sub ] )
			) {
				next[ sub ] = value[ sub ];
			}
		} );
		if ( ! Object.keys( next ).length ) {
			next = undefined;
		}
	} else {
		next =
			isUnset( value ) || String( value ) === String( inherited )
				? undefined
				: value;
	}

	// Rebuild the device in RESPONSIVE_KEYS order, so the saved and edited
	// values compare equal as JSON.
	const deviceValues = {};
	RESPONSIVE_KEYS.forEach( ( name ) => {
		const current = name === key ? next : own[ name ];
		if ( undefined !== current ) {
			deviceValues[ name ] = current;
		}
	} );
	return {
		[ OVERRIDES_KEY ]: { ...overrides, [ device ]: deviceValues },
	};
};

/**
 * Drop one device's value of a setting from the panel values, so the device
 * follows the larger one again.
 *
 * @param {Object} values Panel values.
 * @param {string} key    Setting key.
 * @param {string} device 'tablet' or 'mobile'.
 * @return {Object} `{ device_overrides: … }`, or `{}` for desktop.
 */
export const clearDeviceValue = ( values, key, device ) => {
	const overrides = getOverrides( values );
	if ( ! overrides[ device ] ) {
		return {};
	}
	const { [ key ]: removed, ...rest } = overrides[ device ];
	return { [ OVERRIDES_KEY ]: { ...overrides, [ device ]: rest } };
};

/**
 * Whether a device sets its own value of a setting.
 *
 * @param {Object} values Panel values.
 * @param {string} key    Setting key.
 * @param {string} device Device.
 * @return {boolean} True when the device does not inherit it.
 */
export const hasDeviceValue = ( values, key, device ) =>
	key in ( getOverrides( values )[ device ] || {} );
