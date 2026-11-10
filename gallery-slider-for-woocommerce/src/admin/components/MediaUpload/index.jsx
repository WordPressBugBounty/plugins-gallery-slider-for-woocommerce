import { __ } from '@wordpress/i18n';
import { memo, useEffect, useRef } from '@wordpress/element';
import HelpTip, { tipAlign } from '../HelpTip';
import { CloseIcon, UploadIcon } from '../Icons';
import './editor.scss';

const fileName = ( url ) => {
	try {
		return decodeURIComponent(
			new URL( url, window.location.href ).pathname.split( '/' ).pop()
		);
	} catch ( e ) {
		return url;
	}
};

/**
 * Media library picker (`upload` in the design). Stores the file URL, as the
 * framework's `upload` field does. Needs `wp_enqueue_media()` on the page.
 *
 * @param {Object}   props
 * @param {string}   props.label         Title in the drop area and above the preview.
 * @param {string}   props.help          Help tip.
 * @param {string}   props.attributes    File URL, or '' when empty.
 * @param {string}   props.attributesKey Key passed to `setAttributes`.
 * @param {Function} props.setAttributes Setter.
 * @param {Function} props.onChange      Optional setter called with the new URL.
 * @param {string}   props.placeholder   Hint under the title, e.g. the recommended size.
 * @param {string}   props.libraryType   Media library filter, e.g. 'image'.
 */
const MediaUpload = ( {
	label,
	help,
	attributes,
	attributesKey,
	setAttributes,
	onChange,
	placeholder = '',
	libraryType = 'image',
} ) => {
	const frameRef = useRef();
	const writeRef = useRef();
	const url = 'string' === typeof attributes ? attributes : '';
	const hasMedia = !! window.wp?.media;

	writeRef.current = ( next ) => {
		if ( onChange ) {
			onChange( next );
		} else if ( setAttributes && attributesKey ) {
			setAttributes( { [ attributesKey ]: next } );
		}
	};

	useEffect( () => () => frameRef.current?.off( 'select' ), [] );

	const openLibrary = () => {
		if ( ! hasMedia ) {
			return;
		}
		if ( ! frameRef.current ) {
			frameRef.current = window.wp.media( {
				title:
					label ||
					__( 'Select file', 'gallery-slider-for-woocommerce' ),
				library: libraryType ? { type: libraryType } : {},
				button: {
					text: __(
						'Use this file',
						'gallery-slider-for-woocommerce'
					),
				},
				multiple: false,
			} );
			frameRef.current.on( 'select', () => {
				const attachment = frameRef.current
					.state()
					.get( 'selection' )
					.first()
					?.toJSON();
				if ( attachment?.url ) {
					writeRef.current( attachment.url );
				}
			} );
		}
		frameRef.current.open();
	};

	if ( url ) {
		return (
			<div className="wcgs-control wcgs-media-upload">
				<div className="wcgs-media-upload__file sp-d-flex sp-align-center sp-gap-10px">
					<span
						className="wcgs-media-upload__thumb"
						style={ { backgroundImage: `url(${ url })` } }
					/>
					<span className="wcgs-media-upload__text sp-flex-1 sp-min-w-0 sp-d-flex sp-flex-col sp-gap-2px">
						<span className="wcgs-media-upload__title sp-d-i-flex sp-align-center sp-gap-6px sp-min-w-0">
							{ label }
							<HelpTip
								text={ help }
								align={ tipAlign( label ) }
							/>
						</span>
						<span className="wcgs-media-upload__name" title={ url }>
							{ fileName( url ) }
						</span>
					</span>
					<button
						type="button"
						className="wcgs-media-upload__replace sp-flex-none"
						onClick={ openLibrary }
						disabled={ ! hasMedia }
					>
						{ __( 'Replace', 'gallery-slider-for-woocommerce' ) }
					</button>
					<button
						type="button"
						className="wcgs-media-upload__remove sp-d-i-flex sp-align-center sp-justify-center"
						onClick={ () => writeRef.current( '' ) }
						title={ __(
							'Remove',
							'gallery-slider-for-woocommerce'
						) }
						aria-label={ __(
							'Remove',
							'gallery-slider-for-woocommerce'
						) }
					>
						<CloseIcon size={ 12 } />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="wcgs-control wcgs-media-upload">
			<button
				type="button"
				className="wcgs-media-upload__drop sp-d-flex sp-flex-col sp-align-center sp-gap-6px sp-w-full"
				onClick={ openLibrary }
				disabled={ ! hasMedia }
			>
				<UploadIcon />
				<span className="wcgs-media-upload__title sp-d-i-flex sp-align-center sp-gap-6px sp-min-w-0">
					{ label }
				</span>
				{ ( placeholder || help ) && (
					<span className="wcgs-media-upload__hint">
						{ placeholder || help }
					</span>
				) }
			</button>
		</div>
	);
};

export default memo( MediaUpload );
