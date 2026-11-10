import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Notice } from '@wordpress/components';
import Header from './components/Header';
import Toast from './components/Toast';
import TitleTooltip from './components/TitleTooltip';
import { FeaturePopoverProvider } from './components/Pro';
import GlobalSettingsPage from './pages/globalSettings';
import PerProductLayoutPage from './pages/perProductLayout';
import SettingsPage from './pages/settings';
import SwatchesPage from './pages/swatches';
import SetupWizard from './pages/wizard';
import { STORE_NAME } from './store';
import useHashRoute from './hooks/useHashRoute';
import useAdminMenu from './hooks/useAdminMenu';

const Render = () => {
	const { notice, activeTab, isWizardOpen } = useSelect(
		( select ) => ( {
			notice: select( STORE_NAME ).getNotice(),
			activeTab: select( STORE_NAME ).getActiveTab(),
			isWizardOpen: select( STORE_NAME ).isWizardOpen(),
		} ),
		[]
	);

	// Tabs and sub-tabs live in the URL hash, so a refresh reopens them.
	useHashRoute();
	// The Product Gallery admin submenus follow and switch the header tabs.
	useAdminMenu();

	// Fetch the dashboard data (logo, version, …) into the Redux store.
	const { fetchDashboard, setNotice } = useDispatch( STORE_NAME );
	useEffect( () => {
		fetchDashboard();
	}, [ fetchDashboard ] );

	// The Variation Swatches page has no plugin header.
	const isSwatches = 'swatches' === activeTab;

	return (
		<FeaturePopoverProvider>
			<div className="wcgs-admin-dashboard">
				{ ! isSwatches && <Header /> }
				{ notice?.message && (
					<div className="wcgs-dashboard-notice">
						<Notice
							status={ notice.status }
							onRemove={ () => setNotice( null ) }
						>
							{ notice.message }
						</Notice>
					</div>
				) }
				{ 'global' === activeTab && <GlobalSettingsPage /> }
				{ 'layouts' === activeTab && <PerProductLayoutPage /> }
				{ 'settings' === activeTab && <SettingsPage /> }
				{ isSwatches && <SwatchesPage /> }
				<Toast />
			</div>
			{ isWizardOpen && <SetupWizard /> }
			<TitleTooltip />
		</FeaturePopoverProvider>
	);
};

export default Render;
