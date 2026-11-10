import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store/constants';
import { parseRoute } from '../utils/route';

/** Dashboard page slug (`Woo_Gallery_Slider_Dashboard::PAGE_SLUG`). */
const PAGE_SLUG = 'wcgs-dashboard';

/**
 * Header tab a Product Gallery admin menu link opens, or null when the link
 * leads somewhere else. Dashboard links without a hash open Global Settings.
 *
 * @param {HTMLAnchorElement} link Menu link.
 * @return {string|null} Header tab key.
 */
const linkTab = ( link ) => {
	if (
		link.pathname !== window.location.pathname ||
		new URLSearchParams( link.search ).get( 'page' ) !== PAGE_SLUG
	) {
		return null;
	}
	return parseRoute( link.hash ).tab || 'global';
};

/**
 * Tie the WordPress admin menu to the header tabs: the Product Gallery
 * submenus (Dashboard, Per-Product Layouts, Settings) all link to this page,
 * so mark the open tab's item as current, and switch tabs in place when one
 * is clicked (asking first about unsaved changes, like the header tabs).
 */
const useAdminMenu = () => {
	const activeTab = useSelect(
		( select ) => select( STORE_NAME ).getActiveTab(),
		[]
	);
	const { requestTab } = useDispatch( STORE_NAME );

	useEffect( () => {
		const menu = document.getElementById( 'toplevel_page_wpgs-settings' );
		menu?.querySelectorAll( '.wp-submenu a' ).forEach( ( link ) => {
			const isCurrent = linkTab( link ) === activeTab;
			link.classList.toggle( 'current', isCurrent );
			link.parentElement.classList.toggle( 'current', isCurrent );
			if ( isCurrent ) {
				link.setAttribute( 'aria-current', 'page' );
			} else {
				link.removeAttribute( 'aria-current' );
			}
		} );
	}, [ activeTab ] );

	useEffect( () => {
		const menu = document.getElementById( 'toplevel_page_wpgs-settings' );
		if ( ! menu ) {
			return;
		}
		const onClick = ( event ) => {
			const link = event.target.closest( 'a' );
			// Leave new-tab and new-window clicks to the browser.
			if (
				! link ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return;
			}
			const tab = linkTab( link );
			if ( tab ) {
				event.preventDefault();
				requestTab( tab );
			}
		};
		menu.addEventListener( 'click', onClick );
		return () => menu.removeEventListener( 'click', onClick );
	}, [ requestTab ] );
};

export default useAdminMenu;
