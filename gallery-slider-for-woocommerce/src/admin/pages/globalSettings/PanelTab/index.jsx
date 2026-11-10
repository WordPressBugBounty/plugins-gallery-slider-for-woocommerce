import './editor.scss';

/**
 * Edge tab that collapses the settings panel or expands it from the sidebar
 * (`rv-tab` in the design). Sits on the left edge of its parent.
 *
 * @param {Object}   props
 * @param {string}   props.label     Accessible label and tooltip text.
 * @param {string}   props.shortcut  Optional key hint in the tooltip.
 * @param {string}   props.direction Chevron direction: 'right' (collapse) or 'left' (expand).
 * @param {Function} props.onClick   Click handler.
 * @param {boolean}  props.hidden    Hide the tab (fades out, not focusable).
 */
const PanelTab = ( {
	label,
	shortcut = '',
	direction = 'right',
	onClick,
	hidden = false,
} ) => (
	<button
		type="button"
		className={ `wcgs-panel-tab sp-flex-center is-${ direction }${
			hidden ? ' is-hidden' : ''
		}` }
		onClick={ onClick }
		aria-label={ label }
		tabIndex={ hidden ? -1 : 0 }
	>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.4"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path
				d={
					'left' === direction ? 'M14.5 6l-6 6 6 6' : 'M9.5 6l6 6-6 6'
				}
			/>
		</svg>
		<span
			className="wcgs-panel-tab__tip sp-d-i-flex sp-align-center sp-gap-8px"
			aria-hidden="true"
		>
			{ label }
			{ shortcut && (
				<kbd className="wcgs-panel-tab__key sp-d-i-flex sp-align-center">
					{ shortcut }
				</kbd>
			) }
		</span>
	</button>
);

export default PanelTab;
