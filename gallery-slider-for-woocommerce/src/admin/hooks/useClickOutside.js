import { useEffect } from '@wordpress/element';

/**
 * Call `onClose` on a pointer press outside `ref` or on Escape, while `isOpen`.
 *
 * @param {Object}   ref     Ref of the element that owns the popover.
 * @param {boolean}  isOpen  Whether the popover is open.
 * @param {Function} onClose Close callback.
 */
const useClickOutside = ( ref, isOpen, onClose ) => {
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		const onPointerDown = ( event ) => {
			if ( ref.current && ! ref.current.contains( event.target ) ) {
				onClose();
			}
		};
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key ) {
				onClose();
			}
		};
		document.addEventListener( 'pointerdown', onPointerDown );
		document.addEventListener( 'keydown', onKeyDown );
		return () => {
			document.removeEventListener( 'pointerdown', onPointerDown );
			document.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ ref, isOpen, onClose ] );
};

export default useClickOutside;
