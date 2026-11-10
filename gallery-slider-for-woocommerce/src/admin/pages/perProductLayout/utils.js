import { __, _n, sprintf } from '@wordpress/i18n';
import { GALLERY_LAYOUTS } from '../../components';

/**
 * Helpers of the Per-Product Layouts tab: how a layout's assignment is
 * described, counted and labelled.
 */

/**
 * Display name of a `gallery_layout` value.
 *
 * @param {string} key Layout key.
 * @return {string} Label, or "Custom" for an unknown key.
 */
export const layoutLabel = ( key ) =>
	GALLERY_LAYOUTS.find( ( option ) => option.value === key )?.label ||
	__( 'Custom', 'gallery-slider-for-woocommerce' );

/**
 * Whether a layout (or an editor's meta) has an assignment: categories,
 * products or exclusions, as the design counts them.
 *
 * @param {Object} layout `{ categories, products, exclude? }`.
 * @return {boolean} True when assigned.
 */
export const hasAssignment = ( layout ) =>
	layout.categories.length > 0 ||
	layout.products.length > 0 ||
	( layout.exclude || [] ).length > 0;

/**
 * Map the category tree by ID.
 *
 * @param {Array} categories Category tree from the REST API.
 * @return {Object} `{ id: category }`.
 */
export const indexCategories = ( categories ) => {
	const byId = {};
	categories.forEach( ( category ) => {
		byId[ category.value ] = category;
	} );
	return byId;
};

/**
 * Rough number of products a layout applies to: the products of its
 * categories plus the products picked one by one, less the excluded ones.
 * Overlaps are not removed, like the "≈ N products" of the design.
 *
 * @param {Object} layout         `{ categories, products, exclude? }`.
 * @param {Object} categoriesById Category tree by ID.
 * @return {number} Product count.
 */
export const affectedCount = ( layout, categoriesById ) => {
	const fromCategories = layout.categories.reduce(
		( sum, id ) => sum + ( categoriesById[ id ]?.count || 0 ),
		0
	);
	const picked = new Set( layout.products );
	return Math.max(
		0,
		fromCategories + picked.size - ( layout.exclude || [] ).length
	);
};

/**
 * Short text of an assignment for the editor's "Assign To" button.
 *
 * @param {Object} layout         `{ categories, products, exclude? }`.
 * @param {Object} categoriesById Category tree by ID.
 * @return {string} e.g. "Shoes, 3 products" or "Not assigned yet".
 */
export const assignmentSummary = ( layout, categoriesById ) => {
	const parts = [];
	if ( 1 === layout.categories.length ) {
		parts.push(
			categoriesById[ layout.categories[ 0 ] ]?.label ||
				__( '1 category', 'gallery-slider-for-woocommerce' )
		);
	} else if ( layout.categories.length ) {
		parts.push(
			sprintf(
				/* translators: %d: number of categories. */
				__( '%d categories', 'gallery-slider-for-woocommerce' ),
				layout.categories.length
			)
		);
	}
	if ( layout.products.length ) {
		parts.push(
			sprintf(
				/* translators: %d: number of products. */
				_n(
					'%d product',
					'%d products',
					layout.products.length,
					'gallery-slider-for-woocommerce'
				),
				layout.products.length
			)
		);
	}
	const excluded = ( layout.exclude || [] ).length;
	if ( excluded ) {
		parts.push(
			sprintf(
				/* translators: %d: number of excluded products. */
				_n(
					'%d excluded',
					'%d excluded',
					excluded,
					'gallery-slider-for-woocommerce'
				),
				excluded
			)
		);
	}
	return parts.length
		? parts.join( ', ' )
		: __( 'Not assigned yet', 'gallery-slider-for-woocommerce' );
};

/**
 * Label of a product from the labels the REST API sent, or its ID.
 *
 * @param {number} id           Product ID.
 * @param {Object} productsById `{ id: { label, image } }`.
 * @return {string} Label.
 */
export const productLabel = ( id, productsById ) =>
	productsById[ id ]?.label || `#${ id }`;

/**
 * The "Assigned To" lines of a list row.
 *
 * @param {Object} layout         List item.
 * @param {Object} categoriesById Category tree by ID.
 * @param {Object} productsById   Product labels by ID.
 * @return {Array} `[ { key, prefix, names, muted } ]`, or one "Not assigned" line.
 */
export const assignmentLines = ( layout, categoriesById, productsById ) => {
	const lines = [];
	if ( layout.categories.length ) {
		lines.push( {
			key: 'categories',
			prefix: __( 'Categories:', 'gallery-slider-for-woocommerce' ),
			names: layout.categories.map(
				( id ) => categoriesById[ id ]?.label || `#${ id }`
			),
		} );
	}
	if ( layout.products.length ) {
		lines.push( {
			key: 'products',
			prefix: __( 'Products:', 'gallery-slider-for-woocommerce' ),
			names: layout.products.map( ( id ) =>
				productLabel( id, productsById )
			),
		} );
	}
	if ( ( layout.exclude || [] ).length ) {
		lines.push( {
			key: 'exclude',
			prefix: __( 'Excluded:', 'gallery-slider-for-woocommerce' ),
			names: layout.exclude.map( ( id ) =>
				productLabel( id, productsById )
			),
			muted: true,
		} );
	}
	return lines;
};
