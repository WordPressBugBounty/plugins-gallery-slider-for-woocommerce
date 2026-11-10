import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { MultiSelect } from '../../components';
import { downloadJson, exportFilename } from '../../utils/download';
import { layoutLimitContent } from '../../components/Pro';
import { DoneMessage, Icon, RadioList } from './controls';
import { SettingsHeading, SettingsRow } from './SettingsRow';

const EXPORT_OPTIONS = [
	{
		value: 'global_setting',
		label: __( 'Global Settings', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'all_layouts',
		label: __( 'All Product Layouts', 'gallery-slider-for-woocommerce' ),
	},
	{
		value: 'selected_layouts',
		label: __(
			'Specific Product Layouts',
			'gallery-slider-for-woocommerce'
		),
	},
];

const formatSize = ( bytes ) =>
	bytes < 1024
		? sprintf(
				/* translators: %d: file size in bytes. */
				__( '%d B', 'gallery-slider-for-woocommerce' ),
				bytes
		  )
		: sprintf(
				/* translators: %s: file size in kilobytes. */
				__( '%s KB', 'gallery-slider-for-woocommerce' ),
				Math.ceil( bytes / 1024 )
		  );

/**
 * Describe what an export file will change, or null when it isn't one.
 *
 * @param {Object} data Parsed file.
 * @return {Array|null} `[ { label, meta } ]` rows.
 */
const describeImport = ( data ) => {
	if ( ! data || 'object' !== typeof data ) {
		return null;
	}
	const layoutCount = Array.isArray( data.layout )
		? data.layout.filter( ( item ) => item && 'object' === typeof item )
				.length
		: 0;
	if ( layoutCount ) {
		// The free version imports the first layout of the file only.
		return [
			{
				label: __(
					'Per-Product Layouts',
					'gallery-slider-for-woocommerce'
				),
				meta:
					layoutCount > 1
						? sprintf(
								/* translators: %d: number of layouts in the file. */
								__(
									'1 new (the first of %d, the free version includes one layout)',
									'gallery-slider-for-woocommerce'
								),
								layoutCount
						  )
						: __( '1 new', 'gallery-slider-for-woocommerce' ),
			},
		];
	}
	if ( data.global_settings && 'object' === typeof data.global_settings ) {
		const count = Object.keys( data.global_settings ).filter(
			( key ) => key && 'license_key' !== key
		).length;
		return [
			{
				label: __(
					'Global Settings',
					'gallery-slider-for-woocommerce'
				),
				meta: sprintf(
					/* translators: %d: number of settings. */
					_n(
						'%d setting updated',
						'%d settings updated',
						count,
						'gallery-slider-for-woocommerce'
					),
					count
				),
			},
		];
	}
	return null;
};

/**
 * Export part of the Import & Export sub-tab.
 */
const ExportSection = () => {
	const { layouts, exportDefaults } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			layouts: store.getSettingsChoices().layouts || [],
			exportDefaults: store.getSettingsExport(),
		};
	}, [] );
	const [ what, setWhat ] = useState( exportDefaults.what || 'all_layouts' );
	const [ picked, setPicked ] = useState( exportDefaults.layouts || [] );
	const [ status, setStatus ] = useState( null );
	const [ isBusy, setBusy ] = useState( false );

	const isSelected = 'selected_layouts' === what;
	const isDisabled = isBusy || ( isSelected && ! picked.length );

	const doExport = async () => {
		setBusy( true );
		setStatus( null );
		try {
			const data = await apiFetch( {
				path: '/wcgs/v1/settings/export',
				method: 'POST',
				data: { what, layouts: picked },
			} );
			const filename = exportFilename(
				'global_setting' === what ? 'settings' : 'layouts'
			);
			downloadJson( data, filename );
			setStatus( {
				type: 'success',
				message: sprintf(
					/* translators: %s: file name. */
					__( 'Downloaded %s', 'gallery-slider-for-woocommerce' ),
					filename
				),
			} );
		} catch ( error ) {
			setStatus( {
				type: 'error',
				message:
					error?.message ||
					__( 'Export failed.', 'gallery-slider-for-woocommerce' ),
			} );
		}
		setBusy( false );
	};

	return (
		<>
			<SettingsHeading>
				{ __( 'Export', 'gallery-slider-for-woocommerce' ) }
			</SettingsHeading>
			<SettingsRow
				label={ __(
					'What to Export',
					'gallery-slider-for-woocommerce'
				) }
				tip={ __(
					'Choose which parts of your setup go into the file. Product media like videos stay with each product and aren’t exported.',
					'gallery-slider-for-woocommerce'
				) }
				top={ 0 }
			>
				<div className="wcgs-settings-field sp-d-flex sp-flex-col sp-gap-12px">
					<RadioList
						value={ what }
						onChange={ ( next ) => {
							setWhat( next );
							setStatus( null );
						} }
						options={ EXPORT_OPTIONS }
						label={ __(
							'What to Export',
							'gallery-slider-for-woocommerce'
						) }
					/>
					{ isSelected && (
						<div className="wcgs-settings-reveal">
							<MultiSelect
								attributes={ picked }
								onChange={ ( next ) => {
									setPicked( next );
									setStatus( null );
								} }
								options={ layouts }
								searchable={ layouts.length > 8 }
								placeholder={ __(
									'Select layouts',
									'gallery-slider-for-woocommerce'
								) }
								note={
									layouts.length
										? ''
										: __(
												'There are no layouts yet.',
												'gallery-slider-for-woocommerce'
										  )
								}
							/>
						</div>
					) }
				</div>
			</SettingsRow>
			<SettingsRow label="" top={ 0 }>
				<div className="sp-d-flex sp-align-center sp-flex-wrap sp-gap-12px">
					<button
						type="button"
						className="wcgs-btn is-secondary"
						onClick={ doExport }
						aria-disabled={ isDisabled }
						disabled={ isDisabled }
					>
						<Icon size={ 15 } strokeWidth={ 1.9 }>
							<path d="M12 4v11M7 10l5 5 5-5M4 20h16" />
						</Icon>
						{ __(
							'Export as JSON',
							'gallery-slider-for-woocommerce'
						) }
					</button>
					{ status &&
						( 'success' === status.type ? (
							<DoneMessage>{ status.message }</DoneMessage>
						) : (
							<span className="wcgs-error-text" role="alert">
								{ status.message }
							</span>
						) ) }
				</div>
			</SettingsRow>
		</>
	);
};

