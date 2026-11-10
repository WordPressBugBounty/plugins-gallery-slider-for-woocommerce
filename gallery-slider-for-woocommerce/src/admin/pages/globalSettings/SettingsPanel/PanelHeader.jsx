import { __ } from '@wordpress/i18n';
import { ResetIcon } from '../../../components/Icons';

/**
 * Panel header: page icon and title, reset and save buttons. Reset only
 * shows while a value differs from its default, as in the layout editor.
 *
 * @param {Object}   props
 * @param {string}   props.title       Page title.
 * @param {boolean}  props.isDirty     Unsaved changes; enables Save.
 * @param {boolean}  props.canReset    A value differs from its default; shows Reset.
 * @param {boolean}  props.isSaving    A save is running.
 * @param {Function} props.onSave      Save handler.
 * @param {Function} props.onReset     Reset handler.
 * @param {boolean}  props.isScrolled  Body scrolled; shows the header shadow.
 * @param {boolean}  props.hideActions Leave out Reset and Save (the layout editor has them in its header).
 */
const PanelHeader = ( {
	title,
	isDirty,
	canReset = false,
	isSaving = false,
	onSave,
	onReset,
	isScrolled,
	hideActions = false,
} ) => (
	<div
		className={ `wcgs-panel-header sp-d-flex sp-align-center sp-justify-between sp-gap-8px sp-flex-none${
			isScrolled ? ' is-scrolled' : ''
		}` }
	>
		<div className="wcgs-panel-header__title sp-d-flex sp-align-center sp-gap-10px sp-min-w-0">
			<span className="wcgs-panel-header__icon sp-flex-center">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M13 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
					<path d="M3 16.5l5-5 4.5 4.5" />
					<circle cx="15.5" cy="8.5" r="1.5" />
					<circle cx="18" cy="18" r="1.6" />
					<path d="M18 14.6v1.2M18 20.2v1.2M21.4 18h-1.2M15.8 18h-1.2M20.4 15.6l-.85.85M16.45 19.55l-.85.85M20.4 20.4l-.85-.85M16.45 16.45l-.85-.85" />
				</svg>
			</span>
			<h1 title={ title }>{ title }</h1>
		</div>
		<div
			className={ `wcgs-panel-header__actions sp-d-flex sp-align-center sp-gap-4px sp-flex-none${
				hideActions ? ' is-hidden' : ''
			}` }
			aria-hidden={ hideActions }
		>
			<span
				className={ `wcgs-panel-header__reset-wrap${
					canReset ? ' is-visible' : ''
				}` }
			>
				<button
					type="button"
					className="wcgs-panel-header__reset sp-d-i-flex sp-align-center sp-justify-center"
					onClick={ onReset }
					aria-label={ __(
						'Reset to defaults',
						'gallery-slider-for-woocommerce'
					) }
					aria-hidden={ ! canReset }
					tabIndex={ hideActions || ! canReset ? -1 : 0 }
				>
					<ResetIcon size={ 15 } strokeWidth={ 1.8 } />
				</button>
				<span className="wcgs-panel-header__tip" aria-hidden="true">
					{ __(
						'Reset to defaults',
						'gallery-slider-for-woocommerce'
					) }
				</span>
			</span>
			<button
				type="button"
				className={ `wcgs-panel-header__save sp-d-i-flex sp-align-center sp-justify-center sp-flex-none${
					isDirty ? ' is-dirty' : ''
				}` }
				onClick={ isDirty ? onSave : undefined }
				aria-disabled={ ! isDirty }
				tabIndex={ hideActions ? -1 : 0 }
			>
				{ isSaving
					? __( 'Saving…', 'gallery-slider-for-woocommerce' )
					: __( 'Save changes', 'gallery-slider-for-woocommerce' ) }
			</button>
		</div>
	</div>
);

export default PanelHeader;
