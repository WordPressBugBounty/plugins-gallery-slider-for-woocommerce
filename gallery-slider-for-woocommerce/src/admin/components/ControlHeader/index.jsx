import { __ } from '@wordpress/i18n';
import DeviceTypeControl from '../DeviceTypeControl';
import HelpTip, { tipAlign } from '../HelpTip';
import { ResetIcon } from '../Icons';
import './editor.scss';

/**
 * Label row of a control: label, device switch (responsive values only),
 * help tip and a reset button that shows once the value differs from its default.
 *
 * @param {Object}   props
 * @param {string}   props.label        Label text.
 * @param {string}   props.help         Help tip text.
 * @param {boolean}  props.isResponsive Show the device switch.
 * @param {Function} props.onReset      Reset callback; no reset button when missing.
 * @param {boolean}  props.showReset    Whether the reset button is visible.
 * @param {string}   props.resetLabel   Accessible name of the reset button (default "Reset to default").
 * @param {boolean}  props.small        Small, muted label (inside a labelled row).
 * @param {string}   props.htmlFor      Id of the input the label names.
 */
const ControlHeader = ( {
	label,
	help,
	isResponsive = false,
	onReset,
	showReset = false,
	resetLabel,
	small = false,
	htmlFor,
} ) => {
	if ( ! label ) {
		return null;
	}
	const resetText =
		resetLabel ||
		__( 'Reset to default', 'gallery-slider-for-woocommerce' );
	const LabelTag = htmlFor ? 'label' : 'span';
	return (
		<div
			className={ `wcgs-control-header sp-d-flex sp-align-center sp-gap-6px sp-min-w-0${
				small ? ' is-small' : ''
			}` }
		>
			<LabelTag
				className="wcgs-control-header__label sp-min-w-0"
				htmlFor={ htmlFor }
			>
				{ label }
			</LabelTag>
			{ isResponsive && <DeviceTypeControl /> }
			<HelpTip text={ help } align={ tipAlign( label ) } />
			{ onReset && (
				<button
					type="button"
					className={ `wcgs-control-header__reset sp-d-i-flex sp-align-center sp-justify-center${
						showReset ? ' is-visible' : ''
					}` }
					onClick={ onReset }
					title={ resetText }
					aria-label={ resetText }
					tabIndex={ showReset ? 0 : -1 }
					aria-hidden={ ! showReset }
				>
					<ResetIcon />
				</button>
			) }
		</div>
	);
};

export default ControlHeader;
