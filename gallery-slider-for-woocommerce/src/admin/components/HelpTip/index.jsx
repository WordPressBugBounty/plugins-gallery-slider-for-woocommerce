import { InfoIcon } from '../Icons';
import './editor.scss';

/**
 * Pick the tooltip box alignment from the label length so the box stays
 * inside the settings panel (same rule as the design).
 *
 * @param {string} label Label the tip follows.
 * @return {string} 'start', 'center' or 'end'.
 */
export const tipAlign = ( label = '' ) => {
	const length = String( label ).length;
	if ( length <= 15 ) {
		return 'start';
	}
	return length >= 32 ? 'end' : 'center';
};

const HelpTip = ( { text, align = 'center' } ) => {
	if ( ! text ) {
		return null;
	}
	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Focusable so keyboard users can read the tip.
		<span
			className="wcgs-help-tip sp-d-i-flex sp-align-center"
			tabIndex={ 0 }
			aria-label={ text }
		>
			<InfoIcon />
			<span
				className={ `wcgs-help-tip__box is-${ align }` }
				role="tooltip"
			>
				{ text }
			</span>
		</span>
	);
};

export default HelpTip;
