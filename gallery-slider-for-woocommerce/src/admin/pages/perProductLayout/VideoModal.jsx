import { __ } from '@wordpress/i18n';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { CrossIcon } from '../../components/Icons';

// Exit animation length (matches the stylesheet).
const OUT_MS = 180;

/**
 * A YouTube video in a modal over the dashboard, playing on open. Closing
 * (the × button, Escape or a backdrop click) plays the exit animation, then
 * unmounts the player, which stops the video.
 *
 * @param {Object}   props
 * @param {string}   props.videoId YouTube video ID.
 * @param {string}   props.title   Accessible title of the dialog and player.
 * @param {Function} props.onClose Called once the exit animation ends.
 */
const VideoModal = ( { videoId, title, onClose } ) => {
	const closeRef = useRef();
	const timer = useRef();
	const closingRef = useRef( false );
	const [ isClosing, setClosing ] = useState( false );

	const close = () => {
		if ( closingRef.current ) {
			return;
		}
		closingRef.current = true;
		setClosing( true );
		timer.current = setTimeout( () => onClose?.(), OUT_MS );
	};
	const closeHandler = useRef();
	closeHandler.current = close;

	useEffect( () => {
		// Back to the opener on close.
		const opener = closeRef.current?.ownerDocument.activeElement;
		closeRef.current?.focus( { preventScroll: true } );
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key ) {
				closeHandler.current();
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => {
			document.removeEventListener( 'keydown', onKeyDown );
			clearTimeout( timer.current );
			opener?.focus?.( { preventScroll: true } );
		};
	}, [] );

	const src = `https://www.youtube-nocookie.com/embed/${ encodeURIComponent(
		videoId
	) }?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

	return createPortal(
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Backdrop click; Escape is handled above.
		<div
			className={ `wcgs-video-modal sp-flex-center${
				isClosing ? ' is-closing' : ''
			}` }
			onClick={ ( event ) =>
				event.target === event.currentTarget && close()
			}
		>
			<div
				className="wcgs-video-modal__dialog"
				role="dialog"
				aria-modal="true"
				aria-label={ title }
			>
				<button
					ref={ closeRef }
					type="button"
					className="wcgs-video-modal__close sp-flex-center"
					onClick={ close }
					aria-label={ __(
						'Close',
						'gallery-slider-for-woocommerce'
					) }
				>
					<CrossIcon size={ 18 } />
				</button>
				<div className="wcgs-video-modal__player">
					<iframe
						src={ src }
						title={ title }
						allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
						allowFullScreen
					/>
				</div>
			</div>
		</div>,
		document.body
	);
};

export default VideoModal;
