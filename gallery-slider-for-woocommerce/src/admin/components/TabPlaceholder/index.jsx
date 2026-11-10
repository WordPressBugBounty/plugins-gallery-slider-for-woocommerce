import './editor.scss';

/**
 * Empty content of a header tab that isn't built yet.
 *
 * @param {Object} props
 * @param {string} props.label Small label shown in the middle.
 */
const TabPlaceholder = ( { label } ) => (
	<div
		className="wcgs-tab-placeholder sp-flex-1 sp-flex-center"
		role="tabpanel"
	>
		<span className="wcgs-tab-placeholder__label">{ label }</span>
	</div>
);

export default TabPlaceholder;
