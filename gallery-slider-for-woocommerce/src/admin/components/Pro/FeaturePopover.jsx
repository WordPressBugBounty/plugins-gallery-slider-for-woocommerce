import { __ } from '@wordpress/i18n';
import {
	createContext,
	createPortal,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { openPricing, useProUrl } from './shared';
import { PopoverVisual } from './visuals';

/**
 * Feature popover (`fpop` in the free design): a 320px card that explains a
 * Pro feature, with an animated visual and an "Upgrade to Pro" button.
 *
 * One popover shows at a time. A trigger opens it after 600ms of hover (at
 * once while another popover is open, so moving along a row of locked
 * options switches between them); a click-only trigger (`onHover: false`)
 * opens it on click. It closes on a press outside, a
 * wheel or scroll, Escape, or when the pointer leaves the trigger and the
 * corridor between the trigger and the card.
 *
 * @since 4.0.0
 */

const WIDTH = 320;
const HOVER_DELAY = 600;
const CLOSE_DURATION = 170;

const PopoverContext = createContext( null );

/**
 * Whether a mouse event's related target is inside an element. React's
 * `onMouseLeave` reports `window` as the related target when the pointer
 * leaves for a place React doesn't manage (the preview iframe, outside the
 * browser window), and `Node.contains()` throws on anything but a Node.
 *
 * @since 4.0.0
 *
 * @param {Element|null} element Element to test, if any.
 * @param {*}            target  `event.relatedTarget`.
 * @return {boolean} True when the target is a Node inside the element.
 */
const containsTarget = ( element, target ) =>
	!! element && target instanceof window.Node && element.contains( target );

/**
 * Where the card goes: above the trigger, else below, else to its left,
 * 12px from the viewport edges. A trigger in a narrow row of options
 * (flex or grid parent under 70% of the viewport) centers the card on the row.
 *
 * @param {Element|null} element Trigger, or null for a centered card.
 * @param {Object}       content Popover content.
 * @return {Object} `{ x, y, bottom, mode, arrow }`; mode 'up', 'down', 'side' or 'none'.
 */
const placeCard = ( element, content ) => {
	const viewWidth = document.documentElement.clientWidth || window.innerWidth;
	const viewHeight =
		document.documentElement.clientHeight || window.innerHeight;
	let height = 376;
	if ( 'none' === content.visual ) {
		height = 160;
	} else if ( content.preview ) {
		height = 330;
	} else if ( content.chips ) {
		height = 416;
	}

	if ( ! element?.getBoundingClientRect ) {
		return {
			x: Math.max( 12, viewWidth / 2 - WIDTH / 2 ),
			y: 120,
			mode: 'none',
			arrow: 0,
		};
	}

	const rect = element.getBoundingClientRect();
	const parent = element.parentElement;
	const parentRect = parent?.getBoundingClientRect();
	const group =
		parent &&
		/flex|grid/.test( window.getComputedStyle( parent ).display ) &&
		parent.children.length > 1 &&
		parentRect.width < viewWidth * 0.7
			? parentRect
			: rect;
	const triggerCenter = rect.left + rect.width / 2;
	const groupCenter = group.left + group.width / 2;
	const middle = rect.top + rect.height / 2;
	let x = Math.min(
		Math.max( 12, groupCenter - WIDTH / 2 ),
		viewWidth - WIDTH - 12
	);
	let y;
	let mode = 'up';
	if ( rect.top - height - 10 >= 12 ) {
		y = rect.top - height - 10;
	} else if ( rect.bottom + 10 + height <= viewHeight - 12 ) {
		y = rect.bottom + 10;
		mode = 'down';
	} else {
		mode = 'side';
		x = Math.max( 12, rect.left - WIDTH - 10 );
		y = Math.max(
			12,
			Math.min( middle - height / 2, viewHeight - height - 12 )
		);
	}
	const arrow =
		'side' === mode
			? Math.max( 18, Math.min( height - 18, middle - y ) )
			: Math.max( 18, Math.min( WIDTH - 18, triggerCenter - x ) );
	return { x, y, bottom: viewHeight - rect.top + 10, mode, arrow };
};

/**
 * The card.
 *
 * @param {Object}   props
 * @param {Object}   props.content      `{ title, text, chips, visual, preview }`.
 * @param {Object}   props.place        Result of `placeCard()`.
 * @param {boolean}  props.isClosing    Play the exit animation.
 * @param {Object}   props.cardRef      Ref of the card element.
 * @param {Function} props.onUpgrade    "Upgrade to Pro" handler.
 * @param {Function} props.onMouseEnter Pointer entered the card.
 * @param {Function} props.onMouseLeave Pointer left the card.
 */
const Card = ( {
	content,
	place,
	isClosing,
	cardRef,
	onUpgrade,
	onMouseEnter,
	onMouseLeave,
} ) => {
	const { mode, arrow } = place;
	const style = { left: place.x };
	if ( 'up' === mode ) {
		style.bottom = place.bottom;
	} else {
		style.top = place.y;
	}
	if ( 'side' === mode ) {
		style.transformOrigin = `100% ${ arrow }px`;
	} else if ( 'none' !== mode ) {
		style.transformOrigin = `${ arrow }px ${
			'up' === mode ? '100%' : '0'
		}`;
	}
	const arrowStyle =
		'side' === mode ? { top: arrow - 6 } : { left: arrow - 6 };

	return (
		<div
			ref={ cardRef }
			className={ `wcgs-fpop${ isClosing ? ' is-closing' : '' }` }
			style={ style }
			role="dialog"
			aria-label={ content.title }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
		>
			{ 'none' !== mode && (
				<span
					className={ `wcgs-fpop__arrow is-${ mode }` }
					style={ arrowStyle }
				/>
			) }
			<div className="wcgs-fpop__clip">
				{ 'none' !== content.visual && (
					<PopoverVisual
						visual={ content.visual }
						preview={ content.preview }
					/>
				) }
				<div className="wcgs-fpop__body sp-d-flex sp-flex-col sp-gap-6px">
					<span className="wcgs-fpop__title">{ content.title }</span>
					{ content.text && (
						<span className="wcgs-fpop__text">
							{ content.text }
						</span>
					) }
					{ content.chips && ! content.preview && (
						<div className="wcgs-fpop__chips sp-d-flex sp-flex-wrap sp-gap-6px">
							{ content.chips.map( ( chip ) => (
								<span key={ chip }>{ chip }</span>
							) ) }
						</div>
					) }
					<button
						type="button"
						className="wcgs-fpop__upgrade sp-w-full sp-d-flex sp-align-center sp-justify-center"
						onClick={ onUpgrade }
					>
						{ __(
							'Upgrade to Pro',
							'gallery-slider-for-woocommerce'
						) }
					</button>
				</div>
			</div>
		</div>
	);
};

/**
 * Holds the one feature popover of the dashboard. Render it once, around
 * the app; `useFeaturePopover()` opens it.
 *
 * @param {Object} props
 * @param {*}      props.children App.
 */
export const FeaturePopoverProvider = ( { children } ) => {
	// `{ content, place, isClosing, key }` of the open card, or null.
	const [ popover, setPopover ] = useState( null );
	const proUrl = useProUrl();
	const prompt = useSelect(
		( select ) => select( STORE_NAME ).getProPrompt(),
		[]
	);
	const { setProPrompt } = useDispatch( STORE_NAME );
	const popoverRef = useRef( null );
	popoverRef.current = popover;
	const cardRef = useRef();
	// Element the card points at, and the trigger under the pointer.
	const triggerRef = useRef( null );
	const hoveredRef = useRef( null );
	const timers = useRef( {} );
	const corridorRef = useRef( null );

	const stopCorridor = useCallback( () => {
		if ( corridorRef.current ) {
			document.removeEventListener( 'mousemove', corridorRef.current );
			corridorRef.current = null;
		}
	}, [] );

	const close = useCallback( () => {
		const current = popoverRef.current;
		if ( ! current || current.isClosing ) {
			return;
		}
		clearTimeout( timers.current.close );
		setPopover( { ...current, isClosing: true } );
		timers.current.close = setTimeout( () => {
			setPopover( null );
			triggerRef.current = null;
		}, CLOSE_DURATION );
	}, [] );

	const open = useCallback( ( element, content ) => {
		clearTimeout( timers.current.close );
		triggerRef.current = element || null;
		setPopover( {
			content,
			place: placeCard( element, content ),
			isClosing: false,
			key: Date.now(),
		} );
	}, [] );

	const isOpen = useCallback(
		() => !! popoverRef.current && ! popoverRef.current.isClosing,
		[]
	);

	// The pointer left a trigger: keep the card while it travels to it.
	const leaveTrigger = useCallback(
		( element, event ) => {
			if ( containsTarget( element, event.relatedTarget ) ) {
				return;
			}
			clearTimeout( timers.current.delay );
			hoveredRef.current = null;
			if ( ! isOpen() ) {
				return;
			}
			if ( containsTarget( cardRef.current, event.relatedTarget ) ) {
				return;
			}
			const trigger = element.getBoundingClientRect();
			const mode = popoverRef.current.place.mode;
			const inCorridor = ( x, y ) => {
				if ( ! cardRef.current ) {
					return false;
				}
				const box = cardRef.current.getBoundingClientRect();
				const pad = 3;
				if (
					x >= box.left &&
					x <= box.right &&
					y >= box.top &&
					y <= box.bottom
				) {
					return 'card';
				}
				if ( 'side' === mode ) {
					return (
						x >= box.right - pad &&
						x <= trigger.left + pad &&
						y >= Math.min( trigger.top, box.top ) &&
						y <= Math.max( trigger.bottom, box.bottom )
					);
				}
				const left = Math.min( trigger.left, box.left );
				const right = Math.max( trigger.right, box.right );
				return 'up' === mode
					? x >= left &&
							x <= right &&
							y >= box.bottom - pad &&
							y <= trigger.top + pad
					: x >= left &&
							x <= right &&
							y >= trigger.bottom - pad &&
							y <= box.top + pad;
			};
			stopCorridor();
			if ( ! inCorridor( event.clientX, event.clientY ) ) {
				close();
				return;
			}
			corridorRef.current = ( move ) => {
				const where = inCorridor( move.clientX, move.clientY );
				if ( 'card' === where ) {
					stopCorridor();
				} else if ( ! where ) {
					stopCorridor();
					if ( ! hoveredRef.current ) {
						close();
					}
				}
			};
			document.addEventListener( 'mousemove', corridorRef.current );
		},
		[ close, isOpen, stopCorridor ]
	);

	const enterTrigger = useCallback(
		( element, content ) => {
			if ( hoveredRef.current === element ) {
				return;
			}
			hoveredRef.current = element;
			clearTimeout( timers.current.delay );
			clearTimeout( timers.current.close );
			if ( isOpen() ) {
				open( element, content );
				return;
			}
			timers.current.delay = setTimeout( () => {
				if ( hoveredRef.current === element ) {
					open( element, content );
				}
			}, HOVER_DELAY );
		},
		[ isOpen, open ]
	);

	/**
	 * Props that make an element a popover trigger: it opens on hover only,
	 * or with `onHover: false` on click only.
	 *
	 * @param {Object}  content         `{ title, text, chips, visual, preview }`.
	 * @param {Object}  options
	 * @param {boolean} options.onHover Open on hover (default true); false opens on click instead.
	 * @return {Object} `{ onMouseEnter, onMouseLeave }`, or `{ onClick }`.
	 */
	const bindTrigger = useCallback(
		( content, { onHover = true } = {} ) =>
			onHover
				? {
						onMouseEnter: ( event ) =>
							enterTrigger( event.currentTarget, content ),
						onMouseLeave: ( event ) =>
							leaveTrigger( event.currentTarget, event ),
				  }
				: {
						onClick: ( event ) => {
							event.stopPropagation();
							open( event.currentTarget, content );
						},
				  },
		[ open, enterTrigger, leaveTrigger ]
	);

	// Close on a press outside, a wheel or scroll, and Escape.
	useEffect( () => {
		const onPointerDown = ( event ) => {
			if (
				isOpen() &&
				! cardRef.current?.contains( event.target ) &&
				! hoveredRef.current?.contains( event.target )
			) {
				close();
			}
		};
		const onScroll = ( event ) => {
			// A box that is not a scroller, moved by the browser (focus,
			// scrollIntoView), is not the user scrolling.
			const target = event.target;
			if (
				'wheel' !== event.type &&
				target instanceof window.Element &&
				! /auto|scroll|overlay/.test(
					window.getComputedStyle( target ).overflowY
				)
			) {
				return;
			}
			clearTimeout( timers.current.delay );
			stopCorridor();
			hoveredRef.current = null;
			close();
		};
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key && isOpen() ) {
				close();
			}
		};
		document.addEventListener( 'mousedown', onPointerDown );
		document.addEventListener( 'wheel', onScroll, {
			passive: true,
			capture: true,
		} );
		document.addEventListener( 'scroll', onScroll, true );
		document.addEventListener( 'keydown', onKeyDown );
		const pending = timers.current;
		return () => {
			document.removeEventListener( 'mousedown', onPointerDown );
			document.removeEventListener( 'wheel', onScroll, {
				capture: true,
			} );
			document.removeEventListener( 'scroll', onScroll, true );
			document.removeEventListener( 'keydown', onKeyDown );
			stopCorridor();
			clearTimeout( pending.delay );
			clearTimeout( pending.close );
		};
	}, [ close, isOpen, stopCorridor ] );

	// An upsell asked for by the store (e.g. the server refused a layout).
	useEffect( () => {
		if ( prompt ) {
			open( null, { title: prompt.title, text: prompt.text } );
			setProPrompt( null );
		}
	}, [ prompt, open, setProPrompt ] );

	const value = useMemo(
		() => ( { open, close, bindTrigger, proUrl } ),
		[ open, close, bindTrigger, proUrl ]
	);

	return (
		<PopoverContext.Provider value={ value }>
			{ children }
			{ popover &&
				createPortal(
					<Card
						key={ popover.key }
						content={ popover.content }
						place={ popover.place }
						isClosing={ popover.isClosing }
						cardRef={ cardRef }
						onUpgrade={ () => {
							setPopover( null );
							openPricing( proUrl );
						} }
						onMouseEnter={ () =>
							clearTimeout( timers.current.close )
						}
						onMouseLeave={ ( event ) => {
							if (
								containsTarget(
									triggerRef.current,
									event.relatedTarget
								)
							) {
								hoveredRef.current = null;
								return;
							}
							if ( ! hoveredRef.current ) {
								close();
							}
						} }
					/>,
					document.body
				) }
		</PopoverContext.Provider>
	);
};

