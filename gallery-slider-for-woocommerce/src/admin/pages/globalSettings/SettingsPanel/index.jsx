import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../../store/constants';
import ConfirmDialog from '../../settings/ConfirmDialog';
import PanelTab from '../PanelTab';
import PanelHeader from './PanelHeader';
import SectionAccordion from './SectionAccordion';
import './editor.scss';

/**
 * Right-hand settings panel: page header and the section tabs as an
 * accordion. The open tab follows the section picked in the sidebar.
 * Edits the global settings (`wcgs_settings`), or the open layout's
 * settings (`wcgs_metabox`) in the Per-Product Layouts tab. Saved with the
 * header's Save button; Reset fills in the defaults, which are stored on
 * Save. In the layout editor the Save and Reset buttons sit in the page
 * header instead.
 *
 * @param {Object} props
 * @param {string} props.title Page title.
 */
const SettingsPanel = ( {
	title = __( 'Global Settings', 'gallery-slider-for-woocommerce' ),
} ) => {
	const {
		isCollapsed,
		activeSection,
		activeSubSection,
		isLoaded,
		isSaving,
		changeCount,
		hasNonDefault,
		defaults,
		isLayout,
		layoutTarget,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			isCollapsed: store.isPanelCollapsed(),
			activeSection: store.getActiveSection(),
			activeSubSection: store.getActiveSubSection(),
			isLoaded: store.isPanelLoaded(),
			isSaving: store.isPanelSaving(),
			changeCount: store.getPanelChangeCount(),
			hasNonDefault: store.hasNonDefaultPanel(),
			defaults: store.getPanelDefaults(),
			isLayout: 'layout' === store.getEditorScope(),
			layoutTarget: store.getLayoutTarget(),
		};
	}, [] );
	const { setPanelCollapsed, fetchPanel, savePanel, setPanelValues } =
		useDispatch( STORE_NAME );
	const bodyRef = useRef();
	const [ isScrolled, setIsScrolled ] = useState( false );
	const [ isResetOpen, setResetOpen ] = useState( false );

	// Load the scope's values (again for another layout).
	useEffect( () => {
		if ( ! isLoaded ) {
			fetchPanel();
		}
	}, [ isLoaded, fetchPanel, layoutTarget ] );

	// Bring the opened tab into view once its accordion has expanded.
	useEffect( () => {
		const timer = setTimeout( () => {
			const body = bodyRef.current;
			const key = activeSubSection
				? `${ activeSection }/${ activeSubSection }`
				: activeSection;
			const item = key
				? body?.querySelector( `[data-section="${ key }"]` )
				: null;
			if ( ! body || ! item ) {
				return;
			}
			const top = item.offsetTop;
			if (
				top < body.scrollTop ||
				top > body.scrollTop + body.clientHeight - 80
			) {
				body.scrollTo( { top, behavior: 'smooth' } );
			}
		}, 320 );
		return () => clearTimeout( timer );
	}, [ activeSection, activeSubSection ] );

	return (
		<aside
			className={ `wcgs-settings-panel sp-d-flex sp-flex-col sp-min-w-0${
				isCollapsed ? ' is-collapsed' : ''
			}` }
			aria-label={ __(
				'Settings panel',
				'gallery-slider-for-woocommerce'
			) }
			aria-hidden={ isCollapsed }
		>
			<PanelTab
				label={ __(
					'Collapse panel',
					'gallery-slider-for-woocommerce'
				) }
				shortcut="\"
				direction="right"
				onClick={ () => setPanelCollapsed( true ) }
				hidden={ isCollapsed }
			/>
			<PanelHeader
				title={ title }
				isDirty={ changeCount > 0 && ! isSaving }
				canReset={ hasNonDefault && isLoaded }
				isSaving={ isSaving }
				onSave={ savePanel }
				onReset={ isLoaded ? () => setResetOpen( true ) : undefined }
				isScrolled={ isScrolled }
				hideActions={ isLayout }
			/>
			<div
				ref={ bodyRef }
				className="wcgs-settings-panel__body sp-flex-1"
				onScroll={ ( event ) =>
					setIsScrolled( event.currentTarget.scrollTop > 2 )
				}
			>
				<SectionAccordion />
			</div>
			{ isResetOpen && (
				<ConfirmDialog
					tone="danger"
					title={
						isLayout
							? __(
									'Reset This Layout?',
									'gallery-slider-for-woocommerce'
							  )
							: __(
									'Reset Global Settings to Default?',
									'gallery-slider-for-woocommerce'
							  )
					}
					message={
						isLayout
							? __(
									'All options in this layout go back to their starting values from Global Settings. Nothing changes on your store until you save.',
									'gallery-slider-for-woocommerce'
							  )
							: __(
									'Every section of the panel goes back to its default values. Nothing changes on your store until you save.',
									'gallery-slider-for-woocommerce'
							  )
					}
					confirmLabel={ __(
						'Yes, Reset',
						'gallery-slider-for-woocommerce'
					) }
					onCancel={ () => setResetOpen( false ) }
					onConfirm={ () => {
						setPanelValues( defaults );
						setResetOpen( false );
					} }
				/>
			) }
		</aside>
	);
};

export default SettingsPanel;
