import { buildRoute } from '../utils/route';
import { SECTIONS } from '../constants/sections';

const EMPTY = {};

// Sections a layout has: the classic metabox leaves out Shop Page Video.
const LAYOUT_SECTIONS = SECTIONS.filter(
	( section ) => 'shopvideo' !== section.key
);

export const getDashboardInfo = ( state ) =>
	state.apiData?.dashboardInfo || EMPTY;

// Pricing page of the Pro plugin, opened by every "Upgrade to Pro" control.
export const PRO_URL_FALLBACK = 'https://renoproductgallery.com/pricing/';
export const getProUrl = ( state ) =>
	state.apiData?.dashboardInfo?.proUrl || PRO_URL_FALLBACK;
export const getStats = ( state ) => state.apiData?.stats || EMPTY;
export const hasData = ( state ) => Object.keys( state.apiData ).length > 0;
export const isLoading = ( state ) => state.isLoading;
export const isClearingCache = ( state ) => state.isClearingCache;
export const getNotice = ( state ) => state.notice;
export const getToast = ( state ) => state.toast;
export const getActiveTab = ( state ) => state.activeTab;
export const getDeviceType = ( state ) => state.deviceType;
export const isPanelCollapsed = ( state ) => state.isPanelCollapsed;
export const isLayoutDrawerOpen = ( state ) => state.isLayoutDrawerOpen;
export const isWizardOpen = ( state ) => state.isWizardOpen;
export const getProPrompt = ( state ) => state.proPrompt;
export const getActiveSection = ( state ) => state.activeSection;
export const getActiveSubSection = ( state ) => state.activeSubSection;

/**
 * URL hash of the current place (see `utils/route.js`).
 *
 * @param {Object} state Store state.
 * @return {string} Hash, starting with `#`.
 */
export const getRoute = ( state ) =>
	buildRoute( {
		tab: state.activeTab,
		section: state.activeSection,
		subSection: state.activeSubSection,
		settingsTab: state.settingsTab,
		layoutTarget: state.layoutEditor.target,
	} );

// Settings header tab.
export const getSettingsTab = ( state ) => state.settingsTab;
export const isSettingsLoaded = ( state ) => state.settings.isLoaded;
export const isSettingsSaving = ( state ) => state.settings.isSaving;
export const getSettingsValues = ( state ) => state.settings.values;
export const getSettingsDefaults = ( state ) => state.settings.defaults;
export const getSettingsChoices = ( state ) => state.settings.choices;
export const getSettingsExport = ( state ) => state.settings.export;
export const canEditJs = ( state ) => state.settings.canEditJs;
export const getLeaveTarget = ( state ) => state.leaveTarget;

const isSame = ( a, b ) => JSON.stringify( a ) === JSON.stringify( b );

/**
 * Number of settings whose edited value differs from the saved one.
 *
 * @param {Object} state Store state.
 * @return {number} Count of unsaved changes.
 */
export const getSettingsChangeCount = ( state ) => {
	const { values, saved } = state.settings;
	return Object.keys( values ).filter(
		( key ) => ! isSame( values[ key ], saved[ key ] )
	).length;
};

/**
 * Whether any edited value differs from its default (shows the reset button).
 *
 * @param {Object} state Store state.
 * @return {boolean} True when a value differs from its default.
 */
export const hasNonDefaultSettings = ( state ) => {
	const { values, defaults } = state.settings;
	return Object.keys( defaults ).some(
		( key ) => ! isSame( values[ key ], defaults[ key ] )
	);
};
export const getSavedSettingsValues = ( state ) => state.settings.saved;

// Global Settings panel.
export const isGlobalLoaded = ( state ) => state.globalSettings.isLoaded;
export const isGlobalSaving = ( state ) => state.globalSettings.isSaving;
export const getGlobalValues = ( state ) => state.globalSettings.values;
export const getSavedGlobalValues = ( state ) => state.globalSettings.saved;
export const getGlobalDefaults = ( state ) => state.globalSettings.defaults;
export const getGlobalChoices = ( state ) => state.globalSettings.choices;

/**
 * Number of Global Settings keys whose edited value differs from the saved one.
 *
 * @param {Object} state Store state.
 * @return {number} Count of unsaved changes.
 */
export const getGlobalChangeCount = ( state ) => {
	const { values, saved } = state.globalSettings;
	return Object.keys( values ).filter(
		( key ) => ! isSame( values[ key ], saved[ key ] )
	).length;
};

/**
 * Whether any Global Settings value differs from its default (shows the reset button).
 *
 * @param {Object} state Store state.
 * @return {boolean} True when a value differs from its default.
 */
export const hasNonDefaultGlobal = ( state ) => {
	const { values, defaults } = state.globalSettings;
	return Object.keys( defaults ).some(
		( key ) => ! isSame( values[ key ], defaults[ key ] )
	);
};

