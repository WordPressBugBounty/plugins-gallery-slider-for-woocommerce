import {
	createPortal,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import './editor.scss';

/**
 * Fast tooltip for the dashboard's buttons and links. The browser's own
 * `title` tooltip waits about a second; this one shows the same text after
 * a short delay, and at once while moving between buttons.
 *
 * Mount it once. On hover or keyboard focus of a `button`, `a` or
 * `[role="button"]` with a `title` inside the dashboard, the title moves to
 * `data-wcgs-tip` (so the native tooltip never shows) and the tip renders
 * above the element, or below it when there is no room. An element without
 * an accessible name gets the title as its `aria-label`.
 *
 * @since 4.0.0
 */

const SELECTOR =
	'button[title], a[title], [role="button"][title], button[data-wcgs-tip], a[data-wcgs-tip], [role="button"][data-wcgs-tip]';
// Only elements of the dashboard (its root, or a portal such as the wizard).
const SCOPE = '#wcgs-admin-dashboard-wrapper, [class*="wcgs-"]';
const SHOW_DELAY = 120;
// Moving to another button within this time shows its tip at once.
const WARM_TIME = 300;
const GAP = 8;
const EDGE = 8;

/**
 * Move an element's `title` to `data-wcgs-tip` and return the tip text.
 *
 * @param {Element} element Trigger.
 * @return {string} Tip text.
 */
const takeTitle = ( element ) => {
	const title = element.getAttribute( 'title' );
	if ( null !== title ) {
		element.removeAttribute( 'title' );
		element.setAttribute( 'data-wcgs-tip', title );
		if (
			title &&
			! element.hasAttribute( 'aria-label' ) &&
			! element.hasAttribute( 'aria-labelledby' ) &&
			! element.textContent.trim()
		) {
			element.setAttribute( 'aria-label', title );
		}
	}
	return ( element.getAttribute( 'data-wcgs-tip' ) || '' ).trim();
};

/**
 * Trigger of an event target, or null.
 *
 * @param {EventTarget} target Event target.
 * @return {Element|null} Trigger.
 */
const findTrigger = ( target ) => {
	if ( ! ( target instanceof window.Element ) ) {
		return null;
	}
	const element = target.closest( SELECTOR );
	return element && element.closest( SCOPE ) ? element : null;
};

const TitleTooltip = () => {
	// `{ text, x, top, bottom }` of the hovered element's tip, or null.
	const [ tip, setTip ] = useState( null );
	const tipRef = useRef();
	const state = useRef( { element: null, timer: 0, hiddenAt: 0 } );

	useEffect( () => {
		const current = state.current;
		let observer = null;

		const place = ( element, text ) => {
			const rect = element.getBoundingClientRect();
			setTip( {
				text,
				x: rect.left + rect.width / 2,
				top: rect.top,
				bottom: rect.bottom,
			} );
		};

		const hide = () => {
			clearTimeout( current.timer );
			observer?.disconnect();
			observer = null;
			if ( current.element ) {
				current.element = null;
				current.hiddenAt = Date.now();
			}
			setTip( null );
		};

		const show = ( element ) => {
			if ( current.element === element ) {
				return;
			}
			const text = takeTitle( element );
			hide();
			if ( ! text ) {
				return;
			}
			current.element = element;
			// React may set the title again on a re-render (e.g. "Copied").
			observer = new window.MutationObserver( () => {
				const next = takeTitle( element );
				if ( current.element === element ) {
					if ( next ) {
						place( element, next );
					} else {
						hide();
					}
				}
			} );
			observer.observe( element, {
				attributes: true,
				attributeFilter: [ 'title' ],
			} );
			const delay =
				Date.now() - current.hiddenAt < WARM_TIME ? 0 : SHOW_DELAY;
			current.timer = setTimeout( () => {
				if ( current.element === element && element.isConnected ) {
					place( element, text );
				}
			}, delay );
		};

		const onOver = ( event ) => {
			const element = findTrigger( event.target );
			if ( element ) {
				show( element );
			}
		};
		const onOut = ( event ) => {
			if (
				current.element &&
				! current.element.contains( event.relatedTarget )
			) {
				hide();
			}
		};
		const onFocusIn = ( event ) => {
			const element = findTrigger( event.target );
			if ( element && element.matches( ':focus-visible' ) ) {
				show( element );
			}
		};
		const onFocusOut = ( event ) => {
			if ( current.element === event.target ) {
				hide();
			}
		};
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key && current.element ) {
				hide();
			}
		};

		document.addEventListener( 'mouseover', onOver, true );
		document.addEventListener( 'mouseout', onOut, true );
		document.addEventListener( 'focusin', onFocusIn, true );
		document.addEventListener( 'focusout', onFocusOut, true );
		document.addEventListener( 'mousedown', hide, true );
		document.addEventListener( 'wheel', hide, {
			passive: true,
			capture: true,
		} );
		document.addEventListener( 'scroll', hide, true );
		document.addEventListener( 'keydown', onKeyDown, true );
		window.addEventListener( 'blur', hide );
		return () => {
			document.removeEventListener( 'mouseover', onOver, true );
			document.removeEventListener( 'mouseout', onOut, true );
			document.removeEventListener( 'focusin', onFocusIn, true );
			document.removeEventListener( 'focusout', onFocusOut, true );
			document.removeEventListener( 'mousedown', hide, true );
			document.removeEventListener( 'wheel', hide, { capture: true } );
			document.removeEventListener( 'scroll', hide, true );
			document.removeEventListener( 'keydown', onKeyDown, true );
			window.removeEventListener( 'blur', hide );
			clearTimeout( current.timer );
			observer?.disconnect();
		};
	}, [] );

	// Fit the tip in the viewport once its size is known (before paint).
	const [ position, setPosition ] = useState( null );
	useLayoutEffect( () => {
		if ( ! tip || ! tipRef.current ) {
			setPosition( null );
			return;
		}
		const box = tipRef.current.getBoundingClientRect();
		const viewWidth = document.documentElement.clientWidth;
		const below = tip.top - GAP - box.height < EDGE;
		const left = Math.min(
			Math.max( EDGE, tip.x - box.width / 2 ),
			viewWidth - box.width - EDGE
		);
		setPosition( {
			left,
			top: below ? tip.bottom + GAP : tip.top - GAP - box.height,
			below,
			arrow: Math.max( 8, Math.min( box.width - 8, tip.x - left ) ),
		} );
	}, [ tip ] );

	if ( ! tip ) {
		return null;
	}
	return createPortal(
		<div
			ref={ tipRef }
			className={ `wcgs-title-tip${ position ? ' is-visible' : '' }${
				position?.below ? ' is-below' : ''
			}` }
			style={
				position
					? { left: position.left, top: position.top }
					: { left: 0, top: 0 }
			}
			aria-hidden="true"
		>
			{ tip.text }
			{ position && (
				// Inline, so the RTL stylesheet does not flip it.
				<span
					className="wcgs-title-tip__arrow"
					style={ { left: position.arrow - 5 } }
				/>
			) }
		</div>,
		document.body
	);
};

export default TitleTooltip;
