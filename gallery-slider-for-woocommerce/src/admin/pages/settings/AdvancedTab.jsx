import { __ } from '@wordpress/i18n';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { SETTINGS_LINKS } from '../../constants/settingsTabs';
import { Icon, Switch, CHECK_PATH } from './controls';
import { SettingsHeading, SettingsRow, useSettings } from './SettingsRow';

const SHORTCODE = '[reno_product_gallery]';

// `enqueue_*` switchers of the legacy Advanced Controls tab.
const ASSETS = [
	[
		'enqueue_fancybox_css',
		__( 'FancyBox CSS', 'gallery-slider-for-woocommerce' ),
	],
	[
		'enqueue_fancybox_js',
		__( 'FancyBox JS', 'gallery-slider-for-woocommerce' ),
	],
	[
		'enqueue_swiper_css',
		__( 'Swiper CSS', 'gallery-slider-for-woocommerce' ),
	],
	[
		'enqueue_swiper_js',
		__( 'Swiper JS', 'gallery-slider-for-woocommerce' ),
	],
	[
		'enqueue_video_css',
		__( 'VideoJS CSS', 'gallery-slider-for-woocommerce' ),
	],
	[
		'enqueue_video_js',
		__( 'VideoJS JS', 'gallery-slider-for-woocommerce' ),
	],
];

/**
 * Click-to-copy shortcode box.
 */
const ShortcodeCopy = () => {
	const [ copied, setCopied ] = useState( false );
	const timer = useRef();
	useEffect( () => () => clearTimeout( timer.current ), [] );

	const copy = async () => {
		try {
			await window.navigator.clipboard.writeText( SHORTCODE );
		} catch ( error ) {
			return;
		}
		setCopied( true );
		clearTimeout( timer.current );
		timer.current = setTimeout( () => setCopied( false ), 1600 );
	};

	return (
		<span className="wcgs-shortcode sp-d-i-flex sp-align-center sp-gap-10px">
			<button
				type="button"
				className="wcgs-shortcode__button sp-d-i-flex sp-align-center sp-gap-10px"
				onClick={ copy }
				title={ __(
					'Click to copy',
					'gallery-slider-for-woocommerce'
				) }
			>
				{ SHORTCODE }
				<span className="wcgs-shortcode__rule" />
				<span className="wcgs-shortcode__icon sp-d-i-flex">
					{ copied ? (
						<Icon size={ 15 } strokeWidth={ 2.2 } stroke="#1F9D55">
							{ CHECK_PATH }
						</Icon>
					) : (
						<Icon size={ 15 }>
							<rect x="9" y="9" width="11" height="11" rx="2" />
							<path d="M5 15V6a2 2 0 0 1 2-2h8" />
						</Icon>
					) }
				</span>
			</button>
			<span
				className={ `wcgs-shortcode__copied${
					copied ? ' is-visible' : ''
				}` }
				aria-live="polite"
			>
				{ copied
					? __( 'Copied', 'gallery-slider-for-woocommerce' )
					: '' }
			</span>
		</span>
	);
};

/**
 * Warning shown before "Clean Up Data on Deletion" is turned on.
 *
 * @param {Object}   props
 * @param {Function} props.onCancel  Keep the data.
 * @param {Function} props.onConfirm Turn the setting on.
 */
