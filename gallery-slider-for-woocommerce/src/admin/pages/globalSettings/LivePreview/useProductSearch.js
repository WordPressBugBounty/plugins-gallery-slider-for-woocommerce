import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

// Products per request; the picker asks for the next page on scroll.
const PER_PAGE = 6;

/**
 * Paged server search for the preview's product picker
 * (REST `wcgs/v1/settings/search` with `per_page`).
 *
 * @param {boolean} enabled Load the first page on mount (off when the picker lists the layout's products).
 * @return {Object} `{ options, onSearch, loadMore, isSearching, isLoadingMore, hasMore }`.
 */
const useProductSearch = ( enabled = true ) => {
	const [ options, setOptions ] = useState( [] );
	const [ hasMore, setHasMore ] = useState( false );
	const [ isSearching, setSearching ] = useState( false );
	const [ isLoadingMore, setLoadingMore ] = useState( false );
	const timer = useRef();
	const lastRequest = useRef( 0 );
	const state = useRef( { text: '', page: 1, busy: false } );

	const fetchPage = useCallback( async ( text, page ) => {
		const request = ++lastRequest.current;
		state.current = { text, page, busy: true };
		let result = { items: [], more: false };
		try {
			result = await apiFetch( {
				path: `/wcgs/v1/settings/search?kind=product&per_page=${ PER_PAGE }&page=${ page }&search=${ encodeURIComponent(
					text
				) }`,
			} );
		} catch ( error ) {}
		// Only the latest request may update the list.
		if ( request !== lastRequest.current ) {
			return;
		}
		const items = Array.isArray( result?.items ) ? result.items : [];
		setOptions( ( previous ) => {
			if ( 1 === page ) {
				return items;
			}
			const seen = new Set( previous.map( ( option ) => option.value ) );
			return [
				...previous,
				...items.filter( ( option ) => ! seen.has( option.value ) ),
			];
		} );
		setHasMore( !! result?.more );
		setSearching( false );
		setLoadingMore( false );
		state.current.busy = false;
	}, [] );

	const onSearch = useCallback(
		( text ) => {
			clearTimeout( timer.current );
			// A pending page of the previous search must not land.
			++lastRequest.current;
			state.current.busy = true;
			setSearching( true );
			setLoadingMore( false );
			timer.current = setTimeout(
				() => fetchPage( text.trim(), 1 ),
				text.trim() ? 300 : 0
			);
		},
		[ fetchPage ]
	);

	const loadMore = useCallback( () => {
		if ( state.current.busy || ! hasMore ) {
			return;
		}
		setLoadingMore( true );
		fetchPage( state.current.text, state.current.page + 1 );
	}, [ fetchPage, hasMore ] );

	// First page, shown before anything is typed.
	useEffect( () => {
		if ( enabled ) {
			onSearch( '' );
		}
		return () => clearTimeout( timer.current );
	}, [ onSearch, enabled ] );

	return {
		options,
		onSearch,
		loadMore,
		isSearching,
		isLoadingMore,
		hasMore,
	};
};

export default useProductSearch;
