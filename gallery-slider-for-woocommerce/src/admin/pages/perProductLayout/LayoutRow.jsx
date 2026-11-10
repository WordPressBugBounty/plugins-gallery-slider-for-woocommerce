import { __, _nx, sprintf } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { LayoutArt } from '../../components';
import { CheckIcon } from '../../components/Icons';
import {
	affectedCount,
	assignmentLines,
	hasAssignment,
	layoutLabel,
} from './utils';

const GripIcon = () => (
	<svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
		<circle cx="3" cy="3" r="1.4" />
		<circle cx="9" cy="3" r="1.4" />
		<circle cx="3" cy="8" r="1.4" />
		<circle cx="9" cy="8" r="1.4" />
		<circle cx="3" cy="13" r="1.4" />
		<circle cx="9" cy="13" r="1.4" />
	</svg>
);

const DotsIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
		<circle cx="12" cy="5" r="1.7" />
		<circle cx="12" cy="12" r="1.7" />
		<circle cx="12" cy="19" r="1.7" />
	</svg>
);

/**
 * One "Assigned To" line: a prefix, up to two names and a "+N more" tip.
 *
 * @param {Object}   props
 * @param {string}   props.prefix Line prefix ("Categories:").
 * @param {string[]} props.names  Names.
 * @param {boolean}  props.muted  Grey names (exclusions).
 * @param {string}   props.kind   Line key: `categories`, or a product list.
 */
const AssignLine = ( { prefix, names, muted = false, kind = '' } ) => {
	const rest = names.length - 2;
	// Separate contexts, so languages with gendered words agree with the list.
	const more =
		'categories' === kind
			? sprintf(
					/* translators: %d: number of further categories. */
					_nx(
						'+%d more',
						'+%d more',
						rest,
						'categories',
						'gallery-slider-for-woocommerce'
					),
					rest
			  )
			: sprintf(
					/* translators: %d: number of further products. */
					_nx(
						'+%d more',
						'+%d more',
						rest,
						'products',
						'gallery-slider-for-woocommerce'
					),
					rest
			  );
	return (
		<div
			className={ `wcgs-layout-row__line sp-d-flex sp-align-center sp-gap-6px sp-min-w-0${
				muted ? ' is-muted' : ''
			}` }
		>
			<span className="wcgs-layout-row__prefix sp-flex-none">
				{ prefix }
			</span>
			<span className="wcgs-layout-row__names">
				{ names.slice( 0, 2 ).join( ', ' ) }
			</span>
			{ rest > 0 && (
				<span className="wcgs-layout-row__more wcgs-tip sp-flex-none sp-d-i-flex sp-align-center">
					{ more }
					<span className="wcgs-tip__box is-list">
						{ names.slice( 2 ).join( '\n' ) }
					</span>
				</span>
			) }
		</div>
	);
};

/**
 * A layout of the list: checkbox, drag handle, art and name, assignment,
 * product count, status pill, last update and the row menu.
 *
 * @param {Object}   props
 * @param {Object}   props.layout         List item.
 * @param {Object}   props.categoriesById Category tree by ID.
 * @param {Object}   props.productsById   Product labels by ID.
 * @param {boolean}  props.isSelected     Checked.
 * @param {boolean}  props.isMenuOpen     Row menu open.
 * @param {boolean}  props.isDragOver     A dragged row would drop here.
 * @param {boolean}  props.isLast         Last row (no bottom border).
 * @param {Function} props.onEdit         Open the editor.
 * @param {Function} props.onSelect       Toggle the checkbox.
 * @param {Function} props.onToggleStatus Activate or deactivate.
 * @param {Function} props.onMenu         Open or close the menu.
 * @param {Function} props.onAction       Menu action: 'export' or 'delete'.
 * @param {Function} props.onDragStart    Drag handle pressed.
 * @param {Function} props.onDragOver     Dragged over this row.
 * @param {Function} props.onDrop         Dropped on this row.
 * @param {Function} props.onDragEnd      Drag finished.
 */