const CleanupDialog = ( { onCancel, onConfirm } ) => {
	const cancelRef = useRef( onCancel );
	cancelRef.current = onCancel;
	useEffect( () => {
		const onKeyDown = ( event ) =>
			'Escape' === event.key && cancelRef.current();
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [] );

	return createPortal(
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Backdrop click; Escape is handled above.
		<div
			className="wcgs-confirm"
			onClick={ ( event ) =>
				event.target === event.currentTarget && onCancel()
			}
		>
			<div
				className="wcgs-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="wcgs-cleanup-title"
			>
				<button
					type="button"
					className="wcgs-modal__close sp-flex-center"
					onClick={ onCancel }
					title={ __( 'Close', 'gallery-slider-for-woocommerce' ) }
				>
					<Icon size={ 14 } strokeWidth={ 2.2 }>
						<path d="M6 6l12 12M18 6L6 18" />
					</Icon>
				</button>
				<div className="wcgs-modal__body sp-d-flex sp-align-start sp-gap-14px">
					<span className="wcgs-modal__icon sp-flex-center">
						<Icon size={ 18 } strokeWidth={ 1.9 }>
							<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
						</Icon>
					</span>
					<div className="wcgs-modal__content sp-flex-1 sp-min-w-0">
						<div
							id="wcgs-cleanup-title"
							className="wcgs-confirm__title"
						>
							{ __(
								'Delete Reno Product Gallery Data on Uninstall?',
								'gallery-slider-for-woocommerce'
							) }
						</div>
						<p className="wcgs-confirm__text">
							{ __(
								'If you delete Reno Product Gallery from the Plugins page, these will be removed permanently:',
								'gallery-slider-for-woocommerce'
							) }
						</p>
						<div className="wcgs-modal__list sp-d-flex sp-flex-col sp-gap-6px">
							<span>
								{ __(
									'• Global Settings and Settings',
									'gallery-slider-for-woocommerce'
								) }
							</span>
							<span>
								{ __(
									'• Per-Product Layouts and their assignments',
									'gallery-slider-for-woocommerce'
								) }
							</span>
							<span>
								{ __(
									'• Variation galleries and videos added to products',
									'gallery-slider-for-woocommerce'
								) }
							</span>
						</div>
						<p className="wcgs-modal__muted">
							{ __(
								'Deactivating the plugin won’t delete anything. This only happens on delete.',
								'gallery-slider-for-woocommerce'
							) }
						</p>
					</div>
				</div>
				<div className="wcgs-modal__footer sp-d-flex sp-justify-end sp-gap-8px">
					<button
						type="button"
						className="wcgs-btn is-secondary is-modal"
						onClick={ onCancel }
					>
						{ __(
							'Keep My Data',
							'gallery-slider-for-woocommerce'
						) }
					</button>
					<button
						type="button"
						className="wcgs-btn is-destroy is-modal"
						onClick={ onConfirm }
					>
						{ __(
							'Yes, Turn On',
							'gallery-slider-for-woocommerce'
						) }
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};

/**
 * Advanced Controls sub-tab.
 */
const AdvancedTab = () => {
	const { values, setValues } = useSettings();
	const [ isCleanupAsk, setCleanupAsk ] = useState( false );

	return (
		<div>
			<div className="sp-d-flex sp-flex-col">
				<SettingsHeading>
					{ __( 'General', 'gallery-slider-for-woocommerce' ) }
				</SettingsHeading>
				<SettingsRow
					label={ __(
						'Shortcode',
						'gallery-slider-for-woocommerce'
					) }
					tip={
						<>
							{ __(
								'If Reno Product Gallery doesn’t show automatically on product pages built with a page builder (Divi, Elementor, Bricks Builder, etc.), add this shortcode manually to display it.',
								'gallery-slider-for-woocommerce'
							) }{ ' ' }
							<a
								className="wcgs-lt-tip__link"
								href={ SETTINGS_LINKS.pageBuilders }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __(
									'See Instructions',
									'gallery-slider-for-woocommerce'
								) }
							</a>
						</>
					}
					tipWidth={ 300 }
				>
					<ShortcodeCopy />
				</SettingsRow>

				<SettingsHeading>
					{ __( 'Data & Privacy', 'gallery-slider-for-woocommerce' ) }
				</SettingsHeading>
				<SettingsRow
					label={ __(
						'Clean Up Data on Deletion',
						'gallery-slider-for-woocommerce'
					) }
					tip={ __(
						'When on, deleting Reno from the Plugins page also removes its settings and layouts. Leave it off if you might reinstall later.',
						'gallery-slider-for-woocommerce'
					) }
					tipWidth={ 290 }
					inline
				>
					<Switch
						attributes={ values.wcgs_data_remove }
						label={ __(
							'Clean Up Data on Deletion',
							'gallery-slider-for-woocommerce'
						) }
						onChange={ ( on ) =>
							on
								? setCleanupAsk( true )
								: setValues( { wcgs_data_remove: false } )
						}
					/>
				</SettingsRow>

				<SettingsHeading
					tip={ __(
						'Turn a file off only if your theme or another plugin already loads it. Turning off a needed file can break the gallery, lightbox or video player.',
						'gallery-slider-for-woocommerce'
					) }
				>
					{ __(
						'Assets (Styles & Scripts)',
						'gallery-slider-for-woocommerce'
					) }
				</SettingsHeading>
				{ ASSETS.map( ( [ key, label ] ) => (
					<SettingsRow key={ key } label={ label } inline>
						<Switch
							attributes={ values[ key ] }
							attributesKey={ key }
							setAttributes={ setValues }
							label={ label }
						/>
					</SettingsRow>
				) ) }
			</div>
			{ isCleanupAsk && (
				<CleanupDialog
					onCancel={ () => setCleanupAsk( false ) }
					onConfirm={ () => {
						setValues( { wcgs_data_remove: true } );
						setCleanupAsk( false );
					} }
				/>
			) }
		</div>
	);
};

export default AdvancedTab;
