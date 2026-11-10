/**
 * Stroke icons of the Setup Wizard and the Variation Swatches page (paths
 * from the free design).
 *
 * @since 4.0.0
 */

export const CHECK_PATH = 'M5 12.5 10 17 19 7';
export const ARROW_RIGHT_PATH = 'M5 12h14M13 6l6 6-6 6';
export const CHEVRON_LEFT_PATH = 'M15 5l-7 7 7 7';
export const CHEVRON_RIGHT_PATH = 'M9 5l7 7-7 7';
export const CLOSE_PATH = 'M6 6l12 12M18 6 6 18';

/**
 * 24×24 stroke icon.
 *
 * @param {Object} props
 * @param {string} props.path        Path data.
 * @param {number} props.size        Size in px.
 * @param {number} props.strokeWidth Stroke width.
 * @param {string} props.color       Stroke color.
 * @param {string} props.className   Class.
 * @param {*}      props.children    Extra shapes instead of `path`.
 */
export const StrokeIcon = ( {
	path,
	size = 16,
	strokeWidth = 2,
	color = 'currentColor',
	className,
	children,
} ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke={ color }
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		className={ className }
		aria-hidden="true"
		focusable="false"
	>
		{ path ? <path d={ path } /> : children }
	</svg>
);

/**
 * Small spinner of the install buttons and rows.
 *
 * @param {Object} props
 * @param {string} props.className Extra class (colors).
 */
export const Spinner = ( { className = '' } ) => (
	<span
		className={ `wcgs-wizard-spinner ${ className }`.trim() }
		aria-hidden="true"
	/>
);