const LayoutRow = ( {
	layout,
	categoriesById,
	productsById,
	isSelected,
	isMenuOpen,
	isDragOver,
	isLast,
	onEdit,
	onSelect,
	onToggleStatus,
	onMenu,
	onAction,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
} ) => {
	const menuRef = useRef();
	const isDraft = ! hasAssignment( layout );
	// Free applies the first layout only; a later one (kept from Pro) is not live.
	const isProOnly =
		'publish' === layout.status && false === layout.isActiveInFree;
	const isActive = 'publish' === layout.status && ! isProOnly;
	const lines = assignmentLines( layout, categoriesById, productsById );

	useEffect( () => {
		if ( isMenuOpen ) {
			menuRef.current?.querySelector( 'button' )?.focus();
		}
	}, [ isMenuOpen ] );

	let statusLabel = __( 'Inactive', 'gallery-slider-for-woocommerce' );
	let statusTip = __( 'Click to activate', 'gallery-slider-for-woocommerce' );
	let statusClass = 'is-inactive';
	if ( isDraft ) {
		statusLabel = __( 'Draft', 'gallery-slider-for-woocommerce' );
		statusTip = __(
			'Assign products or categories to activate',
			'gallery-slider-for-woocommerce'
		);
		statusClass = 'is-draft';
	} else if ( isProOnly ) {
		statusLabel = __( 'Pro Only', 'gallery-slider-for-woocommerce' );
		statusTip = __(
			'The free version applies only the first layout',
			'gallery-slider-for-woocommerce'
		);
	} else if ( isActive ) {
		statusLabel = __( 'Active', 'gallery-slider-for-woocommerce' );
		statusTip = __(
			'Click to deactivate',
			'gallery-slider-for-woocommerce'
		);
		statusClass = 'is-active';
	}

	const stop = ( event ) => event.stopPropagation();
	const onRowKeyDown = ( event ) => {
		if ( 'Enter' === event.key && event.target === event.currentTarget ) {
			onEdit();
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- The row opens the editor; Enter does too.
		<div
			className={ `wcgs-layout-row sp-d-grid sp-align-center sp-gap-12px${
				isSelected ? ' is-selected' : ''
			}${ isActive || isMenuOpen ? '' : ' is-dim' }${
				isMenuOpen ? ' is-menu-open' : ''
			}${ isDragOver ? ' is-drag-over' : '' }${
				isLast ? ' is-last' : ''
			}` }
			role="row"
			tabIndex={ 0 }
			onClick={ onEdit }
			onKeyDown={ onRowKeyDown }
			onDragOver={ onDragOver }
			onDrop={ onDrop }
		>
			<button
				type="button"
				className={ `wcgs-check${ isSelected ? ' is-on' : '' }` }
				role="checkbox"
				aria-checked={ isSelected }
				aria-label={ sprintf(
					/* translators: %s: layout name. */
					__( 'Select %s', 'gallery-slider-for-woocommerce' ),
					layout.name
				) }
				onClick={ ( event ) => {
					stop( event );
					onSelect();
				} }
			>
				<span className="wcgs-check__mark sp-d-i-flex">
					<CheckIcon size={ 10 } />
				</span>
			</button>
			<span
				className="wcgs-layout-row__handle sp-d-flex sp-align-center sp-justify-center"
				title={ __(
					'Drag to reorder',
					'gallery-slider-for-woocommerce'
				) }
				draggable
				onDragStart={ onDragStart }
				onDragEnd={ onDragEnd }
				onClick={ stop }
				onKeyDown={ stop }
				role="presentation"
			>
				<GripIcon />
			</span>
			<div className="wcgs-layout-row__name sp-d-flex sp-align-center sp-gap-12px sp-min-w-0">
				<span className="wcgs-layout-row__art sp-d-flex sp-align-center sp-justify-center">
					<LayoutArt
						layout={ layout.layout || 'horizontal' }
						width={ 26 }
						height={ 24 }
					/>
				</span>
				<div className="wcgs-layout-row__title sp-min-w-0">
					<div>{ layout.name }</div>
					<span className="wcgs-layout-row__pill">
						{ layoutLabel( layout.layout ) }
					</span>
				</div>
			</div>
			<div className="wcgs-layout-row__assign sp-d-flex sp-flex-col sp-gap-4px sp-min-w-0">
				{ lines.length ? (
					lines.map( ( { key, ...line } ) => (
						<AssignLine key={ key } kind={ key } { ...line } />
					) )
				) : (
					<div className="wcgs-layout-row__line is-none sp-d-flex sp-align-center sp-gap-6px sp-min-w-0">
						<span className="wcgs-layout-row__names">
							{ __(
								'Not assigned',
								'gallery-slider-for-woocommerce'
							) }
						</span>
					</div>
				) }
			</div>
			<span className="wcgs-layout-row__affected">
				{ affectedCount( layout, categoriesById ).toLocaleString() }
			</span>
			<span
				className="wcgs-layout-row__status sp-d-flex"
				onClick={ stop }
				onKeyDown={ stop }
				role="presentation"
			>
				<button
					type="button"
					className={ `wcgs-layout-row__status-pill wcgs-tip sp-d-i-flex sp-align-center sp-gap-6px ${ statusClass }` }
					onClick={ isDraft ? undefined : onToggleStatus }
					aria-disabled={ isDraft }
				>
					{ statusLabel }
					<span className="wcgs-tip__box is-nowrap">
						{ statusTip }
					</span>
				</button>
			</span>
			<span className="wcgs-layout-row__updated">{ layout.updated }</span>
			<div
				className="wcgs-layout-row__menu sp-d-flex sp-justify-end"
				onClick={ stop }
				onKeyDown={ stop }
				role="presentation"
			>
				<button
					type="button"
					className="wcgs-layout-row__menu-toggle sp-d-flex sp-align-center sp-justify-center"
					title={ __(
						'More actions',
						'gallery-slider-for-woocommerce'
					) }
					aria-label={ __(
						'More actions',
						'gallery-slider-for-woocommerce'
					) }
					aria-haspopup="menu"
					aria-expanded={ isMenuOpen }
					onClick={ onMenu }
				>
					<DotsIcon />
				</button>
				<div
					ref={ menuRef }
					className={ `wcgs-layout-row__menu-list${
						isMenuOpen ? ' is-open' : ''
					}` }
					role="menu"
				>
					<button
						type="button"
						role="menuitem"
						onClick={ onEdit }
						tabIndex={ isMenuOpen ? 0 : -1 }
					>
						{ __( 'Edit', 'gallery-slider-for-woocommerce' ) }
					</button>
					<button
						type="button"
						role="menuitem"
						onClick={ () => onAction( 'export' ) }
						tabIndex={ isMenuOpen ? 0 : -1 }
					>
						{ __( 'Export', 'gallery-slider-for-woocommerce' ) }
					</button>
					<button
						type="button"
						role="menuitem"
						className="is-danger"
						onClick={ () => onAction( 'delete' ) }
						tabIndex={ isMenuOpen ? 0 : -1 }
					>
						{ __( 'Delete', 'gallery-slider-for-woocommerce' ) }
					</button>
				</div>
			</div>
		</div>
	);
};

export default LayoutRow;
