import { __ } from '@wordpress/i18n';
import {
	CrownBadge,
	CrownIcon,
	UpgradeButton,
	openPricing,
	useProUrl,
} from './shared';
import { useFeaturePopover } from './FeaturePopover';
import { ShopVideoVisual } from './visuals';

/**
 * Upsell blocks of the settings panel: the "More X Options in Pro" box, the
 * section upsell card, and the locked toggle and dimension rows.
 *
 * @since 4.0.0
 */

const UPSELL_VISUALS = {
	shopvideo: ShopVideoVisual,
};

/**
 * "More X Options in Pro" box at the end of a section (`more` in the design).
 * Items with a `popover` are underlined and open their demo.
 *
 * @param {Object} props
 * @param {string} props.title       Title, e.g. "More Zoom Options in Pro".
 * @param {string} props.description One line under the title.
 * @param {Array}  props.items       `[ { label, popover? } ]`; `popover` is popover content.
 */
export const MoreInPro = ( { title, description, items = [] } ) => {
	const proUrl = useProUrl();
	const { bindTrigger } = useFeaturePopover();
	return (
		<div className="wcgs-more-pro sp-d-flex sp-flex-col sp-gap-14px">
			<div className="wcgs-more-pro__head sp-min-w-0 sp-d-flex sp-flex-col sp-gap-4px">
				<span className="wcgs-more-pro__title sp-d-flex sp-align-center">
					<CrownIcon size={ 16 } strokeWidth={ 1.7 } />
					{ title }
				</span>
				<span className="wcgs-more-pro__description">
					{ description }
				</span>
			</div>
			<ul className="wcgs-more-pro__list sp-d-flex sp-flex-col sp-gap-8px">
				{ items.map( ( item ) => (
					<li
						key={ item.label }
						className="wcgs-more-pro__item sp-min-w-0 sp-d-flex sp-align-start"
					>
						<span className="wcgs-more-pro__dot" />
						{ item.popover ? (
							<button
								type="button"
								className="wcgs-more-pro__demo"
								{ ...bindTrigger( item.popover ) }
							>
								{ item.label }
							</button>
						) : (
							<span>{ item.label }</span>
						) }
					</li>
				) ) }
			</ul>
			<button
				type="button"
				className="wcgs-more-pro__link sp-d-i-flex sp-align-center"
				onClick={ () => openPricing( proUrl ) }
			>
				<span className="wcgs-more-pro__link-text">
					{ __( 'Upgrade to Pro', 'gallery-slider-for-woocommerce' ) }
				</span>
				<svg
					className="wcgs-more-pro__link-arrow"
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M5 12h14M13 6l6 6-6 6" />
				</svg>
			</button>
		</div>
	);
};

/**
 * Card that replaces the settings of a Pro-only section (`upsell` in the design).
 * Its "Upgrade to Pro" button opens the pricing page.
 *
 * @param {Object} props
 * @param {string} props.title       Title.
 * @param {string} props.description Description.
 * @param {Array}  props.items       Feature list.
 * @param {string} props.visual      Visual key, e.g. 'shopvideo'.
 */
export const UpsellCard = ( { title, description, items = [], visual } ) => {
	const Visual = UPSELL_VISUALS[ visual ];
	return (
		<div className="wcgs-upsell-card">
			<div className="wcgs-upsell-card__visual">
				{ Visual && <Visual /> }
			</div>
			<div className="wcgs-upsell-card__body sp-d-flex sp-flex-col sp-gap-10px">
				<div className="wcgs-upsell-card__title sp-d-flex sp-align-center sp-gap-8px">
					<CrownIcon size={ 18 } />
					<span>{ title }</span>
				</div>
				<span className="wcgs-upsell-card__description">
					{ description }
				</span>
				<ul className="wcgs-upsell-card__list sp-d-flex sp-flex-col sp-gap-2px">
					{ items.map( ( item ) => (
						<li key={ item }>{ item }</li>
					) ) }
				</ul>
				<div className="wcgs-upsell-card__actions sp-d-flex sp-align-center sp-gap-10px">
					<UpgradeButton />
				</div>
			</div>
		</div>
	);
};

/**
 * Locked switch row (`protog` in the design): label, crown and a disabled
 * switch. Not clickable: no tooltip and no pricing redirect.
 *
 * @param {Object} props
 * @param {string} props.label Setting name.
 */
export const ProToggleRow = ( { label } ) => (
	<div className="wcgs-pro-row sp-w-full is-toggle" aria-disabled="true">
		<span className="wcgs-pro-row__label sp-min-w-0 sp-d-flex sp-align-center sp-gap-8px">
			{ label }
			<CrownBadge />
		</span>
		<span
			className="wcgs-pro-row__switch sp-flex-none sp-d-i-flex"
			aria-hidden="true"
		>
			<span />
		</span>
	</div>
);

/**
 * Locked width × height row (`prorow` in the design): label, crown and two
 * disabled fields; hovering it opens its popover.
 *
 * @param {Object} props
 * @param {string} props.label   Setting name.
 * @param {Object} props.popover Popover content.
 */
export const ProDimensionRow = ( { label, popover } ) => {
	const { bindTrigger } = useFeaturePopover();
	return (
		<button
			type="button"
			className="wcgs-pro-row sp-w-full is-dimension"
			{ ...bindTrigger( popover ) }
		>
			<span className="wcgs-pro-row__label sp-min-w-0 sp-d-flex sp-align-center sp-gap-8px">
				{ label }
				<CrownBadge />
			</span>
			<span
				className="wcgs-pro-row__fields sp-d-grid sp-gap-8px"
				aria-hidden="true"
			>
				<span>
					<span>
						{ __( 'Width', 'gallery-slider-for-woocommerce' ) }
					</span>
					<span>px</span>
				</span>
				<span>
					<span>
						{ __( 'Height', 'gallery-slider-for-woocommerce' ) }
					</span>
					<span>px</span>
				</span>
			</span>
		</button>
	);
};
