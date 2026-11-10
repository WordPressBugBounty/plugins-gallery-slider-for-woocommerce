import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import ConfirmDialog from '../settings/ConfirmDialog';
import SplitView from './SplitView';
import LivePreview from './LivePreview';

/**
 * Global Settings header tab: the live product page preview in the main
 * area, with the settings panel and icon sidebar of the split view. Leaving
 * with unsaved panel changes asks first.
 */
const GlobalSettingsPage = () => {
	const { changeCount, leaveTarget } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			changeCount: store.getGlobalChangeCount(),
			leaveTarget: store.getLeaveTarget(),
		};
	}, [] );
	const { resolveLeave } = useDispatch( STORE_NAME );

	// Warn before the browser leaves the page with unsaved changes.
	useEffect( () => {
		if ( ! changeCount ) {
			return;
		}
		const onBeforeUnload = ( event ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () =>
			window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ changeCount ] );

	return (
		<>
			<SplitView>
				<LivePreview />
			</SplitView>
			{ leaveTarget && (
				<ConfirmDialog
					title={ __(
						'Save your changes?',
						'gallery-slider-for-woocommerce'
					) }
					message={ sprintf(
						/* translators: %s: "3 unsaved changes". */
						__(
							'You have %s in Global Settings. Save them before leaving, or discard them.',
							'gallery-slider-for-woocommerce'
						),
						sprintf(
							/* translators: %d: number of unsaved changes. */
							_n(
								'%d unsaved change',
								'%d unsaved changes',
								changeCount,
								'gallery-slider-for-woocommerce'
							),
							changeCount
						)
					) }
					confirmLabel={ __(
						'Save & Leave',
						'gallery-slider-for-woocommerce'
					) }
					secondaryLabel={ __(
						'Discard',
						'gallery-slider-for-woocommerce'
					) }
					onCancel={ () => resolveLeave( 'cancel' ) }
					onSecondary={ () => resolveLeave( 'discard' ) }
					onConfirm={ () => resolveLeave( 'save' ) }
				/>
			) }
		</>
	);
};

export default GlobalSettingsPage;
