import { useCallback, useEffect, useState } from '@wordpress/element';
import {
	SWATCHES_SLUG,
	fetchPluginStatuses,
	installPlugin,
} from '../wizard/addons';

/**
 * State of the Smart Swatches plugin on this site, and the action that
 * installs or activates it.
 *
 * `status` is 'loading', 'missing' (not installed), 'inactive', 'active' or
 * 'busy' (installing or activating); `error` holds the last failure.
 *
 * @since 4.0.0
 * @param {boolean} canInstall Whether the user may install and activate plugins.
 * @return {Object} `{ status, isActivating, error, install }`.
 */
const useSwatchesPlugin = ( canInstall ) => {
	const [ current, setCurrent ] = useState( null );
	const [ status, setStatus ] = useState( 'loading' );
	const [ error, setError ] = useState( '' );

	useEffect( () => {
		if ( ! canInstall ) {
			return;
		}
		let isCurrent = true;
		fetchPluginStatuses()
			.then( ( statuses ) => {
				if ( ! isCurrent ) {
					return;
				}
				const plugin = statuses[ SWATCHES_SLUG ] || null;
				setCurrent( plugin );
				setStatus( plugin ? plugin.status : 'missing' );
			} )
			.catch( () => isCurrent && setStatus( 'missing' ) );
		return () => {
			isCurrent = false;
		};
	}, [ canInstall ] );

	const install = useCallback( async () => {
		if ( 'missing' !== status && 'inactive' !== status ) {
			return;
		}
		const wasInstalled = 'inactive' === status;
		setStatus( 'busy' );
		setError( '' );
		try {
			const plugin = await installPlugin( SWATCHES_SLUG, current );
			setCurrent( plugin );
			setStatus( 'active' );
		} catch ( failure ) {
			setStatus( wasInstalled ? 'inactive' : 'missing' );
			setError( failure.message );
		}
	}, [ status, current ] );

	return {
		status: canInstall ? status : 'missing',
		// Installed before (only activating): the busy label says so.
		isActivating: !! current && 'active' !== current.status,
		error,
		install,
	};
};

export default useSwatchesPlugin;
