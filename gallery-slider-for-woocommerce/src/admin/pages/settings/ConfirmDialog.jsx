import { __ } from '@wordpress/i18n';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';

// Exit animation length (matches the stylesheet).
const OUT_MS = 180;

/**
 * Small confirm dialog of the design (reset, leave, deactivate prompts).
 * Every button plays the exit animation before its handler runs.
 *
 * @param {Object}   props
 * @param {string}   props.title          Title.
 * @param {string}   props.message        Body text.
 * @param {string}   props.confirmLabel   Main button label.
 * @param {Function} props.onConfirm      Main button handler.
 * @param {Function} props.onCancel       Cancel, Escape and backdrop handler.
 * @param {string}   props.secondaryLabel Optional middle button label.
 * @param {Function} props.onSecondary    Middle button handler.
 * @param {string}   props.tone           'danger' shows the red icon and button.
 * @param {*}        props.icon           Icon paths (24×24) shown with the danger tone.
 */
const ConfirmDialog = ( {
	title,
	message,
	confirmLabel,
	onConfirm,
	onCancel,
	secondaryLabel = '',
	onSecondary,
	tone = 'default',
	icon,
} ) => {
	const confirmRef = useRef();
	const timer = useRef();
	const closingRef = useRef( false );
	const [ isClosing, setClosing ] = useState( false );
	const isDanger = 'danger' === tone;

	// Play the exit, then run the handler (once).
	const closeWith = ( handler ) => {
		if ( closingRef.current ) {
			return;
		}
		closingRef.current = true;
		setClosing( true );
		timer.current = setTimeout( () => handler?.(), OUT_MS );
	};
	const cancelRef = useRef();
	cancelRef.current = () => closeWith( onCancel );

	useEffect( () => {
		confirmRef.current?.focus( { preventScroll: true } );
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key ) {
				cancelRef.current();
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => {
			document.removeEventListener( 'keydown', onKeyDown );
			clearTimeout( timer.current );
		};
	}, [] );

	return createPortal(
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Backdrop click; Escape is handled above.
		<div
			className={ `wcgs-confirm${ isClosing ? ' is-closing' : '' }` }
			onClick={ ( event ) =>
				event.target === event.currentTarget && cancelRef.current()
			}
		>
			<div
				className={ `wcgs-confirm__card sp-d-flex sp-gap-16px${
					isDanger ? ' is-danger' : ''
				}` }
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="wcgs-confirm-title"
				aria-describedby="wcgs-confirm-text"
			>
				{ isDanger && (
					<span className="wcgs-confirm__icon sp-flex-center">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							{ icon || (
								<>
									<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
									<path d="M3 3v5h5" />
								</>
							) }
						</svg>
					</span>
				) }
				<div className="wcgs-confirm__content sp-flex-1 sp-min-w-0">
					<div
						id="wcgs-confirm-title"
						className="wcgs-confirm__title"
					>
						{ title }
					</div>
					<p id="wcgs-confirm-text" className="wcgs-confirm__text">
						{ message }
					</p>
					<div className="wcgs-confirm__actions sp-d-flex sp-justify-end sp-gap-8px">
						<button
							type="button"
							className={ `wcgs-btn ${
								secondaryLabel ? 'is-ghost' : 'is-secondary'
							}` }
							onClick={ () => cancelRef.current() }
						>
							{ __( 'Cancel', 'gallery-slider-for-woocommerce' ) }
						</button>
						{ secondaryLabel && (
							<button
								type="button"
								className="wcgs-btn is-secondary"
								onClick={ () => closeWith( onSecondary ) }
							>
								{ secondaryLabel }
							</button>
						) }
						<button
							ref={ confirmRef }
							type="button"
							className={ `wcgs-btn ${
								isDanger ? 'is-danger' : 'is-primary'
							}` }
							onClick={ () => closeWith( onConfirm ) }
						>
							{ confirmLabel }
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
};

export default ConfirmDialog;
