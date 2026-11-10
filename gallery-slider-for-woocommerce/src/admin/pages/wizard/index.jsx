import { __, _n, sprintf } from '@wordpress/i18n';
import {
	createPortal,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { STORE_NAME } from '../../store/constants';
import { GALLERY_LAYOUTS } from '../../components/LayoutPicker';
import WelcomeStep from './WelcomeStep';
import LayoutStep from './LayoutStep';
import FeaturesStep from './FeaturesStep';
import PluginsStep from './PluginsStep';
import DoneStep from './DoneStep';
import { ADDONS, fetchPluginStatuses, installPlugin } from './addons';
import {
	FEATURES,
	FEATURE_KEYS,
	STEP_DONE,
	STEP_FEATURES,
	STEP_LABELS,
	STEP_LAYOUT,
	STEP_PLUGINS,
	STEP_WELCOME,
} from './constants';
import {
	ARROW_RIGHT_PATH,
	CHECK_PATH,
	CHEVRON_LEFT_PATH,
	CLOSE_PATH,
	StrokeIcon,
} from './icons';
import './editor.scss';

// Close animation length (design `pvScrimOut`).
const CLOSE_DURATION = 220;

// localStorage key of the live preview's product (`LivePreview/index.jsx`).
const PREVIEW_PRODUCT_KEY = 'wcgs-preview-product';

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Free layout keys (a stored Pro layout reads as the default).
 */
const FREE_LAYOUTS = GALLERY_LAYOUTS.filter( ( item ) => ! item.locked ).map(
	( item ) => item.value
);

/**
 * Wizard choices read from the saved Global Settings.
 *
 * @param {Object} values Saved `wcgs_settings` values (app shapes).
 * @return {Object} `{ layout, features }`.
 */
const choicesFrom = ( values ) => ( {
	layout: FREE_LAYOUTS.includes( values.gallery_layout )
		? values.gallery_layout
		: FREE_LAYOUTS[ 0 ],
	features: FEATURE_KEYS.reduce(
		( result, key ) => ( { ...result, [ key ]: !! values[ key ] } ),
		{}
	),
} );

/**
 * Permalink of a product to view from the Done screen: the live preview's
 * product, else the latest one (WooCommerce Store API).
 *
 * @return {Promise<string|null>} URL, or null when the store has no product.
 */
const findProductUrl = async () => {
	let id = 0;
	try {
		id = parseInt( window.localStorage.getItem( PREVIEW_PRODUCT_KEY ), 10 );
	} catch ( error ) {
		// Storage unavailable: use the latest product.
	}
	if ( id > 0 ) {
		const product = await apiFetch( {
			path: `/wc/store/v1/products/${ id }`,
		} ).catch( () => null );
		if ( product?.permalink ) {
			return product.permalink;
		}
	}
	const products = await apiFetch( {
		path: '/wc/store/v1/products?per_page=1',
	} ).catch( () => [] );
	return products?.[ 0 ]?.permalink || null;
};

/**
 * Step indicator of the header: three numbered dots joined by lines that
 * fill as the steps are done.
 *
 * @param {Object} props
 * @param {number} props.step Current step (1–3).
 */
const StepIndicator = ( { step } ) => (
	<ol className="wcgs-wizard-steps sp-d-flex sp-align-center">
		{ STEP_LABELS.map( ( label, i ) => {
			const number = i + 1;
			const isDone = step > number;
			const isActive = step === number;
			let state = '';
			if ( isDone ) {
				state = ' is-done';
			} else if ( isActive ) {
				state = ' is-active';
			}
			return (
				<li
					key={ label }
					className={ `wcgs-wizard-steps__item sp-d-flex sp-align-center sp-gap-10px${ state }` }
					aria-current={ isActive ? 'step' : undefined }
				>
					{ i > 0 && (
						<span
							className="wcgs-wizard-steps__line"
							aria-hidden="true"
						>
							<span
								className="wcgs-wizard-steps__fill"
								style={ {
									transform: `scaleX(${
										step >= number ? 1 : 0
									})`,
								} }
							/>
						</span>
					) }
					<span className="wcgs-wizard-steps__dot sp-flex-center">
						{ isDone ? (
							<StrokeIcon
								path={ CHECK_PATH }
								size={ 12 }
								strokeWidth={ 3.4 }
								color="#fff"
								className="wcgs-wizard-steps__check sp-d-block"
							/>
						) : (
							number
						) }
					</span>
					<span className="wcgs-wizard-steps__label">{ label }</span>
				</li>
			);
		} ) }
	</ol>
);

/**
 * Setup Wizard (free design, variant 1): a full-screen dialog over the
 * dashboard and the admin chrome. Welcome, three steps (layout, features,
 * add-ons) and a Done screen.
 *
 * Finishing saves the layout and the feature switches to the Global Settings
 * in one request, installs the picked add-ons one by one, and stops the
 * wizard from opening by itself again (REST `wizard/dismiss`), as exiting does.
 *
 * @since 4.0.0
 */
const SetupWizard = () => {
	const { isGlobalLoaded, savedGlobal, canInstall, logoUrl } = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			return {
				isGlobalLoaded: store.isGlobalLoaded(),
				savedGlobal: store.getSavedGlobalValues(),
				canInstall: !! store.getDashboardInfo().canInstallPlugins,
				logoUrl: store.getDashboardInfo().logoUrl,
			};
		},
		[]
	);
	const { setWizardOpen, saveWizardSettings, requestTab } =
		useDispatch( STORE_NAME );

	const [ step, setStep ] = useState( STEP_WELCOME );
	const [ choices, setChoices ] = useState( null );
	const [ installed, setInstalled ] = useState( null );
	// Every add-on starts picked; installed ones are locked and skipped.
	const [ selected, setSelected ] = useState( () =>
		ADDONS.reduce(
			( result, addon ) => ( { ...result, [ addon.slug ]: true } ),
			{}
		)
	);
	const [ progress, setProgress ] = useState( {} );
	const [ errors, setErrors ] = useState( {} );
	const [ isBusy, setBusy ] = useState( false );
	const [ saveError, setSaveError ] = useState( '' );
	const [ isClosing, setClosing ] = useState( false );
	const [ productUrl, setProductUrl ] = useState( null );

	const rootRef = useRef();
	const bodyRef = useRef();
	const isDismissed = useRef( false );
	const lastSaved = useRef( '' );
	const timer = useRef();

	// Start from the saved settings: the store's, or fetched when the
	// Global Settings tab hasn't loaded them.
	useEffect( () => {
		if ( choices ) {
			return;
		}
		if ( isGlobalLoaded ) {
			setChoices( choicesFrom( savedGlobal ) );
			return;
		}
		let isCurrent = true;
		apiFetch( { path: '/wcgs/v1/global-settings' } )
			.then( ( data ) => {
				if ( isCurrent ) {
					setChoices( choicesFrom( data?.values || {} ) );
				}
			} )
			.catch( () => isCurrent && setChoices( choicesFrom( {} ) ) );
		return () => {
			isCurrent = false;
		};
	}, [ choices, isGlobalLoaded, savedGlobal ] );

	// Installed plugins, so their rows show "Installed".
	useEffect( () => {
		if ( ! canInstall ) {
			return;
		}
		fetchPluginStatuses()
			.then( setInstalled )
			.catch( () => setInstalled( {} ) );
	}, [ canInstall ] );

	const dismiss = useCallback( () => {
		if ( isDismissed.current ) {
			return;
		}
		isDismissed.current = true;
		apiFetch( { path: '/wcgs/v1/wizard/dismiss', method: 'POST' } ).catch(
			() => {
				isDismissed.current = false;
			}
		);
	}, [] );

	const close = useCallback( () => {
		dismiss();
		setClosing( true );
		clearTimeout( timer.current );
		timer.current = setTimeout(
			() => setWizardOpen( false ),
			CLOSE_DURATION
		);
	}, [ dismiss, setWizardOpen ] );

	useEffect( () => () => clearTimeout( timer.current ), [] );

	// Lock the page scroll, move focus in, and give it back on close.
	useEffect( () => {
		const previous = rootRef.current?.ownerDocument.activeElement;
		const html = document.documentElement;
		const overflow = html.style.overflow;
		html.style.overflow = 'hidden';
		return () => {
			html.style.overflow = overflow;
			if ( previous && previous.focus ) {
				previous.focus();
			}
		};
	}, [] );

	// Each screen starts at the top, with focus on its main button. On open
	// the dialog itself takes focus, so no button shows a focus ring yet.
	const isFirstScreen = useRef( true );
	useEffect( () => {
		if ( bodyRef.current ) {
			bodyRef.current.scrollTop = 0;
		}
		const root = rootRef.current;
		const target = isFirstScreen.current
			? root
			: root?.querySelector( '[data-wcgs-autofocus]' ) || root;
		isFirstScreen.current = false;
		target?.focus( { preventScroll: true } );
	}, [ step ] );

	// Escape exits; Tab stays inside the dialog.
	const onKeyDown = ( event ) => {
		if ( 'Escape' === event.key ) {
			event.stopPropagation();
			close();
			return;
		}
		if ( 'Tab' !== event.key ) {
			return;
		}
		const items = Array.from(
			rootRef.current.querySelectorAll( FOCUSABLE )
		).filter( ( item ) => item.offsetParent !== null );
		if ( ! items.length ) {
			return;
		}
		const first = items[ 0 ];
		const last = items[ items.length - 1 ];
		const active = rootRef.current.ownerDocument.activeElement;
		if (
			event.shiftKey &&
			( active === first || active === rootRef.current )
		) {
			event.preventDefault();
			last.focus();
		} else if ( ! event.shiftKey && active === last ) {
			event.preventDefault();
			first.focus();
		}
	};

	const layout = choices?.layout || FREE_LAYOUTS[ 0 ];
	const features = choices?.features || {};
	const queue = canInstall
		? ADDONS.filter(
				( addon ) =>
					selected[ addon.slug ] &&
					! installed?.[ addon.slug ] &&
					'done' !== progress[ addon.slug ]
		  ).map( ( addon ) => addon.slug )
		: [];

	const finish = async () => {
		if ( isBusy ) {
			return;
		}
		setBusy( true );
		setSaveError( '' );

		// One save of the wizard's keys (skipped when a retry changes nothing).
		const changes = { gallery_layout: layout, ...features };
		const key = JSON.stringify( changes );
		if ( lastSaved.current !== key ) {
			const isSaved = await saveWizardSettings( changes );
			if ( ! isSaved ) {
				setSaveError(
					__(
						'Your choices could not be saved. Please try again.',
						'gallery-slider-for-woocommerce'
					)
				);
				setBusy( false );
				return;
			}
			lastSaved.current = key;
		}

		// Install the picked add-ons one at a time.
		let statuses = installed;
		if ( queue.length && ! statuses ) {
			statuses = await fetchPluginStatuses().catch( () => ( {} ) );
		}
		let hasFailed = false;
		for ( const slug of queue ) {
			setProgress( ( current ) => ( { ...current, [ slug ]: 'busy' } ) );
			setErrors( ( current ) => ( { ...current, [ slug ]: '' } ) );
			try {
				await installPlugin( slug, statuses?.[ slug ] || null );
				setProgress( ( current ) => ( {
					...current,
					[ slug ]: 'done',
				} ) );
			} catch ( error ) {
				hasFailed = true;
				setProgress( ( current ) => ( { ...current, [ slug ]: '' } ) );
				setSelected( ( current ) => ( {
					...current,
					[ slug ]: false,
				} ) );
				setErrors( ( current ) => ( {
					...current,
					[ slug ]: error.message,
				} ) );
			}
		}

		dismiss();
		setBusy( false );
		// A failed install stays on screen; "Finish" then moves on.
		if ( ! hasFailed ) {
			clearTimeout( timer.current );
			timer.current = setTimeout(
				() => setStep( STEP_DONE ),
				queue.length ? 600 : 0
			);
		}
	};

	// The Done screen offers a product page to look at.
	useEffect( () => {
		if ( STEP_DONE !== step ) {
			return;
		}
		let isCurrent = true;
		findProductUrl().then( ( url ) => isCurrent && setProductUrl( url ) );
		return () => {
			isCurrent = false;
		};
	}, [ step ] );

	const goTab = ( tab ) => {
		close();
		requestTab( tab );
	};

	const isStep = step >= STEP_LAYOUT && step <= STEP_PLUGINS;
	const installedCount = Object.values( progress ).filter(
		( state ) => 'done' === state
	).length;

	let continueLabel = __( 'Continue', 'gallery-slider-for-woocommerce' );
	if ( isBusy ) {
		continueLabel = queue.length
			? __( 'Installing…', 'gallery-slider-for-woocommerce' )
			: __( 'Saving…', 'gallery-slider-for-woocommerce' );
	} else if ( STEP_PLUGINS === step ) {
		continueLabel = queue.length
			? sprintf(
					/* translators: %d: number of plugins to install. */
					__(
						'Install %d & Finish',
						'gallery-slider-for-woocommerce'
					),
					queue.length
			  )
			: __( 'Finish', 'gallery-slider-for-woocommerce' );
	}

	const summary = [
		[
			__( 'Gallery layout', 'gallery-slider-for-woocommerce' ),
			GALLERY_LAYOUTS.find( ( item ) => item.value === layout )?.label,
		],
		[
			__( 'Features on', 'gallery-slider-for-woocommerce' ),
			FEATURES.filter( ( item ) => ! item.locked && features[ item.key ] )
				.map( ( item ) => item.short )
				.join( ', ' ) || __( 'None', 'gallery-slider-for-woocommerce' ),
		],
	];
	if ( installedCount ) {
		summary.push( [
			__( 'Plugins installed', 'gallery-slider-for-woocommerce' ),
			sprintf(
				/* translators: %d: number of installed plugins. */
				_n(
					'%d plugin',
					'%d plugins',
					installedCount,
					'gallery-slider-for-woocommerce'
				),
				installedCount
			),
		] );
	}

	return createPortal(
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		<div
			ref={ rootRef }
			className={ `wcgs-wizard sp-d-flex sp-flex-col${
				isClosing ? ' is-closing' : ''
			}` }
			role="dialog"
			aria-modal="true"
			aria-labelledby="wcgs-wizard-title"
			tabIndex="-1"
			onKeyDown={ onKeyDown }
		>
			<div className="wcgs-wizard__header sp-d-flex sp-align-center">
				{ logoUrl && (
					<img
						className="wcgs-wizard__logo sp-d-block"
						src={ logoUrl }
						alt={ __(
							'Reno Product Gallery',
							'gallery-slider-for-woocommerce'
						) }
					/>
				) }
				<div className="wcgs-wizard__progress sp-d-flex sp-flex-1 sp-min-w-0 sp-justify-center">
					{ isStep && <StepIndicator step={ step } /> }
				</div>
				<button
					type="button"
					className="wcgs-wizard__exit sp-d-i-flex sp-align-center sp-gap-6px"
					onClick={ close }
				>
					{ __( 'Exit Setup', 'gallery-slider-for-woocommerce' ) }
					<StrokeIcon path={ CLOSE_PATH } strokeWidth={ 1.9 } />
				</button>
			</div>
			<div
				ref={ bodyRef }
				className={ `wcgs-wizard__body sp-flex-1${
					isStep ? ' is-step' : ''
				}` }
			>
				{ STEP_WELCOME === step && (
					<WelcomeStep
						onStart={ () => setStep( STEP_LAYOUT ) }
						onSkip={ close }
					/>
				) }
				{ STEP_LAYOUT === step && (
					<LayoutStep
						value={ layout }
						onChange={ ( value ) =>
							setChoices( { features, layout: value } )
						}
					/>
				) }
				{ STEP_FEATURES === step && (
					<FeaturesStep
						values={ features }
						onToggle={ ( key ) =>
							setChoices( {
								layout,
								features: {
									...features,
									[ key ]: ! features[ key ],
								},
							} )
						}
					/>
				) }
				{ STEP_PLUGINS === step && (
					<PluginsStep
						installed={ installed }
						selected={ selected }
						progress={ progress }
						errors={ errors }
						canInstall={ canInstall }
						isBusy={ isBusy }
						onToggle={ ( slug ) =>
							setSelected( ( current ) => ( {
								...current,
								[ slug ]: ! current[ slug ],
							} ) )
						}
						onSetAll={ ( isOn ) =>
							setSelected(
								ADDONS.reduce(
									( result, addon ) => ( {
										...result,
										[ addon.slug ]: isOn,
									} ),
									{}
								)
							)
						}
					/>
				) }
				{ STEP_DONE === step && (
					<DoneStep
						summary={ summary }
						productUrl={ productUrl }
						onSettings={ () => goTab( 'global' ) }
						onLayouts={ () => goTab( 'layouts' ) }
					/>
				) }
			</div>
			{ isStep && (
				<div className="wcgs-wizard__footer sp-d-flex sp-align-center">
					<div className="wcgs-wizard__footer-inner sp-d-flex sp-w-full sp-align-center sp-justify-between sp-gap-12px">
						<button
							type="button"
							className="wcgs-wizard__back sp-d-i-flex sp-align-center sp-gap-6px"
							onClick={ () => setStep( step - 1 ) }
							disabled={ isBusy }
						>
							<StrokeIcon
								path={ CHEVRON_LEFT_PATH }
								strokeWidth={ 2.2 }
							/>
							{ __( 'Back', 'gallery-slider-for-woocommerce' ) }
						</button>
						<div className="wcgs-wizard__footer-end sp-d-flex sp-min-w-0 sp-align-center sp-gap-14px">
							{ saveError && (
								<span
									className="wcgs-wizard__error"
									role="alert"
								>
									{ saveError }
								</span>
							) }
							<button
								type="button"
								className={ `wcgs-wizard__continue sp-d-i-flex sp-align-center sp-gap-8px${
									isBusy ? ' is-busy' : ''
								}` }
								aria-disabled={ isBusy ? 'true' : undefined }
								onClick={ () =>
									STEP_PLUGINS === step
										? finish()
										: setStep( step + 1 )
								}
								data-wcgs-autofocus
							>
								{ continueLabel }
								<StrokeIcon
									path={ ARROW_RIGHT_PATH }
									size={ 15 }
									strokeWidth={ 2.2 }
								/>
							</button>
						</div>
					</div>
				</div>
			) }
		</div>,
		document.body
	);
};

export default SetupWizard;
