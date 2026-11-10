import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * The products the layout editor's preview can show (REST
 * `wcgs/v1/layouts/preview-products`): "Assigned Products", then each
 * assigned category's products, without the excluded ones. Follows the
 * unsaved assignment.
 *
 * @param {Object}  args
 * @param {boolean} args.isLayout Whether a layout is being edited.
 * @param {number}  args.layoutId Layout ID (0 for a new one).
 * @param {Object}  args.meta     `{ categories, products, exclude }`.
 * @return {Array|null} Groups `[ { title, items } ]`, or null until loaded (and outside a layout).
 */
const useLayoutProducts = ( { isLayout, layoutId, meta } ) => {
	const [ groups, setGroups ] = useState( null );
	const key = isLayout
		? JSON.stringify( [
				layoutId,
				meta.categories,
				meta.products,
				meta.exclude,
		  ] )
		: '';

	useEffect( () => {
		if ( ! key ) {
			setGroups( null );
			return;
		}
		let isCancelled = false;
		const params = new window.URLSearchParams( { id: layoutId } );
		meta.categories.forEach( ( id ) =>
			params.append( 'categories[]', id )
		);
		meta.products.forEach( ( id ) => params.append( 'products[]', id ) );
		( meta.exclude || [] ).forEach( ( id ) =>
			params.append( 'exclude[]', id )
		);
		// Picks come in bursts while the assign drawer is open.
		const timer = setTimeout(
			async () => {
				let next = [];
				try {
					const response = await apiFetch( {
						path: `/wcgs/v1/layouts/preview-products?${ params.toString() }`,
					} );
					next = response.groups || [];
				} catch ( error ) {
					next = [];
				}
				if ( ! isCancelled ) {
					setGroups( next );
				}
			},
			null === groups ? 0 : 300
		);
		return () => {
			isCancelled = true;
			clearTimeout( timer );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `key` holds the assignment.
	}, [ key ] );

	return groups;
};

export default useLayoutProducts;
