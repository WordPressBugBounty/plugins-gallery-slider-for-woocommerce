/**
 * Centered title and text of a wizard step.
 *
 * @param {Object} props
 * @param {string} props.title Step title (the dialog's label).
 * @param {string} props.text  Text under the title.
 */
const StepHeading = ( { title, text } ) => (
	<div className="wcgs-wizard-step__head sp-d-flex sp-flex-col sp-align-center sp-gap-10px">
		<h1 className="wcgs-wizard-step__title" id="wcgs-wizard-title">
			{ title }
		</h1>
		<p className="wcgs-wizard-step__text">{ text }</p>
	</div>
);

export default StepHeading;
