import './editor.scss';

/**
 * Group title between settings (`sub` in the design): small uppercase label
 * with a divider above.
 *
 * @param {Object} props
 * @param {string} props.label Title text.
 */
const Subheading = ( { label } ) =>
	label ? <div className="wcgs-subheading">{ label }</div> : null;

export default Subheading;
