import { useCallback } from '@wordpress/element';
import useDeviceType from './useDeviceType';
import {
	getDeviceUnit,
	getDeviceValue,
	isResponsiveValue,
	setDeviceUnit,
	setDeviceValue,
} from '../utils/responsive';

/**
 * Read and write a control value with the testimonial-pro control API
 * (`attributes`, `attributesKey`, `setAttributes`, optional `onChange`).
 * A responsive value (`{ device: {…} }`) reads and writes the device picked
 * in the dashboard store; any other shape always uses desktop.
 *
 * @param {Object}   props               Control props.
 * @param {*}        props.attributes    Current control value.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter called with `{ [attributesKey]: value }`.
 * @param {Function} props.onChange      Optional setter called with the new value instead.
 * @return {Object} Value helpers.
 */
const useControlValue = ( {
	attributes,
	attributesKey,
	setAttributes,
	onChange,
} ) => {
	const deviceType = useDeviceType();
	const isResponsive = isResponsiveValue( attributes );
	const device = isResponsive ? deviceType : 'desktop';

	const write = useCallback(
		( next ) => {
			if ( onChange ) {
				onChange( next );
			} else if ( setAttributes && attributesKey ) {
				setAttributes( { [ attributesKey ]: next } );
			}
		},
		[ onChange, setAttributes, attributesKey ]
	);

	return {
		device,
		isResponsive,
		value: getDeviceValue( attributes, device ),
		unit: getDeviceUnit( attributes, device ),
		write,
		setValue: ( value ) =>
			write( setDeviceValue( attributes, device, value ) ),
		setUnit: ( unit ) => write( setDeviceUnit( attributes, device, unit ) ),
	};
};

export default useControlValue;
