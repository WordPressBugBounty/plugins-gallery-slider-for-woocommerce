import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { PANEL_STORAGE_KEY } from './constants';
import {
	clearDeviceValue,
	valueForDevice,
	writeDeviceValue,
} from '../utils/deviceOverrides';

export const setApiData = ( data ) => ( {
	type: 'SET_API_DATA',
	data,
} );

export const setLoading = ( isLoading ) => ( {
	type: 'SET_LOADING',
	isLoading,
} );

export const setClearingCache = ( isClearingCache ) => ( {
	type: 'SET_CLEARING_CACHE',
	isClearingCache,
} );

/**
 * Set the dashboard notice.
 *
 * @param {Object|null} notice - `{ status: 'success'|'error'|'info', message }`, or null to hide it.
 */
export const setNotice = ( notice ) => ( {
	type: 'SET_NOTICE',
	notice,
} );

/**
 * Show the bottom toast ("Changes saved"). It hides itself after a moment.
 *
 * @param {string}  text    Toast text.
 * @param {boolean} isDraft Grey icon (saved as draft, deleted) instead of green.
 */
export const showToast = ( text, isDraft = false ) => ( {
	type: 'SET_TOAST',
	toast: { text, isDraft, key: Date.now() },
} );

export const hideToast = () => ( {
	type: 'SET_TOAST',
	toast: null,
} );

/**
 * Pick the header tab.
 *
 * @param {string} tab - 'global', 'layouts' or 'settings'.
 */
export const setActiveTab = ( tab ) => ( {
	type: 'SET_ACTIVE_TAB',
	tab,
} );

/**
 * Set the device the responsive controls edit.
 *
 * @param {string} deviceType - 'desktop', 'tablet' or 'mobile'.
 */
export const setDeviceType = ( deviceType ) => ( {
	type: 'SET_DEVICE_TYPE',
	deviceType,
} );

/**
 * Collapse the settings panel to the icon sidebar, or dock it back.
 * The choice is remembered in localStorage.
 *
 * @param {boolean} isPanelCollapsed True to collapse.
 */
export const setPanelCollapsed =
	( isPanelCollapsed ) =>
	( { dispatch } ) => {
		try {
			window.localStorage.setItem(
				PANEL_STORAGE_KEY,
				isPanelCollapsed ? 'collapsed' : 'docked'
			);
		} catch ( e ) {
			// Storage unavailable (private mode): keep the choice for this visit only.
		}
		dispatch( { type: 'SET_PANEL_COLLAPSED', isPanelCollapsed } );
	};

/**
 * Open or close the Setup Wizard.
 *
 * @since 4.0.0
 * @param {boolean} isOpen Whether the wizard is open.
 */
export const setWizardOpen = ( isOpen ) => ( {
	type: 'SET_WIZARD_OPEN',
	isOpen,
} );

/**
 * Ask the feature popover (components/Pro) to show an upsell that has no
 * trigger element, e.g. after the server refused a second layout.
 *
 * @since 4.0.0
 * @param {Object|null} content `{ title, text }`, or null once it is shown.
 */
export const setProPrompt = ( content ) => ( {
	type: 'SET_PRO_PROMPT',
	prompt: content ? { ...content, key: Date.now() } : null,
} );

/**
 * Open or close the "Gallery Layouts" drawer of the live preview.
 *
 * @param {boolean} isOpen Whether the drawer is open.
 */
export const setLayoutDrawerOpen = ( isOpen ) => ( {
	type: 'SET_LAYOUT_DRAWER_OPEN',
	isOpen,
} );

/**
 * Pick the settings section shown in the panel.
 *
 * @param {string}      section    Section key, e.g. 'gallery'.
 * @param {string|null} subSection Sub-section key, e.g. 'zoom'.
 */
export const setActiveSection = ( section, subSection = null ) => ( {
	type: 'SET_ACTIVE_SECTION',
	section,
	subSection,
} );

