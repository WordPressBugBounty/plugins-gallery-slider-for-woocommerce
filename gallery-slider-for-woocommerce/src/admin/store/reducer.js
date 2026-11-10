import { PANEL_STORAGE_KEY } from './constants';
import { parseRoute } from '../utils/route';

const readPanelCollapsed = () => {
	try {
		return 'collapsed' === window.localStorage.getItem( PANEL_STORAGE_KEY );
	} catch ( e ) {
		return false;
	}
};

// Tab, section and sub-tab from the URL hash, so a refresh reopens the same place.
const initialRoute = parseRoute( window.location.hash );

// Name, status and assignment of a layout that is not loaded yet.
const EMPTY_LAYOUT_META = {
	name: '',
	status: 'draft',
	categories: [],
	products: [],
	exclude: [],
};

const DEFAULT_STATE = {
	apiData: {},
	isLoading: false,
	isClearingCache: false,
	notice: null,
	// `{ text, isDraft, key }` of the bottom toast ("Changes saved"), or null.
	toast: null,
	// Page: a header tab ('global' | 'layouts' | 'settings') or 'swatches'.
	activeTab: initialRoute.tab || 'global',
	// Setup Wizard overlay; `#wizard` (the first install's activation redirect) opens it.
	isWizardOpen: !! initialRoute.wizard,
	// Upsell the feature popover shows without a trigger (`{ title, text, key }`).
	proPrompt: null,
	// Device the responsive controls edit: 'desktop' | 'tablet' | 'mobile'.
	deviceType: 'desktop',
	// Settings panel collapsed to the icon sidebar.
	isPanelCollapsed: readPanelCollapsed(),
	// "Gallery Layouts" drawer at the bottom of the live preview.
	isLayoutDrawerOpen: false,
	// Settings section picked in the sidebar, and its sub-section (Product Gallery only).
	activeSection:
		undefined !== initialRoute.section ? initialRoute.section : 'general',
	activeSubSection: initialRoute.subSection || null,
	// Settings header tab: sub-tab, edited values and the last saved values.
	settingsTab: initialRoute.settingsTab || 'advanced',
	settings: {
		isLoaded: false,
		isSaving: false,
		values: {},
		saved: {},
		defaults: {},
		choices: {},
		export: {},
		canEditJs: false,
	},
	// Global Settings panel: edited `wcgs_settings` values and the last saved values.
	globalSettings: {
		isLoaded: false,
		isSaving: false,
		values: {},
		saved: {},
		defaults: {},
		choices: {},
	},
	// Per-Product Layouts tab: the list, the category tree and product labels.
	layouts: {
		isLoaded: false,
		isLoading: false,
		items: [],
		categories: [],
		products: {},
	},
	// Layout editor: which layout is open ('new', an ID, or null for the list),
	// its name and assignment, and its edited `wcgs_metabox` values.
	layoutEditor: {
		target:
			undefined !== initialRoute.layoutTarget
				? initialRoute.layoutTarget
				: null,
		isLoaded: false,
		isSaving: false,
		id: 0,
		meta: EMPTY_LAYOUT_META,
		savedMeta: EMPTY_LAYOUT_META,
		values: {},
		saved: {},
		defaults: {},
		choices: {},
		isAssignDrawerOpen: false,
	},
	// Place waiting for the unsaved-changes prompt (`{ tab, layoutTarget }`), or null.
	leaveTarget: null,
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_API_DATA':
			return { ...state, apiData: action.data };
		case 'SET_LOADING':
			return { ...state, isLoading: action.isLoading };
		case 'SET_CLEARING_CACHE':
			return { ...state, isClearingCache: action.isClearingCache };
		case 'SET_NOTICE':
			return { ...state, notice: action.notice };
		case 'SET_TOAST':
			return { ...state, toast: action.toast };
		case 'SET_ACTIVE_TAB':
			return { ...state, activeTab: action.tab };
		case 'SET_PRO_PROMPT':
			return { ...state, proPrompt: action.prompt };
		case 'SET_WIZARD_OPEN':
			return { ...state, isWizardOpen: action.isOpen };
		case 'SET_DEVICE_TYPE':
			return { ...state, deviceType: action.deviceType };
		case 'SET_PANEL_COLLAPSED':
			return { ...state, isPanelCollapsed: action.isPanelCollapsed };
		case 'SET_LAYOUT_DRAWER_OPEN':
			return { ...state, isLayoutDrawerOpen: action.isOpen };
		case 'SET_ACTIVE_SECTION':
			return {
				...state,
				activeSection: action.section,
				activeSubSection: action.subSection,
			};
		case 'SET_SETTINGS_TAB':
			return { ...state, settingsTab: action.tab };
		case 'SET_SETTINGS_DATA':
			return {
				...state,
				settings: {
					...state.settings,
					...action.data,
					isLoaded: true,
					values: action.data.values,
					saved: action.data.values,
				},
			};
		case 'SET_SETTINGS_VALUES':
			return {
				...state,
				settings: {
					...state.settings,
					values: { ...state.settings.values, ...action.values },
				},
			};
		case 'SET_SETTINGS_SAVED':
			return {
				...state,
				settings: {
					...state.settings,
					values: action.values,
					saved: action.saved || action.values,
				},
			};
		case 'SET_SETTINGS_SAVING':
			return {
				...state,
				settings: { ...state.settings, isSaving: action.isSaving },
			};
		case 'SET_SETTINGS_CHOICES':
			return {
				...state,
				settings: {
					...state.settings,
					choices: { ...state.settings.choices, ...action.choices },
				},
			};
		case 'SET_GLOBAL_DATA':
			return {
				...state,
				globalSettings: {
					...state.globalSettings,
					...action.data,
					isLoaded: true,
					values: action.data.values,
					saved: action.data.values,
				},
			};
		case 'SET_GLOBAL_VALUES':
			return {
				...state,
				globalSettings: {
					...state.globalSettings,
					values: {
						...state.globalSettings.values,
						...action.values,
					},
				},
			};
		case 'SET_GLOBAL_SAVED':
			return {
				...state,
				globalSettings: {
					...state.globalSettings,
					values: action.values,
					saved: action.saved || action.values,
				},
			};
		case 'SET_GLOBAL_SAVING':
			return {
				...state,
				globalSettings: {
					...state.globalSettings,
					isSaving: action.isSaving,
				},
			};
		case 'SET_LEAVE_TARGET':
			return { ...state, leaveTarget: action.target };
		case 'SET_LAYOUTS_LOADING':
			return {
				...state,
				layouts: { ...state.layouts, isLoading: action.isLoading },
			};
		case 'SET_LAYOUTS_DATA':
			return {
				...state,
				layouts: {
					...state.layouts,
					isLoaded: true,
					isLoading: false,
					items: action.data.layouts || [],
					categories: action.data.categories || [],
					products: action.data.products || {},
				},
			};
		case 'UPDATE_LAYOUT_ITEMS': {
			// Replace the listed layouts; new ones go first, as the design does.
			const items = state.layouts.items.slice();
			action.layouts.forEach( ( layout ) => {
				const index = items.findIndex(
					( item ) => item.id === layout.id
				);
				if ( index < 0 ) {
					items.unshift( layout );
				} else {
					items[ index ] = layout;
				}
			} );
			return {
				...state,
				layouts: {
					...state.layouts,
					items,
					products: { ...state.layouts.products, ...action.products },
				},
			};
		}
		case 'REMOVE_LAYOUT_ITEMS':
			return {
				...state,
				layouts: {
					...state.layouts,
					items: state.layouts.items.filter(
						( item ) => ! action.ids.includes( item.id )
					),
				},
			};
		case 'SET_LAYOUTS_ORDER': {
			const byId = {};
			state.layouts.items.forEach( ( item ) => {
				byId[ item.id ] = item;
			} );
			const ordered = action.ids
				.map( ( id ) => byId[ id ] )
				.filter( Boolean );
			const rest = state.layouts.items.filter(
				( item ) => ! action.ids.includes( item.id )
			);
			return {
				...state,
				layouts: { ...state.layouts, items: [ ...ordered, ...rest ] },
			};
		}
		case 'OPEN_LAYOUT_EDITOR':
			return {
				...state,
				activeSection: 'general',
				activeSubSection: null,
				isLayoutDrawerOpen: false,
				layoutEditor: {
					...DEFAULT_STATE.layoutEditor,
					target: action.target,
				},
			};
		case 'CLOSE_LAYOUT_EDITOR':
			return {
				...state,
				isLayoutDrawerOpen: false,
				layoutEditor: { ...DEFAULT_STATE.layoutEditor, target: null },
			};
		case 'SET_LAYOUT_EDITOR_DATA': {
			const meta = {
				name: action.data.name,
				status: action.data.status,
				categories: action.data.categories,
				products: action.data.products,
				exclude: action.data.exclude || [],
			};
			return {
				...state,
				layoutEditor: {
					...state.layoutEditor,
					isLoaded: true,
					id: action.data.id,
					meta,
					savedMeta: meta,
					values: action.data.values,
					saved: action.data.values,
					defaults: action.data.defaults,
					choices: action.data.choices || {},
				},
			};
		}
		case 'SET_LAYOUT_VALUES':
			return {
				...state,
				layoutEditor: {
					...state.layoutEditor,
					values: { ...state.layoutEditor.values, ...action.values },
				},
			};
		case 'SET_LAYOUT_META':
			return {
				...state,
				layoutEditor: {
					...state.layoutEditor,
					meta: { ...state.layoutEditor.meta, ...action.meta },
				},
			};
		case 'SET_LAYOUT_SAVED':
			return {
				...state,
				layoutEditor: {
					...state.layoutEditor,
					values: action.values,
					saved: action.values,
					meta: action.meta,
					savedMeta: action.meta,
				},
			};
		case 'SET_LAYOUT_SAVING':
			return {
				...state,
				layoutEditor: {
					...state.layoutEditor,
					isSaving: action.isSaving,
				},
			};
		case 'SET_ASSIGN_DRAWER_OPEN':
			return {
				...state,
				layoutEditor: {
					...state.layoutEditor,
					isAssignDrawerOpen: action.isOpen,
				},
			};
		default:
			return state;
	}
};

export default reducer;
