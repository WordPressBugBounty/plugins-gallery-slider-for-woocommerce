import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';

/**
 * Small pieces of the free plugin's upsell layer, shared by the lock kit:
 * the crown, the pills, the purple "Upgrade to Pro" button and the pricing link.
 *
 * @since 4.0.0
 */

// The crown every Pro marker uses (24×24 path, drawn 0.75 lower).
const CROWN_PATH = 'M3.5 8.5 7 11l5-6.5 5 6.5 3.5-2.5-1.75 9.5H5.25zM5.5 21h13';

/**
 * Pricing page of the Pro plugin (REST `dashboardInfo.proUrl`).
 *
 * @return {string} URL.
 */
export const useProUrl = () =>
	useSelect( ( select ) => select( STORE_NAME ).getProUrl(), [] );

/**
 * Open the pricing page in a new tab.
 *
 * @param {string} url Pricing URL.
 */
export const openPricing = ( url ) => {
	window.open( url, '_blank', 'noopener,noreferrer' );
};

/**
 * Pro crown icon.
 *
 * @param {Object} props
 * @param {number} props.size        Size in px.
 * @param {number} props.strokeWidth Stroke width.
 * @param {string} props.color       Stroke color; `currentColor` inside buttons.
 * @param {string} props.className   Extra class.
 */
export const CrownIcon = ( {
	size = 13,
	strokeWidth = 1.6,
	color = '#C98A0B',
	className = '',
} ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0.75 24 24"
		fill="none"
		stroke={ color }
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		className={ `wcgs-crown ${ className }`.trim() }
		aria-hidden="true"
	>
		<path d={ CROWN_PATH } />
	</svg>
);

/**
 * Gold check of the upsell lists.
 *
 * @param {Object} props
 * @param {number} props.size Size in px.
 */
export const GoldCheckIcon = ( { size = 14 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="#C98A0B"
		strokeWidth="2.2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="wcgs-crown"
		aria-hidden="true"
	>
		<path d="M5 12.5 10 17 19 7" />
	</svg>
);

/**
 * Mouse pointer drawn over the animated visuals.
 *
 * @param {Object} props
 * @param {number} props.size      Size in px.
 * @param {string} props.className Class (sets position and animation).
 */
export const PointerIcon = ( { size = 16, className = '' } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		className={ `wcgs-pro-pointer ${ className }`.trim() }
		aria-hidden="true"
	>
		<path
			d="M5 3l13.5 9.2-6.1 1.1 3.6 6.8-2.6 1.4-3.6-6.9L5 19.2z"
			fill="#fff"
			stroke="#1D1D1F"
			strokeWidth="1.6"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * "Pro" pill of a locked section's accordion header.
 */
export const ProPill = () => (
	<span className="wcgs-pro-pill sp-flex-none sp-d-i-flex sp-align-center sp-gap-4px">
		<CrownIcon />
		{ __( 'Pro', 'gallery-slider-for-woocommerce' ) }
	</span>
);

/**
 * Crown pill of a locked option. With `onClick` the pill is a button of its
 * own that opens the pricing page (the option itself is then not clickable),
 * and "Get Pro" slides out after the crown while the option (the closest
 * `.wcgs-lock-host`) is hovered; otherwise it shows the crown only.
 *
 * @param {Object}   props
 * @param {string}   props.className Extra class (e.g. the corner placement).
 * @param {Function} props.onClick   Optional: makes the pill a button.
 * @param {number}   props.tabIndex  Tab index of the button form.
 */
export const LockPill = ( { className = '', onClick, tabIndex } ) => {
	const classes =
		`wcgs-lock-pill sp-flex-none sp-d-flex sp-align-center ${ className }`.trim();
	if ( onClick ) {
		return (
			<button
				type="button"
				className={ `${ classes } sp-row-reverse is-button` }
				onClick={ onClick }
				tabIndex={ tabIndex }
				aria-label={ __( 'Get Pro', 'gallery-slider-for-woocommerce' ) }
			>
				<CrownIcon />
				<span className="wcgs-lock-pill__text sp-d-block">
					{ __( 'Get Pro', 'gallery-slider-for-woocommerce' ) }
				</span>
			</button>
		);
	}
	return (
		<span className={ classes }>
			<CrownIcon />
		</span>
	);
};

/**
 * Round crown badge next to a locked row's label.
 */
export const CrownBadge = () => (
	<span className="wcgs-crown-badge sp-d-i-flex sp-align-center sp-justify-center">
		<CrownIcon size={ 11 } strokeWidth={ 1.7 } />
	</span>
);

/**
 * Purple "Upgrade to Pro" button with a crown.
 *
 * @param {Object}   props
 * @param {string}   props.size      'small' (28px), 'medium' (34px) or 'large' (38px).
 * @param {boolean}  props.isBlock   Full width.
 * @param {Function} props.onClick   Click handler; defaults to opening the pricing page.
 * @param {string}   props.label     Button text.
 * @param {string}   props.className Extra class.
 */
export const UpgradeButton = ( {
	size = 'medium',
	isBlock = false,
	onClick,
	label = __( 'Upgrade to Pro', 'gallery-slider-for-woocommerce' ),
	className = '',
	...props
} ) => {
	const proUrl = useProUrl();
	return (
		<button
			type="button"
			className={ `wcgs-upgrade-button sp-flex-none sp-d-i-flex sp-align-center sp-justify-center sp-gap-6px is-${ size }${
				isBlock ? ' is-block' : ''
			} ${ className }`.trim() }
			onClick={ onClick || ( () => openPricing( proUrl ) ) }
			{ ...props }
		>
			<CrownIcon size={ 14 } strokeWidth={ 1.9 } color="currentColor" />
			{ label }
		</button>
	);
};
