import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../store';
import HeaderTabs from './HeaderTabs';
import HelpMenu from './HelpMenu';
import ChangelogDrawer from './ChangelogDrawer';
import { ChangelogIcon } from './Icons';
import EditorHeader from '../pages/perProductLayout/EditorHeader';

/**
 * Page header: logo and version (the version badge opens the changelog
 * drawer), the header tabs and the help menu. While a layout is being edited
 * it is replaced by the layout editor's header, as in the design.
 */
const Header = () => {
	const [ isChangelogOpen, setChangelogOpen ] = useState( false );
	const closeChangelog = useCallback( () => setChangelogOpen( false ), [] );
	const { pluginVersion, logoUrl } = useSelect(
		( select ) => select( STORE_NAME ).getDashboardInfo(),
		[]
	);
	const isEditingLayout = useSelect(
		( select ) => 'layout' === select( STORE_NAME ).getEditorScope(),
		[]
	);

	if ( isEditingLayout ) {
		return <EditorHeader />;
	}

	return (
		<div className="wcgs-dashboard-header">
			<div className="wcgs-dashboard-header__logo">
				{ logoUrl && (
					<img
						src={ logoUrl }
						alt={ __(
							'Reno Product Gallery',
							'gallery-slider-for-woocommerce'
						) }
					/>
				) }
				{ pluginVersion && (
					<button
						type="button"
						className="wcgs-dashboard-header__version"
						title={ __(
							'View the changelog',
							'gallery-slider-for-woocommerce'
						) }
						aria-haspopup="dialog"
						aria-expanded={ isChangelogOpen }
						onClick={ () => setChangelogOpen( true ) }
					>
						<ChangelogIcon />
						{ pluginVersion }
					</button>
				) }
			</div>
			<HeaderTabs />
			<HelpMenu />
			<ChangelogDrawer
				isOpen={ isChangelogOpen }
				onClose={ closeChangelog }
			/>
		</div>
	);
};

export default Header;
