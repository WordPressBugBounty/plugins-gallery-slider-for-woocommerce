import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import { DoneMessage, Icon } from './controls';
import { SettingsIntro } from './SettingsRow';

/**
 * One source plugin: Migrate Now, progress, then the result (`migRows`).
 *
 * @param {Object} props
 * @param {Object} props.source `{ value, label, author }`.
 */
const MigrationRow = ( { source } ) => {
	// { status: 'idle'|'run'|'done'|'error', pct, products, message }.
	const [ state, setState ] = useState( { status: 'idle' } );
	const isMounted = useRef( true );
	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, [] );

	const start = async () => {
		let offset = 0;
		let products = 0;
		setState( { status: 'run', pct: 0 } );
		try {
			// Batches of 50 variable products until the server says it's done.
			for (;;) {
				const batch = await apiFetch( {
					path: '/wcgs/v1/settings/migrate',
					method: 'POST',
					data: { plugin: source.value, offset },
				} );
				if ( ! isMounted.current ) {
					return;
				}
				products += batch.products;
				offset = batch.nextOffset;
				if ( batch.done ) {
					break;
				}
				setState( {
					status: 'run',
					pct: Math.min(
						99,
						Math.round( ( offset / ( batch.total || 1 ) ) * 100 )
					),
				} );
			}
			setState( { status: 'done', products } );
		} catch ( error ) {
			if ( isMounted.current ) {
				setState( {
					status: 'error',
					message:
						error?.message ||
						__(
							'Migration failed.',
							'gallery-slider-for-woocommerce'
						),
				} );
			}
		}
	};

	return (
		<div className="wcgs-migration-row sp-d-flex sp-align-center sp-flex-wrap">
			<div className="wcgs-migration-row__name sp-flex-none">
				<div className="wcgs-migration-row__title">
					{ source.label }
				</div>
				<div className="wcgs-migration-row__author">
					{ sprintf(
						/* translators: %s: plugin author. */
						__( 'by %s', 'gallery-slider-for-woocommerce' ),
						source.author
					) }
				</div>
			</div>
			<div className="wcgs-migration-row__action sp-d-flex sp-align-center sp-flex-wrap sp-gap-12px">
				{ 'idle' === state.status && (
					<button
						type="button"
						className="wcgs-btn is-secondary is-small"
						onClick={ start }
					>
						<Icon size={ 14 } strokeWidth={ 1.9 }>
							<path d="M4 8h13l-3-3M20 16H7l3 3" />
						</Icon>
						{ __(
							'Migrate Now',
							'gallery-slider-for-woocommerce'
						) }
					</button>
				) }
				{ 'run' === state.status && (
					<div
						className="wcgs-migration-row__progress sp-d-flex sp-align-center sp-gap-10px"
						role="status"
					>
						<span className="wcgs-spinner is-muted sp-d-i-block" />
						<span>
							{ sprintf(
								/* translators: %d: percent done. */
								__(
									'Migrating… %d%%',
									'gallery-slider-for-woocommerce'
								),
								state.pct
							) }
						</span>
						<span className="wcgs-migration-row__bar">
							<span
								className="wcgs-migration-row__fill"
								style={ { width: `${ state.pct }%` } }
							/>
						</span>
					</div>
				) }
				{ ( 'done' === state.status || 'error' === state.status ) && (
					<div className="wcgs-migration-row__result sp-d-flex sp-align-center sp-flex-wrap sp-gap-10px">
						{ 'done' === state.status ? (
							<DoneMessage>
								{ sprintf(
									/* translators: %d: number of migrated products. */
									_n(
										'%d product migrated',
										'%d products migrated',
										state.products,
										'gallery-slider-for-woocommerce'
									),
									state.products
								) }
							</DoneMessage>
						) : (
							<span className="wcgs-error-text" role="alert">
								{ state.message }
							</span>
						) }
						<span className="wcgs-dot">·</span>
						<button
							type="button"
							className="wcgs-link-button"
							onClick={ start }
						>
							{ __(
								'Run Again',
								'gallery-slider-for-woocommerce'
							) }
						</button>
					</div>
				) }
			</div>
		</div>
	);
};

/**
 * Migration sub-tab.
 */
const MigrationTab = () => {
	const sources = useSelect(
		( select ) => select( STORE_NAME ).getSettingsChoices().migrations,
		[]
	);

	return (
		<div>
			<SettingsIntro>
				{ __(
					'Bring your galleries from another plugin into Reno Product Gallery. Your original data stays untouched.',
					'gallery-slider-for-woocommerce'
				) }
			</SettingsIntro>
			<div className="sp-d-flex sp-flex-col">
				{ ( sources || [] ).map( ( source ) => (
					<MigrationRow key={ source.value } source={ source } />
				) ) }
			</div>
		</div>
	);
};

export default MigrationTab;
