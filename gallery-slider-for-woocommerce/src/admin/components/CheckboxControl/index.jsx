import { memo } from '@wordpress/element';
import useControlValue from '../../hooks/useControlValue';
import ControlHeader from '../ControlHeader';
import { CheckIcon } from '../Icons';
import './editor.scss';

const normalizeOptions = ( options ) =>
	options.map( ( option ) =>
		'object' === typeof option
			? option
			: { value: option, label: String( option ) }
	);

/**
 * Checkbox list, or a single checkbox when no `options` are given.
 *
 * With `options`, `attributes` is the array of checked values;
 * without, `attributes` is a boolean and `checkboxLabel` labels the box.
 *
 * @param {Object}   props
 * @param {string}   props.label         Group label.
 * @param {string}   props.help          Help tip.
 * @param {*}        props.attributes    Checked values array, or boolean.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new value.
 * @param {Array}    props.options       `[ { value, label } ]` or plain values.
 * @param {string}   props.checkboxLabel Label of the single checkbox.
 */
const CheckboxControl = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	options,
	checkboxLabel = '',
} ) => {
	const { write } = useControlValue( {
		attributes,
		attributesKey,
		setAttributes,
		onChange,
	} );

	const isGroup = Array.isArray( options );
	const checked = isGroup && Array.isArray( attributes ) ? attributes : [];
	const items = isGroup
		? normalizeOptions( options )
		: [ { value: true, label: checkboxLabel } ];

	const isChecked = ( item ) =>
		isGroup ? checked.includes( item.value ) : !! attributes;

	const toggle = ( item ) => {
		if ( ! isGroup ) {
			write( ! attributes );
			return;
		}
		write(
			checked.includes( item.value )
				? checked.filter( ( v ) => v !== item.value )
				: [ ...checked, item.value ]
		);
	};

	return (
		<div className="wcgs-control wcgs-checkbox-control">
			<ControlHeader label={ label } help={ help } />
			<div
				className="wcgs-checkbox-control__list sp-d-flex sp-flex-col sp-align-start sp-gap-10px"
				role={ isGroup ? 'group' : undefined }
				aria-label={ isGroup ? label : undefined }
			>
				{ items.map( ( item ) => {
					const on = isChecked( item );
					return (
						<button
							key={ String( item.value ) }
							type="button"
							role="checkbox"
							aria-checked={ on }
							className="wcgs-checkbox-control__item sp-d-flex sp-align-center sp-gap-10px"
							onClick={ () => toggle( item ) }
						>
							<span
								className={ `wcgs-checkbox-control__box${
									on ? ' is-checked' : ''
								}` }
							>
								<CheckIcon />
							</span>
							{ item.label }
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default memo( CheckboxControl );
