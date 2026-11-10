import { memo } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import ControlHeader from '../ControlHeader';
import './editor.scss';

const normalizeOptions = ( options ) =>
	options.map( ( option ) =>
		'object' === typeof option
			? option
			: { value: option, label: String( option ) }
	);

/**
 * Vertical radio list.
 *
 * @param {Object}   props
 * @param {string}   props.label         Label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Selected value.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {Array}    props.options       `[ { value, label } ]` or plain values.
 */
const RadioControl = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options = [],
} ) => {
	const { value, setValue } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );

	return (
		<div className="wcgs-control wcgs-radio-control">
			<ControlHeader label={ label } help={ help } />
			<div
				className="wcgs-radio-control__list sp-d-flex sp-flex-col sp-align-start sp-gap-10px"
				role="radiogroup"
				aria-label={ label }
			>
				{ normalizeOptions( options ).map( ( item ) => {
					const on = item.value === value;
					return (
						<button
							key={ String( item.value ) }
							type="button"
							role="radio"
							aria-checked={ on }
							className="wcgs-radio-control__item sp-d-i-flex sp-align-center sp-gap-8px"
							onClick={ () => setValue( item.value ) }
						>
							<span
								className={ `wcgs-radio-control__ring${
									on ? ' is-checked' : ''
								}` }
							>
								<span className="wcgs-radio-control__dot" />
							</span>
							{ item.label }
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default memo( RadioControl );
