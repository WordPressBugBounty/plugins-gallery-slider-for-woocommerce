import { useEffect, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { CheckIcon } from '../Icons';
import './editor.scss';

// How long the toast stays, and how long its exit animation runs.
const SHOW_MS = 2600;
const OUT_MS = 220;

/**
 * Bottom toast of the dashboard ("Changes saved", "Layout saved · …"), as
 * in the design: it slides in, stays 2.6s and fades out. Shown by the store's
 * `showToast(text, isDraft)`.
 */
const Toast = () => {
	const toast = useSelect(
		( select ) => select( STORE_NAME ).getToast(),
		[]
	);
	const { hideToast } = useDispatch( STORE_NAME );
	// Key of the toast that is fading out: a new toast never starts faded.
	const [ outKey, setOutKey ] = useState( null );

	useEffect( () => {
		if ( ! toast ) {
			return;
		}
		const outTimer = setTimeout( () => setOutKey( toast.key ), SHOW_MS );
		const hideTimer = setTimeout( hideToast, SHOW_MS + OUT_MS );
		return () => {
			clearTimeout( outTimer );
			clearTimeout( hideTimer );
		};
	}, [ toast, hideToast ] );

	if ( ! toast ) {
		return null;
	}
	const isOut = outKey === toast.key;

	return (
		<div
			key={ toast.key }
			className={ `wcgs-toast sp-d-flex sp-align-center sp-gap-10px${
				isOut ? ' is-out' : ''
			}${ toast.isDraft ? ' is-draft' : '' }` }
			role="status"
			aria-live="polite"
		>
			<span className="wcgs-toast__icon sp-d-i-flex sp-align-center sp-justify-center">
				<CheckIcon size={ 11 } strokeWidth={ 3.2 } />
			</span>
			{ toast.text }
		</div>
	);
};

export default Toast;