/**
 * Fetch the dashboard overview data from the REST API.
 */
export const fetchDashboard =
	() =>
	async ( { dispatch } ) => {
		dispatch( setLoading( true ) );
		try {
			const data = await apiFetch( { path: '/wcgs/v1/dashboard' } );
			dispatch( setApiData( data ) );
			// A fresh install opens the Setup Wizard once.
			if ( data?.dashboardInfo?.showWizard ) {
				dispatch( setWizardOpen( true ) );
			}
		} catch ( error ) {
			dispatch(
				setNotice( {
					status: 'error',
					message:
						error?.message ||
						__(
							'Could not load the dashboard data.',
							'gallery-slider-for-woocommerce'
						),
				} )
			);
		}
		dispatch( setLoading( false ) );
	};

/**
 * Delete the cached product gallery transients.
 */
export const clearCache =
	() =>
	async ( { dispatch } ) => {
		dispatch( setClearingCache( true ) );
		dispatch( setNotice( null ) );
		try {
			const response = await apiFetch( {
				path: '/wcgs/v1/cache/clear',
				method: 'POST',
			} );
			dispatch(
				setNotice( { status: 'success', message: response?.message } )
			);
		} catch ( error ) {
			dispatch(
				setNotice( {
					status: 'error',
					message:
						error?.message ||
						__(
							'Could not clear the gallery cache.',
							'gallery-slider-for-woocommerce'
						),
				} )
			);
		}
		dispatch( setClearingCache( false ) );
	};

const errorNotice = ( error, fallback ) =>
	setNotice( { status: 'error', message: error?.message || fallback } );

/**
 * Pick the Settings sub-tab.
 *
 * @param {string} tab Sub-tab key from `constants/settingsTabs.js`.
 */
export const setSettingsTab = ( tab ) => ( {
	type: 'SET_SETTINGS_TAB',
	tab,
} );

/**
 * Change edited settings values (not saved until `saveSettings`).
 *
 * @param {Object} values `{ key: value }` pairs.
 */
export const setSettingsValues = ( values ) => ( {
	type: 'SET_SETTINGS_VALUES',
	values,
} );

/**
 * Change one edited settings value.
 *
 * @param {string} key   Settings key, e.g. 'gallery_cache'.
 * @param {*}      value New value.
 */
export const setSettingsValue = ( key, value ) =>
	setSettingsValues( { [ key ]: value } );

/**
 * Add choices (picker options) fetched after the first load.
 *
 * @param {Object} choices `{ categories: [], products: [] }` etc.
 */
export const setSettingsChoices = ( choices ) => ( {
	type: 'SET_SETTINGS_CHOICES',
	choices,
} );

/**
 * Place waiting for the unsaved-changes prompt.
 *
 * @param {Object|null} target `{ tab, layoutTarget }`, or null to close the prompt.
 */
export const setLeaveTarget = ( target ) => ( {
	type: 'SET_LEAVE_TARGET',
	target,
} );

/**
 * Open a place at once: the header tab, and for the Per-Product Layouts tab
 * the list or the layout editor.
 *
 * @param {Object}             target              Place.
 * @param {string}             target.tab          Header tab key.
 * @param {string|number|null} target.layoutTarget Layouts tab: 'new', an ID, or null for the list.
 */
const goTo =
	( { tab, layoutTarget = null } ) =>
	( { select, dispatch } ) => {
		if ( 'layouts' === tab ) {
			if ( null === layoutTarget ) {
				dispatch( closeLayoutEditor() );
			} else if ( select.getLayoutTarget() !== layoutTarget ) {
				dispatch( openLayoutEditor( layoutTarget ) );
			}
		} else if ( null !== select.getLayoutTarget() ) {
			// The editor closes when its tab is left.
			dispatch( closeLayoutEditor() );
		}
		dispatch( setActiveTab( tab ) );
	};

