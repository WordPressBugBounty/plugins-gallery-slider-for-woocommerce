import { memo } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import useControlValue from '../../hooks/useControlValue';
import ControlHeader from '../ControlHeader';
import './editor.scss';

/**
 * On/off switch with the label on the left.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {boolean}  props.attributes    Current state.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new state.
 */
const ToggleControl = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
} ) => {
	const id = useInstanceId( ToggleControl, 'wcgs-toggle' );
	const { write } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );
	const isOn = !! attributes;

	return (
		<div className="wcgs-control wcgs-toggle-control">
			<div className="wcgs-toggle-control__row sp-d-flex sp-align-center sp-justify-between sp-gap-12px">
				<ControlHeader label={ label } help={ help } htmlFor={ id } />
				<button
					id={ id }
					type="button"
					role="switch"
					aria-checked={ isOn }
					className={ `wcgs-toggle-control__switch sp-d-block${
						isOn ? ' is-on' : ''
					}` }
					onClick={ () => write( ! isOn ) }
				>
					<span className="wcgs-toggle-control__knob" />
				</button>
			</div>
		</div>
	);
};

export default memo( ToggleControl );
