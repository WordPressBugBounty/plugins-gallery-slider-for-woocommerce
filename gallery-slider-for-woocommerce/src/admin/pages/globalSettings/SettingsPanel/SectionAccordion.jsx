import { useEffect, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { STORE_NAME } from '../../../store/constants';
import { ChevronDownIcon } from '../../../components/Icons';
import { ProPill } from '../../../components/Pro';
import { SECTION_BODIES } from './sections';

/**
 * Height-animated region; closed content is inert (not focusable). Once
 * fully open it stops clipping, so dropdowns and color pickers can overflow.
 *
 * @param {Object}  props
 * @param {boolean} props.isOpen   Expanded.
 * @param {*}       props.children Content.
 */
const Collapse = ( { isOpen, children } ) => {
	const [ isSettled, setSettled ] = useState( isOpen );

	useEffect( () => {
		if ( ! isOpen ) {
			setSettled( false );
		}
	}, [ isOpen ] );

	return (
		<div
			className={ `wcgs-collapse sp-d-grid${ isOpen ? ' is-open' : '' }${
				isOpen && isSettled ? ' is-settled' : ''
			}` }
			inert={ isOpen ? undefined : '' }
			onTransitionEnd={ ( event ) => {
				if (
					event.target === event.currentTarget &&
					'grid-template-rows' === event.propertyName
				) {
					setSettled( isOpen );
				}
			} }
		>
			<div className="wcgs-collapse__inner">{ children }</div>
		</div>
	);
};

const AccordionHeader = ( {
	label,
	isOpen,
	isChild = false,
	isPro = false,
	onClick,
} ) => (
	<button
		type="button"
		className={ `wcgs-accordion__header sp-d-flex sp-align-center sp-gap-10px sp-w-full${
			isChild ? ' is-child' : ''
		}${ isOpen ? ' is-open' : '' }` }
		onClick={ onClick }
		aria-expanded={ isOpen }
	>
		<span className="wcgs-accordion__label sp-flex-1 sp-min-w-0">
			{ label }
		</span>
		{ isPro && <ProPill /> }
		<span className="wcgs-accordion__chevron sp-d-flex">
			<ChevronDownIcon strokeWidth={ 1.2 } />
		</span>
	</button>
);

/**
 * Section body: its settings, once the panel's values have loaded.
 *
 * @param {Object} props
 * @param {string} props.sectionKey `section` or `section/sub-section`.
 */
const SectionBody = ( { sectionKey } ) => {
	const isLoaded = useSelect(
		( select ) => select( STORE_NAME ).isPanelLoaded(),
		[]
	);
	const Body = SECTION_BODIES[ sectionKey ];

	return (
		<div className="wcgs-accordion__body">
			{ isLoaded && Body ? (
				<Body />
			) : (
				<div className="wcgs-accordion__loading sp-d-flex sp-justify-center">
					<Spinner />
				</div>
			) }
		</div>
	);
};

/**
 * Settings section tabs as an accordion (General, Product Gallery with its
 * sub-sections, Lightbox, and the Shop Page Video upsell with a Pro pill). The open tab is the store's
 * `activeSection` / `activeSubSection`, shared with the sidebar. A layout
 * has no Shop Page Video section (`getPanelSections`).
 */
const SectionAccordion = () => {
	const { activeSection, activeSubSection, sections } = useSelect(
		( select ) => ( {
			activeSection: select( STORE_NAME ).getActiveSection(),
			activeSubSection: select( STORE_NAME ).getActiveSubSection(),
			sections: select( STORE_NAME ).getPanelSections(),
		} ),
		[]
	);
	const { setActiveSection } = useDispatch( STORE_NAME );

	return (
		<div className="wcgs-accordion sp-d-flex sp-flex-col">
			{ sections.map( ( section ) => {
				const isOpen = activeSection === section.key;
				return (
					<div
						key={ section.key }
						className="wcgs-accordion__section"
						data-section={ section.key }
					>
						<AccordionHeader
							label={ section.label }
							isOpen={ isOpen }
							isPro={ section.isPro }
							onClick={ () =>
								setActiveSection( isOpen ? null : section.key )
							}
						/>
						<Collapse isOpen={ isOpen }>
							{ section.children ? (
								section.children.map( ( child ) => {
									const isChildOpen =
										isOpen &&
										activeSubSection === child.key;
									return (
										<div
											key={ child.key }
											data-section={ `${ section.key }/${ child.key }` }
										>
											<AccordionHeader
												label={ child.label }
												isChild
												isOpen={ isChildOpen }
												onClick={ () =>
													setActiveSection(
														section.key,
														isChildOpen
															? null
															: child.key
													)
												}
											/>
											<Collapse isOpen={ isChildOpen }>
												<SectionBody
													sectionKey={ `${ section.key }/${ child.key }` }
												/>
											</Collapse>
										</div>
									);
								} )
							) : (
								<SectionBody sectionKey={ section.key } />
							) }
						</Collapse>
					</div>
				);
			} ) }
		</div>
	);
};

export default SectionAccordion;
