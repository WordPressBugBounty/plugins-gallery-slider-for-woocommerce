import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { STORE_NAME } from '../../store/constants';
import VideoModal from './VideoModal';

// "How to Create Custom Gallery Layouts for Specific Products and
// Categories" on the ShapedPlugin YouTube channel.
const LAYOUTS_VIDEO_ID = 'KyMQLePpPTc';

const PlayIcon = () => (
	<svg
		className="wcgs-layouts-empty__video-icon"
		width="46"
		height="46"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth=".75"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="9.5" />
		<path d="M10 8.6v6.8l5.4-3.4z" fill="currentColor" />
	</svg>
);

/**
 * What the Per-Product Layouts tab shows before the first layout exists:
 * the design's hero with "Create New Layout", "Watch Video" (the layouts
 * tutorial in a modal) and an illustration of products pointing at their
 * layouts.
 *
 * @param {Object}   props
 * @param {Function} props.onCreate Opens the editor on a new layout.
 */
const EmptyState = ( { onCreate } ) => {
	const [ isVideoOpen, setVideoOpen ] = useState( false );
	const pluginUrl = useSelect(
		( select ) => select( STORE_NAME ).getDashboardInfo().pluginUrl || '',
		[]
	);

	return (
		<div className="wcgs-layouts-empty sp-d-flex sp-flex-wrap">
			<div className="wcgs-layouts-empty__text sp-d-flex sp-flex-col sp-justify-center sp-gap-14px">
				<h2>
					{ __(
						'Create Different Galleries for Different Products',
						'gallery-slider-for-woocommerce'
					) }
				</h2>
				<p>
					{ __(
						'Give specific products or categories their own gallery style.',
						'gallery-slider-for-woocommerce'
					) }
					<br />
					{ __(
						'Everything else keeps your Global Settings.',
						'gallery-slider-for-woocommerce'
					) }
				</p>
				<div className="wcgs-layouts-empty__actions sp-d-flex sp-flex-wrap sp-gap-10px">
					<button
						type="button"
						className="wcgs-btn is-primary is-large"
						onClick={ onCreate }
					>
						{ __(
							'Create New Layout',
							'gallery-slider-for-woocommerce'
						) }
					</button>
					<button
						type="button"
						className="wcgs-layouts-empty__video sp-d-i-flex sp-align-center"
						onClick={ () => setVideoOpen( true ) }
						aria-haspopup="dialog"
						aria-label={ __(
							'Watch Video',
							'gallery-slider-for-woocommerce'
						) }
					>
						<PlayIcon />
						<span className="wcgs-layouts-empty__video-text">
							{ __(
								'Watch Video',
								'gallery-slider-for-woocommerce'
							) }
						</span>
					</button>
				</div>
			</div>
			<div
				className="wcgs-layouts-empty__art sp-d-flex sp-align-center"
				aria-hidden="true"
			>
				<img
					src={ `${ pluginUrl }admin/img/layouts-empty.webp` }
					alt=""
					width="840"
					height="589"
					decoding="async"
					draggable="false"
				/>
			</div>
			{ isVideoOpen && (
				<VideoModal
					videoId={ LAYOUTS_VIDEO_ID }
					title={ __(
						'How to Create Custom Gallery Layouts for Specific Products and Categories',
						'gallery-slider-for-woocommerce'
					) }
					onClose={ () => setVideoOpen( false ) }
				/>
			) }
		</div>
	);
};

export default EmptyState;
