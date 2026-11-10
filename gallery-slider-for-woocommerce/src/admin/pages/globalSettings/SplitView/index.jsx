import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../../store/constants';
import SettingsPanel from '../SettingsPanel';
import Sidebar from '../Sidebar';
import './editor.scss';

const TYPING_TAGS = [ 'INPUT', 'TEXTAREA', 'SELECT' ];

/**
 * Split view of the settings page: main content on the left, the settings
 * panel on the right, collapsible to the icon sidebar. The panel edits the
 * Global Settings, or the layout open in the Per-Product Layouts tab.
 *
 * @param {Object} props
 * @param {*}      props.children Main content.
 */
const SplitView = ( { children } ) => {
	const { isCollapsed, isDirty, isLayout } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			isCollapsed: store.isPanelCollapsed(),
			isDirty: store.getPanelChangeCount() > 0 && ! store.isPanelSaving(),
			isLayout: 'layout' === store.getEditorScope(),
		};
	}, [] );
	const { setPanelCollapsed, savePanel } = useDispatch( STORE_NAME );
	const title = isLayout
		? __( 'Per-Product Layout', 'gallery-slider-for-woocommerce' )
		: __( 'Global Settings', 'gallery-slider-for-woocommerce' );

	// `\` toggles the panel, as in the design (ignored while typing).
	useEffect( () => {
		const onKeyDown = ( event ) => {
			const target = event.target;
			if (
				( target &&
					( TYPING_TAGS.includes( target.tagName ) ||
						target.isContentEditable ) ) ||
				'\\' !== event.key ||
				event.metaKey ||
				event.ctrlKey ||
				event.altKey
			) {
				return;
			}
			event.preventDefault();
			setPanelCollapsed( ! isCollapsed );
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ isCollapsed, setPanelCollapsed ] );

	return (
		<div
			className={ `wcgs-split-view sp-d-flex sp-flex-1${
				isCollapsed ? ' is-collapsed' : ''
			}` }
		>
			<section
				className="wcgs-split-view__main sp-flex-1 sp-min-w-0"
				aria-label={ __(
					'Main content',
					'gallery-slider-for-woocommerce'
				) }
			>
				{ children }
			</section>
			<div className="wcgs-split-view__spacer" aria-hidden="true" />
			<SettingsPanel title={ title } />
			<Sidebar
				pageTitle={ title }
				isDirty={ isDirty }
				onSave={ isDirty ? savePanel : undefined }
			/>
		</div>
	);
};

export default SplitView;
