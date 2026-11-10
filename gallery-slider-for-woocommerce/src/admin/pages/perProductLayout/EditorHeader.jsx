import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { ChevronDownIcon, ResetIcon } from '../../components/Icons';
import ConfirmDialog from '../settings/ConfirmDialog';
import { assignmentSummary, hasAssignment, indexCategories } from './utils';

// Popover exit animation length (matches the stylesheet).
const POP_OUT_MS = 160;

const BackIcon = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="m15 18-6-6 6-6" />
	</svg>
);

const PencilIcon = () => (
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="none"
		stroke="#9A9BA0"
		strokeWidth="1.9"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
		<path d="m13.5 6.5 4 4" />
	</svg>
);

/**
 * Header of the layout editor (`layEditing` in the design): back to the
 * list, the layout's name, the "Assign To" button that opens the assign
 * drawer, and Reset and Save. Saving an unassigned layout asks whether to
 * save it as a draft or assign it now.
 */
const EditorHeader = () => {
	const {
		meta,
		isLoaded,
		isSaving,
		isNew,
		hasNonDefault,
		defaults,
		categories,
		areLayoutsLoaded,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			meta: store.getLayoutMeta(),
			isLoaded: store.isLayoutLoaded(),
			isSaving: store.isLayoutSaving(),
			isNew: 'new' === store.getLayoutTarget(),
			hasNonDefault: store.hasNonDefaultPanel(),
			defaults: store.getLayoutDefaults(),
			categories: store.getLayoutCategories(),
			areLayoutsLoaded: store.areLayoutsLoaded(),
		};
	}, [] );
	const {
		requestNavigate,
		setLayoutMeta,
		setAssignDrawerOpen,
		saveLayout,
		setLayoutValues,
		fetchLayouts,
	} = useDispatch( STORE_NAME );
	const [ isPopoverOpen, setPopoverOpen ] = useState( false );
	const [ isPopoverOut, setPopoverOut ] = useState( false );
	const [ isNudging, setNudging ] = useState( false );
	const [ isResetOpen, setResetOpen ] = useState( false );
	const nameInput = useRef();
	const nudgeTimer = useRef();
	const popoverTimer = useRef();

	// The category names of the summary come with the list.
	useEffect( () => {
		if ( ! areLayoutsLoaded ) {
			fetchLayouts();
		}
	}, [ areLayoutsLoaded, fetchLayouts ] );

	// A new layout starts by naming it.
	useEffect( () => {
		if ( isNew && isLoaded ) {
			nameInput.current?.focus();
		}
	}, [ isNew, isLoaded ] );

	useEffect(
		() => () => {
			clearTimeout( nudgeTimer.current );
			clearTimeout( popoverTimer.current );
		},
		[]
	);

	const categoriesById = useMemo(
		() => indexCategories( categories ),
		[ categories ]
	);
	const isAssigned = hasAssignment( meta );
	const summary = assignmentSummary( meta, categoriesById );

	const openDrawer = () => {
		setPopoverOpen( false );
		setAssignDrawerOpen( true );
	};

	// The popover plays its exit, then unmounts (and runs `after`).
	const closePopover = ( after ) => {
		setPopoverOut( true );
		clearTimeout( popoverTimer.current );
		popoverTimer.current = setTimeout( () => {
			setPopoverOpen( false );
			setPopoverOut( false );
			after?.();
		}, POP_OUT_MS );
	};

	const onSave = () => {
		if ( isSaving || ! isLoaded ) {
			return;
		}
		// Categories, products or exclusions: any of them lets it save.
		if ( ! isAssigned ) {
			// Nudge the "Assign To" button and ask: draft, or assign now?
			clearTimeout( popoverTimer.current );
			setPopoverOut( false );
			setPopoverOpen( true );
			setNudging( true );
			clearTimeout( nudgeTimer.current );
			nudgeTimer.current = setTimeout( () => setNudging( false ), 1300 );
			return;
		}
		saveLayout();
	};

	const onKeyDown = ( event ) => {
		if ( 'Escape' === event.key && isPopoverOpen ) {
			closePopover();
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Escape closes the save popover.
		<div
			className="wcgs-layout-editor-header sp-flex-none sp-d-flex sp-align-center sp-flex-wrap sp-gap-14px"
			onKeyDown={ onKeyDown }
		>
			<button
				type="button"
				className="wcgs-layout-editor-header__back sp-d-i-flex sp-align-center sp-justify-center"
				title={ __(
					'Back to Layouts',
					'gallery-slider-for-woocommerce'
				) }
				aria-label={ __(
					'Back to Layouts',
					'gallery-slider-for-woocommerce'
				) }
				onClick={ () =>
					requestNavigate( { tab: 'layouts', layoutTarget: null } )
				}
			>
				<BackIcon />
			</button>
			<div
				className="wcgs-layout-editor-header__name sp-d-i-flex sp-align-center sp-min-w-0"
				title={ __(
					'Rename layout',
					'gallery-slider-for-woocommerce'
				) }
			>
				<input
					ref={ nameInput }
					className="wcgs-layout-editor-header__input"
					type="text"
					value={ meta.name }
					onChange={ ( event ) =>
						setLayoutMeta( { name: event.target.value } )
					}
					placeholder={ __(
						'Untitled Layout',
						'gallery-slider-for-woocommerce'
					) }
					aria-label={ __(
						'Layout name',
						'gallery-slider-for-woocommerce'
					) }
					disabled={ ! isLoaded }
				/>
				<PencilIcon />
			</div>
			<button
				type="button"
				className={ `wcgs-layout-editor-header__assign sp-d-i-flex sp-align-center sp-gap-8px${
					isAssigned ? ' is-assigned' : ' is-unassigned'
				}${ isNudging ? ' is-nudging' : '' }` }
				onClick={ openDrawer }
				disabled={ ! isLoaded }
			>
				<span className="wcgs-layout-editor-header__dot">
					{ ! isAssigned && (
						<>
							<span className="wcgs-layout-editor-header__wave" />
							<span className="wcgs-layout-editor-header__wave" />
						</>
					) }
				</span>
				<span className="wcgs-layout-editor-header__assign-label">
					{ __( 'Assign To', 'gallery-slider-for-woocommerce' ) }
				</span>
				<span className="wcgs-layout-editor-header__assign-value">
					{ summary }
				</span>
				<ChevronDownIcon size={ 14 } strokeWidth={ 1.2 } />
			</button>
			<div className="wcgs-layout-editor-header__actions sp-d-flex sp-align-center sp-gap-4px sp-flex-none">
				<span
					className={ `wcgs-layout-editor-header__reset-wrap${
						hasNonDefault && isLoaded ? ' is-visible' : ''
					}` }
				>
					<button
						type="button"
						className="wcgs-layout-editor-header__reset sp-d-i-flex sp-align-center sp-justify-center"
						onClick={ () => setResetOpen( true ) }
						aria-label={ __(
							'Reset to defaults',
							'gallery-slider-for-woocommerce'
						) }
						tabIndex={ hasNonDefault && isLoaded ? 0 : -1 }
					>
						<ResetIcon size={ 15 } strokeWidth={ 1.8 } />
					</button>
					<span className="wcgs-layout-editor-header__tip">
						{ __(
							'Reset to defaults',
							'gallery-slider-for-woocommerce'
						) }
					</span>
				</span>
				<button
					type="button"
					className="wcgs-layout-editor-header__save sp-flex-none sp-d-i-flex sp-align-center sp-justify-center"
					onClick={ onSave }
					aria-disabled={ isSaving || ! isLoaded }
				>
					{ isSaving
						? __( 'Saving…', 'gallery-slider-for-woocommerce' )
						: __(
								'Save changes',
								'gallery-slider-for-woocommerce'
						  ) }
				</button>
			</div>
			<div className="wcgs-layout-editor-header__anchor">
				{ isPopoverOpen && (
					<>
						{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Backdrop; Escape is handled on the header. */ }
						<div
							className="wcgs-layout-editor-header__backdrop"
							onClick={ () => closePopover() }
						/>
						<div
							className={ `wcgs-layout-editor-header__popover${
								isPopoverOut ? ' is-out' : ''
							}` }
							role="dialog"
							aria-labelledby="wcgs-layout-unassigned-title"
						>
							<span className="wcgs-layout-editor-header__caret" />
							<div
								id="wcgs-layout-unassigned-title"
								className="wcgs-layout-editor-header__popover-title"
							>
								{ __(
									'This layout isn’t assigned yet',
									'gallery-slider-for-woocommerce'
								) }
							</div>
							<div className="wcgs-layout-editor-header__popover-text">
								{ __(
									'Assign it to categories or products to use it on your store, or save it as a draft and assign it later.',
									'gallery-slider-for-woocommerce'
								) }
							</div>
							<div className="wcgs-layout-editor-header__popover-actions sp-d-flex sp-justify-end sp-gap-8px">
								<button
									type="button"
									className="wcgs-btn is-secondary is-small"
									onClick={ () => {
										setPopoverOpen( false );
										saveLayout( { asDraft: true } );
									} }
								>
									{ __(
										'Save as Draft',
										'gallery-slider-for-woocommerce'
									) }
								</button>
								<button
									type="button"
									className="wcgs-btn is-primary is-small"
									onClick={ () =>
										closePopover( () =>
											setAssignDrawerOpen( true )
										)
									}
								>
									{ __(
										'Assign Now',
										'gallery-slider-for-woocommerce'
									) }
								</button>
							</div>
						</div>
					</>
				) }
			</div>
			{ isResetOpen && (
				<ConfirmDialog
					tone="danger"
					title={ __(
						'Reset This Layout?',
						'gallery-slider-for-woocommerce'
					) }
					message={ __(
						'All options in this layout go back to their starting values from Global Settings. Nothing changes on your store until you save.',
						'gallery-slider-for-woocommerce'
					) }
					confirmLabel={ __(
						'Yes, Reset',
						'gallery-slider-for-woocommerce'
					) }
					onCancel={ () => setResetOpen( false ) }
					onConfirm={ () => {
						setLayoutValues( defaults );
						setResetOpen( false );
					} }
				/>
			) }
		</div>
	);
};

export default EditorHeader;
