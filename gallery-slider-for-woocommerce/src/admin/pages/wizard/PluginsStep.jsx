import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ADDONS } from './addons';
import { CHECK_PATH, Spinner, StrokeIcon } from './icons';
import StepHeading from './StepHeading';

/**
 * An add-on's WordPress.org icon, or its monogram on a colored tile when the
 * icon can't load (offline, or the plugin changed its icon file).
 *
 * @param {Object} props
 * @param {Object} props.addon Entry of `ADDONS`.
 */
const AddonTile = ( { addon } ) => {
	const [ hasIcon, setHasIcon ] = useState( !! addon.icon );
	return (
		<span
			className={ `wcgs-wizard-plugin__tile sp-flex-center${
				hasIcon ? ' has-icon' : ''
			}` }
			style={ hasIcon ? undefined : { background: addon.color } }
			aria-hidden="true"
		>
			{ hasIcon ? (
				<img
					src={ addon.icon }
					alt=""
					width="48"
					height="48"
					onError={ () => setHasIcon( false ) }
				/>
			) : (
				addon.mono
			) }
		</span>
	);
};

/**
 * Step 3: free Reno add-ons to install. Rows of installed plugins show
 * "Installed" and can't be picked; while the wizard installs, each row shows
 * its progress, and a failed install shows its error under the description.
 *
 * @param {Object}      props
 * @param {Object|null} props.installed  `{ slug: { plugin, status } }` of installed plugins; null while loading.
 * @param {Object}      props.selected   `{ slug: true }` of picked add-ons.
 * @param {Object}      props.progress   `{ slug: 'busy' | 'done' }` of this run.
 * @param {Object}      props.errors     `{ slug: message }` of failed installs.
 * @param {boolean}     props.canInstall Whether the user may install and activate plugins.
 * @param {boolean}     props.isBusy     Whether the wizard is finishing.
 * @param {Function}    props.onToggle   Called with an add-on slug.
 * @param {Function}    props.onSetAll   Called with true (select all) or false (clear).
 */
const PluginsStep = ( {
	installed,
	selected,
	progress,
	errors,
	canInstall,
	isBusy,
	onToggle,
	onSetAll,
} ) => {
	const isInstalled = ( slug ) =>
		'done' === progress[ slug ] || !! installed?.[ slug ];
	const pickable = canInstall
		? ADDONS.filter( ( addon ) => ! isInstalled( addon.slug ) )
		: [];
	const count = pickable.filter( ( addon ) => selected[ addon.slug ] ).length;
	const isAllSelected = pickable.length > 0 && count === pickable.length;

	const summary = count
		? sprintf(
				/* translators: %d: number of selected plugins. */
				_n(
					'%d selected',
					'%d selected',
					count,
					'gallery-slider-for-woocommerce'
				),
				count
		  )
		: sprintf(
				/* translators: %d: number of plugins. */
				_n(
					'%d plugin',
					'%d plugins',
					ADDONS.length,
					'gallery-slider-for-woocommerce'
				),
				ADDONS.length
		  );

	return (
		<div className="wcgs-wizard-step sp-d-flex sp-flex-col is-narrow is-roomy">
			<StepHeading
				title={ __(
					'Essential Tools for Your Store, Built to Sell More',
					'gallery-slider-for-woocommerce'
				) }
				text={ __(
					'Free plugins from the Reno team that work with your product gallery. Choose any to install now.',
					'gallery-slider-for-woocommerce'
				) }
			/>
			<div className="wcgs-wizard-plugins sp-d-flex sp-flex-col">
				<div className="wcgs-wizard-plugins__head sp-d-flex sp-align-center sp-justify-between sp-gap-12px">
					<span className="wcgs-wizard-plugins__count">
						{ summary }
						{ ' · ' }
						{ __(
							'All free on WordPress.org',
							'gallery-slider-for-woocommerce'
						) }
					</span>
					{ pickable.length > 0 && (
						<button
							type="button"
							className="wcgs-wizard-plugins__all"
							onClick={ () => onSetAll( ! isAllSelected ) }
							disabled={ isBusy }
						>
							{ isAllSelected
								? __(
										'Clear selection',
										'gallery-slider-for-woocommerce'
								  )
								: __(
										'Select all',
										'gallery-slider-for-woocommerce'
								  ) }
						</button>
					) }
				</div>
				{ ! canInstall && (
					<p className="wcgs-wizard-plugins__note">
						{ __(
							'Your account can’t install plugins. Ask a site administrator to install them, or find them on WordPress.org.',
							'gallery-slider-for-woocommerce'
						) }
					</p>
				) }
				{ ADDONS.map( ( addon, i ) => {
					const state = progress[ addon.slug ];
					const isDone = isInstalled( addon.slug );
					const isBusyRow = 'busy' === state;
					const isLocked = ! canInstall || isDone || isBusyRow;
					const isPicked = ! isLocked && !! selected[ addon.slug ];
					const error = errors[ addon.slug ];
					return (
						<button
							key={ addon.slug }
							type="button"
							role="checkbox"
							aria-checked={ isPicked }
							aria-disabled={
								isLocked || isBusy ? 'true' : undefined
							}
							className={ `wcgs-wizard-plugin sp-d-flex sp-w-full sp-align-center sp-gap-16px${
								isPicked ? ' is-picked' : ''
							}${ isLocked ? ' is-locked' : '' }` }
							style={ { animationDelay: `${ i * 50 }ms` } }
							onClick={ () =>
								! isLocked && ! isBusy && onToggle( addon.slug )
							}
						>
							<AddonTile addon={ addon } />
							<span className="wcgs-wizard-plugin__body sp-d-flex sp-flex-1 sp-min-w-0 sp-flex-col sp-gap-3px">
								<span className="wcgs-wizard-plugin__title sp-d-flex sp-align-center sp-gap-8px">
									<span className="wcgs-wizard-plugin__name">
										{ addon.name }
									</span>
									<span className="wcgs-wizard-plugin__tag sp-d-i-flex sp-align-center">
										{ __(
											'Free',
											'gallery-slider-for-woocommerce'
										) }
									</span>
								</span>
								<span className="wcgs-wizard-plugin__text">
									{ addon.description }
								</span>
								{ error && (
									<span
										className="wcgs-wizard-plugin__error"
										role="alert"
									>
										{ error }
									</span>
								) }
							</span>
							{ isBusyRow && (
								<span className="wcgs-wizard-plugin__state sp-d-i-flex sp-flex-none sp-align-center sp-gap-8px is-busy">
									<Spinner />
									{ __(
										'Installing…',
										'gallery-slider-for-woocommerce'
									) }
								</span>
							) }
							{ isDone && (
								<span className="wcgs-wizard-plugin__state sp-d-i-flex sp-flex-none sp-align-center sp-gap-8px is-done">
									<StrokeIcon
										path={ CHECK_PATH }
										size={ 14 }
										strokeWidth={ 2.8 }
									/>
									{ __(
										'Installed',
										'gallery-slider-for-woocommerce'
									) }
								</span>
							) }
							{ ! isDone && ! isBusyRow && canInstall && (
								<span
									className="wcgs-wizard-plugin__box sp-flex-center"
									aria-hidden="true"
								>
									<StrokeIcon
										path={ CHECK_PATH }
										size={ 11 }
										strokeWidth={ 3.6 }
										color="#fff"
									/>
								</span>
							) }
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default PluginsStep;
