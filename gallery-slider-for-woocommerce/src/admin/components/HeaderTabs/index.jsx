import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';
import { STORE_NAME } from '../../store/constants';
import { HEADER_TABS } from '../../constants/tabs';
import './editor.scss';

/**
 * Top tabs of the header (`topTabs` in the design). Arrow keys move between them.
 * An underline (`ttBar`) slides to the active tab.
 */
const HeaderTabs = () => {
	const activeTab = useSelect(
		( select ) => select( STORE_NAME ).getActiveTab(),
		[]
	);
	// Leaving Settings with unsaved changes asks first (see `requestTab`).
	const { requestTab } = useDispatch( STORE_NAME );
	const ref = useRef();
	// `{ x, w, animate }` of the underline; the first placement doesn't animate.
	const [ bar, setBar ] = useState( null );

	useLayoutEffect( () => {
		const el = ref.current;
		if ( ! el ) {
			return;
		}
		const measure = () => {
			const tab = el.querySelector( `[data-tab="${ activeTab }"]` );
			if ( ! tab ) {
				return;
			}
			const x = tab.offsetLeft;
			const w = tab.offsetWidth;
			setBar( ( prev ) =>
				prev && prev.x === x && prev.w === w
					? prev
					: { x, w, animate: !! prev }
			);
		};
		measure();
		// Tab widths change when the web font loads or the window resizes.
		const observer = new window.ResizeObserver( measure );
		observer.observe( el );
		return () => observer.disconnect();
	}, [ activeTab ] );

	const onKeyDown = ( event ) => {
		const step = { ArrowRight: 1, ArrowLeft: -1 }[ event.key ];
		if ( ! step ) {
			return;
		}
		event.preventDefault();
		const index = HEADER_TABS.findIndex( ( tab ) => tab.key === activeTab );
		const next =
			HEADER_TABS[
				( index + step + HEADER_TABS.length ) % HEADER_TABS.length
			];
		requestTab( next.key );
		event.currentTarget.parentElement
			.querySelector( `[data-tab="${ next.key }"]` )
			?.focus();
	};

	return (
		<div
			ref={ ref }
			className="wcgs-header-tabs sp-d-flex sp-gap-6px sp-min-w-0"
			role="tablist"
			aria-label={ __(
				'Dashboard sections',
				'gallery-slider-for-woocommerce'
			) }
		>
			{ HEADER_TABS.map( ( { key, label } ) => {
				const isActive = key === activeTab;
				return (
					<button
						key={ key }
						type="button"
						role="tab"
						data-tab={ key }
						aria-selected={ isActive }
						tabIndex={ isActive ? 0 : -1 }
						className={ `wcgs-header-tabs__tab sp-flex-none sp-d-i-flex sp-align-center${
							isActive ? ' is-active' : ''
						}` }
						onClick={ () => requestTab( key ) }
						onKeyDown={ onKeyDown }
					>
						{ label }
					</button>
				);
			} ) }
			<span
				className="wcgs-header-tabs__bar"
				aria-hidden="true"
				style={
					bar
						? {
								width: bar.w,
								transform: `translateX(${ bar.x }px)`,
								transition: bar.animate ? undefined : 'none',
						  }
						: { width: 0, opacity: 0 }
				}
			/>
		</div>
	);
};

export default HeaderTabs;
