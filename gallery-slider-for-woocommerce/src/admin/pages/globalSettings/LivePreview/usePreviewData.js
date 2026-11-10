import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

// Wait this long after the last image-size edit before asking again.
const MEDIA_DELAY = 300;

// Panel keys the image URLs and sizes depend on (Preview_API::MEDIA_KEYS).
// Every other setting renders in the browser without a request.
export const MEDIA_KEYS = [ 'image_sizes', 'thumbnails_sizes' ];

/**
 * The data the preview is built from (REST `wcgs/v1/preview`): the product's
 * raw gallery data, image URLs and sizes, stored settings, field definitions
 * and style defaults. It is asked for again only for another product or an
 * image-size change; a newer request cancels the one in flight, and the last
 * data stays in use meanwhile.
 *
 * @param {Object}  args
 * @param {Object}  args.values    Settings panel values.
 * @param {number}  args.productId Product to preview; 0 lets the server pick one.
 * @param {boolean} args.isReady   Whether the panel values are loaded.
 * @param {number}  args.layoutId  Layout being edited, or 0 for a new one (notices only).
 * @param {boolean} args.isLayout  Whether a layout is being edited at all (notices only).
 * @return {Object} `{ data, error, isLoading, retry }`.
 */
const usePreviewData = ( {
	values,
	productId,
	isReady,
	layoutId = 0,
	isLayout = false,
} ) => {
	const [ state, setState ] = useState( {
		data: null,
		error: '',
		isLoading: false,
	} );
	const [ attempt, setAttempt ] = useState( 0 );
	const timer = useRef();
	const controller = useRef();
	const target = useRef( null );

	const mediaValues = {};
	MEDIA_KEYS.forEach( ( key ) => {
		if ( values && key in values ) {
			mediaValues[ key ] = values[ key ];
		}
	} );
	const mediaKey = JSON.stringify( mediaValues );

	useEffect( () => {
		if ( ! isReady ) {
			return;
		}
		const previous = target.current;
		target.current = { productId, attempt, layoutId, isLayout };
		const isInstant =
			! previous ||
			previous.productId !== productId ||
			previous.attempt !== attempt ||
			previous.layoutId !== layoutId ||
			previous.isLayout !== isLayout;

		clearTimeout( timer.current );
		timer.current = setTimeout(
			() => {
				if ( controller.current ) {
					controller.current.abort();
				}
				const request = new AbortController();
				controller.current = request;
				setState( ( current ) => ( { ...current, isLoading: true } ) );

				apiFetch( {
					path: '/wcgs/v1/preview',
					method: 'POST',
					data: {
						values: JSON.parse( mediaKey ),
						product_id: productId,
						layout_id: layoutId,
						is_layout: isLayout,
					},
					signal: request.signal,
				} )
					.then( ( data ) => {
						if ( ! request.signal.aborted ) {
							setState( { data, error: '', isLoading: false } );
						}
					} )
					.catch( ( error ) => {
						if ( request.signal.aborted ) {
							return;
						}
						setState( ( current ) => ( {
							...current,
							error:
								error?.message ||
								__(
									'The preview could not be loaded.',
									'gallery-slider-for-woocommerce'
								),
							isLoading: false,
						} ) );
					} );
			},
			isInstant ? 0 : MEDIA_DELAY
		);

		return () => clearTimeout( timer.current );
	}, [ mediaKey, productId, isReady, attempt, layoutId, isLayout ] );

	// Cancel the request in flight when the preview goes away.
	useEffect(
		() => () => controller.current && controller.current.abort(),
		[]
	);

	const retry = useCallback( () => setAttempt( ( n ) => n + 1 ), [] );

	return { ...state, retry };
};

export default usePreviewData;
