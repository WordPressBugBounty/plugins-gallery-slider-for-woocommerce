import { __ } from '@wordpress/i18n';
import { useCallback, useRef, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { SETTINGS_LINKS } from '../../constants/settingsTabs';
import useClickOutside from '../../hooks/useClickOutside';
import { UpgradeButton, openPricing, useProUrl } from '../Pro';
import './editor.scss';

// Menu icons (paths from the Reno settings design).
const ICONS = {
	wizard: (
		<>
			<path d="M4 20 15 9" />
			<path d="M14 4v2M14 12v2M10 8h2M16 8h2" />
			<path d="M19 3l.6 1.4L21 5l-1.4.6L19 7l-.6-1.4L17 5l1.4-.6z" />
		</>
	),
	docs: (
		<>
			<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
			<path d="M4 19a2 2 0 0 1 2-2h12" />
		</>
	),
	videos: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M10 8.6v6.8l5.4-3.4z" fill="currentColor" />
		</>
	),
	changelog: (
		<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
	),
	support: (
		<>
			<path d="M4 6h16v12H4z" />
			<path d="m4 7 8 6 8-6" />
		</>
	),
	about: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 11v5.5" />
			<circle
				cx="12"
				cy="7.75"
				r="0.6"
				fill="currentColor"
				stroke="none"
			/>
		</>
	),
};

const Icon = ( { size, strokeWidth, children } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		{ children }
	</svg>
);

/**
 * Help button at the right of the header (`helpToggle` / `helpOpen` in the
 * free design): the Setup Wizard, links to docs and support, and an
 * "Upgrade to Pro" button that opens the pricing page.
 */
const HelpMenu = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const ref = useRef();
	const close = useCallback( () => setIsOpen( false ), [] );
	useClickOutside( ref, isOpen, close );
	const { setWizardOpen } = useDispatch( STORE_NAME );
	const proUrl = useProUrl();

	const items = [
		{
			key: 'docs',
			label: __( 'Documentation', 'gallery-slider-for-woocommerce' ),
			href: SETTINGS_LINKS.docs,
		},
		{
			key: 'videos',
			label: __( 'Video Tutorials', 'gallery-slider-for-woocommerce' ),
			href: SETTINGS_LINKS.videos,
		},
		{
			key: 'changelog',
			label: __( 'What’s New', 'gallery-slider-for-woocommerce' ),
			href: SETTINGS_LINKS.changelog,
		},
		{
			key: 'support',
			label: __( 'Contact Support', 'gallery-slider-for-woocommerce' ),
			href: SETTINGS_LINKS.support,
		},
		{
			key: 'about',
			label: __( 'About Us', 'gallery-slider-for-woocommerce' ),
			href: SETTINGS_LINKS.about,
		},
	];

	return (
		<div className="wcgs-help-menu" ref={ ref }>
			<button
				type="button"
				className={ `wcgs-help-menu__toggle${
					isOpen ? ' is-open' : ''
				}` }
				onClick={ () => setIsOpen( ! isOpen ) }
				title={ __( 'Help & docs', 'gallery-slider-for-woocommerce' ) }
				aria-label={ __( 'Help', 'gallery-slider-for-woocommerce' ) }
				aria-haspopup="true"
				aria-expanded={ isOpen }
			>
				<Icon size={ 22 } strokeWidth={ 1.6 }>
					<circle cx="12" cy="12" r="9" />
					<path d="M9.5 9.2a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2.1-2.3 3.9" />
					<circle
						cx="12"
						cy="17.4"
						r="0.6"
						fill="currentColor"
						stroke="none"
					/>
				</Icon>
			</button>
			<div
				className={ `wcgs-help-menu__popover${
					isOpen ? ' is-open' : ''
				}` }
			>
				<button
					type="button"
					className="wcgs-help-menu__item"
					tabIndex={ isOpen ? 0 : -1 }
					onClick={ () => {
						close();
						setWizardOpen( true );
					} }
				>
					<span className="wcgs-help-menu__icon sp-flex-center is-accent">
						<Icon size={ 16 } strokeWidth={ 1.7 }>
							{ ICONS.wizard }
						</Icon>
					</span>
					<span className="wcgs-help-menu__label">
						{ __(
							'Setup Wizard',
							'gallery-slider-for-woocommerce'
						) }
					</span>
				</button>
				<span className="wcgs-help-menu__divider sp-d-block" />
				{ items.map( ( { key, label, href } ) => (
					<a
						key={ key }
						href={ href }
						className="wcgs-help-menu__item"
						tabIndex={ isOpen ? 0 : -1 }
						onClick={ close }
						target="_blank"
						rel="noopener noreferrer"
					>
						<span className="wcgs-help-menu__icon sp-flex-center">
							<Icon size={ 16 } strokeWidth={ 1.7 }>
								{ ICONS[ key ] }
							</Icon>
						</span>
						<span className="wcgs-help-menu__label">{ label }</span>
					</a>
				) ) }
				<span className="wcgs-help-menu__divider sp-d-block is-wide" />
				<UpgradeButton
					isBlock
					tabIndex={ isOpen ? 0 : -1 }
					onClick={ () => {
						close();
						openPricing( proUrl );
					} }
				/>
			</div>
		</div>
	);
};

export default HelpMenu;
