import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { SettingsTip } from './controls';

/**
 * One setting of a Settings sub-tab: a 320px label column with the help tip,
 * and the control on the right (the row layout of the design).
 *
 * @param {Object}  props
 * @param {string}  props.label    Label.
 * @param {*}       props.tip      Help tip content.
 * @param {number}  props.tipWidth Help tip width in px.
 * @param {number}  props.top      Align to the top, with the label pushed down this many px
 *                                 (10 next to a 40px field, 0 next to a list). Omit to centre.
 * @param {boolean} props.inline   Switch row: label and control never wrap.
 * @param {*}       props.children Control.
 */
export const SettingsRow = ( {
	label,
	tip,
	tipWidth = 280,
	top,
	inline = false,
	children,
} ) => {
	const isTop = undefined !== top;
	let className = 'wcgs-settings-row sp-d-flex';
	className += isTop ? ' sp-align-start' : ' sp-align-center';
	className += inline ? ' is-inline' : ' sp-flex-wrap';
	return (
		<div className={ className }>
			<div
				className="wcgs-settings-row__label sp-d-flex sp-align-center sp-flex-none sp-gap-6px"
				style={ isTop ? { paddingTop: top } : undefined }
			>
				{ label }
				<SettingsTip width={ tipWidth }>{ tip }</SettingsTip>
			</div>
			{ isTop ? (
				<div className="wcgs-settings-row__control">{ children }</div>
			) : (
				children
			) }
		</div>
	);
};

/**
 * Uppercase group heading between rows.
 *
 * @param {Object} props
 * @param {*}      props.children Heading text.
 * @param {*}      props.tip      Optional help tip.
 * @param {number} props.tipWidth Help tip width in px.
 */
export const SettingsHeading = ( { children, tip, tipWidth = 290 } ) => (
	<div className="wcgs-settings-heading sp-d-flex sp-align-center sp-gap-6px">
		{ children }
		<SettingsTip width={ tipWidth }>{ tip }</SettingsTip>
	</div>
);

/**
 * Intro paragraph at the top of a sub-tab, with an optional link.
 *
 * @param {Object} props
 * @param {*}      props.children  Text.
 * @param {string} props.linkLabel Link text.
 * @param {string} props.linkUrl   Link URL (new tab).
 */
export const SettingsIntro = ( { children, linkLabel, linkUrl } ) => (
	<p className="wcgs-settings-intro">
		{ children }
		{ linkUrl && (
			<>
				{ ' ' }
				<a href={ linkUrl } target="_blank" rel="noopener noreferrer">
					{ linkLabel }
				</a>
			</>
		) }
	</p>
);

/**
 * Edited Settings values and the control setter (`setAttributes` API).
 *
 * @return {Object} `{ values, setValues }`.
 */
export const useSettings = () => {
	const values = useSelect(
		( select ) => select( STORE_NAME ).getSettingsValues(),
		[]
	);
	const { setSettingsValues } = useDispatch( STORE_NAME );
	return { values, setValues: setSettingsValues };
};
