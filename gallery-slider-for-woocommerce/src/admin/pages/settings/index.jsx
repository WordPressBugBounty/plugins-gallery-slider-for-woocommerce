import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { STORE_NAME } from '../../store/constants';
import { SETTINGS_TABS } from '../../constants/settingsTabs';
import { ResetIcon } from '../../components/Icons';
import ConfirmDialog from './ConfirmDialog';
import AdvancedTab from './AdvancedTab';
import SpeedTab from './SpeedTab';
import MigrationTab from './MigrationTab';
import ImportExportTab from './ImportExportTab';
import CodeTab from './CodeTab';
import './editor.scss';

const TAB_CONTENT = {
	advanced: AdvancedTab,
	speed: SpeedTab,
	migration: MigrationTab,
	importexport: ImportExportTab,
	css: CodeTab,
};

/**
 * Settings header tab (`pgSettings` in the design): sub-tab nav on the left,
 * the sub-tab's settings on the right, Save and Reset in the page header.
 */
const SettingsPage = () => {
	const {
		tab,
		isLoaded,
		isSaving,
		changeCount,
		hasNonDefault,
		defaults,
		leaveTarget,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			tab: store.getSettingsTab(),
			isLoaded: store.isSettingsLoaded(),
			isSaving: store.isSettingsSaving(),
			changeCount: store.getSettingsChangeCount(),
			hasNonDefault: store.hasNonDefaultSettings(),
			defaults: store.getSettingsDefaults(),
			leaveTarget: store.getLeaveTarget(),
		};
	}, [] );
	const {
		fetchSettings,
		saveSettings,
		setSettingsTab,
		setSettingsValues,
		resolveLeave,
	} = useDispatch( STORE_NAME );
	const [ isResetOpen, setResetOpen ] = useState( false );

	useEffect( () => {
		if ( ! isLoaded ) {
			fetchSettings();
		}
	}, [ isLoaded, fetchSettings ] );

	// Warn before the browser leaves the page with unsaved changes.
	useEffect( () => {
		if ( ! changeCount ) {
			return;
		}
		const onBeforeUnload = ( event ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () =>
			window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ changeCount ] );

	const isDirty = changeCount > 0;
	const canSave = isDirty && ! isSaving;
	const changeLabel = sprintf(
		/* translators: %d: number of unsaved changes. */
		_n(
			'%d unsaved change',
			'%d unsaved changes',
			changeCount,
			'gallery-slider-for-woocommerce'
		),
		changeCount
	);
	const Content = TAB_CONTENT[ tab ] || AdvancedTab;

	return (
		<div className="wcgs-settings-page sp-flex-1">
			<div className="wcgs-settings-page__inner sp-d-flex sp-flex-col">
				<div className="wcgs-settings-page__head sp-d-flex sp-align-center sp-justify-between sp-flex-wrap sp-gap-16px">
					<h1>
						{ __( 'Settings', 'gallery-slider-for-woocommerce' ) }
					</h1>
					<div className="wcgs-settings-page__actions sp-d-flex sp-align-center sp-flex-none sp-gap-4px">
						{ isDirty && (
							<span className="wcgs-settings-page__count">
								{ changeLabel }
							</span>
						) }
						<span
							className={ `wcgs-settings-page__reset-wrap${
								hasNonDefault && isLoaded ? ' is-visible' : ''
							}` }
						>
							<button
								type="button"
								className="wcgs-settings-page__reset sp-d-i-flex sp-align-center sp-justify-center"
								onClick={ () => setResetOpen( true ) }
								aria-label={ __(
									'Reset to defaults',
									'gallery-slider-for-woocommerce'
								) }
								tabIndex={ hasNonDefault ? 0 : -1 }
							>
								<ResetIcon size={ 15 } />
							</button>
							<span
								className="wcgs-settings-page__tip"
								aria-hidden="true"
							>
								{ __(
									'Reset to defaults',
									'gallery-slider-for-woocommerce'
								) }
							</span>
						</span>
						<button
							type="button"
							className={ `wcgs-settings-page__save sp-flex-none${
								canSave ? ' is-dirty' : ''
							}` }
							onClick={ canSave ? saveSettings : undefined }
							aria-disabled={ ! canSave }
						>
							{ isSaving
								? __(
										'Saving…',
										'gallery-slider-for-woocommerce'
								  )
								: __(
										'Save changes',
										'gallery-slider-for-woocommerce'
								  ) }
						</button>
					</div>
				</div>
				<div className="wcgs-settings-page__body sp-d-flex sp-gap-20px">
					<nav
						className="wcgs-settings-nav"
						aria-label={ __(
							'Settings sections',
							'gallery-slider-for-woocommerce'
						) }
					>
						{ SETTINGS_TABS.map( ( item ) => (
							<button
								key={ item.key }
								type="button"
								className={ `wcgs-settings-nav__item sp-d-flex sp-align-center sp-gap-10px${
									item.key === tab ? ' is-active' : ''
								}` }
								aria-current={
									item.key === tab ? 'page' : undefined
								}
								onClick={ () => setSettingsTab( item.key ) }
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.6"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									{ item.icon }
								</svg>
								{ item.label }
							</button>
						) ) }
					</nav>
					<div className="wcgs-settings-card sp-flex-1 sp-min-w-0">
						<div className="wcgs-settings-card__body">
							{ isLoaded ? (
								<Content />
							) : (
								<div className="wcgs-settings-card__loading sp-flex-center">
									<Spinner />
								</div>
							) }
						</div>
					</div>
				</div>
			</div>
			{ isResetOpen && (
				<ConfirmDialog
					tone="danger"
					title={ __(
						'Reset Settings to Default?',
						'gallery-slider-for-woocommerce'
					) }
					message={ __(
						'All sections in Settings go back to their default values. Nothing changes on your store until you save.',
						'gallery-slider-for-woocommerce'
					) }
					confirmLabel={ __(
						'Yes, Reset',
						'gallery-slider-for-woocommerce'
					) }
					onCancel={ () => setResetOpen( false ) }
					onConfirm={ () => {
						setSettingsValues( defaults );
						setResetOpen( false );
					} }
				/>
			) }
			{ leaveTarget && (
				<ConfirmDialog
					title={ __(
						'Save your changes?',
						'gallery-slider-for-woocommerce'
					) }
					message={ sprintf(
						/* translators: %s: "3 unsaved changes". */
						__(
							'You have %s in Settings. Save them before leaving, or discard them.',
							'gallery-slider-for-woocommerce'
						),
						changeLabel
					) }
					confirmLabel={ __(
						'Save & Leave',
						'gallery-slider-for-woocommerce'
					) }
					secondaryLabel={ __(
						'Discard',
						'gallery-slider-for-woocommerce'
					) }
					onCancel={ () => resolveLeave( 'cancel' ) }
					onSecondary={ () => resolveLeave( 'discard' ) }
					onConfirm={ () => resolveLeave( 'save' ) }
				/>
			) }
		</div>
	);
};

export default SettingsPage;