/**
 * The feature popover: `open( element, content )`, `close()`, and
 * `bindTrigger( content, { onHover } )` (props for a trigger element).
 * Outside a provider, click triggers open the pricing page instead and hover
 * triggers do nothing.
 *
 * @return {Object} `{ open, close, bindTrigger, proUrl }`.
 */
export const useFeaturePopover = () => {
	const context = useContext( PopoverContext );
	const proUrl = useProUrl();
	if ( context ) {
		return context;
	}
	const toPricing = () => openPricing( proUrl );
	return {
		open: toPricing,
		close: () => {},
		bindTrigger: ( content, { onHover = true } = {} ) =>
			onHover ? {} : { onClick: toPricing },
		proUrl,
	};
};

/**
 * Content of the popover of a locked option.
 *
 * @param {string} title Option name.
 * @return {Object} Popover content.
 */
export const lockedOptionContent = ( title ) => ( {
	title,
	text: __(
		'Available in Reno Product Gallery Pro.',
		'gallery-slider-for-woocommerce'
	),
} );

/**
 * Content of the "Unlimited per-product layouts" popover.
 *
 * @return {Object} Popover content.
 */
export const layoutLimitContent = () => ( {
	title: __(
		'Unlimited per-product layouts',
		'gallery-slider-for-woocommerce'
	),
	text: __(
		'Free includes one per-product layout. Pro lets you create and assign as many as you need.',
		'gallery-slider-for-woocommerce'
	),
} );
