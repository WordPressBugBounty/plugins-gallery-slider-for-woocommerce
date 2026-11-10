import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { SETTINGS_LINKS } from '../../constants/settingsTabs';
import { CloseIcon } from '../Icons';
import './editor.scss';

// Exit animation length (matches the stylesheet).
const OUT_MS = 220;

// The changelog is fetched once per page load and kept here.
let cached = null;

/**
 * Right-hand drawer with the plugin changelog, opened from the version
 * badge in the header. The HTML comes from REST `wcgs/v1/changelog`,
 * sanitized on the server with `wp_kses`, and is fetched the first time the
 * drawer opens.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen  Whether the drawer is open.
 * @param {Function} props.onClose Close callback.
 */
const ChangelogDrawer = ( { isOpen, onClose } ) => {
	const [ isMounted, setMounted ] = useState( false );
	const [ isClosing, setClosing ] = useState( false );
	const [ html, setHtml ] = useState( cached );
	const [ hasFailed, setFailed ] = useState( false );
	const closeTimer = useRef();
	const closeButton = useRef();

	// Mount on open, unmount after the exit animation on close.
	useEffect( () => {
		clearTimeout( closeTimer.current );
		if ( isOpen ) {
			setMounted( true );
			setClosing( false );
			return;
		}
		if ( isMounted ) {
			setClosing( true );
			closeTimer.current = setTimeout( () => {
				setMounted( false );
				setClosing( false );
			}, OUT_MS );
		}
		return () => clearTimeout( closeTimer.current );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Runs on open/close only.
	}, [ isOpen ] );

	// Fetch the changelog the first time the drawer opens.
	useEffect( () => {
		if ( ! isOpen || null !== cached ) {
			return;
		}
		let isCurrent = true;
		setFailed( false );
		apiFetch( { path: '/wcgs/v1/changelog' } )
			.then( ( response ) => {
				cached = response?.changelog || '';
				if ( isCurrent ) {
					setHtml( cached );
				}
			} )
			.catch( () => {
				if ( isCurrent ) {
					setFailed( true );
				}
			} );
		return () => {
			isCurrent = false;
		};
	}, [ isOpen ] );

	// Focus moves into the drawer once its panel is rendered.
	useEffect( () => {
		if ( isOpen && isMounted ) {
			closeButton.current?.focus( { preventScroll: true } );
		}
	}, [ isOpen, isMounted ] );

	// Escape closes.
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		const onKeyDown = ( event ) => {
			if ( 'Escape' === event.key ) {
				onClose();
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ isOpen, onClose ] );

	if ( ! isMounted ) {
		return null;
	}

	const isLoading = null === html && ! hasFailed;
	const isEmpty = null !== html && '' === html;

	return (
		<div
			className={ `wcgs-changelog-drawer${
				isClosing ? ' is-closing' : ''
			}` }
		>
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Scrim; Escape closes too. */ }
			<div className="wcgs-changelog-drawer__scrim" onClick={ onClose } />
			<div
				className="wcgs-changelog-drawer__panel sp-d-flex sp-flex-col"
				role="dialog"
				aria-modal="true"
				aria-labelledby="wcgs-changelog-drawer-title"
			>
				<div className="wcgs-changelog-drawer__head sp-flex-none sp-d-flex sp-align-center sp-justify-between sp-gap-12px">
					<div
						id="wcgs-changelog-drawer-title"
						className="wcgs-changelog-drawer__title"
					>
						{ __(
							'Latest Updates - Changelog',
							'gallery-slider-for-woocommerce'
						) }
					</div>
					<button
						ref={ closeButton }
						type="button"
						className="wcgs-changelog-drawer__close sp-flex-center"
						title={ __(
							'Close',
							'gallery-slider-for-woocommerce'
						) }
						aria-label={ __(
							'Close',
							'gallery-slider-for-woocommerce'
						) }
						onClick={ onClose }
					>
						<CloseIcon size={ 14 } />
					</button>
				</div>
				<div className="wcgs-changelog-drawer__body">
					{ isLoading && (
						<div className="wcgs-changelog-drawer__state sp-d-flex sp-flex-col sp-align-center sp-gap-8px">
							<Spinner />
						</div>
					) }
					{ ( hasFailed || isEmpty ) && (
						<div className="wcgs-changelog-drawer__state sp-d-flex sp-flex-col sp-align-center sp-gap-8px">
							<p>
								{ __(
									'The changelog could not be loaded right now.',
									'gallery-slider-for-woocommerce'
								) }
							</p>
							<a
								href={ SETTINGS_LINKS.changelog }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __(
									'View the changelog online',
									'gallery-slider-for-woocommerce'
								) }
							</a>
						</div>
					) }
					{ !! html && (
						<div
							className="wcgs-changelog-drawer__content"
							// Sanitized with wp_kses on the server.
							dangerouslySetInnerHTML={ { __html: html } }
						/>
					) }
				</div>
			</div>
		</div>
	);
};

export default ChangelogDrawer;
