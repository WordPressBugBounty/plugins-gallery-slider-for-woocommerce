import './editor.scss';

/**
 * Muted note between settings (`note` in the design), with an optional link.
 * Wrap words in `<strong>` to emphasise them.
 *
 * @param {Object} props
 * @param {*}      props.children  Note content.
 * @param {string} props.linkLabel Link text.
 * @param {string} props.linkUrl   Link URL; opens in a new tab.
 */
const ControlNote = ( { children, linkLabel = '', linkUrl = '' } ) => (
	<div className="wcgs-control-note">
		{ children }
		{ linkLabel && linkUrl && (
			<>
				{ ' ' }
				<a href={ linkUrl } target="_blank" rel="noopener noreferrer">
					{ linkLabel }
				</a>
			</>
		) }
	</div>
);

export default ControlNote;