/**
 * Unsaved changes of a header tab that has a Save button.
 *
 * @param {Object} state Store state.
 * @param {string} tab   Header tab key.
 * @return {number} Count of unsaved changes.
 */
export const getTabChangeCount = ( state, tab ) => {
	if ( 'settings' === tab ) {
		return getSettingsChangeCount( state );
	}
	if ( 'layouts' === tab ) {
		return null === state.layoutEditor.target
			? 0
			: getLayoutChangeCount( state );
	}
	return 'global' === tab ? getGlobalChangeCount( state ) : 0;
};

// Per-Product Layouts: the list.
export const areLayoutsLoaded = ( state ) => state.layouts.isLoaded;
export const areLayoutsLoading = ( state ) => state.layouts.isLoading;
export const getLayouts = ( state ) => state.layouts.items;
export const getLayoutCategories = ( state ) => state.layouts.categories;
export const getLayoutProducts = ( state ) => state.layouts.products;

// Per-Product Layouts: the editor.
export const getLayoutTarget = ( state ) => state.layoutEditor.target;
export const getLayoutId = ( state ) => state.layoutEditor.id;
export const isLayoutLoaded = ( state ) => state.layoutEditor.isLoaded;
export const isLayoutSaving = ( state ) => state.layoutEditor.isSaving;
export const getLayoutMeta = ( state ) => state.layoutEditor.meta;
export const getSavedLayoutMeta = ( state ) => state.layoutEditor.savedMeta;
export const getLayoutValues = ( state ) => state.layoutEditor.values;
export const getSavedLayoutValues = ( state ) => state.layoutEditor.saved;
export const getLayoutDefaults = ( state ) => state.layoutEditor.defaults;
export const getLayoutChoices = ( state ) => state.layoutEditor.choices;
export const isAssignDrawerOpen = ( state ) =>
	state.layoutEditor.isAssignDrawerOpen;

/**
 * Number of layout editor changes: settings whose value differs from the
 * saved one, plus the name and the assignment when they changed.
 *
 * @param {Object} state Store state.
 * @return {number} Count of unsaved changes.
 */
export const getLayoutChangeCount = ( state ) => {
	const { values, saved, meta, savedMeta } = state.layoutEditor;
	let count = Object.keys( values ).filter(
		( key ) => ! isSame( values[ key ], saved[ key ] )
	).length;
	if ( meta.name !== savedMeta.name ) {
		count += 1;
	}
	if (
		! isSame( meta.categories, savedMeta.categories ) ||
		! isSame( meta.products, savedMeta.products ) ||
		! isSame( meta.exclude, savedMeta.exclude )
	) {
		count += 1;
	}
	return count;
};

/**
 * What the settings panel and the live preview edit: the Global Settings,
 * or the layout open in the Per-Product Layouts tab.
 *
 * @param {Object} state Store state.
 * @return {string} 'global' or 'layout'.
 */
export const getEditorScope = ( state ) =>
	'layouts' === state.activeTab && null !== state.layoutEditor.target
		? 'layout'
		: 'global';

const isLayoutScope = ( state ) => 'layout' === getEditorScope( state );

// The panel's values, defaults and state, for whichever scope is open.
export const getPanelValues = ( state ) =>
	isLayoutScope( state )
		? getLayoutValues( state )
		: getGlobalValues( state );
export const getSavedPanelValues = ( state ) =>
	isLayoutScope( state )
		? getSavedLayoutValues( state )
		: getSavedGlobalValues( state );
export const getPanelDefaults = ( state ) =>
	isLayoutScope( state )
		? getLayoutDefaults( state )
		: getGlobalDefaults( state );
export const getPanelChoices = ( state ) =>
	isLayoutScope( state )
		? getLayoutChoices( state )
		: getGlobalChoices( state );
export const isPanelLoaded = ( state ) =>
	isLayoutScope( state ) ? isLayoutLoaded( state ) : isGlobalLoaded( state );
export const isPanelSaving = ( state ) =>
	isLayoutScope( state ) ? isLayoutSaving( state ) : isGlobalSaving( state );
export const getPanelChangeCount = ( state ) =>
	isLayoutScope( state )
		? getLayoutChangeCount( state )
		: getGlobalChangeCount( state );

/**
 * Whether any panel value differs from its default (shows the reset button).
 *
 * @param {Object} state Store state.
 * @return {boolean} True when a value differs from its default.
 */
export const hasNonDefaultPanel = ( state ) => {
	const values = getPanelValues( state );
	const defaults = getPanelDefaults( state );
	return Object.keys( defaults ).some(
		( key ) => ! isSame( values[ key ], defaults[ key ] )
	);
};

/**
 * Sections the panel and sidebar list for the open scope.
 *
 * @param {Object} state Store state.
 * @return {Array} Entries of `constants/sections.js`.
 */
export const getPanelSections = ( state ) =>
	isLayoutScope( state ) ? LAYOUT_SECTIONS : SECTIONS;
