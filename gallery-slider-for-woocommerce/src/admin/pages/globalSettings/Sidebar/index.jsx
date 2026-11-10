import { __, _n, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../../store/constants';
import PanelTab from '../PanelTab';
import { CrownIcon } from '../../../components/Pro';
import './editor.scss';

const PAGE_ICON_PATHS = [
	'M13 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6',
	'M3 16.5l5-5 4.5 4.5',
	'M18 14.6v1.2M18 20.2v1.2M21.4 18h-1.2M15.8 18h-1.2M20.4 15.6l-.85.85M16.45 19.55l-.85.85M20.4 20.4l-.85-.85M16.45 16.45l-.85-.85',
];

const SectionIcon = ( { path } ) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.7"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d={ path } />
	</svg>
);

/**
 * Icon sidebar shown while the settings panel is collapsed (`data-sv-rail`
 * in the design). Picking a section docks the panel open on that section.
 *
 * @param {Object}   props
 * @param {string}   props.pageTitle Page title (tooltip of the page button).
 * @param {boolean}  props.isDirty   Unsaved changes; shows a dot on Save.
 * @param {Function} props.onSave    Save handler.
 */
const Sidebar = ( {
	pageTitle = __( 'Global Settings', 'gallery-slider-for-woocommerce' ),
	isDirty = false,
	onSave,
} ) => {
	const { isCollapsed, activeSection, activeSubSection, sections } =
		useSelect(
			( select ) => ( {
				isCollapsed: select( STORE_NAME ).isPanelCollapsed(),
				activeSection: select( STORE_NAME ).getActiveSection(),
				activeSubSection: select( STORE_NAME ).getActiveSubSection(),
				sections: select( STORE_NAME ).getPanelSections(),
			} ),
			[]
		);
	const { setPanelCollapsed, setActiveSection } = useDispatch( STORE_NAME );

	const expand = () => setPanelCollapsed( false );
	const open = ( section, subSection = null ) => {
		setActiveSection( section, subSection );
		expand();
	};
	const tabIndex = isCollapsed ? 0 : -1;
	const saveTip = isDirty
		? __( 'Save changes', 'gallery-slider-for-woocommerce' )
		: __( 'All changes saved', 'gallery-slider-for-woocommerce' );

	return (
		<nav
			className={ `wcgs-sidebar sp-d-flex sp-flex-col sp-align-center sp-gap-6px${
				isCollapsed ? ' is-visible' : ''
			}` }
			aria-label={ __(
				'Settings sections',
				'gallery-slider-for-woocommerce'
			) }
			aria-hidden={ ! isCollapsed }
		>
			<PanelTab
				label={ __( 'Expand panel', 'gallery-slider-for-woocommerce' ) }
				direction="left"
				onClick={ expand }
				hidden={ ! isCollapsed }
			/>
			<button
				type="button"
				className="wcgs-sidebar__page sp-flex-center"
				onClick={ expand }
				title={ pageTitle }
				aria-label={ pageTitle }
				tabIndex={ tabIndex }
			>
				<svg
					width="19"
					height="19"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d={ PAGE_ICON_PATHS[ 0 ] } />
					<path d={ PAGE_ICON_PATHS[ 1 ] } />
					<circle cx="15.5" cy="8.5" r="1.5" />
					<circle cx="18" cy="18" r="1.6" />
					<path d={ PAGE_ICON_PATHS[ 2 ] } />
				</svg>
			</button>
			<span className="wcgs-sidebar__divider" />

			{ sections.map( ( section ) => {
				const isActive = activeSection === section.key;
				return (
					<span
						className="wcgs-sidebar__item sp-d-flex"
						key={ section.key }
					>
						<button
							type="button"
							className={ `wcgs-sidebar__link sp-d-flex sp-flex-col sp-align-center sp-gap-4px${
								isActive ? ' is-active' : ''
							}` }
							onClick={ () => open( section.key ) }
							aria-label={ section.label }
							aria-current={ isActive ? 'true' : undefined }
							tabIndex={ tabIndex }
						>
							<span className="wcgs-sidebar__tile sp-flex-center">
								<SectionIcon path={ section.icon } />
							</span>
							{ section.isPro && (
								<span className="wcgs-sidebar__crown sp-flex-center">
									<CrownIcon />
								</span>
							) }
							<span className="wcgs-sidebar__label">
								{ section.short }
							</span>
						</button>
						{ section.children && (
							<span className="wcgs-sidebar__flyout">
								<span className="wcgs-sidebar__flyout-card sp-d-flex sp-flex-col">
									<button
										type="button"
										className="wcgs-sidebar__flyout-head sp-d-flex sp-align-center sp-justify-between sp-gap-8px"
										onClick={ () => open( section.key ) }
										tabIndex={ tabIndex }
									>
										{ section.label }
										<span>
											{ sprintf(
												/* translators: %d: number of sections. */
												_n(
													'%d section',
													'%d sections',
													section.children.length,
													'gallery-slider-for-woocommerce'
												),
												section.children.length
											) }
										</span>
									</button>
									{ section.children.map( ( child ) => {
										const isChildActive =
											isActive &&
											activeSubSection === child.key;
										return (
											<button
												key={ child.key }
												type="button"
												className={ `wcgs-sidebar__flyout-item sp-d-flex sp-align-center sp-gap-8px sp-w-full${
													isChildActive
														? ' is-active'
														: ''
												}` }
												onClick={ () =>
													open(
														section.key,
														child.key
													)
												}
												tabIndex={ tabIndex }
											>
												<span className="wcgs-sidebar__flyout-dot" />
												{ child.label }
											</button>
										);
									} ) }
								</span>
							</span>
						) }
					</span>
				);
			} ) }

			<span className="wcgs-sidebar__fill sp-flex-1" />
			<button
				type="button"
				className="wcgs-sidebar__link sp-d-flex sp-flex-col sp-align-center sp-gap-4px"
				onClick={ onSave }
				title={ saveTip }
				aria-label={ saveTip }
				tabIndex={ tabIndex }
			>
				<span className="wcgs-sidebar__tile sp-flex-center">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.7"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
						<path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7" />
					</svg>
					{ isDirty && <span className="wcgs-sidebar__dirty" /> }
				</span>
				<span className="wcgs-sidebar__label">
					{ __( 'Save', 'gallery-slider-for-woocommerce' ) }
				</span>
			</button>
		</nav>
	);
};

export default Sidebar;
