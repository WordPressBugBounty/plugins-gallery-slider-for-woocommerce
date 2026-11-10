import { ROUTE_TABS } from '../constants/tabs';
import { SECTIONS } from '../constants/sections';
import { SETTINGS_TABS } from '../constants/settingsTabs';

/**
 * Hash routes of the dashboard, so a refresh (or a shared link) opens the
 * same place:
 *
 * - `#global`, `#global/<section>`, `#global/gallery/<sub-section>`
 * - `#layouts`, `#layouts/new`, `#layouts/<layout ID>` (the layout editor)
 * - `#settings/<settings sub-tab>`
 * - `#swatches` (the Variation Swatches page)
 * - `#wizard`: opens the Setup Wizard over Global Settings (the activation
 *   redirect of a first install). It is not kept in the URL: the hash
 *   becomes `#global`, so a refresh doesn't reopen the wizard.
 *
 * Unknown parts are ignored, so an old or mistyped link falls back to defaults.
 */

/**
 * Read a location hash.
 *
 * @param {string} hash `window.location.hash`, with or without the `#`.
 * @return {Object} Known parts only: `{ tab, section, subSection, settingsTab, layoutTarget, wizard }`.
 */
export const parseRoute = ( hash = '' ) => {
	const parts = String( hash )
		.replace( /^#\/?/, '' )
		.split( '/' )
		.map( ( part ) => part.trim().toLowerCase() );
	const tab = parts[ 0 ];

	if ( 'wizard' === tab ) {
		return { tab: 'global', wizard: true };
	}

	if ( ! ROUTE_TABS.includes( tab ) ) {
		return {};
	}
	const route = { tab };

	if ( 'global' === tab ) {
		// `#global` alone means every section is folded.
		const section = SECTIONS.find( ( item ) => item.key === parts[ 1 ] );
		route.section = section ? section.key : null;
		route.subSection =
			section?.children?.find( ( item ) => item.key === parts[ 2 ] )
				?.key || null;
	}

	if (
		'settings' === tab &&
		SETTINGS_TABS.some( ( item ) => item.key === parts[ 1 ] )
	) {
		route.settingsTab = parts[ 1 ];
	}

	if ( 'layouts' === tab ) {
		// `#layouts` alone is the list; `new` or an ID opens the editor.
		route.layoutTarget = parseLayoutTarget( parts[ 1 ] );
	}

	return route;
};

/**
 * Read a layout editor target from a hash part.
 *
 * @param {string} part Hash part after `layouts/`.
 * @return {string|number|null} 'new', a layout ID, or null for the list.
 */
export const parseLayoutTarget = ( part ) => {
	if ( 'new' === part ) {
		return 'new';
	}
	return /^\d+$/.test( part || '' ) ? parseInt( part, 10 ) : null;
};

/**
 * Build the hash of a dashboard place.
 *
 * @param {Object}             route              Place.
 * @param {string}             route.tab          Header tab.
 * @param {string|null}        route.section      Global Settings section.
 * @param {string|null}        route.subSection   Global Settings sub-section.
 * @param {string}             route.settingsTab  Settings sub-tab.
 * @param {string|number|null} route.layoutTarget Layout editor: 'new', an ID, or null for the list.
 * @return {string} Hash, starting with `#`.
 */
export const buildRoute = ( {
	tab,
	section,
	subSection,
	settingsTab,
	layoutTarget,
} ) => {
	if ( 'global' === tab ) {
		return [ '#global', section, section && subSection ]
			.filter( Boolean )
			.join( '/' );
	}
	if ( 'settings' === tab ) {
		return `#settings/${ settingsTab }`;
	}
	if ( 'layouts' === tab ) {
		return null === layoutTarget || undefined === layoutTarget
			? '#layouts'
			: `#layouts/${ layoutTarget }`;
	}
	return `#${ tab }`;
};
