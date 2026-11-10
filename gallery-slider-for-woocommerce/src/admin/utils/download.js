/**
 * Save data as a .json download.
 *
 * @param {Object} data     Data to save.
 * @param {string} filename File name.
 */
export const downloadJson = ( data, filename ) => {
	const url = window.URL.createObjectURL(
		new window.Blob( [ JSON.stringify( data, null, 2 ) ], {
			type: 'application/json',
		} )
	);
	const link = document.createElement( 'a' );
	link.href = url;
	link.download = filename;
	document.body.appendChild( link );
	link.click();
	link.remove();
	window.URL.revokeObjectURL( url );
};

/**
 * File name of an export, dated today.
 *
 * @param {string} what 'settings' or 'layouts'.
 * @return {string} File name.
 */
export const exportFilename = ( what ) =>
	`reno-gallery-${ what }-${ new Date().toISOString().slice( 0, 10 ) }.json`;