/**
 * Whether opening a place would leave unsaved changes behind.
 *
 * @param {Function} select Store selectors.
 * @param {Object}   target `{ tab, layoutTarget }`.
 * @return {boolean} True when the current place has unsaved changes it would lose.
 */
const leavesChanges = ( select, target ) => {
	const current = select.getActiveTab();
	if ( 'layouts' === current ) {
		const editing = select.getLayoutTarget();
		const stays =
			'layouts' === target.tab &&
			null !== editing &&
			( target.layoutTarget === editing ||
				undefined === target.layoutTarget );
		return ! stays && select.getTabChangeCount( current ) > 0;
	}
	return current !== target.tab && select.getTabChangeCount( current ) > 0;
};

/**
 * Open a place, asking first when the current tab (Settings, Global
 * Settings or a layout being edited) has unsaved changes.
 *
 * @param {Object} target `{ tab, layoutTarget }`.
 */
export const requestNavigate =
	( target ) =>
	( { select, dispatch } ) => {
		if ( leavesChanges( select, target ) ) {
			dispatch( setLeaveTarget( target ) );
			return;
		}
		dispatch( goTo( target ) );
	};

/**
 * Switch the header tab, asking first when the current tab has unsaved
 * changes. The Per-Product Layouts tab opens on its list.
 *
 * @param {string} tab Header tab key.
 */
export const requestTab = ( tab ) =>
	requestNavigate( { tab, layoutTarget: null } );

/**
 * Open the place a URL hash points to (see `utils/route.js`). Leaving
 * unsaved changes still asks first.
 *
 * @param {Object} route Parsed hash: `{ tab, section, subSection, settingsTab, layoutTarget }`.
 */
export const applyRoute =
	( route ) =>
	( { dispatch } ) => {
		if ( ! route.tab ) {
			return;
		}
		// `#wizard` opens the Setup Wizard over the current page.
		if ( route.wizard ) {
			dispatch( setWizardOpen( true ) );
			return;
		}
		if ( route.settingsTab ) {
			dispatch( setSettingsTab( route.settingsTab ) );
		}
		if ( undefined !== route.section ) {
			dispatch( setActiveSection( route.section, route.subSection ) );
		}
		dispatch(
			requestNavigate( {
				tab: route.tab,
				layoutTarget:
					undefined === route.layoutTarget
						? null
						: route.layoutTarget,
			} )
		);
	};

/**
 * Fetch the Settings tab values and choices from the REST API.
 */
