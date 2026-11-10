import { useInstanceId } from '@wordpress/compose';

/**
 * Controls of the Settings page, drawn like the "Reno Settings Split View"
 * design (40×22 switch, 16px boxes and rings).
 * They write through `setAttributes( { [ attributesKey ]: value } )`.
 */

/**
 * Stroke icon in a 24×24 viewBox.
 *
 * @param {Object} props
 * @param {number} props.size        Width and height.
 * @param {number} props.strokeWidth Stroke width.
 * @param {string} props.stroke      Stroke colour.
 * @param {*}      props.children    Paths.
 */
export const Icon = ( {
	size = 16,
	strokeWidth = 1.8,
	stroke = 'currentColor',
	children,
} ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke={ stroke }
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		{ children }
	</svg>
);

export const CHECK_PATH = <path d="M5 12.5 10 17 19 7" />;

/**
 * Green "done" message with a check (`expMsg`, `impMsg`, migration result).
 *
 * @param {Object} props
 * @param {*}      props.children Message.
 */
export const DoneMessage = ( { children } ) => (
	<span
		className="wcgs-done sp-d-i-flex sp-align-center sp-gap-6px"
		role="status"
	>
		<Icon size={ 15 } strokeWidth={ 2.2 }>
			{ CHECK_PATH }
		</Icon>
		{ children }
	</span>
);

/**
 * Info icon with a hover tip above it (`lt-tip` in the design).
 *
 * @param {Object} props
 * @param {*}      props.children Tip content; may hold a link.
 * @param {number} props.width    Tip width in px.
 */
export const SettingsTip = ( { children, width = 280 } ) => {
	if ( ! children ) {
		return null;
	}
	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Focusable so keyboard users can read the tip.
		<span
			className="wcgs-lt-tip sp-d-i-flex sp-align-center sp-justify-center"
			tabIndex={ 0 }
		>
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="9.25" />
				<path d="M12 11v5.5" />
				<circle
					cx="12"
					cy="7.75"
					r="0.4"
					fill="currentColor"
					stroke="currentColor"
					strokeWidth="1.6"
				/>
			</svg>
			<span
				className="wcgs-lt-tip__box"
				role="tooltip"
				style={ { width } }
			>
				{ children }
			</span>
		</span>
	);
};

/**
 * On/off switch (`tog` / `knb` in the design).
 *
 * @param {Object}   props
 * @param {boolean}  props.attributes    State.
 * @param {string}   props.attributesKey Settings key.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional handler called with the new state instead.
 * @param {string}   props.label         Accessible name.
 */
export const Switch = ( {
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	label,
} ) => {
	const isOn = !! attributes;
	const toggle = () =>
		onChange
			? onChange( ! isOn )
			: setAttributes( { [ attributesKey ]: ! isOn } );
	return (
		<button
			type="button"
			role="switch"
			aria-checked={ isOn }
			aria-label={ label }
			className={ `wcgs-switch sp-d-block${ isOn ? ' is-on' : '' }` }
			onClick={ toggle }
		>
			<span className="wcgs-switch__knob" />
		</button>
	);
};

/**
 * Text field with a note under it (`spIn` rows in the design).
 *
 * @param {Object}   props
 * @param {string}   props.attributes    Value.
 * @param {string}   props.attributesKey Settings key.
 * @param {Function} props.setAttributes Setter.
 * @param {string}   props.placeholder   Placeholder.
 * @param {string}   props.note          Note under the field.
 * @param {string}   props.label         Accessible name.
 */
export const TextField = ( {
	attributes,
	attributesKey,
	setAttributes,
	placeholder,
	note,
	label,
} ) => {
	const id = useInstanceId( TextField, 'wcgs-text' );
	return (
		<div className="wcgs-text-field sp-d-flex sp-flex-col sp-gap-6px">
			<input
				id={ id }
				type="text"
				className="wcgs-text-field__input"
				value={ attributes || '' }
				placeholder={ placeholder }
				aria-label={ label }
				onChange={ ( event ) =>
					setAttributes( { [ attributesKey ]: event.target.value } )
				}
			/>
			{ note && <span className="wcgs-text-field__note">{ note }</span> }
		</div>
	);
};

/**
 * Vertical checkbox list (`spCb` in the design).
 *
 * @param {Object}   props
 * @param {Array}    props.attributes    Checked values.
 * @param {string}   props.attributesKey Settings key.
 * @param {Function} props.setAttributes Setter.
 * @param {Array}    props.options       `[ { value, label } ]`.
 */
export const CheckList = ( {
	attributes,
	attributesKey,
	setAttributes,
	options,
} ) => {
	const checked = Array.isArray( attributes ) ? attributes : [];
	const toggle = ( value ) =>
		setAttributes( {
			[ attributesKey ]: checked.includes( value )
				? checked.filter( ( item ) => item !== value )
				: [ ...checked, value ],
		} );
	return (
		<div
			className="wcgs-check-list sp-d-flex sp-flex-col sp-gap-12px"
			role="group"
		>
			{ options.map( ( option ) => {
				const on = checked.includes( option.value );
				return (
					<button
						key={ option.value }
						type="button"
						role="checkbox"
						aria-checked={ on }
						className="wcgs-check-list__item sp-d-i-flex sp-align-center sp-gap-10px"
						onClick={ () => toggle( option.value ) }
					>
						<span className={ `wcgs-box${ on ? ' is-on' : '' }` }>
							<Icon size={ 10 } strokeWidth={ 3.4 } stroke="#fff">
								{ CHECK_PATH }
							</Icon>
						</span>
						{ option.label }
					</button>
				);
			} ) }
		</div>
	);
};

/**
 * Vertical radio list (`expItems` in the design).
 *
 * @param {Object}   props
 * @param {string}   props.value    Picked value.
 * @param {Function} props.onChange Called with the picked value.
 * @param {Array}    props.options  `[ { value, label } ]`.
 * @param {string}   props.label    Accessible name of the group.
 */
export const RadioList = ( { value, onChange, options, label } ) => (
	<div
		className="wcgs-check-list sp-d-flex sp-flex-col sp-gap-12px"
		role="radiogroup"
		aria-label={ label }
	>
		{ options.map( ( option ) => {
			const on = option.value === value;
			return (
				<button
					key={ option.value }
					type="button"
					role="radio"
					aria-checked={ on }
					className="wcgs-check-list__item sp-d-flex sp-align-center sp-gap-10px"
					onClick={ () => onChange( option.value ) }
				>
					<span className={ `wcgs-ring${ on ? ' is-on' : '' }` }>
						<span />
					</span>
					{ option.label }
				</button>
			);
		} ) }
	</div>
);
