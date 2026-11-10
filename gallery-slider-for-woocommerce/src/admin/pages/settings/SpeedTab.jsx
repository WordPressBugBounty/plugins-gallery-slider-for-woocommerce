import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { SETTINGS_LINKS } from '../../constants/settingsTabs';
import { CheckList, Switch, TextField } from './controls';
import { SettingsIntro, SettingsRow, useSettings } from './SettingsRow';

const WC_GALLERY_SCRIPTS = [
	{
		value: 'lightbox',
		label: __( 'Lightbox (PhotoSwipe)', 'gallery-slider-for-woocommerce' ),
	},
	{ value: 'zoom', label: __( 'Zoom', 'gallery-slider-for-woocommerce' ) },
	{
		value: 'slider',
		label: __( 'Slider (FlexSlider)', 'gallery-slider-for-woocommerce' ),
	},
];

const HANDLES_NOTE = __(
	'Enter handles separated by commas. Applies to product pages only.',
	'gallery-slider-for-woocommerce'
);

/**
 * Speed Optimization sub-tab.
 */
const SpeedTab = () => {
	const { values, setValues } = useSettings();
	const isClearingCache = useSelect(
		( select ) => select( STORE_NAME ).isClearingCache(),
		[]
	);
	const { clearCache } = useDispatch( STORE_NAME );

	return (
		<div>
			<SettingsIntro
				linkLabel={ __(
					'See speed guide',
					'gallery-slider-for-woocommerce'
				) }
				linkUrl={ SETTINGS_LINKS.speedGuide }
			>
				{ __(
					'Make your product pages load faster by controlling which files Reno Product Gallery loads. For the best results, also follow your caching plugin’s recommendations.',
					'gallery-slider-for-woocommerce'
				) }
			</SettingsIntro>
			<div className="sp-d-flex sp-flex-col">
				<SettingsRow
					label={ __(
						'Lazy Load the Gallery',
						'gallery-slider-for-woocommerce'
					) }
					tip={ __(
						'Loads the gallery only when it scrolls into view, so the rest of the page appears faster. Best for galleries placed below the fold.',
						'gallery-slider-for-woocommerce'
					) }
					tipWidth={ 290 }
					inline
				>
					<div className="wcgs-settings-row__fill">
						<Switch
							attributes={ values.lazy_load_gallery }
							attributesKey="lazy_load_gallery"
							setAttributes={ setValues }
							label={ __(
								'Lazy Load the Gallery',
								'gallery-slider-for-woocommerce'
							) }
						/>
					</div>
				</SettingsRow>
				<SettingsRow
					label={ __(
						'Cache Gallery Images',
						'gallery-slider-for-woocommerce'
					) }
					tip={ __(
						'Saves each product’s gallery so it isn’t rebuilt on every visit. After editing a gallery, clear your site cache to see the changes.',
						'gallery-slider-for-woocommerce'
					) }
					tipWidth={ 290 }
					inline
				>
					<div className="wcgs-settings-row__fill sp-d-flex sp-align-center sp-gap-20px">
						<Switch
							attributes={ values.gallery_cache }
							attributesKey="gallery_cache"
							setAttributes={ setValues }
							label={ __(
								'Cache Gallery Images',
								'gallery-slider-for-woocommerce'
							) }
						/>
						<button
							type="button"
							className="wcgs-link-button"
							onClick={ () => clearCache() }
							disabled={ isClearingCache }
						>
							{ isClearingCache
								? __(
										'Clearing…',
										'gallery-slider-for-woocommerce'
								  )
								: __(
										'Clear Cache',
										'gallery-slider-for-woocommerce'
								  ) }
						</button>
					</div>
				</SettingsRow>
				<SettingsRow
					label={ __(
						'Remove WooCommerce Gallery Scripts',
						'gallery-slider-for-woocommerce'
					) }
					tip={ __(
						'Reno replaces WooCommerce’s own gallery, so these files load for nothing. Keep one only if another plugin needs it.',
						'gallery-slider-for-woocommerce'
					) }
					tipWidth={ 290 }
					top={ 0 }
				>
					<CheckList
						attributes={ values.remove_default_wc_gallery }
						attributesKey="remove_default_wc_gallery"
						setAttributes={ setValues }
						options={ WC_GALLERY_SCRIPTS }
					/>
				</SettingsRow>
				<SettingsRow
					label={ __(
						'Remove CSS Files',
						'gallery-slider-for-woocommerce'
					) }
					tip={ __(
						'Stops other themes or plugins from loading stylesheets you don’t need on product pages. Use the file’s handle name, not its URL.',
						'gallery-slider-for-woocommerce'
					) }
					tipWidth={ 290 }
					top={ 10 }
				>
					<TextField
						attributes={ values.dequeue_single_product_css }
						attributesKey="dequeue_single_product_css"
						setAttributes={ setValues }
						placeholder={ __(
							'e.g. theme-style, plugin-style-xyz',
							'gallery-slider-for-woocommerce'
						) }
						note={ HANDLES_NOTE }
						label={ __(
							'Remove CSS Files',
							'gallery-slider-for-woocommerce'
						) }
					/>
				</SettingsRow>
				<SettingsRow
					label={ __(
						'Remove JavaScript Files',
						'gallery-slider-for-woocommerce'
					) }
					tip={ __(
						'Stops other themes or plugins from loading scripts you don’t need on product pages. Removing a needed script can break features, so test after saving.',
						'gallery-slider-for-woocommerce'
					) }
					tipWidth={ 290 }
					top={ 10 }
				>
					<TextField
						attributes={ values.dequeue_single_product_js }
						attributesKey="dequeue_single_product_js"
						setAttributes={ setValues }
						placeholder={ __(
							'e.g. theme-script, plugin-script-xyz',
							'gallery-slider-for-woocommerce'
						) }
						note={ HANDLES_NOTE }
						label={ __(
							'Remove JavaScript Files',
							'gallery-slider-for-woocommerce'
						) }
					/>
				</SettingsRow>
			</div>
		</div>
	);
};

export default SpeedTab;
