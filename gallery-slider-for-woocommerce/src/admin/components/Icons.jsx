/**
 * Icons used by the settings controls (paths from the Reno settings design).
 */

export const DEVICE_ICON_PATHS = {
	desktop:
		'M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 20h8M12 16v4',
	tablet: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2',
	mobile: 'M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
};

export const DeviceIcon = ( {
	device = 'desktop',
	size = 14,
	strokeWidth = 1.7,
} ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d={ DEVICE_ICON_PATHS[ device ] || DEVICE_ICON_PATHS.desktop } />
	</svg>
);

export const ChevronDownIcon = ( { size = 16, strokeWidth = 1.1 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 12 12"
		fill="none"
		stroke="currentColor"
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M3 4.5 6 7.5l3-3" />
	</svg>
);

export const ResetIcon = ( { size = 12, strokeWidth = 2 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
		<path d="M3 3v5h5" />
	</svg>
);

export const InfoIcon = () => (
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="9.25" />
		<path d="M12 11v5.5" />
		<circle
			cx="12"
			cy="7.75"
			r="0.4"
			fill="currentColor"
			stroke="currentColor"
			strokeWidth="1.6"
		/>
	</svg>
);

export const SpinUpIcon = () => (
	<svg
		width="11"
		height="11"
		viewBox="0 0 10 10"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M2.5 6.25 5 3.75l2.5 2.5" />
	</svg>
);

export const SpinDownIcon = () => (
	<svg
		width="11"
		height="11"
		viewBox="0 0 10 10"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M2.5 3.75 5 6.25l2.5-2.5" />
	</svg>
);

export const CheckIcon = ( { size = 10, strokeWidth = 3.6 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="#fff"
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M5 12.5 10 17 19 7" />
	</svg>
);

export const LinkIcon = ( { linked = true } ) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path
			d={
				linked
					? 'M10 14a4 4 0 0 0 5.66 0l3.17-3.17a4 4 0 0 0-5.66-5.66l-1.1 1.1M14 10a4 4 0 0 0-5.66 0l-3.17 3.17a4 4 0 0 0 5.66 5.66l1.1-1.1'
					: 'M9 15l-1.5 1.5M15 9l1.5-1.5M18.8 13.2l1.1-1.1a5 5 0 0 0-7.07-7.07l-1.1 1.1M5.2 10.8l-1.1 1.1a5 5 0 0 0 7.07 7.07l1.1-1.1M4 4l3 3M20 20l-3-3'
			}
		/>
	</svg>
);

// The design's 24-unit X, for the drawers (thinner than `CloseIcon` at the same size).
export const CrossIcon = ( { size = 14, strokeWidth = 2 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		aria-hidden="true"
	>
		<path d="M6 6l12 12M18 6 6 18" />
	</svg>
);

export const CloseIcon = ( { size = 10 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 10 10"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		aria-hidden="true"
	>
		<path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
	</svg>
);

export const SearchIcon = ( { size = 14 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.5-3.5" />
	</svg>
);

export const UploadIcon = ( { size = 22 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.6"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
	</svg>
);

export const ChangelogIcon = ( { size = 12 } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M3 12a9 9 0 1 0 3-6.7" />
		<path d="M3 4v5h5" />
		<path d="M12 8v4.5l3 2" />
	</svg>
);
