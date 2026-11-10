/**
 * Small visuals the design draws next to some dropdown options, keyed by the
 * legacy option value. Kept as the design's inline CSS and turned into React
 * styles by `cssToStyle()`.
 */

/**
 * Pagination styles (`pagination_type`).
 * Each part is `[ css, text ]`, copied from the design.
 */
export const PAGINATION_VISUALS = {
	bullets: [
		[
			'display:block;flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#56606B;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#D5DCE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#D5DCE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#D5DCE1;',
			'',
		],
	],
	dynamic: [
		[
			'display:block;flex:0 0 auto;width:4px;height:4px;border-radius:50%;background:#D5DCE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:#D5DCE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:#56606B;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:#D5DCE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:4px;height:4px;border-radius:50%;background:#D5DCE1;',
			'',
		],
	],
	strokes: [
		[
			'display:block;flex:0 0 auto;width:14px;height:3px;border-radius:2px;background:#56606B;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:14px;height:3px;border-radius:2px;background:#D5DCE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:14px;height:3px;border-radius:2px;background:#D5DCE1;',
			'',
		],
	],
	numbers: [
		[
			'display:block;flex:0 0 auto;width:12px;height:12px;border-radius:50%;background:#56606B;color:#fff;font-size:8px;font-weight:700;line-height:12px;text-align:center;',
			'1',
		],
		[
			'display:block;flex:0 0 auto;width:12px;height:12px;border-radius:50%;background:#56606B;color:#fff;font-size:8px;font-weight:700;line-height:12px;text-align:center;',
			'2',
		],
		[
			'display:block;flex:0 0 auto;width:12px;height:12px;border-radius:50%;background:#56606B;color:#fff;font-size:8px;font-weight:700;line-height:12px;text-align:center;',
			'3',
		],
		[
			'display:block;flex:0 0 auto;width:12px;height:12px;border-radius:50%;background:#56606B;color:#fff;font-size:8px;font-weight:700;line-height:12px;text-align:center;',
			'4',
		],
	],
	progressbar: [
		[
			'display:block;flex:0 0 auto;width:52px;height:3px;border-radius:2px;background:linear-gradient(to right,#56606B 0 50%,#D5DCE1 50% 100%);',
			'',
		],
	],
	'dot-hopper': [
		[
			'display:block;flex:0 0 auto;width:9px;height:9px;box-sizing:border-box;border-radius:50%;border:1.2px solid #56606B;background:radial-gradient(circle,#56606B 0 2px,transparent 2.4px);',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:9px;height:9px;box-sizing:border-box;border-radius:50%;border:1.2px solid #56606B;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:9px;height:9px;box-sizing:border-box;border-radius:50%;border:1.2px solid #56606B;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:9px;height:9px;box-sizing:border-box;border-radius:50%;border:1.2px solid #56606B;',
			'',
		],
	],
	'expanding-dot': [
		[
			'display:block;flex:0 0 auto;width:50px;height:12px;border-radius:6px;background:linear-gradient(#56606B,#56606B) 6px 50%/14px 4px no-repeat,radial-gradient(circle,#A3ADB6 0 1.6px,transparent 2px) 23px 50%/5px 5px no-repeat,radial-gradient(circle,#A3ADB6 0 1.6px,transparent 2px) 30px 50%/5px 5px no-repeat,radial-gradient(circle,#A3ADB6 0 1.6px,transparent 2px) 37px 50%/5px 5px no-repeat,#E7ECEF;',
			'',
		],
	],
	fraction: [
		[
			'display:block;flex:0 0 auto;font-size:12px;font-weight:500;line-height:1;color:#56606B;font-variant-numeric:tabular-nums;',
			'‹',
		],
		[
			'display:block;flex:0 0 auto;font-size:11px;font-weight:500;line-height:1;color:#56606B;font-variant-numeric:tabular-nums;',
			'1/2',
		],
		[
			'display:block;flex:0 0 auto;font-size:12px;font-weight:500;line-height:1;color:#56606B;font-variant-numeric:tabular-nums;',
			'›',
		],
	],
};

/**
 * Thumbnails navigation styles (`thumbnailnavigation_style`).
 * Each part is `[ css, text ]`, copied from the design.
 */
export const THUMB_NAV_VISUALS = {
	outer: [
		[
			'display:block;flex:0 0 auto;width:5px;height:5px;box-sizing:border-box;border-top:1.6px solid #74757A;border-left:1.6px solid #74757A;transform:rotate(-45deg);position:relative;z-index:1;margin-right:-1px;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:5px;height:5px;box-sizing:border-box;border-top:1.6px solid #74757A;border-left:1.6px solid #74757A;transform:rotate(135deg);position:relative;z-index:1;margin-left:-1px;',
			'',
		],
	],
	inner_right: [
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:7px;height:7px;border-radius:1px;background:#74757A;color:#fff;font-size:8px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;margin-left:-12px;align-self:flex-start;margin-top:0;',
			'›',
		],
		[
			'display:block;flex:0 0 auto;width:7px;height:7px;border-radius:1px;background:#74757A;color:#fff;font-size:8px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;margin-left:-11px;align-self:flex-end;',
			'‹',
		],
	],
	inner: [
		[
			'display:block;flex:0 0 auto;width:5px;height:5px;box-sizing:border-box;border-top:1.6px solid #74757A;border-left:1.6px solid #74757A;transform:rotate(-45deg);position:relative;z-index:1;margin-right:-13px;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:5px;height:5px;box-sizing:border-box;border-top:1.6px solid #74757A;border-left:1.6px solid #74757A;transform:rotate(135deg);position:relative;z-index:1;margin-left:-13px;',
			'',
		],
	],
	custom: [
		[
			'display:block;flex:0 0 auto;width:6px;height:16px;background:rgba(80,82,88,.6);color:#fff;font-size:8px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;margin-right:-10px;border-radius:2px 0 0 2px;',
			'‹',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:16px;height:16px;border-radius:2px;background:#DCDDE1;',
			'',
		],
		[
			'display:block;flex:0 0 auto;width:6px;height:16px;background:rgba(80,82,88,.6);color:#fff;font-size:8px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;margin-left:-10px;border-radius:0 2px 2px 0;',
			'›',
		],
	],
};
