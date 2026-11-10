import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../store/constants';

/**
 * Device the responsive controls currently edit, from the dashboard store.
 *
 * @return {string} 'desktop', 'tablet' or 'mobile'.
 */
const useDeviceType = () =>
	useSelect( ( select ) => select( STORE_NAME ).getDeviceType(), [] );

export default useDeviceType;