export const fetchSettings =
	() =>
	async ( { dispatch } ) => {
		try {
			const data = await apiFetch( { path: '/wcgs/v1/settings' } );
			dispatch( { type: 'SET_SETTINGS_DATA', data } );
		} catch ( error ) {
			dispatch(
				errorNotice(
					error,
					__(
						'Could not load the settings.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
		}
	};

/**
 * Save the edited Settings values.
 *
 * @return {Promise<boolean>} Whether the save worked.
 */
export const saveSettings =
	() =>
	async ( { select, dispatch } ) => {
		dispatch( { type: 'SET_SETTINGS_SAVING', isSaving: true } );
		dispatch( setNotice( null ) );
		let saved = false;
		const sent = select.getSettingsValues();
		try {
			const response = await apiFetch( {
				path: '/wcgs/v1/settings',
				method: 'POST',
				data: { values: sent },
			} );
			// Keep edits made while the request was running; they are still unsaved.
			const current = select.getSettingsValues();
			const values = { ...response.values };
			Object.keys( current ).forEach( ( key ) => {
				if ( current[ key ] !== sent[ key ] ) {
					values[ key ] = current[ key ];
				}
			} );
			dispatch( {
				type: 'SET_SETTINGS_SAVED',
				values,
				saved: response.values,
			} );
			dispatch(
				showToast(
					__( 'Changes saved', 'gallery-slider-for-woocommerce' )
				)
			);
			saved = true;
		} catch ( error ) {
			dispatch(
				errorNotice(
					error,
					__(
						'Could not save the settings.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
		}
		dispatch( { type: 'SET_SETTINGS_SAVING', isSaving: false } );
		return saved;
	};

/**
 * Throw away the unsaved Settings changes.
 */
export const discardSettings =
	() =>
	( { select, dispatch } ) => {
		dispatch( {
			type: 'SET_SETTINGS_SAVED',
			values: select.getSavedSettingsValues(),
		} );
	};

/**
 * Answer the unsaved-changes prompt of the place being left.
 *
 * @param {string} choice 'save', 'discard' or 'cancel'.
 */
export const resolveLeave =
	( choice ) =>
	async ( { select, dispatch } ) => {
		const target = select.getLeaveTarget();
		const current = select.getActiveTab();
		const scope = 'layouts' === current ? 'layout' : current;
		dispatch( setLeaveTarget( null ) );
		if ( ! target || 'cancel' === choice ) {
			return;
		}
		if ( 'save' === choice ) {
			const savers = {
				global: saveGlobalSettings,
				settings: saveSettings,
				layout: () => saveLayout( { keepOpen: true } ),
			};
			const saved = await dispatch( savers[ scope ]() );
			if ( ! saved ) {
				return;
			}
		}
		if ( 'discard' === choice ) {
			const discarders = {
				global: discardGlobalSettings,
				settings: discardSettings,
				layout: discardLayout,
			};
			dispatch( discarders[ scope ]() );
		}
		dispatch( goTo( target ) );
	};

/**
 * Change edited Global Settings values (not saved until `saveGlobalSettings`).
 *
 * @param {Object} values `{ key: value }` pairs of `wcgs_settings` keys.
 */
export const setGlobalValues = ( values ) => ( {
	type: 'SET_GLOBAL_VALUES',
	values,
} );

/**
 * Change one key of a nested Global Settings value, e.g. a border's width.
 *
 * @param {string} key   Settings key, e.g. 'lens_border'.
 * @param {string} sub   Nested key, e.g. 'all'.
 * @param {*}      value New value.
 */
export const setGlobalSubValue =
	( key, sub, value ) =>
	( { select, dispatch } ) => {
		const current = select.getGlobalValues()[ key ] || {};
		dispatch(
			setGlobalValues( { [ key ]: { ...current, [ sub ]: value } } )
		);
	};

/**
 * Fetch the Global Settings values, defaults and choices from the REST API.
 */
export const fetchGlobalSettings =
	() =>
	async ( { dispatch } ) => {
		try {
			const data = await apiFetch( { path: '/wcgs/v1/global-settings' } );
			dispatch( { type: 'SET_GLOBAL_DATA', data } );
		} catch ( error ) {
			dispatch(
				errorNotice(
					error,
					__(
						'Could not load the global settings.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
		}
	};

/**
 * Save the edited Global Settings values.
 *
 * @return {Promise<boolean>} Whether the save worked.
 */
export const saveGlobalSettings =
	() =>
	async ( { select, dispatch } ) => {
		dispatch( { type: 'SET_GLOBAL_SAVING', isSaving: true } );
		dispatch( setNotice( null ) );
		let saved = false;
		const sent = select.getGlobalValues();
		try {
			const response = await apiFetch( {
				path: '/wcgs/v1/global-settings',
				method: 'POST',
				data: { values: sent },
			} );
			// Keep edits made while the request was running; they are still unsaved.
			const current = select.getGlobalValues();
			const values = { ...response.values };
			Object.keys( current ).forEach( ( key ) => {
				if ( current[ key ] !== sent[ key ] ) {
					values[ key ] = current[ key ];
				}
			} );
			dispatch( {
				type: 'SET_GLOBAL_SAVED',
				values,
				saved: response.values,
			} );
			dispatch(
				showToast(
					__( 'Changes saved', 'gallery-slider-for-woocommerce' )
				)
			);
			saved = true;
		} catch ( error ) {
			dispatch(
				errorNotice(
					error,
					__(
						'Could not save the global settings.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
		}
		dispatch( { type: 'SET_GLOBAL_SAVING', isSaving: false } );
		return saved;
	};

/**
 * Save the Setup Wizard's choices (a few Global Settings keys) on their own.
 *
 * Only `changes` are sent, so the other stored settings stay as they are.
 * Unsaved panel edits of other keys are kept as unsaved edits; the wizard's
 * keys take the saved values.
 *
 * @since 4.0.0
 * @param {Object} changes `{ key: value }` pairs of `wcgs_settings` keys.
 * @return {Promise<boolean>} Whether the save worked.
 */
export const saveWizardSettings =
	( changes ) =>
	async ( { select, dispatch } ) => {
		try {
			const response = await apiFetch( {
				path: '/wcgs/v1/global-settings',
				method: 'POST',
				data: { values: changes },
			} );
			if ( select.isGlobalLoaded() ) {
				const current = select.getGlobalValues();
				const saved = select.getSavedGlobalValues();
				const values = { ...response.values };
				Object.keys( current ).forEach( ( key ) => {
					if (
						! ( key in changes ) &&
						current[ key ] !== saved[ key ]
					) {
						values[ key ] = current[ key ];
					}
				} );
				dispatch( {
					type: 'SET_GLOBAL_SAVED',
					values,
					saved: response.values,
				} );
			}
			return true;
		} catch ( error ) {
			return false;
		}
	};

/**
 * Throw away the unsaved Global Settings changes.
 */
export const discardGlobalSettings =
	() =>
	( { select, dispatch } ) => {
		dispatch( {
			type: 'SET_GLOBAL_SAVED',
			values: select.getSavedGlobalValues(),
		} );
	};

/**
 * Change edited values of the panel's scope: the Global Settings, or the
 * layout open in the Per-Product Layouts tab.
 *
 * @param {Object} values `{ key: value }` pairs of settings keys.
 */
export const setPanelValues =
	( values ) =>
	( { select, dispatch } ) => {
		dispatch(
			'layout' === select.getEditorScope()
				? setLayoutValues( values )
				: setGlobalValues( values )
		);
	};

/**
 * Change one key of a nested value of the panel's scope.
 *
 * @param {string} key   Settings key, e.g. 'lens_border'.
 * @param {string} sub   Nested key, e.g. 'all'.
 * @param {*}      value New value.
 */
export const setPanelSubValue =
	( key, sub, value ) =>
	( { select, dispatch } ) => {
		const current = select.getPanelValues()[ key ] || {};
		dispatch(
			setPanelValues( { [ key ]: { ...current, [ sub ]: value } } )
		);
	};

/**
 * Change one device's value of a responsive setting in the panel's scope
 * (utils/deviceOverrides.js): desktop writes the setting's own key, tablet
 * and mobile write `device_overrides`.
 *
 * @param {string} key    Settings key, e.g. 'gallery_bottom_gap'.
 * @param {string} device 'desktop', 'tablet' or 'mobile'.
 * @param {*}      value  New value.
 */
export const setPanelDeviceValue =
	( key, device, value ) =>
	( { select, dispatch } ) => {
		dispatch(
			setPanelValues(
				writeDeviceValue( select.getPanelValues(), key, device, value )
			)
		);
	};

/**
 * Change one key of a nested responsive setting on one device.
 *
 * @param {string} key    Settings key, e.g. 'thumbnails_sliders_space'.
 * @param {string} sub    Nested key, e.g. 'width'.
 * @param {string} device 'desktop', 'tablet' or 'mobile'.
 * @param {*}      value  New value.
 */
export const setPanelDeviceSubValue =
	( key, sub, device, value ) =>
	( { select, dispatch } ) => {
		const values = select.getPanelValues();
		const current = valueForDevice( values, key, device ) || {};
		dispatch(
			setPanelValues(
				writeDeviceValue( values, key, device, {
					...current,
					[ sub ]: value,
				} )
			)
		);
	};

/**
 * Drop a tablet or mobile value of a responsive setting, so the device
 * follows the larger one again.
 *
 * @param {string} key    Settings key.
 * @param {string} device 'tablet' or 'mobile'.
 */
export const clearPanelDeviceValue =
	( key, device ) =>
	( { select, dispatch } ) => {
		dispatch(
			setPanelValues(
				clearDeviceValue( select.getPanelValues(), key, device )
			)
		);
	};

/**
 * Load the values of the panel's scope.
 */
export const fetchPanel =
	() =>
	( { select, dispatch } ) =>
		dispatch(
			'layout' === select.getEditorScope()
				? fetchLayoutEditor()
				: fetchGlobalSettings()
		);

/**
 * Save the panel's scope.
 *
 * @return {Promise<boolean>} Whether the save worked.
 */
export const savePanel =
	() =>
	( { select, dispatch } ) =>
		dispatch(
			'layout' === select.getEditorScope()
				? saveLayout( { keepOpen: true } )
				: saveGlobalSettings()
		);

// Per-Product Layouts tab.

const layoutError = ( error, fallback ) =>
	setNotice( { status: 'error', message: error?.message || fallback } );

// REST error code of a second layout: the free plugin keeps one.
const LAYOUT_LIMIT_CODE = 'wcgs_layout_limit';

/**
 * Upsell shown when the server refuses another layout.
 *
 * @return {Object} Action.
 */
const layoutLimitPrompt = () =>
	setProPrompt( {
		title: __(
			'Unlimited per-product layouts',
			'gallery-slider-for-woocommerce'
		),
		text: __(
			'Free includes one per-product layout. Pro lets you create and assign as many as you need.',
			'gallery-slider-for-woocommerce'
		),
	} );

/**
 * Fetch the layouts, the category tree and the product labels.
 */
export const fetchLayouts =
	() =>
	async ( { dispatch } ) => {
		dispatch( { type: 'SET_LAYOUTS_LOADING', isLoading: true } );
		try {
			const data = await apiFetch( { path: '/wcgs/v1/layouts' } );
			dispatch( { type: 'SET_LAYOUTS_DATA', data } );
		} catch ( error ) {
			dispatch( { type: 'SET_LAYOUTS_LOADING', isLoading: false } );
			dispatch(
				layoutError(
					error,
					__(
						'Could not load the layouts.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
		}
	};

/**
 * Open the layout editor on a layout, or on a new one.
 *
 * @param {string|number} target 'new' or a layout ID.
 */
export const openLayoutEditor = ( target ) => ( {
	type: 'OPEN_LAYOUT_EDITOR',
	target,
} );

/**
 * Close the layout editor and show the list.
 */
export const closeLayoutEditor = () => ( { type: 'CLOSE_LAYOUT_EDITOR' } );

/**
 * Fetch the open layout: its name, assignment, values and defaults. A new
 * layout starts from the Global Settings values.
 */
export const fetchLayoutEditor =
	() =>
	async ( { select, dispatch } ) => {
		const target = select.getLayoutTarget();
		if ( null === target ) {
			return;
		}
		const id = 'new' === target ? 0 : target;
		try {
			const data = await apiFetch( { path: `/wcgs/v1/layouts/${ id }` } );
			if ( select.getLayoutTarget() === target ) {
				dispatch( { type: 'SET_LAYOUT_EDITOR_DATA', data } );
			}
		} catch ( error ) {
			dispatch(
				layoutError(
					error,
					__(
						'Could not load the layout.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
			// A deleted layout: back to the list.
			if ( 404 === error?.data?.status ) {
				dispatch( closeLayoutEditor() );
			}
		}
	};

/**
 * Change edited layout values (not saved until `saveLayout`).
 *
 * @param {Object} values `{ key: value }` pairs of `wcgs_metabox` keys.
 */
export const setLayoutValues = ( values ) => ( {
	type: 'SET_LAYOUT_VALUES',
	values,
} );

/**
 * Change the open layout's name or assignment (not saved until `saveLayout`).
 *
 * @param {Object} meta `{ name?, categories?, products?, exclude? }`.
 */
export const setLayoutMeta = ( meta ) => ( { type: 'SET_LAYOUT_META', meta } );

/**
 * Open or close the "Assign Layout" drawer of the editor.
 *
 * @param {boolean} isOpen Whether the drawer is open.
 */
export const setAssignDrawerOpen = ( isOpen ) => ( {
	type: 'SET_ASSIGN_DRAWER_OPEN',
	isOpen,
} );

/**
 * Save the open layout: name, assignment, settings and status.
 *
 * The status follows the design: "Save as Draft" drafts it; a layout that
 * gains its first assignment is published; otherwise it keeps its status.
 * On success the editor closes and the list shows a toast, unless `keepOpen`.
 *
 * @param {Object}  options
 * @param {boolean} options.asDraft  Save as an inactive draft.
 * @param {boolean} options.keepOpen Stay in the editor (the leave prompt's Save).
 * @return {Promise<boolean>} Whether the save worked.
 */
export const saveLayout =
	( { asDraft = false, keepOpen = false } = {} ) =>
	async ( { select, dispatch } ) => {
		const target = select.getLayoutTarget();
		const id = select.getLayoutId();
		const meta = select.getLayoutMeta();
		const savedMeta = select.getSavedLayoutMeta();
		const values = select.getLayoutValues();
		// Exclusions count too, as the list shows them.
		const hasAssignment =
			meta.categories.length > 0 ||
			meta.products.length > 0 ||
			meta.exclude.length > 0;
		const hadAssignment =
			savedMeta.categories.length > 0 ||
			savedMeta.products.length > 0 ||
			savedMeta.exclude.length > 0;

		let status = meta.status;
		if ( asDraft ) {
			status = 'draft';
		} else if ( ! id ) {
			status = hasAssignment ? 'publish' : 'draft';
		} else if ( hasAssignment && ! hadAssignment ) {
			status = 'publish';
		}

		dispatch( { type: 'SET_LAYOUT_SAVING', isSaving: true } );
		dispatch( setNotice( null ) );
		let saved = false;
		try {
			const response = await apiFetch( {
				path: id ? `/wcgs/v1/layouts/${ id }` : '/wcgs/v1/layouts',
				method: 'POST',
				data: {
					name: meta.name,
					status,
					values,
					categories: meta.categories,
					products: meta.products,
					exclude: meta.exclude,
				},
			} );
			dispatch( {
				type: 'UPDATE_LAYOUT_ITEMS',
				layouts: [ response.layout ],
				products: response.products || {},
			} );
			saved = true;
			// Rough count, as the list's Products column: category sizes plus the picks, less the exclusions.
			const counts = {};
			select.getLayoutCategories().forEach( ( category ) => {
				counts[ category.value ] = category.count;
			} );
			const { layout } = response;
			const affected = Math.max(
				0,
				layout.categories.reduce(
					( sum, category ) => sum + ( counts[ category ] || 0 ),
					0
				) +
					new Set( layout.products ).size -
					( layout.exclude || [] ).length
			);
			// Unless the editor moved on while saving, close it or refresh it.
			if ( select.getLayoutTarget() === target && ! keepOpen ) {
				dispatch( closeLayoutEditor() );
			} else if ( select.getLayoutTarget() === target && id ) {
				dispatch( {
					type: 'SET_LAYOUT_SAVED',
					values: response.values,
					meta: {
						name: response.layout.name,
						status: response.layout.status,
						categories: response.layout.categories,
						products: response.layout.products,
						exclude: response.layout.exclude || [],
					},
				} );
			} else if ( select.getLayoutTarget() === target ) {
				// The new layout has an ID now: its hash and data follow.
				dispatch( openLayoutEditor( response.layout.id ) );
			}
			dispatch(
				showToast(
					'draft' === response.layout.status
						? __(
								'Layout saved as draft',
								'gallery-slider-for-woocommerce'
						  )
						: sprintf(
								/* translators: %s: number of products. */
								_n(
									'Layout saved · applies to %s product',
									'Layout saved · applies to %s products',
									affected,
									'gallery-slider-for-woocommerce'
								),
								affected.toLocaleString()
						  ),
					'draft' === response.layout.status
				)
			);
			dispatch( fetchDashboard() );
		} catch ( error ) {
			if ( LAYOUT_LIMIT_CODE === error?.code ) {
				dispatch( layoutLimitPrompt() );
			} else {
				dispatch(
					layoutError(
						error,
						__(
							'Could not save the layout.',
							'gallery-slider-for-woocommerce'
						)
					)
				);
			}
		}
		dispatch( { type: 'SET_LAYOUT_SAVING', isSaving: false } );
		return saved;
	};

/**
 * Throw away the unsaved changes of the open layout.
 */
export const discardLayout =
	() =>
	( { select, dispatch } ) => {
		dispatch( {
			type: 'SET_LAYOUT_SAVED',
			values: select.getSavedLayoutValues(),
			meta: select.getSavedLayoutMeta(),
		} );
	};

/**
 * Move layouts to the trash.
 *
 * @param {number[]} ids Layout IDs.
 * @return {Promise<boolean>} Whether it worked.
 */
export const deleteLayouts =
	( ids ) =>
	async ( { dispatch } ) => {
		try {
			const response =
				1 === ids.length
					? await apiFetch( {
							path: `/wcgs/v1/layouts/${ ids[ 0 ] }`,
							method: 'DELETE',
					  } )
					: await apiFetch( {
							path: '/wcgs/v1/layouts/bulk',
							method: 'POST',
							data: { action: 'delete', ids },
					  } );
			dispatch( { type: 'REMOVE_LAYOUT_ITEMS', ids: response.deleted } );
			dispatch( showToast( response.message, true ) );
			dispatch( fetchDashboard() );
			return true;
		} catch ( error ) {
			dispatch(
				layoutError(
					error,
					__(
						'Could not delete the layout.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
			return false;
		}
	};

/**
 * Activate (publish) or deactivate (draft) layouts. Activation needs an
 * assignment; unassigned layouts stay drafts.
 *
 * @param {number[]} ids    Layout IDs.
 * @param {boolean}  active True to activate.
 */
export const setLayoutsActive =
	( ids, active ) =>
	async ( { dispatch } ) => {
		try {
			const response = await apiFetch( {
				path: '/wcgs/v1/layouts/bulk',
				method: 'POST',
				data: { action: active ? 'activate' : 'deactivate', ids },
			} );
			dispatch( {
				type: 'UPDATE_LAYOUT_ITEMS',
				layouts: response.layouts,
			} );
			dispatch( fetchDashboard() );
		} catch ( error ) {
			dispatch(
				layoutError(
					error,
					__(
						'Could not update the layouts.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
		}
	};

/**
 * Store a new list order. The first matching layout wins on the store, so
 * the order matters when assignments overlap.
 *
 * @param {number[]} ids Layout IDs in the new order.
 */
export const reorderLayouts =
	( ids ) =>
	async ( { dispatch } ) => {
		dispatch( { type: 'SET_LAYOUTS_ORDER', ids } );
		try {
			await apiFetch( {
				path: '/wcgs/v1/layouts/order',
				method: 'POST',
				data: { ids },
			} );
		} catch ( error ) {
			dispatch(
				layoutError(
					error,
					__(
						'Could not save the order.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
			dispatch( fetchLayouts() );
		}
	};
