import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { STORE_NAME } from '../../store/constants';
import { useSettings } from './SettingsRow';

/**
 * Dark monospace code field of the design.
 *
 * @param {Object}   props
 * @param {string}   props.label       Label.
 * @param {string}   props.value       Code.
 * @param {Function} props.onChange    Called with the new code.
 * @param {string}   props.placeholder Placeholder.
 * @param {boolean}  props.readOnly    Read only.
 * @param {string}   props.note        Note under the field.
 */
const CodeField = ( {
	label,
	value,
	onChange,
	placeholder,
	readOnly = false,
	note = '',
} ) => {
	const id = useInstanceId( CodeField, 'wcgs-code' );
	return (
		<div className="wcgs-code-field">
			<label className="wcgs-code-field__label sp-d-block" htmlFor={ id }>
				{ label }
			</label>
			<textarea
				id={ id }
				className="wcgs-code-field__input"
				value={ value || '' }
				onChange={ ( event ) => onChange( event.target.value ) }
				placeholder={ placeholder }
				readOnly={ readOnly }
				spellCheck={ false }
				autoCapitalize="off"
				autoComplete="off"
				rows={ 5 }
			/>
			{ note && <div className="wcgs-code-field__note">{ note }</div> }
		</div>
	);
};

/**
 * Additional CSS & JS sub-tab.
 */
const CodeTab = () => {
	const { values, setValues } = useSettings();
	const canEditJs = useSelect(
		( select ) => select( STORE_NAME ).canEditJs(),
		[]
	);

	return (
		<div>
			<CodeField
				label={ __(
					'Additional CSS',
					'gallery-slider-for-woocommerce'
				) }
				value={ values.wcgs_additional_css }
				onChange={ ( code ) =>
					setValues( { wcgs_additional_css: code } )
				}
				placeholder={ '#wpgs-gallery {\n  border-radius: 6px;\n}' }
			/>
			<CodeField
				label={ __(
					'Additional JS',
					'gallery-slider-for-woocommerce'
				) }
				value={ values.wcgs_additional_js }
				onChange={ ( code ) =>
					setValues( { wcgs_additional_js: code } )
				}
				placeholder={ __(
					'// runs after gallery init',
					'gallery-slider-for-woocommerce'
				) }
				readOnly={ ! canEditJs }
				note={
					canEditJs
						? ''
						: __(
								'Only administrators who can post unfiltered HTML can change this script.',
								'gallery-slider-for-woocommerce'
						  )
				}
			/>
		</div>
	);
};

export default CodeTab;
