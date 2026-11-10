import { useEffect, useRef } from '@wordpress/element';
import { select, useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store/constants';
import { parseRoute } from '../utils/route';

/**
 * Keep the URL hash and the dashboard store in sync (see `utils/route.js`).
 *
 * - Store → URL: each tab, section or sub-tab change adds a history entry,
 *   so Back and Forward move between them. The first write only tidies
 *   the hash (no entry).
 * - URL → store: Back/Forward and edited or clicked hash links open that place.
 */
const useHashRoute = () => {
	const route = useSelect(
		( storeSelect ) => storeSelect( STORE_NAME ).getRoute(),
		[]
	);
	const { applyRoute } = useDispatch( STORE_NAME );
	const isFirstWrite = useRef( true );

	useEffect( () => {
		if ( window.location.hash !== route ) {
			window.history[
				isFirstWrite.current ? 'replaceState' : 'pushState'
			]( window.history.state, '', route );
		}
		isFirstWrite.current = false;
	}, [ route ] );

	useEffect( () => {
		const onNavigate = () => {
			applyRoute( parseRoute( window.location.hash ) );
			// The unsaved-changes prompt (or an unknown hash) kept the old place: show its hash again.
			const current = select( STORE_NAME ).getRoute();
			if ( window.location.hash !== current ) {
				window.history.replaceState(
					window.history.state,
					'',
					current
				);
			}
		};
		window.addEventListener( 'popstate', onNavigate );
		window.addEventListener( 'hashchange', onNavigate );
		return () => {
			window.removeEventListener( 'popstate', onNavigate );
			window.removeEventListener( 'hashchange', onNavigate );
		};
	}, [ applyRoute ] );
};

export default useHashRoute;