/**
 * Import part of the Import & Export sub-tab.
 */
const ImportSection = () => {
	const {
		fetchSettings,
		fetchDashboard,
		fetchGlobalSettings,
		fetchLayouts,
		setProPrompt,
	} = useDispatch( STORE_NAME );
	const inputRef = useRef();
	// { name, size, data, rows } of the picked file.
	const [ file, setFile ] = useState( null );
	const [ isDragging, setDragging ] = useState( false );
	const [ status, setStatus ] = useState( null );
	const [ isBusy, setBusy ] = useState( false );

	const resetInput = () => {
		if ( inputRef.current ) {
			inputRef.current.value = '';
		}
	};

	const readFile = ( picked ) => {
		setStatus( null );
		if ( ! picked ) {
			return;
		}
		const fail = ( message ) => {
			setFile( null );
			resetInput();
			setStatus( { type: 'error', message } );
		};
		picked
			.text()
			.then( ( text ) => {
				let data = null;
				try {
					data = JSON.parse( text );
				} catch ( error ) {
					data = null;
				}
				const rows = describeImport( data );
				if ( ! rows ) {
					fail(
						__(
							'This file is not a Reno Product Gallery export.',
							'gallery-slider-for-woocommerce'
						)
					);
					return;
				}
				setFile( { name: picked.name, size: picked.size, data, rows } );
			} )
			.catch( () =>
				fail(
					__(
						'The file could not be read.',
						'gallery-slider-for-woocommerce'
					)
				)
			);
	};

	const clearFile = () => {
		setFile( null );
		setStatus( null );
		resetInput();
	};

	const doImport = async () => {
		setBusy( true );
		setStatus( null );
		try {
			const response = await apiFetch( {
				path: '/wcgs/v1/settings/import',
				method: 'POST',
				data: { data: file.data },
			} );
			setStatus( { type: 'success', message: response.message } );
			// Imported settings and layouts change the values, layout list and stats.
			fetchSettings();
			fetchDashboard();
			// Reload what the other tabs show, so they don't keep the old values.
			if ( 'global_settings' === response.imported ) {
				fetchGlobalSettings();
			} else if ( 'layouts' === response.imported ) {
				fetchLayouts();
			}
		} catch ( error ) {
			setStatus( {
				type: 'error',
				message:
					error?.message ||
					__( 'Import failed.', 'gallery-slider-for-woocommerce' ),
			} );
			// The free plugin keeps one layout: offer Pro for more.
			if ( 'wcgs_layout_limit' === error?.code ) {
				setProPrompt( layoutLimitContent() );
			}
		}
		setBusy( false );
	};

	const isDone = 'success' === status?.type;

	return (
		<>
			<SettingsHeading>
				{ __( 'Import', 'gallery-slider-for-woocommerce' ) }
			</SettingsHeading>
			<SettingsRow
				label={ __( 'Import File', 'gallery-slider-for-woocommerce' ) }
				tip={ __(
					'Use a .json file exported from Reno Product Gallery. You’ll see what changes before anything is imported.',
					'gallery-slider-for-woocommerce'
				) }
				top={ 10 }
			>
				<div className="wcgs-settings-field sp-d-flex sp-flex-col sp-gap-10px">
					<input
						ref={ inputRef }
						type="file"
						accept=".json,application/json"
						className="sp-d-hidden"
						onChange={ ( event ) =>
							readFile( event.target.files?.[ 0 ] )
						}
					/>
					{ file ? (
						<div className="wcgs-import-file sp-d-flex sp-align-center sp-gap-10px">
							<Icon
								size={ 18 }
								strokeWidth={ 1.7 }
								stroke="#74757A"
							>
								<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
								<path d="M14 3v5h5" />
							</Icon>
							<span className="wcgs-import-file__name sp-flex-1 sp-min-w-0">
								{ file.name }
							</span>
							<span className="wcgs-import-file__size">
								{ formatSize( file.size ) }
							</span>
							<button
								type="button"
								className="wcgs-import-file__remove sp-flex-center"
								onClick={ clearFile }
								aria-label={ __(
									'Remove file',
									'gallery-slider-for-woocommerce'
								) }
								title={ __(
									'Remove file',
									'gallery-slider-for-woocommerce'
								) }
							>
								<Icon size={ 13 } strokeWidth={ 2.4 }>
									<path d="M6 6l12 12M18 6L6 18" />
								</Icon>
							</button>
						</div>
					) : (
						<button
							type="button"
							className={ `wcgs-dropzone sp-d-flex sp-flex-col sp-align-center sp-gap-6px sp-w-full${
								isDragging ? ' is-dragging' : ''
							}` }
							onClick={ () => inputRef.current?.click() }
							onDragOver={ ( event ) => {
								event.preventDefault();
								setDragging( true );
							} }
							onDragLeave={ () => setDragging( false ) }
							onDrop={ ( event ) => {
								event.preventDefault();
								setDragging( false );
								readFile( event.dataTransfer.files?.[ 0 ] );
							} }
						>
							<Icon
								size={ 22 }
								strokeWidth={ 1.7 }
								stroke="#74757A"
							>
								<path d="M12 15V4M7 9l5-5 5 5M4 20h16" />
							</Icon>
							<span className="wcgs-dropzone__title">
								{ __(
									'Drop a .json file here or',
									'gallery-slider-for-woocommerce'
								) }{ ' ' }
								<span className="wcgs-dropzone__browse">
									{ __(
										'browse',
										'gallery-slider-for-woocommerce'
									) }
								</span>
							</span>
							<span className="wcgs-dropzone__hint">
								{ __(
									'Only files exported from Reno Product Gallery',
									'gallery-slider-for-woocommerce'
								) }
							</span>
						</button>
					) }
					{ ! file && 'error' === status?.type && (
						<span className="wcgs-error-text" role="alert">
							{ status.message }
						</span>
					) }
				</div>
			</SettingsRow>
			{ file && (
				<div className="wcgs-settings-reveal">
					<SettingsRow
						label={ __(
							'What Will Change',
							'gallery-slider-for-woocommerce'
						) }
						tip={ __(
							'A preview of the file’s contents. Nothing changes until you click Import.',
							'gallery-slider-for-woocommerce'
						) }
						top={ 0 }
					>
						<div className="wcgs-settings-field wcgs-import-preview sp-d-flex sp-flex-col">
							{ file.rows.map( ( row ) => (
								<div
									key={ row.label }
									className="wcgs-import-preview__row sp-d-flex sp-justify-between sp-gap-12px"
								>
									<span>{ row.label }</span>
									<span className="wcgs-import-preview__meta">
										{ row.meta }
									</span>
								</div>
							) ) }
						</div>
					</SettingsRow>
					<SettingsRow label="" top={ 0 }>
						<div className="sp-d-flex sp-align-center sp-flex-wrap sp-gap-12px">
							<button
								type="button"
								className="wcgs-btn is-primary is-large"
								onClick={ doImport }
								disabled={ isBusy || isDone }
							>
								{ __(
									'Import Settings',
									'gallery-slider-for-woocommerce'
								) }
							</button>
							{ status &&
								( isDone ? (
									<DoneMessage>
										{ status.message }
									</DoneMessage>
								) : (
									<span
										className="wcgs-error-text"
										role="alert"
									>
										{ status.message }
									</span>
								) ) }
						</div>
					</SettingsRow>
				</div>
			) }
		</>
	);
};

/**
 * Import & Export sub-tab.
 */
const ImportExportTab = () => (
	<div>
		<ExportSection />
		<ImportSection />
	</div>
);

export default ImportExportTab;
