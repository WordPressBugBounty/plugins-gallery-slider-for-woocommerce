/**
 * Helpers for control values that may differ per device.
 *
 * A control value can take three shapes (same as testimonial-pro):
 * - raw value:        `12`
 * - value object:     `{ value: 12, unit: 'px' }`
 * - responsive value: `{ device: { desktop: 12, tablet: 10, mobile: 8 }, unit: 'px' }`
 *
 * `unit` may also be a per-device map: `{ desktop: 'px', mobile: '%' }`.
 */

export const DEVICES = [ 'desktop', 'tablet', 'mobile' ];

const isEmpty = ( value ) =>
	value === undefined || value === null || value === '';

/**
 * Whether the value carries a per-device map.
 *
 * @param {*} attr Control value.
 * @return {boolean} True for a responsive value.
 */
export const isResponsiveValue = ( attr ) =>
	!! attr &&
	'object' === typeof attr &&
	!! attr.device &&
	'object' === typeof attr.device;

const isValueObject = ( attr ) =>
	!! attr &&
	'object' === typeof attr &&
	! Array.isArray( attr ) &&
	'value' in attr;

/**
 * Read the value for a device. An unset tablet/mobile value inherits the
 * next larger device, so only overrides need to be stored.
 *
 * @param {*}      attr   Control value.
 * @param {string} device Device key.
 * @return {*} Value for the device.
 */
export const getDeviceValue = ( attr, device = 'desktop' ) => {
	if ( isResponsiveValue( attr ) ) {
		const index = Math.max( 0, DEVICES.indexOf( device ) );
		for ( let i = index; i >= 0; i-- ) {
			if ( ! isEmpty( attr.device[ DEVICES[ i ] ] ) ) {
				return attr.device[ DEVICES[ i ] ];
			}
		}
		return undefined;
	}
	if ( isValueObject( attr ) ) {
		return attr.value;
	}
	return attr;
};

/**
 * Write the value for a device, keeping the value's shape.
 *
 * @param {*}      attr   Control value.
 * @param {string} device Device key.
 * @param {*}      value  New value.
 * @return {*} Updated control value.
 */
export const setDeviceValue = ( attr, device, value ) => {
	if ( isResponsiveValue( attr ) ) {
		return { ...attr, device: { ...attr.device, [ device ]: value } };
	}
	if ( isValueObject( attr ) ) {
		return { ...attr, value };
	}
	return value;
};

/**
 * Read the unit for a device.
 *
 * @param {*}      attr   Control value.
 * @param {string} device Device key.
 * @return {string} Unit, or an empty string.
 */
export const getDeviceUnit = ( attr, device = 'desktop' ) => {
	const unit = attr?.unit;
	if ( unit && 'object' === typeof unit ) {
		return getDeviceValue( { device: unit }, device ) || '';
	}
	return unit || '';
};

/**
 * Write the unit for a device.
 *
 * @param {Object} attr   Control value (object shape).
 * @param {string} device Device key.
 * @param {string} unit   New unit.
 * @return {Object} Updated control value.
 */
export const setDeviceUnit = ( attr, device, unit ) => {
	if ( attr?.unit && 'object' === typeof attr.unit ) {
		return { ...attr, unit: { ...attr.unit, [ device ]: unit } };
	}
	return { ...attr, unit };
};

/**
 * Shallow-safe deep equality for plain control values.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @return {boolean} True when equal.
 */
export const isSameValue = ( a, b ) =>
	JSON.stringify( a ) === JSON.stringify( b );
