/**
 * Number helpers shared by the numeric controls.
 */

/**
 * Number of decimals in a step, e.g. 0.1 → 1.
 *
 * @param {number} step Step.
 * @return {number} Decimal places.
 */
export const stepDecimals = ( step ) =>
	( String( step ).split( '.' )[ 1 ] || '' ).length;

/**
 * Snap a value to the step and keep it inside min/max.
 *
 * @param {number} value Value.
 * @param {number} min   Minimum.
 * @param {number} max   Maximum.
 * @param {number} step  Step.
 * @return {number} Clamped value.
 */
export const clampToStep = ( value, min, max, step = 1 ) => {
	const snapped = Math.round( value / step ) * step;
	const clamped = Math.max( min, Math.min( max, snapped ) );
	return +clamped.toFixed( stepDecimals( step ) );
};

/**
 * Format a value for a number input, padding decimals to the step.
 *
 * @param {number|string} value Value.
 * @param {number}        step  Step.
 * @return {string} Display value.
 */
export const formatNumber = ( value, step = 1 ) => {
	if ( value === '' || value === null || value === undefined ) {
		return '';
	}
	const decimals = stepDecimals( step );
	return decimals ? ( +value ).toFixed( decimals ) : String( value );
};

/**
 * Track a pointer drag over an element and report the pointer position as
 * 0–1 fractions of the element box (same as the design's `_drag`).
 *
 * @param {PointerEvent} event  The pointerdown event.
 * @param {Function}     onMove Called with ( x, y ) fractions.
 */
export const startPointerDrag = ( event, onMove ) => {
	event.preventDefault();
	const rect = event.currentTarget.getBoundingClientRect();
	const run = ( ev ) =>
		onMove(
			Math.max(
				0,
				Math.min( 1, ( ev.clientX - rect.left ) / rect.width )
			),
			Math.max(
				0,
				Math.min( 1, ( ev.clientY - rect.top ) / rect.height )
			)
		);
	run( event );
	const up = () => {
		window.removeEventListener( 'pointermove', run );
		window.removeEventListener( 'pointerup', up );
	};
	window.addEventListener( 'pointermove', run );
	window.addEventListener( 'pointerup', up );
};
