(function ($) {
	'use strict';
	// Translated strings from wcgs_object.wcgs_i18n (PHP __()), with the English text as fallback.
	const wcgsI18n = (key, fallback) => {
		const i18n = (typeof wcgs_object !== 'undefined' && wcgs_object.wcgs_i18n) || {};
		return i18n[key] || fallback;
	};
	// Fancybox `l10n` option: its toolbar, arrow and error labels in the site language.
	const lightboxL10n = () => {
		const l10n = wcgsI18n('fancybox', null);
		return l10n && 'object' === typeof l10n ? { l10n } : {};
	};
	// Accessible video iframe title, e.g. "Vimeo video" (wcgs_i18n.video_title is "%s video" translated).
	const videoTitle = (host) => wcgsI18n('video_title', '%s video').replace('%s', host);
	const escAttr = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	// Tablet and mobile values of the responsive settings (Woo_Gallery_Slider_Responsive).
	// wcgs_object.wcgs_settings arrives in the runtime shape: each setting's own key holds the
	// desktop value, and device_overrides holds what differs on tablets and phones (the max
	// widths come from wcgs_object.wcgs_breakpoints: 1024px and 767px). Mobile inherits tablet,
	// and a nested value (e.g. thumbnails_sliders_space) differs per sub key. The dynamic CSS has
	// the matching media queries; this covers what the gallery script reads. Without device
	// values it changes nothing.
	const isDeviceMap = (value) => !!value && 'object' === typeof value && !Array.isArray(value);
	const copySettings = (value) => JSON.parse(JSON.stringify(value));
	// Max width per device, largest first: Woo_Gallery_Slider_Responsive::devices().
	const deviceBreakpoints = () => {
		const localized = typeof wcgs_object !== 'undefined' && isDeviceMap(wcgs_object.wcgs_breakpoints) ? wcgs_object.wcgs_breakpoints : {};
		const widths = Object.assign({ tablet: 1024, mobile: 767 }, localized);
		return [['tablet', parseInt(widths.tablet, 10) || 1024], ['mobile', parseInt(widths.mobile, 10) || 767]];
	};
	const wcgsDevices = {
		breakpoints: deviceBreakpoints(),
		// Settings the gallery script reads (the rest are CSS only).
		scriptKeys: ['thumbnails_item_to_show', 'vertical_thumbs_width', 'thumbnails_sliders_space'],
		// The desktop values, kept by start() before the device's values go in.
		desktop: null,
		// scriptValues() per device; the desktop values never change after start().
		scriptCache: {},
		// One MediaQueryList per device, made on first use: [[device, list]].
		lists: null,
		// The callback of watch(), and whether the lists call it yet.
		onDeviceChange: null,
		watching: false,
		queries() {
			if (!this.lists) {
				this.lists = window.matchMedia ? this.breakpoints.map(([name, maxWidth]) => [name, window.matchMedia(`screen and (max-width: ${maxWidth}px)`)]) : [];
			}
			return this.lists;
		},
		// The device of the viewport, by the same queries as the CSS.
		current() {
			let device = 'desktop';
			this.queries().forEach(([name, list]) => {
				if (list.matches) {
					device = name;
				}
			});
			return device;
		},
		// Call onChange() when the viewport moves into another device's media query. The lists
		// only fire on a crossing, so nothing runs while a resize stays within one device. A later
		// call replaces the callback. Without device values there is nothing to watch.
		watch(onChange) {
			if (!this.desktop) {
				return;
			}
			this.onDeviceChange = onChange;
			if (this.watching) {
				return;
			}
			this.watching = true;
			const listener = () => this.onDeviceChange && this.onDeviceChange(this.current());
			this.queries().forEach(([, list]) => {
				if (list.addEventListener) {
					list.addEventListener('change', listener);
				} else if (list.addListener) {
					// Safari before 14.
					list.addListener(listener);
				}
			});
		},
		// The device values per device, largest first; non-objects (an empty PHP array) count as none.
		overrides(settings) {
			const all = settings && isDeviceMap(settings.device_overrides) ? settings.device_overrides : {};
			return this.breakpoints.map(([name]) => [name, isDeviceMap(all[name]) ? all[name] : {}]);
		},
		// Put a device's values into the settings, in place.
		apply(settings, device) {
			if ('desktop' === device) {
				return settings;
			}
			for (const [name, values] of this.overrides(settings)) {
				Object.keys(values).forEach((key) => {
					const value = values[key];
					if (Array.isArray(value) || (isDeviceMap(value) && !Object.keys(value).length)) {
						return;
					}
					if (isDeviceMap(value)) {
						settings[key] = Object.assign({}, isDeviceMap(settings[key]) ? settings[key] : {}, value);
					} else if (null !== value && undefined !== value && '' !== value) {
						settings[key] = value;
					}
				});
				if (name === device) {
					break;
				}
			}
			return settings;
		},
		// Keep the desktop values once, then put the viewport's device values into the settings
		// (in place, as the gallery script also rewrites them). Returns the device.
		start(settings) {
			if (!this.desktop && !this.overrides(settings).some(([, values]) => Object.keys(values).length)) {
				return 'desktop';
			}
			this.desktop = this.desktop || copySettings(settings);
			const device = this.current();
			this.apply(settings, device);
			return device;
		},
		// The settings the script reads, as one device sees them.
		scriptValues(device) {
			if (!(device in this.scriptCache)) {
				const values = this.apply(copySettings(this.desktop || {}), device);
				this.scriptCache[device] = JSON.stringify(this.scriptKeys.map((key) => values[key]));
			}
			return this.scriptCache[device];
		},
		// Whether the viewport now shows another device whose script-read values differ from the
		// ones the gallery started with, so it needs a fresh start.
		needsRestart(startDevice) {
			if (!this.desktop) {
				return false;
			}
			const device = this.current();
			return device !== startDevice && this.scriptValues(device) !== this.scriptValues(startDevice);
		},
	};

	// Field defaults (Woo_Gallery_Slider_Global_Settings_API) of the settings the script reads as
	// numbers or nested values: a fresh install or old saved data may lack them, and an empty PHP
	// array arrives as []. Nested values are filled per sub key. Product/engine.js has the same list.
	const settingDefaults = {
		gallery_layout: 'horizontal',
		gallery_width: 50,
		gallery_responsive_width: { width: 0, height: 720, height2: 480, unit: 'px' },
		thumbnails_item_to_show: 4,
		vertical_thumbs_width: 20,
		thumbnails_sliders_space: { width: 6, height: 6 },
		slide_orientation: 'horizontal',
		fade_slide: 'slide',
		autoplay_interval: 3000,
		autoplay_speed: 300,
		lightbox_icon: 'search',
		lightbox_icon_position: 'top_right',
		grayscale: 'gray_off',
	};
	// The settings with the defaults put in, in place (the script mutates them anyway).
	const withSettingDefaults = (settings) => {
		const values = isDeviceMap(settings) ? settings : {};
		Object.keys(settingDefaults).forEach((key) => {
			const fallback = settingDefaults[key];
			if (isDeviceMap(fallback)) {
				values[key] = Object.assign({}, fallback, isDeviceMap(values[key]) ? values[key] : {});
			} else if (undefined === values[key] || null === values[key] || '' === values[key]) {
				values[key] = fallback;
			}
		});
		return values;
	};
	class WooGallerySlider {
		constructor() {
			// Remove any existing event listeners before initializing.
			this.unbindAllEvents();
			// Cache DOM elements
			this.$gallery = $('#wpgs-gallery');
			this.$carousel = this.$gallery.find('.wcgs-carousel');
			this.$window = $(window);
			this.$document = $(document);
			this.players = new Map();
			this.settings = wcgs_object.wcgs_settings = withSettingDefaults(wcgs_object.wcgs_settings);
			this.device = wcgsDevices.start(this.settings);
			this.publicUrl = wcgs_object.wcgs_public_url;
			this.spswiperLoaded = false;
			this.videoJsLoaded = false;
			this.fancyLoaded = false;
			this.zoomLoaded = false;
			this.wcgsFancybox = null;
			this.lazyAttr = 'loading="lazy"';
			this.spswiper = {
				thumb: null,
				gallery: null
			};
			this.gallery_w = 100;
			this.state = {
				isMobileDevice: false,
				prevWindowWidth: 1200,
				slidesPerView: 1,
				slideSpaceBetween: 1,
				isHideThumbLayout: false,
				videoOnlyPopup: true,
				videoPresentation: 'in_gallery',
				isPreloader: false,
				iconPosition: 'top_right',
				lightboxIcon: 'search',
				// The video play icon sits in the middle of the slides.
				video_icon_position: 'middle',
				lastVariationActive: {},
			};
			this.setupInitialState();
			// Event handler storage.
			this.eventHandlers = {
				resize: null,
				scroll: null,
				click: null,
				variation: null
			};
			this.init();
		}
		init() {
			this.setupResponsiveLayout();
			const width = this.calculateGalleryWidth();
			this.setGalleryWidth(width);
			if (this.state.isPreloader) {
				this.initializePreloader();
			}
			// A variation restored by the browser builds (and starts) its own gallery.
			// The variation fields come from the theme and swatch plugins: whatever
			// they hold, the gallery still starts.
			let rebuilt = false;
			try {
				rebuilt = this.showRestoredVariation();
			} catch (error) {
				rebuilt = false;
			}
			if (!rebuilt) {
				this.initializeGallery();
			}

			this.bindEvents();
			if (this.state.isPreloader) {
				this.removePreloader();
			}
		}
		unbindAllEvents() {
			// Unbind all previous event listeners.
			$(document).off('click.wcgsGallery');
			$(window).off('resize.wcgsGallery scroll.wcgsGallery');
			$(document).off('change.wcgsVariation');
			$('.wcgs-carousel').off();
			$('.gallery-navigation-carousel-wrapper').off();
		}

		setupInitialState() {
			this.state.isHideThumbLayout = this.settings.gallery_layout == 'hide_thumb';
			this.state.videoOnlyPopup = this.settings.video_popup_place != 'inline';
			this.state.videoPresentation = this.getVideoPresentation();
			this.state.isPreloader = this.settings.preloader == '1';
			this.state.iconPosition = this.settings.lightbox_icon_position || 'top_right';
			const lightboxIcon = this.settings.lightbox_icon || 'search';
			this.state.lightboxIcon = this.getLightboxIcon(lightboxIcon);
			const windowWidth = $(window).width();
			this.state.isMobileDevice = windowWidth < 768;
			this.state.prevWindowWidth = windowWidth;
			this.lazyAttr = this.settings.wcgs_image_lazy_load && this.settings.wcgs_image_lazy_load == 'ondemand' ? 'loading="lazy"' : '';
		}
		getLightboxIcon = (icon) => {
			const iconMapping = {
				'search-plus': 'zoom-in-1',
			};
			return iconMapping[icon] || icon;
		};

		initializePreloader() {
			if (this.state.isPreloader) {
				if (!$('.wcgs-gallery-preloader').length) {
					this.$gallery.append(`<div class="wcgs-gallery-preloader"></div>`);
				}
				if (this.$gallery.find('.wcgs-gallery-preloader').length) {
					// Fade, Gray and Blur show the loading gallery under the spinner (CSS).
					if (this.$gallery.hasClass('wcgs_preloader_normal')) {
						$('#wpgs-gallery.wcgs-woocommerce-product-gallery .gallery-navigation-carousel-wrapper, #wpgs-gallery.wcgs-woocommerce-product-gallery .wcgs-carousel').css('visibility', 'hidden');
					}
					let slideHeight = this.getMaxImageHeight();
					$('.wcgs-gallery-preloader').css({
						'height': slideHeight
					});
				}
			}
		}
		initializeGallery() {
			this.setupResponsiveLayout();
			this.$gallery.find('.wcgs-carousel').wpgspimagesLoaded().then(() => {
				this.calculateGalleryHeights();
				this.initializeComponents();
			});
			if (!this.state.videoOnlyPopup) {
				this.checkYouTubeAPIReady();
			}
		}
		setupResponsiveLayout() {
			const wcgs_img_count = this.$gallery.find('.wcgs-carousel .wcgs-slider-image').length;
			if (wcgs_img_count == 1 || this.settings.gallery_layout == 'hide_thumb') {
				this.initializeHideThumbLayout();
				this.$gallery.find('.wcgs-carousel').css('width', '100%');
				if (wcgs_img_count == 1) {
					this.$gallery.find(".wcgs-spswiper-arrow").hide()
				} else {
					this.$gallery.find(".wcgs-spswiper-arrow").show();
				}
			} else {
				this.$gallery.find(".wcgs-spswiper-arrow").show();
				this.$gallery.find('.gallery-navigation-carousel, .gallery-navigation-carousel-wrapper').show();
			}
		}
		initializeComponents() {
			this.checkSPSwiperAPIReady();
			if (this.isZoomEnabled()) {
				this.checkZoomAPIReady();
			}
			this.checkFancyboxReady();
			this.initializeVideoFeatures();
			this.addGrayscale();
		}
		// The hover zoom runs on small screens (below 480px) only with "Zoom on Mobile".
		isZoomEnabled() {
			return this.settings.zoom == '1' && (this.settings.mobile_zoom == '1' || $(window).width() >= 480);
		}
		initializeSPSwiperScript() {
			const spswiperScriptId = 'wcgs-swiper-js';
			// Check if script is already added.
			if (!document.getElementById(spswiperScriptId)) {
				const tag = document.createElement('script');
				tag.src = this.publicUrl + 'js/swiper.min.js';
				tag.id = spswiperScriptId;
				tag.defer = true;
				const firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(tag, firstScript);
			}
		}

		checkSPSwiperAPIReady() {
			// Check if the spswiper is already loaded.
			if (typeof SPSwiper == 'function') {
				this.spswiperLoaded = true;
				this.initializeSliderGallery();
				return;
			}
			const checkInterval = setInterval(() => {
				this.initializeSPSwiperScript();
				if (typeof SPSwiper == 'function') {
					clearInterval(checkInterval);
					this.spswiperLoaded = true;
					this.initializeSliderGallery();
				}
			}, 300);
			// Prevent infinite checking.
			setTimeout(() => {
				clearInterval(checkInterval);
				if (!this.spswiperLoaded) {
					console.log('SPSwiper script failed to load');
				}
			}, 10000);
		}
		initializeSliderGallery() {
			this.initializeThumbnailSlider();
			this.initializeMainSlider();
			this.navigationArrowsVisibility();
			this.handleAutoplayEvents();
			this.AddLightboxIcon();
		}
		calculateGalleryWidth() {
			let gallery_w = this.settings.gallery_width;
			const windowWidth = $(window).width();
			const wcgs_product_wrapper = wcgs_object.wcgs_product_wrapper;
			let woocommerce_single_wrapper_width = $(wcgs_product_wrapper).width();
			let gallery_parent_product_width = this.$gallery.parent().width();
			let woocommerce_single_product_width = gallery_parent_product_width > woocommerce_single_wrapper_width ? woocommerce_single_wrapper_width : gallery_parent_product_width;
			var widthUnit = "%";
			// Special handling for Flatsome theme.
			if ($('body').hasClass('theme-flatsome')) {
				woocommerce_single_product_width = $('.single-product .product .row.content-row').width();
			}

			// Handle vertical/hide thumb layouts.
			if (this.settings.gallery_layout == 'vertical' ||
				this.settings.gallery_layout == 'vertical_right' ||
				this.settings.gallery_layout == 'hide_thumb' ||
				gallery_w > 100) {
				gallery_w = ((gallery_w * woocommerce_single_product_width) / 100);
				// Specific width in pixel for desktop.
				if (this.settings.gallery_width > 100) {
					gallery_w = this.settings.gallery_width;
				}
			}
			// Hestia theme support.
			if (this.$gallery.parents('.hestia-product-image-wrap').length) {
				const gallery_hestia_width = $('.wcgs-wcgs-woocommerce-product-gallery')
					.parents('.hestia-product-image-wrap')
					.width();
				if (typeof gallery_hestia_width == "number") {
					gallery_w = gallery_hestia_width;
				}
			}
			// Divi builder width issue.
			if ($('body').hasClass('et_divi_builder') || $('body').hasClass('theme-Divi')) {
				const gallery_divi_width = $('.et-db #et-boc .et-l .et_pb_row .et_pb_column:has(#wpgs-gallery)').width();
				if (typeof gallery_divi_width == "number") {
					gallery_w = gallery_divi_width;
				}
			}

			if (!$('#wpgs-gallery ~ .summary').length) {
				const gallery_width = $('#wpgs-gallery').parent('*').outerWidth();
				if (gallery_width && typeof gallery_width === "number") {
					gallery_w = gallery_width;
				}
			}

			// Responsive widths
			const responsiveWidth = this.settings.gallery_responsive_width || settingDefaults.gallery_responsive_width;
			if (windowWidth < 992) {
				if (responsiveWidth.width > 0) {
					gallery_w = responsiveWidth.width;
					widthUnit = responsiveWidth.unit;
				}
			}
			if (windowWidth < 768) {
				gallery_w = responsiveWidth.height;
				widthUnit = responsiveWidth.unit;
			}
			if (windowWidth < 480) {
				gallery_w = responsiveWidth.height2;
				widthUnit = responsiveWidth.unit;
			}
			if (widthUnit == 'em') {
				gallery_w = this.emToPx(gallery_w);
			}
			this.gallery_w = gallery_w;
			return gallery_w;
		}
		emToPx(em) {
			// Fallback methods
			var fontSize =
				document.documentElement.style.fontSize ||
				window.getComputedStyle(document.documentElement).fontSize ||
				'16px';
			return em * parseFloat(fontSize);
		}
		setGalleryWidth(width) {
			let widthUnit = '%';
			const isVerticalLayout = this.settings.gallery_layout == 'vertical' ||
				this.settings.gallery_layout == 'vertical_right';
			const needsPixelWidth = isVerticalLayout || this.settings.gallery_layout == 'hide_thumb' || width > 100;
			if (needsPixelWidth) {
				widthUnit = 'px';
				let currentGLWidth = this.$gallery.parent().outerWidth();
				width = currentGLWidth > width ? width : currentGLWidth;
				this.$gallery.css("max-width", '100%');
			}
			// Set gallery width.
			this.$gallery.css('minWidth', 'auto').css('width', width + widthUnit);

			const wcgs_img_count = this.$gallery.find('.wcgs-carousel .wcgs-slider-image').length;
			if (wcgs_img_count == 1 || this.settings.gallery_layout == 'hide_thumb') {
				this.initializeHideThumbLayout();
				this.$gallery.find('.wcgs-carousel').css('width', '100%');
				if (wcgs_img_count == 1) {
					this.$gallery.find(".wcgs-spswiper-arrow").hide()
				} else {
					this.$gallery.find(".wcgs-spswiper-arrow").show()
				}
			} else {
				this.$gallery.find('.gallery-navigation-carousel, .gallery-navigation-carousel-wrapper').show();
			}
			this.updateSummaryWidth(width, widthUnit);
		}
		updateSummaryWidth(galleryWidth, widthUnit) {
			let summaryWidth;
			if (widthUnit == '%') {
				summaryWidth = (100 - galleryWidth);
				summaryWidth = summaryWidth > 20 ? `calc(${summaryWidth}% - 50px)` : '';
			} else {
				const parentWrapper = $('#wpgs-gallery').parent('*');
				const parentWidth = parentWrapper.width();
				summaryWidth = this.calculateSummaryWidth(parentWidth, galleryWidth, widthUnit);
			}
			$('#wpgs-gallery ~ .summary').css('maxWidth', summaryWidth);
		}

		AddLightboxIcon() {
			if (this.settings.lightbox != '1') return;
			if (!$('#wpgs-gallery .wcgs-carousel > .wcgs-lightbox').length) {
				$('#wpgs-gallery .wcgs-carousel').prepend(`
				<button class="wcgs-lightbox grid-lightbox ${this.state.iconPosition}" aria-label="${escAttr(wcgsI18n('lightbox', 'Open lightbox'))}"><span class="sp-wgsp-icon-${this.state.lightboxIcon}"></span></button>`);
			}
		}
		calculateSummaryWidth(parentWidth, galleryWidth, widthUnit) {
			if (parentWidth > ($('#wpgs-gallery').width() + 100)) {
				const summaryWidth = parentWidth - galleryWidth;
				if (summaryWidth > 150) {
					return (summaryWidth - 50) + widthUnit;
				}
			}
			return '';
		}
		initializeHideThumbLayout() {
			// Set full width for the carousel when thumbnails are hidden.
			this.$gallery.find('.wcgs-carousel').css('width', '100%');
			// Hide the thumbnail navigation.
			this.$gallery.find('.gallery-navigation-carousel, .gallery-navigation-carousel-wrapper').hide();
		}
		calculateGalleryHeights() {
			const wcgs_img_count = this.$gallery.find('.gallery-navigation-carousel .wcgs-thumb').length;
			const vertical_thumbs_width = this.settings.vertical_thumbs_width || 20;
			let currentGLWidth = this.$gallery.parent().outerWidth();
			this.gallery_w = currentGLWidth > this.gallery_w ? this.gallery_w : currentGLWidth;
			const vertical_thumb_width = (this.gallery_w / 100) * vertical_thumbs_width;
			const thumbnails_space = (this.settings.thumbnails_sliders_space && this.settings.thumbnails_sliders_space.width) ? this.settings.thumbnails_sliders_space.width : 6;
			if (this.settings.gallery_layout == 'horizontal' || this.settings.gallery_layout == 'horizontal_top') {
				this.handleHorizontalLayout();
			} else if (this.settings.gallery_layout == 'hide_thumb') {
				this.$gallery.find('.wcgs-carousel').css('width', this.gallery_w);
			} else {
				this.handleVerticalLayout(wcgs_img_count, vertical_thumb_width, thumbnails_space);
				setTimeout(() => {
					this.handleVerticalLayout(wcgs_img_count, vertical_thumb_width, thumbnails_space);
				}, 600);
			}
		}

		handleHorizontalLayout() {
			if (this.settings.slide_orientation == 'vertical') {
				let maxHeight = this.getMaxImageHeight();
				// A vertical Swiper sizes slides from the container height; without one,
				// the container grows to all slides stacked and each slide gets that height.
				this.$gallery.find('.wcgs-carousel').css('height', maxHeight);
				this.$gallery.find('.wcgs-carousel .spswiper-slide').css('minHeight', maxHeight);
				this.$gallery.find('.wcgs-carousel .spswiper-slide').css({
					"display": "flex",
					"justify-content": "center",
					"align-items": "center",
				});
			}
		}

		handleVerticalLayout(wcgs_img_count, vertical_thumb_width, thumbnails_space) {
			if (wcgs_img_count <= 1) return;
			const vertical_gap = (this.settings.thumbnails_sliders_space && this.settings.thumbnails_sliders_space.height) ? this.settings.thumbnails_sliders_space.height : 6;
			let currentGLWidth = this.$gallery.parent().outerWidth();
			this.gallery_w = currentGLWidth > this.gallery_w ? this.gallery_w : currentGLWidth;
			// Set carousel width.
			this.$gallery.find('.wcgs-carousel.spswiper').css({
				'maxWidth': this.gallery_w - vertical_thumb_width - vertical_gap,
				'width': this.gallery_w - vertical_thumb_width - vertical_gap
			});
			let maxHeight = 'auto';
			// Calculate and set heights.
			maxHeight = this.getMaxImageHeight();
			if (this.settings.slide_orientation == 'vertical') {
				this.$gallery.find('.wcgs-carousel .spswiper-slide, .wcgs-carousel')
					.css('minHeight', maxHeight);
			}
			// Set navigation wrapper styles.
			this.$gallery.find('.gallery-navigation-carousel-wrapper').css({
				'width': vertical_thumb_width,
				'maxHeight': maxHeight
			});

			// Center the images vertically (the images are never hard-cropped).
			$('.wcgs-carousel').addClass('vertically-center');
			// Set slide height.
			this.$gallery.find('.wcgs-carousel .spswiper-slide, .wcgs-carousel').css('height', maxHeight);
		}

		getMaxImageHeight() {
			let maxHeight = 0;
			this.$gallery.find('.wcgs-carousel img').each(function () {
				// Check if height is set in attributes.
				if ($(this).attr('height') && $(this).attr('width')) {
					const attrWidth = parseInt($(this).attr('width'), 10);
					const attrHeight = parseInt($(this).attr('height'), 10);

					if (attrWidth && attrHeight) {
						const ratio = attrHeight / attrWidth;
						const actualWidth = $(this).width(); // Rendered width on screen.
						const estimatedHeight = actualWidth * ratio;
						if (estimatedHeight > maxHeight) {
							maxHeight = estimatedHeight;
						}
					}
				} else {
					if ($(this).innerHeight() > maxHeight) {
						maxHeight = $(this).innerHeight();
					}
				}
			});
			return maxHeight;
		}

		initializeYouTubeAPI() {
			const youtubeScriptId = 'youtube-api';
			if (!document.getElementById(youtubeScriptId)) {
				const tag = document.createElement('script');
				tag.src = 'https://www.youtube.com/iframe_api';
				tag.id = youtubeScriptId;
				const firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(tag, firstScript);
			}
		}

		checkYouTubeAPIReady() {
			const checkInterval = setInterval(() => {
				if (this.$gallery.find('.wcgs-slider-image .wcgs-youtube-video').length > 0) {
					this.initializeYouTubeAPI();
					if (typeof YT == 'object' && typeof YT.Player == 'function') {
						clearInterval(checkInterval);
						this.initializeVideos();
					}
				} else {
					this.initializeVideos();
					clearInterval(checkInterval);
				}
			}, 300);
			setTimeout(() => {
				clearInterval(checkInterval);
			}, 5000);
		}

		// Inline videos play on a click of their play icon.
		initializeVideos() {
			let youtubeIndex = 0;
			this.$gallery.find('.wcgs-carousel  .wcgs-slider-image .wcgs-video-icon-wrapper').each((index, iconWrapper) => {
				$(iconWrapper).closest('.wcgs-iframe-wrapper').find('img').css('visibility', 'visible');
				$(iconWrapper).on('click', (e) => {
					e.preventDefault();
					const videoWrapper = $(iconWrapper).closest('.wcgs-iframe-wrapper');
					const videoElement = videoWrapper.find('.wcgs-youtube-video');
					if (videoElement.length > 0 && typeof YT == 'object' && typeof YT.Player == 'function') {
						const videoId = videoElement.data('video-id');
						videoElement.addClass('initialized');
						$(iconWrapper).closest('.wcgs-iframe-wrapper').find('img').css('visibility', 'hidden');
						// Set unique ID reference using YouTube-specific index
						videoElement.attr('data-unique-id', youtubeIndex);
						const uniqueId = videoElement.attr('data-unique-id');
						// Increment YouTube index for next YouTube video
						youtubeIndex++;
						// Initialize YouTube player.
						let wcgs_player = new YT.Player(videoElement[0], {
							videoId: videoId,
							playerVars: this.getYouTubePlayerVars(),
							events: {
								'onReady': (event) => {
									// Auto play when ready
									event.target.playVideo();

									// Hide the play icon
									$(iconWrapper).fadeOut();
								},
								'onStateChange': (event) => {
									// Show play icon again if video ends or is paused
									if (event.data == YT.PlayerState.ENDED || event.data == YT.PlayerState.PAUSED) {
										$(iconWrapper).fadeIn();
									}
								}
							}
						});
						// Store player reference.
						const player_id = videoId + uniqueId;
						this.players.set(player_id, wcgs_player);
					} else {
						$(iconWrapper).closest('.wcgs-iframe-wrapper').find('img').css('visibility', 'hidden');
						const iframeData = videoWrapper.find('div.wcgs-iframe');
						if (iframeData.length > 0) {
							// Create an iframe element.
							const iframe = document.createElement('iframe');
							// Transfer data attributes to direct iframe attributes.
							iframe.className = iframeData.attr('class');
							iframe.src = iframeData.data('src');
							iframe.width = iframeData.data('width') || '100%';
							iframe.height = iframeData.data('height') || '100%';
							iframe.title = iframeData.data('title') || '';
							iframe.frameBorder = iframeData.data('frameborder') || '0';
							iframe.allow = iframeData.data('allow') || 'autoplay; fullscreen';
							iframe.allowFullscreen = true;
							// Replace the div with the iframe
							iframeData.replaceWith(iframe);
						}
					}
				});
			});
		}
		getYouTubePlayerVars() {
			return {
				controls: 1,
				modestbranding: 1,
				showinfo: 0,
				rel: 0,
				fs: 1
			};
		}

		stopVideosOnPreviousSlide($previousSlide) {
			// Handle YouTube videos specifically.
			const youtubeVideo = $previousSlide.find('.wcgs-youtube-video');
			if (youtubeVideo.length > 0) {
				const videoId = youtubeVideo.data('video-id');
				const uniqueId = youtubeVideo.attr('data-unique-id');
				const player = this.players.get(videoId + uniqueId);
				if (player && typeof player.pauseVideo == 'function') {
					player.pauseVideo();
				}
			} else {
				// Check if previous slide contains videos.
				const videos = $previousSlide.find('iframe, video');
				videos.each((index, video) => {
					if (video.tagName.toLowerCase() == 'video') {
						video.pause();
					} else if (video.tagName.toLowerCase() == 'iframe') {
						// Reset iframe source to stop video.
						const src = video.src;
						video.src = src;
					}
				});
			}
		}

		handleAutoplayEvents() {
			// Remove event listeners
			if (this.settings.autoplay == '1') {
				$(document).find('#wpgs-gallery').on({
					mouseenter: () => {
						if (this.spswiper.gallery && this.spswiper.gallery.autoplay) {
							this.spswiper.gallery.autoplay.stop();
						}
						if (this.spswiper.thumb && this.spswiper.thumb.autoplay && this.spswiper.thumb) {
							this.spswiper.thumb.autoplay.stop();
						}
					},
					mouseleave: () => {
						if (this.spswiper.gallery.autoplay && this.spswiper.gallery) {
							this.spswiper.gallery.autoplay.start();
						}
						if (this.spswiper.thumb && this.spswiper.thumb && this.spswiper.thumb.autoplay) {
							this.spswiper.thumb.autoplay.start();
						}
						this.handleMouseLeaveAutoplay();
					}
				});
			}
		}

		handleMouseLeaveAutoplay() {
			const xzoomElements = '.wcgs_xzoom-source';
			$(document).find(xzoomElements).on({
				mouseenter: () => {
					if (this.spswiper.gallery && this.spswiper.gallery.autoplay) {
						this.spswiper.gallery.autoplay.stop();
					}
					if (this.spswiper.thumb && this.spswiper.thumb.autoplay && this.spswiper.thumb) {
						this.spswiper.thumb.autoplay.stop();
					}
				},
				mouseleave: () => {
					if (this.spswiper.thumb && this.spswiper.gallery && this.spswiper.gallery.autoplay) {
						this.spswiper.gallery.autoplay.start();
					}
					if (this.spswiper.thumb && this.spswiper.thumb.autoplay) {
						this.spswiper.thumb.autoplay.start();
					}
				}
			});
		}

		initializeFancyboxScript() {
			const fancyboxScriptId = 'wcgs-fancybox-js';
			// Check if the Fancybox script is already added.
			if (!document.getElementById(fancyboxScriptId)) {
				const jsTag = document.createElement('script');
				jsTag.src = this.publicUrl + 'js/fancybox-bundle.min.js';
				jsTag.id = fancyboxScriptId;
				jsTag.defer = true;
				// Append to document.
				const firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(jsTag, firstScript);
			}
		}
		checkFancyboxReady() {
			if (typeof Fancybox != 'undefined') {
				this.fancyLoaded = true;
				this.initializeLightbox();
				return;
			}
			const checkInterval = setInterval(() => {
				this.initializeFancyboxScript();
				if (this.isStylesheetEnabled('enqueue_fancybox_css')) {
					this.loadNonCriticalCSS('css/fancybox.min.css');
				}
				if (typeof Fancybox != 'undefined') {
					clearInterval(checkInterval);
					this.fancyLoaded = true;
					this.initializeLightbox();
				}
			}, 700);
			setTimeout(() => {
				if (!this.fancyLoaded) {
					clearInterval(checkInterval);
				}
			}, 5000);
		}

		initializeLightbox() {
			if (typeof Fancybox == 'undefined') return;
			Fancybox.bind("[data-fancybox]", {
				...lightboxL10n(),
				// General options
				backdropClick: "close",         // ['close'|'iterate'|false] Close on backdrop click.
				mainClass: "wcgs-fancybox-wrapper",
				// Animation options.
				animated: true,                 // [true|false] Enable/disable animations
				hideClass: "f-fadeOut",         // Hide animation class
				showClass: "f-fadeIn",          // Show animation class
				animationDuration: 1000,         // Animation duration in ms
				// Toolbar options.
				Toolbar: {
					display: {
						left: this.settings.l_img_counter == '1' ? ["infobar"] : '',
						middle: [],
						right: this.getLightboxButtons(),
					}
				},
				Thumbs: false,
				// Carousel options
				Carousel: {
					Panzoom: {
						decelFriction: 0.5,
					},
					// Fancybox has no "no animation" transition: an unknown name never ends, so the previous
					// slide stays stacked under the new one. Jump to the page instead (friction 0 = instant).
					...('no_animation' === this.settings.lightbox_sliding_effect
						? { transition: false, friction: 0 }
						: { transition: this.settings.lightbox_sliding_effect }), // ['slide'|'crossfade'|'classic']
					transitionDuration: 1000,    // Transition duration in ms
				},
				// Image options
				Image: {
					zoom: true,                 // [true|false] Enable image zoom
					preload: 3,                 // Number of images to preload
					click: "toggleZoom",        // ['close'|'toggleZoom'|'next'|false]
					wheel: "zoom",              // ['zoom'|'slide'|'close'|false]
					imageProtection: true,      // [true|false] Disable right-click
				},
				Video: {
					autoplay: true,             // [true|false] Autoplay videos
					loop: true,                 // [true|false] Loop videos
					mute: true,                 // [true|false] Mute videos
					ratio: 16 / 9,              // Video aspect ratio
				},
				// Other options
				caption: (fancybox, slide) => {
					if (this.settings.lightbox_caption == '1') {
						// Fancybox renders the caption as HTML, and the browser has
						// already decoded data-caption: show it as text.
						return this.escapeHtml(slide.caption || '');
					}
					return '';
				},
				dragToClose: true, // [true|false] Enable drag-to-close
				// Events
				on: {
					reveal: () => {
						// Elementor's own lightbox would open over this one.
						$(".wcgs-fancybox-wrapper ~ .elementor-lightbox").remove();
					}
				}
			});

		}
		getLightboxButtons() {
			const buttons = [];
			if (this.settings.gallery_fs_btn === "1") buttons.push("fullscreen");
			buttons.push("close");
			return buttons;
		}
		initializeXzoomJSScript() {
			const xzoomJsScriptId = 'wcgs-xzoom-js';
			// Check if zoom.js script is already added.
			if (!document.getElementById(xzoomJsScriptId)) {
				// zoom.js JavaScript.
				const jsTag = document.createElement('script');
				jsTag.src = this.publicUrl + 'js/zoom.min.js';
				jsTag.id = xzoomJsScriptId;
				jsTag.defer = true;
				// Append to document
				const firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(jsTag, firstScript);

			}
		}
		// Grayscale.
		addGrayscale() {
			if (this.settings.grayscale && this.settings.grayscale !== 'gray_off') {
				let grayClass = this.settings.grayscale;
				$('.wcgs-slider-image img').addClass('' + grayClass + '');
			}
		}
		checkZoomAPIReady() {
			setTimeout(() => {
				const checkInterval = setInterval(() => {
					this.initializeXzoomJSScript();
					if (typeof $.fn.wcgs_xzoom == 'function') {
						clearInterval(checkInterval);
						this.zoomLoaded = true;
						this.initializeZoom();
					}
				}, 300);
				setTimeout(() => {
					if (!this.zoomLoaded) {
						clearInterval(checkInterval);
					}
				}, 5000);
			}, 100);

		}

		initializeZoom() {
			this.setupZoomEffect();
		}
		// The inside zoom: 1.5x for 'in_side', 2x for 'zoom_2x' (the zoom levels of 3.2.1).
		setupZoomEffect() {
			const level = 'zoom_2x' === this.settings.zoom_type ? 2 : 1.5;
			$('.wcgs_xzoom').each((index, element) => {
				const $image = $(element);
				if (!$image.data('wcgsZoomLevel')) {
					$image.data('wcgsZoomLevel', true);
					const full = new Image();
					full.src = $image.attr('xoriginal') || '';
					// Bound before xZoom's own mouseenter (which opens the zoom), so it runs first.
					$image.on('mouseenter.wcgsZoomLevel', () => {
						const zoom = $image.data('wcgs_xzoom');
						if (zoom && zoom.options) {
							zoom.options.defaultScale = zoomScale(full.naturalWidth, $image.width(), level);
						}
					});
				}
				$image.wcgs_xzoom({
					position: 'inside',
					defaultScale: 0,
					lensCollision: true,
					smoothZoomMove: 12,
					rootOutput: false,
				});
			});
		}

		areAllAttributesEmpty(variation) {
			for (let key in variation) {
				if (variation[key] && variation[key].trim() !== '') {
					return false; // If any attribute has a value, return false
				}
			}
			return true; // All attributes are empty
		}
		// The chosen attributes. With `rendered`, the ones the page was rendered
		// with: the options and radios marked selected in the markup (URL
		// attributes or the product's default ones), whatever the fields hold now.
		collectVariationData($variations_table, rendered = false) {
			let variationsArray = {};
			$variations_table.find('tr, .aux-dropdown').each((index, element) => {
				const $select = $(element).find('select');
				let attributeName = $select.data('attribute_name');
				let attributeValue = rendered ? $select.find('option').filter((i, option) => option.defaultSelected).first().val() || '' : $select.val();
				if ($(element).find('input[type=radio]').length > 0) {
					// If radio buttons are used.
					// Get the name and value of the selected radio button.
					const $radio = rendered ? $(element).find('input[type=radio]').filter((i, radio) => radio.defaultChecked).first() : $(element).find('input[type=radio]:checked');
					attributeName = $radio.attr('name');
					attributeValue = $radio.val();
				}

				// Only add to variationsArray if attributeName is not already present.
				if (attributeName && !(attributeName in variationsArray)) {
					variationsArray[attributeName] = attributeValue;
				}
			});
			if (this.areAllAttributesEmpty(variationsArray)) {
				return {};
			}
			return variationsArray;
		}

		initializeThumbnailSlider() {
			if (this.state.isHideThumbLayout) {
				return;
			}
			// Check if there are thumbnail items.
			const thumbnailItems = this.$gallery.find('.gallery-navigation-carousel:not(.spswiper-initialized) .wcgs-thumb').length;
			if (thumbnailItems == 0) return;
			const $swipeContainer = this.$gallery.find('.gallery-navigation-carousel.spswiper');
			// Get gallery layout and settings.
			const galleryLayout = (this.settings.gallery_layout == 'vertical' ||
				this.settings.gallery_layout == 'vertical_right') ? 'vertical' : 'horizontal';

			// Vertical thumbnails size themselves; horizontal ones show the set number.
			let thumbnailsItemToShow = parseInt(this.settings.thumbnails_item_to_show);
			var thumbnails_sliders_space = this.settings.thumbnails_sliders_space && typeof this.settings.thumbnails_sliders_space.width != 'undefined' ? this.settings.thumbnails_sliders_space.width : 6;
			if (galleryLayout == 'vertical') {
				thumbnailsItemToShow = 'auto';
			}
			// Initialize thumbnail spswiper.
			this.spswiper.thumb = new SPSwiper($swipeContainer[0], {
				slidesPerView: thumbnailsItemToShow,
				direction: galleryLayout,
				autoplay: this.getThumbAutoplaySettings(),
				speed: parseInt(this.settings.autoplay_speed),
				watchSlidesVisibility: true,
				watchSlidesProgress: true,
				autoHeight: false,
				watchOverflow: true,
				loop: this.settings.infinite_loop == '1',
				spaceBetween: parseInt(thumbnails_sliders_space),
				freeMode: this.settings.free_mode == '1',
				mousewheel: this.settings.mouse_wheel == '1',
				simulateTouch: true,
				a11y: this.getAccessibilitySettings(),
				on: {
					init: () => {
						setTimeout(() => {
							this.$gallery.removeClass('wcgs-spswiper-before-init');
						}, 400);
					},
				}
			});
			// Check and update arrow visibility.
			this.checkArrowsVisibility();

			// Setup the thumbnail line of the top line style.
			if (this.settings.thumbnail_style == 'top_line') {
				this.setupThumbnailBottomLine();
			}

		}

		getThumbAutoplaySettings() {
			if (this.settings.autoplay != '1') return false;
			return {
				delay: parseInt(this.settings.autoplay_interval) || 3000,
				pauseOnMouseEnter: false
			};
		}

		getAccessibilitySettings() {
			if (this.settings.accessibility != '1') return false;
			return {
				prevSlideMessage: wcgsI18n('prev_slide', 'Previous slide'),
				nextSlideMessage: wcgsI18n('next_slide', 'Next slide')
			};
		}

		checkArrowsVisibility() {
			if (this.spswiper.thumb) {
				const allowSlidePrev = this.spswiper.thumb.allowSlidePrev;
				const allowSlideNext = this.spswiper.thumb.allowSlideNext;
				const arrows = this.$gallery.find(".gallery-navigation-carousel-wrapper .wcgs-spswiper-arrow");
				if (allowSlidePrev || allowSlideNext) {
					arrows.show();
				} else {
					arrows.hide();
				}
			}
		}

		setupThumbnailBottomLine() {
			if (this.settings.gallery_layout == 'hide_thumb') {
				return;
			}
			setTimeout(() => {
				this.spswiper.thumb.on('sliderMove', () => {
					this.setThumbnailBorderPosition();
				});
				this.spswiper.gallery.on('slideChange', () => {
					setTimeout(() => {
						this.setThumbnailBorderPosition();
					}, 50);
				});
			}, 100);
			// Set initial line dimensions.
			setTimeout(() => {
				this.setThumbnailBorderPosition();

			}, 1000);
		}
		// Place the top line style's line on the active thumbnail.
		setThumbnailBorderPosition() {
			const isVertical = this.settings.gallery_layout == 'vertical' || this.settings.gallery_layout == 'vertical_right';
			const activeThumb = this.$gallery.find('.gallery-navigation-carousel-wrapper .wcgs-thumb.spswiper-slide-thumb-active');
			const activeThumbHeight = activeThumb.height();

			const activeThumbHeightTop = activeThumb.position().top !== undefined ? 10 + activeThumbHeight + activeThumb.position().top : 'auto';
			const activePosition = isVertical
				? (activeThumb.position() && activeThumb.position().top !== undefined ? activeThumb.position().top
					: -162) + this.spswiper.thumb.translate
				: (activeThumb.position() && activeThumb.position().left !== undefined ? activeThumb.position().left
					: -162) + this.spswiper.thumb.translate;
			const dimension = isVertical ? activeThumb.height() : activeThumb.width();

			const $border = this.$gallery.find('.gallery-navigation-carousel-wrapper .wcgs-border-bottom');
			$border.css(
				isVertical
					? { height: dimension, top: activePosition }
					: this.settings.gallery_layout === 'horizontal_top'
						? { width: dimension, left: activePosition, bottom: 0, top: 'auto' }
						: { width: dimension, left: activePosition, bottom: activeThumbHeightTop, top: 'auto' }
			);
		}
		isMatch(variation_attributes, attributes) {
			let match = true;
			for (let attr_name in variation_attributes) {
				if (variation_attributes.hasOwnProperty(attr_name)) {
					let val1 = variation_attributes[attr_name];
					let val2 = attributes[attr_name];
					if (val1 !== undefined && val2 !== undefined && val1.length !== 0 && val2.length !== 0 && val1 !== val2) {
						match = false;
					}
				}
			}
			return match;
		};
		findMatchingVariations(variations, attributes) {
			let matching = [];
			for (let i = 0; i < variations.length; i++) {
				let variation = variations[i];
				if ($.isEmptyObject(attributes)) {
					if ($.isEmptyObject(variation[0])) {
						const response = variation[1];
						if (response.length > 0) {
							$.merge(matching, response);
							return matching;
						}
					}
				} else if (this.isMatch(variation[0], attributes) && !$.isEmptyObject(variation[0])) {
					$.merge(matching, variation[1]);
				}
			}
			return matching;
		};

		// The variation galleries come with the page (wcgs_object.wcgs_data); without them
		// the gallery stays as it is.
		// Returns whether the gallery is rebuilt.
		updateGalleryBasedOnVariations(variationsArray, data) {
			if (JSON.stringify(this.state.lastVariationActive) === JSON.stringify(variationsArray)) {
				return false; // No change in variations.
			}
			let rendered = false;
			if (data.length > 0) {
				let variationsItems = this.findMatchingVariations(data, variationsArray);
				if (variationsItems.length > 0) {
					this.renderGallery(variationsItems);
					rendered = true;
				}
			}
			this.state.lastVariationActive = variationsArray;
			return rendered;
		}
		// On a reload the browser puts the shopper's last choice back into the
		// variation fields, with no change event, so the page can show the gallery
		// of another variation (or the product's) than the one chosen. Start from
		// the variation the page was rendered for and switch to the chosen one.
		// Returns whether the gallery is rebuilt.
		showRestoredVariation() {
			// The fields of this gallery's product (a page can hold other variation
			// forms, e.g. in a shortcode page or a sticky add-to-cart bar).
			let $variations_table = this.$gallery.closest('.product').find('.variations:not(.spswp-shop-variations)').first();
			if (!$variations_table.length) {
				$variations_table = $('.variations:not(.spswp-shop-variations)').first();
			}
			if (!$variations_table.length) {
				return false;
			}
			this.state.lastVariationActive = this.collectVariationData($variations_table, true);
			return this.updateGalleryBasedOnVariations(this.collectVariationData($variations_table), wcgs_object.wcgs_data || []);
		}
		// Video come last.
		sortByVideoLast(array) {
			return array.sort((a, b) => {
				if (a.video && !b.video) return 1;  // `a` with video comes last
				if (!a.video && b.video) return -1; // `b` with video comes last
				return 0;                           // Maintain order if both or neither have `video`
			});
		}
		// How the videos are shown, as WCGS_Public_Helper::video_presentation():
		// 'none' (video gallery off) or 'in_gallery'.
		getVideoPresentation() {
			const enabled = this.settings.video_gallery;
			if (undefined !== enabled && null !== enabled && (!enabled || '0' === enabled)) {
				return 'none';
			}
			return 'in_gallery';
		}
		// Without the video gallery, the video images show as plain images.
		applyVideoPresentation(items) {
			if ('in_gallery' === this.state.videoPresentation) {
				return items;
			}
			return items.map((item) => {
				if (!item || !item.video) {
					return item;
				}
				const { video, ...image } = item;
				return image;
			});
		}

		renderGallery(variationsItems) {
			variationsItems = this.uniqueMultidimensionalArray(variationsItems, 'full_url');
			variationsItems = this.applyVideoPresentation(variationsItems);
			// Videos are ordered only when they sit in the gallery.
			if ('in_gallery' === this.state.videoPresentation && this.settings.video_order && this.settings.video_order == 'video_come_last') {
				variationsItems = this.sortByVideoLast([...variationsItems]);
			}
			// Batch DOM manipulations.
			const galleryContainer = this.$gallery;
			const carouselWrapper = galleryContainer.find('.wcgs-carousel .spswiper-wrapper');
			const thumbnailWrapper = galleryContainer.find('.gallery-navigation-carousel .spswiper-wrapper');
			const spswiperPagination = galleryContainer.find('.wcgs-carousel  .spswiper-pagination');
			// Use document fragment for faster rendering
			const galleryFragment = document.createDocumentFragment();
			const thumbnailFragment = document.createDocumentFragment();

			variationsItems.forEach((item, index) => {
				if (!item) return;

				const galleryItemHTML = this.generateGalleryItemHTML(item, index);
				// Append to document fragments instead of direct DOM.
				galleryFragment.appendChild($(galleryItemHTML)[0]);
				if (!this.state.isHideThumbLayout) {
					thumbnailFragment.appendChild($(this.generateThumbnailItemHTML(item, index))[0]);
				}
			});
			// Append all items to the DOM.
			setTimeout(() => {
				this.$gallery.find('.wcgs-gallery-preloader').css('z-index', 999).css('opacity', 1);
				this.$gallery.find('.gallery-navigation-carousel-wrapper .wcgs-border-bottom').hide();
				this.$gallery.addClass('wcgs-transition-none');
				if (this.spswiper.gallery) {
					this.spswiper.gallery.destroy(true, true);
				}
				if (this.spswiper.thumb) {
					this.spswiper.thumb.destroy(true, true);
				}
				// Reset spswiper references.
				this.spswiper = {
					thumb: null,
					gallery: null
				};
				// Single DOM insertion.
				spswiperPagination.empty();
				carouselWrapper.empty().append(galleryFragment);
				thumbnailWrapper.empty().append(thumbnailFragment);
				this.players = new Map();
				this.initializeGallery();
				setTimeout(() => {
					const $preloader = $('.wcgs-gallery-preloader');
					$preloader.animate({
						opacity: 0
					}, 300, () => {
						$preloader.css('z-index', -99);
					});
					this.$gallery.removeClass('wcgs-transition-none');
					$('.gallery-navigation-carousel-wrapper .wcgs-border-bottom').show();
					if (this.settings.show_caption == '1') {
						this.$gallery.find('.wcgs-carousel .wcgs-slider-image').each(function () {
							let img_cap = $(this).find('img').data('cap');
							if (img_cap && !$(this).find('.wcgs-slider-image-caption').length) {
								$('<div class="wcgs-slider-image-caption"><span></span></div>').appendTo(this).find('span').text(img_cap);
							}
						});
					}
				}, 150);
			}, 200);
		}
		// Add a method to generate thumbnail HTML
		generateThumbnailItemHTML(item, index) {
			if (!item) return;
			let lazyAttr = this.lazyAttr;
			if (index < 2) {
				lazyAttr = '';
			}
			const altText = this.escapeAttribute(item.alt_text || '');
			const caption = this.escapeAttribute(item.cap || '');
			const videoType = item.hasOwnProperty('video') ? this.getVideoType(item.video) : null;
			return `<div class="wcgs-thumb spswiper-slide">
            <img alt="${altText}" data-cap="${caption}" src="${this.escapeAttribute(item.thumb_url)}" ${videoType ? `data-type="${videoType}"` : ''} ${lazyAttr}
            /> </div>`;
		}
		// Add this method to handle preloader removal.
		removePreloader() {
			if (this.state.isPreloader) {
				const $preloader = $('.wcgs-gallery-preloader');
				if ($preloader.length) {
					// Hold the preloader until the slider is laid out (it drops
					// wcgs-spswiper-before-init), so the preload style lasts as
					// long as the loading does. Give up after 10 s.
					const startedAt = Date.now();
					const checkInterval = setInterval(() => {
						if (this.$gallery.hasClass('wcgs-spswiper-before-init') && Date.now() - startedAt < 10000) {
							return;
						}
						clearInterval(checkInterval);
						$preloader.animate({
							opacity: 0
						}, 300, () => {
							$preloader.css('z-index', -99);
						});
						$('#wpgs-gallery.wcgs-woocommerce-product-gallery .wcgs-carousel, #wpgs-gallery.wcgs-woocommerce-product-gallery .gallery-navigation-carousel-wrapper').css('visibility', 'visible');
					}, 100);
				}
			}
		}
		initializeMainSlider() {
			const mainSliderSelector = '.wcgs-carousel.spswiper';
			const $mainSliderContainer = this.$gallery.find(mainSliderSelector);
			const $mainSliderSlides = $mainSliderContainer.find('.spswiper-slide');
			// Check if main slider container and slides exist.
			if ($mainSliderContainer.length == 0 || $mainSliderSlides.length == 0) {
				console.log('Main slider container or slides not found');
				return;
			}
			try {
				let adaptive_height = (this.settings.slider_height_type && this.settings.slider_height_type == 'adaptive') ? true : false;
				adaptive_height = this.settings.slide_orientation == 'vertical' ? true : adaptive_height;
				// Add navigation/pagination only when enabled. Passing undefined
				// would wipe Swiper's module defaults and crash the slider.
				const sliderConfig = {
					slidesPerView: this.state.slidesPerView,
					spaceBetween: this.state.slideSpaceBetween,
					lazyPreloadPrevNext: 0,
					autoHeight: adaptive_height,
					speed: parseInt(this.settings.autoplay_speed),
					direction: this.settings.slide_orientation,
					effect: this.settings.fade_slide,
					loop: this.settings.infinite_loop == '1',
					autoplay: this.getThumbAutoplaySettings(),
					mousewheel: this.settings.mouse_wheel == '1',
					thumbs: !this.state.isHideThumbLayout ? {
						spswiper: this.spswiper.thumb
					} : null,
					on: {
						init: () => this.handleMainSliderInit(),
						slideChange: () => this.handleMainSliderChange(),
						transitionEnd: () => this.sweepOrphanedZoomOverlays(),
						// loopFix's slideTo runs with runCallbacks=false, so only
						// this event covers its DOM moves.
						loopFix: () => this.sweepOrphanedZoomOverlays(),
					}
				};
				const sliderNavigation = this.getMainSliderNavigationSettings();
				if (sliderNavigation) {
					sliderConfig.navigation = sliderNavigation;
				}
				const sliderPagination = this.getMainSliderPaginationSettings();
				if (sliderPagination) {
					sliderConfig.pagination = sliderPagination;
				}
				// Initialize the main slider using SPSwiper.
				this.spswiper.gallery = new SPSwiper($mainSliderContainer[0], sliderConfig);
			} catch (error) {
				console.log('Error initializing main slider:', error);
			}
		}
		getMainSliderNavigationSettings() {
			// Undefined when disabled; the caller must omit the key entirely.
			if (!this.settings.navigation && !this.settings.thumbnailnavigation) return;
			return this.settings.navigation == '1' ? ({
				nextEl: ".wcgs-carousel .wcgs-spswiper-button-next",
				prevEl: ".wcgs-carousel .wcgs-spswiper-button-prev",
			}) : (this.settings.thumbnailnavigation == '1') ? ({
				nextEl: ".gallery-navigation-carousel .wcgs-spswiper-button-next",
				prevEl: ".gallery-navigation-carousel .wcgs-spswiper-button-prev",
			}) : undefined;
		}
		navigationArrowsVisibility() {
			var pagination_visibility = (this.settings.pagination_visibility == 'hover') ? true : false;
			if (pagination_visibility) {
				this.$gallery.find(".wcgs-carousel .spswiper-pagination").hide();
				this.$gallery.find(".wcgs-carousel").on({
					mouseenter: () => {
						this.$gallery.find(".wcgs-carousel .spswiper-pagination").show();
						this.refreshDynamicBullets();
					},
					mouseleave: () => {
						this.$gallery.find(".wcgs-carousel .spswiper-pagination").hide();
					}
				});
			}
			const navigation_visibility = (this.settings.navigation_visibility == 'hover') ? true : false;
			if (navigation_visibility && this.$gallery
				.find('.wcgs-carousel .spswiper-slide')
				.length > 1) {
				this.$gallery.find(".wcgs-carousel .wcgs-spswiper-arrow").hide();
				this.$gallery.find(".wcgs-carousel").on({
					mouseenter: () => this.$gallery.find(".wcgs-carousel .wcgs-spswiper-arrow").show(),
					mouseleave: () => this.$gallery.find(".wcgs-carousel .wcgs-spswiper-arrow").hide()
				});
			}
		}


		/**
		 * Re-measure dynamic bullets once the pagination is shown. Swiper sizes
		 * them from their rendered width, which is 0 while the hover-only
		 * pagination is hidden, and that leaves a single cut-off bullet.
		 *
		 * @since 4.0.0
		 */
		refreshDynamicBullets() {
			const gallery = this.spswiper.gallery;
			if (gallery && !gallery.destroyed && gallery.pagination && gallery.params.pagination && gallery.params.pagination.dynamicBullets) {
				gallery.pagination.update();
			}
		}

		getMainSliderPaginationSettings() {
			// Undefined when disabled; the caller must omit the key entirely.
			if (this.settings.pagination != '1') return;
			// Bullets, dynamic bullets or strokes (bullets styled as bars).
			const dynamicBullets = this.settings.pagination_type === 'dynamic';

			return {
				el: '.wcgs-carousel .spswiper-pagination',
				type: 'bullets',
				clickable: true,
				dynamicBullets: dynamicBullets,
				renderBullet: function (index, className) {
					return '<span class="' + className + '"><span class="number">' + (index + 1) + '</span></span>';
				},
			};
		}
		/**
		 * Remove zoom overlays orphaned on non-active slides. loopFix can move
		 * a slide mid-hover, swallowing the mouseleave that closes its zoom
		 * overlay, so the stale preview reappears as a veil over the image.
		 */
		sweepOrphanedZoomOverlays() {
			if (this.settings.zoom != '1') return;
			const orphanSelector = '.wcgs_xzoom-source, .wcgs_xzoom-preview, .zoom-tint, [class*="xzoom-caption"]';
			this.$gallery.find('.wcgs-carousel .spswiper-slide').each((index, slide) => {
				const $slide = $(slide);
				if ($slide.hasClass('spswiper-slide-active')) return;
				const $orphans = $slide.find(orphanSelector);
				if (!$orphans.length) return;
				// Prefer instance cleanup so the zoom closure state stays consistent.
				const zoomInstance = $slide.find('img.wcgs_xzoom').data('wcgs_xzoom');
				if (zoomInstance && typeof zoomInstance.closezoom === 'function') {
					zoomInstance.closezoom();
				}
				// Hard-remove anything still attached (also covers leftovers
				// without a reachable instance). Idempotent by construction.
				$slide.find(orphanSelector).remove();
			});
		}
		/**
		 * Clear any live text selection — dblclicks on the nav arrows can
		 * extend it across slides, painting a translucent veil over the images.
		 */
		clearGallerySelection() {
			if (window.getSelection && !window.getSelection().isCollapsed) {
				window.getSelection().removeAllRanges();
			}
		}
		handleMainSliderInit() {
			// Additional logic after the main slider is initialized, if necessary.
			if (this.settings.navigation) {
				// Debounced navigation handler.
				const debouncedNavigation = debounce((e) => {
					// Prevent multiple rapid clicks.
					if (this.navigationLock) return;

					this.navigationLock = true;

					this.clearGallerySelection();

					// Determine navigation direction.
					const isNext = $(e.currentTarget).hasClass('wcgs-spswiper-button-next');

					try {
						if (this.spswiper.gallery) {
							if (isNext) {
								this.spswiper.gallery.slideNext();
							} else {
								this.spswiper.gallery.slidePrev();
							}
						}
					} catch (error) {
						console.log('Navigation error:', error);
					} finally {
						// Reset lock after a short delay.
						setTimeout(() => {
							this.navigationLock = false;
						}, 300);
					}
				}, 10);
				// Remove existing handlers and attach new ones
				this.$gallery.find('.gallery-navigation-carousel .wcgs-spswiper-button-next, .gallery-navigation-carousel .wcgs-spswiper-button-prev')
					.off('click.wcgsNavigation')
					.on('click.wcgsNavigation', (e) => {
						e.preventDefault();
						e.stopPropagation();
						debouncedNavigation(e);
					});
			}
			setTimeout(() => {
				this.$gallery.removeClass('wcgs-spswiper-before-init');
			}, 400);
		}
		handleMainSliderChange() {
			// Run both cleanups synchronously at event time, before the
			// deferred work below.
			this.sweepOrphanedZoomOverlays();
			this.clearGallerySelection();
			// Stop the video of the slide left behind.
			setTimeout(() => {
				if (this.spswiper.gallery && Number.isInteger(this.spswiper.gallery.activeIndex)) {
					const currentSlide = this.spswiper.gallery.activeIndex;
					const previousIndex = this.spswiper.gallery.previousIndex ? this.spswiper.gallery.previousIndex : currentSlide - 1;
					const $previousSlide = this.$gallery.find('.wcgs-carousel .spswiper-slide').eq(previousIndex);
					// Stop videos on previous slide.
					this.stopVideosOnPreviousSlide($previousSlide);
					// Stop previous slide bunny video.
					this.stopBunnyVideo($previousSlide);
				}
			}, 500);
		}

		// Stop bunny video on previous slide.
		stopBunnyVideo($slide) {
			const iframe = $slide.find('iframe.wcgs-bunny-iframe')[0];
			if (!iframe) return;

			// Save original src if not already stored
			if (!iframe.dataset.originalSrc) {
				iframe.dataset.originalSrc = iframe.src;
			}

			// Reset src to original with autoplay=false
			const url = new URL(iframe.dataset.originalSrc);
			url.searchParams.set('autoplay', 'false'); // ensure autoplay off
			url.searchParams.set('mute', 'true');      // keep muted if needed
			iframe.src = url.toString();
		}

		uniqueMultidimensionalArray(arr, key) {
			let uniqueArray = [];
			let uniqueKeys = [];
			$.each(arr, function (index, item) {
				// Check if the key value is not already in the uniqueKeys array.
				if (key in item && $.inArray(item[key], uniqueKeys) === -1) {
					uniqueKeys.push(item[key]); // Add the key value to the uniqueKeys array.
					uniqueArray.push(item); // Add the entire item to the uniqueArray.
				}
			});
			return uniqueArray;
		}
		generateGalleryItemHTML(item, index) {
			let lazyAttr = this.lazyAttr;
			if (index < 2) {
				lazyAttr = '';
			}
			// Attribute values: a quote in a caption would break the markup.
			const caption = this.escapeAttribute(item.cap || '');
			const altText = this.escapeAttribute(item.alt_text || '');
			const imageUrl = this.escapeAttribute(item.url);
			const fullUrl = this.escapeAttribute(item.full_url);
			const videoCheck = item.hasOwnProperty('video') ? true : false;
			const lightbox_thumb = 'data-thumb="' + this.escapeAttribute(item.thumb_url) + '"';
			let videoHTML = '';
			let lightboxHTML = '';
			// The lightbox anchor opens the image, or a video card's video.
			let lightboxHref = fullUrl,
				lightboxType = '';
			let video_icon_type = '',
				dataVideoId = '',
				zoomData = `xoriginal="${fullUrl}"`,
				style = '',
				cardClass = '',
				cardAttributes = '';
			if (videoCheck) {
				let videoType = this.getVideoType(item.video);
				const video_data = this.generateVideoHTML(item, videoType);
				video_icon_type = `data-type="${videoType}"`
				dataVideoId = 'data-videoid="' + video_data[1] + '"';
				cardClass = ' video';
				const popup = this.getVideoPopupData(item.video);
				lightboxHref = this.escapeAttribute(popup.src);
				lightboxType = popup.type ? ` data-type="${popup.type}"` : '';
				if (!this.state.videoOnlyPopup) {
					videoHTML = video_data[0];
					style = ' style="visibility: hidden;"';
					videoHTML = `<div class="wcgs-iframe-wrapper ${this.state.video_icon_position}">${videoHTML}<img ${style} class="skip-lazy wcgs-slider-image-tag wcgs-lazyloaded" ${video_icon_type} alt="${altText}" data-cap="${caption}" src="${imageUrl}" ${dataVideoId} data-image="${imageUrl}" height="${item.imageHeight}" width="${item.imageWidth}" ${lazyAttr} /></div>`;
				} else {
					// No zoom on a video card (as in 3.x); with the lightbox off, the play icon opens the video on its own.
					cardAttributes = ` data-video-popup="${lightboxHref}" data-video-type="${popup.type}"`;
					videoHTML = `<div class="wcgs-video-icon-wrapper ${this.state.video_icon_position}"></div><img ${style} class="skip-lazy wcgs-slider-image-tag wcgs-lazyloaded" ${video_icon_type} alt="${altText}" data-cap="${caption}" src="${imageUrl}" ${dataVideoId} height="${item.imageHeight}" width="${item.imageWidth}" data-image="${imageUrl}" ${lazyAttr} />`;
				}
			} else {
				videoHTML = `<img ${style} class="skip-lazy wcgs-slider-image-tag wcgs_xzoom wcgs-lazyloaded" ${video_icon_type} alt="${altText}" data-cap="${caption}" src="${imageUrl}" ${dataVideoId} data-image="${imageUrl}" ${zoomData} ${lazyAttr} height="${item.imageHeight}" width="${item.imageWidth}" />`;
			}
			// On a video card the lightbox icon, the image and the play icon all open the video.
			if (this.settings.lightbox == '1') {
				lightboxHTML = `<a class="wcgs-slider-lightbox" data-caption="${caption}" aria-label="${escAttr(wcgsI18n('lightbox', 'Open lightbox'))}" href="${lightboxHref}" ${lightbox_thumb}${lightboxType} data-fancybox="view"><div class="wcgs-lightbox grid-lightbox ${this.state.iconPosition}"><span class="sp-wgsp-icon-${this.state.lightboxIcon}"></span></div></a>`;
			}
			return `<div class="spswiper-slide"><div class="wcgs-slider-image${cardClass}"${cardAttributes}>${lightboxHTML} ${videoHTML}</div></div>`;
		}
		// The popup of a video card: get_video_embed_link() and
		// get_video_popup_type() of product-images.php.
		getVideoPopupData(url) {
			const videoUrl = String(url || '');
			switch (this.getVideoType(videoUrl)) {
				case 'youtube':
					return { src: `https://www.youtube.com/embed/${this.extractYouTubeId(videoUrl)}`, type: '' };
				case 'dailymotion':
					return { src: this.generateDailymotionEmbedURL(videoUrl, ''), type: 'iframe' };
				case 'mediadelivery':
					return { src: videoUrl.replace('/play/', '/embed/'), type: 'iframe' };
				case 'facebook':
				case 'wistia':
				case 'sproutvideo':
					return { src: videoUrl, type: 'iframe' };
				default:
					return { src: videoUrl, type: '' };
			}
		}
		// Like esc_attr(): entities already in the value (get_the_title() gives
		// `&#8217;`, saved captions `&amp;`) are kept, not encoded twice.
		escapeAttribute(value) {
			return String(value ?? '').replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}
		// For text that is already decoded (a data-* attribute read by the
		// browser): every `&` is encoded, so `&lt;` shows as text, not a tag.
		escapeHtml(value) {
			return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
		}
		// With the lightbox off, the play icon of a popup video card opens its
		// video on its own. With it on, the card's lightbox anchor opens the video.
		openVideoPopup(card) {
			const src = card ? card.getAttribute('data-video-popup') : '';
			if (!src || typeof Fancybox == 'undefined') {
				return;
			}
			const item = { src, thumbSrc: $(card).find('.wcgs-slider-image-tag').attr('src') || '' };
			if (card.getAttribute('data-video-type')) {
				item.type = card.getAttribute('data-video-type');
			}
			Fancybox.show([item], {
				...lightboxL10n(),
				mainClass: 'wcgs-fancybox-wrapper wcgs-video-popup',
				backdropClick: 'close',
				dragToClose: true,
				Toolbar: {
					display: {
						left: [],
						middle: [],
						right: ['close'],
					}
				},
				Thumbs: false,
				Html: {
					videoAutoplay: true,
				},
			});
		}
		// Returns `fallback` when no video ID is found: the URL itself for the
		// inline iframe, '' for the popup link (PHP returns false there).
		generateDailymotionEmbedURL(url, fallback = url) {
			// Use regex to extract the video ID from the URL
			const matches = url.match(/(?:dailymotion\.com\/video\/|player\.html\?video=|embed\/video\/)([a-zA-Z0-9]+)/);
			if (matches) {
				const videoId = matches[1];
				return 'https://www.dailymotion.com/embed/video/' + videoId;
			}

			return fallback;
		}
		generateVideoHTML(item, videoType) {
			let videoHTML = '';
			let videoId = '';
			switch (videoType) {
				case 'youtube':
					videoId = this.extractYouTubeId(item.video);
					videoHTML = `<div class="wcgs-youtube-video skip-lazy wcgs-iframe" data-video-id="${videoId}"></div><div class="wcgs-video-icon-wrapper ${this.state.video_icon_position}"></div>`;
					break;
				case 'vimeo':
					videoId = this.extractVimeoId(item.video);
					if (videoId.includes('/')) {
						videoId = videoId.replace('/', '?h=');
					}
					videoHTML = `<iframe class="skip-lazy wcgs-iframe" title="${escAttr(videoTitle('Vimeo'))}" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
					break;
				case 'dailymotion':
					videoId = this.generateDailymotionEmbedURL(item.video);
					videoHTML = `<iframe class="skip-lazy wcgs-iframe" title="${escAttr(videoTitle('Dailymotion'))}" src="${videoId}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
					break;
				case 'facebook':
					videoId = item.video;
					videoHTML = `<iframe class="skip-lazy wcgs-iframe facebook-iframe" title="${escAttr(videoTitle('Facebook'))}" src="${item.video}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
					break;
				case 'wistia':
					videoId = item.video;
					videoHTML = `<iframe class="skip-lazy wcgs-iframe wistia-iframe" title="${escAttr(videoTitle('Wistia'))}" src="${item.video}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
					break;
				case 'sproutvideo':
					videoId = item.video;
					videoHTML = `<iframe class="skip-lazy wcgs-iframe sproutvideo-iframe" title="${escAttr(videoTitle('SproutVideo'))}" src="${item.video}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
					break;
				case 'mediadelivery':
					videoId = item.video;
					videoHTML = `<iframe class="skip-lazy wcgs-iframe wcgs-bunny-iframe" title="${escAttr(videoTitle('Bunny Stream'))}" src="${item.video}" frameborder="0" allow="fullscreen" allowfullscreen></iframe>`;
					break;
				default:
					videoId = item.video;
					videoHTML = `<div class="wcgs-video-self-hosted"><video data-setup="{}" playsinline class="video-js" controls ><source src="${item.video}" type="video/mp4"></video></div>`;
					break;
			}
			return Array(videoHTML, videoId);
		}
		getVideoType(videoUrl) {
			if (videoUrl.includes('youtu')) return 'youtube';
			if (videoUrl.includes('vimeo')) return 'vimeo';
			if (videoUrl.includes('dailymotion')) return 'dailymotion';
			if (videoUrl.includes('facebook')) return 'facebook';
			if (videoUrl.includes('wistia')) return 'wistia';
			if (videoUrl.includes('sproutvideo')) return 'sproutvideo';
			if (videoUrl.includes('mediadelivery')) return 'mediadelivery';
			return 'html5video';
		}
		extractYouTubeId(videoUrl) {
			if (videoUrl.includes('shorts')) {
				const match = videoUrl.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
				return match ? match[1] : '';
			} else {
				const match = videoUrl.match(/(?:youtu\.be\/|v=|\/v\/|embed\/|watch\?v=)([^#\&\?]{11})/);
				return match ? match[1] : '';
			}
		}
		extractVimeoId(videoUrl) {
			try {
				const url = new URL(videoUrl);
				return url.pathname.substring(1); // Remove the leading '/'
			} catch (error) {
				console.error("Invalid URL:", error);
				return null;
			}
		}

		bindEvents() {
			// Namespace all events and store handlers.
			this.eventHandlers.resize = this.handleResize.bind(this);
			this.eventHandlers.variation = this.handleVariationChange.bind(this);

			// Window events with namespaces
			$(window)
				.off('resize.wcgsGallery')
				.on('resize.wcgsGallery', this.eventHandlers.resize);
			// Another device whose values differ for a setting the script read at start: start again.
			wcgsDevices.watch(() => {
				if (!$('body').hasClass('elementor-editor-active') && wcgsDevices.needsRestart(this.device)) {
					window.location.reload();
				}
			});

			// Document events.
			$(document)
				.off('change.wcgsVariation', '.variations:not(.spswp-shop-variations) select')
				.on('change.wcgsVariation', '.variations:not(.spswp-shop-variations) select, .variations:not(.spswp-shop-variations) input[type=radio]', this.eventHandlers.variation);

			// With the lightbox off, a popup video card's play icon opens its video.
			// With it on, setupVideoPopup() opens the lightbox at the video.
			$(document)
				.off('click.wcgsVideoPopup')
				.on('click.wcgsVideoPopup', '#wpgs-gallery .wcgs-slider-image.video[data-video-popup] .wcgs-video-icon-wrapper', (e) => {
					if (this.settings.lightbox == '1') {
						return;
					}
					e.preventDefault();
					this.openVideoPopup($(e.currentTarget).closest('.wcgs-slider-image.video')[0]);
				});

		}
		handleVariationChange(e) {
			// Debounce variation changes.
			if (this.variationTimeout) {
				clearTimeout(this.variationTimeout);
			}
			const $variations_table = $(e.target).closest('.variations');
			this.variationTimeout = setTimeout(() => {
				const variationData = wcgs_object.wcgs_data || [];
				const variationsArray = this.collectVariationData($variations_table);
				this.updateGalleryBasedOnVariations(variationsArray, variationData);
			}, 250);
		}
		handleResize() {
			let currentWidth = $(window).width();
			if (!$('body').hasClass("elementor-editor-active") && ((this.state.prevWindowWidth >= 768 && currentWidth < 768) || (this.state.prevWindowWidth < 768 && currentWidth >= 768))) {
				window.location.reload();
			}

			this.state.prevWindowWidth = currentWidth;
		}

		initializeVideoFeatures() {
			this.checkVideoJSAPIReady();
			// Setup video popup if enabled.
			if (this.settings.lightbox == '1') {
				this.setupVideoPopup();
			}
			// Add video icon on thumbnail.
			this.addVideoIcons();
		}

		addVideoIcons() {
			let video_icon_type = this.settings['video_icon'] !== undefined ? this.settings['video_icon'] : 'play-01';
			let video_icon_position = this.state.video_icon_position;
			let video_icon = `<i class="wcgs-video-icon sp-wgsp-icon-${video_icon_type}"></i>`;
			this.$gallery.find('.wcgs-slider-image, .wcgs-thumb').each(function () {
				let slide = $(this);
				const icon = $(this).find('img').data('type');
				let _this = $(this).find('.wcgs-video-icon-wrapper');
				if ($(this).hasClass('wcgs-thumb')) {
					_this = $(this);
				}

				if (video_icon_type === 'native' && icon) {
					video_icon = icon == 'vimeo' ? '<i class="sp-wgsp-icon-vimeo wcgs-video-icon"></i>' : video_icon;
					video_icon = icon == 'facebook' ? '<i class="sp-wgsp-icon-facebook-circled wcgs-video-icon"></i>' : video_icon;
					video_icon = icon == 'youtube' ? '<i class="sp-wgsp-icon-youtube-play wcgs-video-icon "></i>' : video_icon;
					video_icon = icon == 'dailymotion' ? '<i class="sp-wgsp-icon-dailymotion wcgs-video-icon"></i>' : video_icon;
					video_icon = icon == 'html5video' ? '<i class="sp-wgsp-icon-play-01 wcgs-video-icon"></i>' : video_icon;
				}
				setTimeout(() => {
					if (slide.find('.wcgs-video-self-hosted').length) {

						slide = slide.find('.vjs-big-play-button').addClass(video_icon_position);
						if (!slide.find('.wcgs-video-icon').length) {
							slide.append(video_icon);
						}
					}
				}, 1500);
				if (icon && !_this.find('.wcgs-video-icon').length) {
					_this.append(video_icon);
				}


			});
		}
		checkVideoJSAPIReady() {
			const selfHostedVideos = this.$gallery.find('.wcgs-carousel .video-js');
			if (selfHostedVideos.length > 0) {
				const checkInterval = setInterval(() => {
					this.initializeVideoJSScript();
					if (this.isStylesheetEnabled('enqueue_video_css')) {
						this.loadNonCriticalCSS('css/video.min.css');
					}
					if (typeof videojs == 'function') {
						clearInterval(checkInterval);
						this.videoJsLoaded = true;
						this.initializeSelfHostedVideos();
					}
				}, 300);
				// Prevent infinite checking.
				setTimeout(() => {
					clearInterval(checkInterval);
					if (!this.videoJsLoaded) {
						console.log('Video.js script failed to load');
					}
				}, 5000);
			}
		}
		// Speed Optimization: whether the script loads a library's stylesheet ('enqueue_fancybox_css',
		// 'enqueue_video_css'; on unless saved off). The Swiper stylesheet is enqueued by PHP
		// (enqueue_swiper_css). The 'enqueue_*_js' toggles are not read: each library script is
		// injected only when its global (SPSwiper, Fancybox, videojs) does not exist yet, so a copy
		// another plugin or the theme loads is used instead.
		isStylesheetEnabled(key) {
			const value = this.settings[key];
			return undefined === value || null === value || !(false === value || '' === value || '0' === value || 0 === value);
		}
		loadNonCriticalCSS(file) {
			// Check if a <link> tag with the specific href exists
			const href = this.publicUrl + file;
			if (jQuery(`link[rel="stylesheet"][href="${href}"]`).length === 0) {
				// If not, add the <link> tag dynamically
				$('<link>', {
					rel: 'stylesheet',
					href: href,
				}).appendTo('head');
			}
		}
		initializeVideoJSScript() {
			const videoJsScriptId = 'wcgs-videojs-js';
			// Check if Video.js script is already added.
			if (!document.getElementById(videoJsScriptId)) {
				// Video.js JavaScript.
				const jsTag = document.createElement('script');
				jsTag.src = this.publicUrl + 'js/video.min.js';
				jsTag.id = videoJsScriptId;
				jsTag.defer = true;
				// Append to document.
				const firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(jsTag, firstScript);
			}
		}
		initializeSelfHostedVideos() {
			const selfHostedVideos = this.$gallery.find('.wcgs-carousel .video-js');
			if (selfHostedVideos.length > 0 && typeof videojs != 'undefined') {
				selfHostedVideos.each((index, element) => {
					videojs(element);
				});
			}
		}

		setupVideoPopup() {
			const lightboxSelector = '.wcgs-carousel .wcgs-lightbox, .wcgs-slider-image .wcgs-video-icon, .wcgs-slider-image .wcgs-slider-image-tag, .wcgs_xzoom-source, .wcgs-slider-image.video';

			// Namespaced and unbound first: this runs again on every variation change.
			$(document).off('click.wcgsLightboxProxy').on('click.wcgsLightboxProxy', lightboxSelector, (e) => {
				e.preventDefault();
				if ($(e.target).parents('.wcgs-iframe-wrapper').length > 0) {
					return;
				}
				const activeSlideLink = $('.wcgs-carousel .spswiper-slide-active a');
				if (activeSlideLink.length) {
					document.querySelector(".wcgs-carousel .spswiper-slide-active a").click();
					const activeSlide = $('.wcgs-carousel .spswiper-slide-active');
					if (activeSlide.find('.wcgs-youtube-video').length > 0) {
						this.pauseYouTubeVideo(activeSlide);
					} else {
						this.stopVideos(activeSlide);
					}
				}
			});
		}

		pauseYouTubeVideo(slide) {
			const videoElement = slide.find('.wcgs-youtube-video');
			const videoId = videoElement.data('video-id');
			const uniqueId = videoElement.attr('data-unique-id');
			const player = this.players.get(videoId + uniqueId);
			if (player && typeof player.pauseVideo == 'function') {
				player.pauseVideo();
			}
		}

		stopVideos(item) {
			const videos = $(item).find('video, iframe')[0];
			if (!videos) return;
			if (videos.tagName.toLowerCase() == 'video') {
				videos.pause();
			} else {
				const src = videos.src;
				videos.src = src; // Reset iframe source to stop video.
			}
		}
	}

	// jQuery extension to check if images are loaded.
	$.fn.wpgspimagesLoaded = function () {
		var $imgs = this.find('img[src!=""]');
		if (!$imgs.length) {
			return $.Deferred().resolve().promise();
		}
		var dfds = [];
		$imgs.each(function (index) {
			if (index == 0) {
				var dfd = $.Deferred();
				var img = new Image();
				img.onload = function () { dfd.resolve(); };
				img.onerror = function () { dfd.resolve(); };
				img.src = this.src;
			}
		});
		return $.when.apply($, dfds);
	};
	// xZoom's defaultScale for a zoom level: at 0 it shows the full image at its own size (ratio
	// times the shown size), at 1 at the shown size; in between it scales linearly. The same as
	// zoomScale() of the live preview (Product/engine.js).
	function zoomScale(fullWidth, shownWidth, level) {
		if (!fullWidth || !shownWidth) {
			return 0;
		}
		const ratio = fullWidth / shownWidth;
		if (Math.abs(ratio - 1) < 0.01) {
			return 0;
		}
		return Math.max(-30, Math.min(1, (ratio - level) / (ratio - 1)));
	}
	// Utility Debounce Function.
	function debounce(func, wait = 10) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	/**
	 * Whether the page is being loaded by a page-speed audit tool.
	 *
	 * Only the user agent is checked. Window-size guesses matched real
	 * desktop and mobile screens and left the gallery uninitialized there.
	 *
	 * @return {boolean} True for Lighthouse or GTmetrix.
	 */
	function is_pagespeed() {
		if (typeof navigator === 'undefined') {
			return false;
		}

		// Lighthouse (PageSpeed Insights) or GTmetrix in the user agent.
		if (/(lighthouse|gtmetrix)/i.test(navigator.userAgent || '')) {
			return true;
		}

		// Lighthouse in the client hints brands.
		const brands = navigator.userAgentData && navigator.userAgentData.brands;
		if (brands) {
			for (let i = 0; i < brands.length; i++) {
				if (brands[i] && brands[i].brand && brands[i].brand.toLowerCase() === 'lighthouse') {
					return true;
				}
			}
		}

		return false;
	}

	// Initialize gallery slider.
	function initGallerySlider() {
		$("#wpgs-gallery").addClass('wcgs-visible');
		new WooGallerySlider();
	}

	// Lazy-load: start the gallery when it scrolls into view. Page-speed
	// tools (and browsers without IntersectionObserver) start it right away
	// instead, so it is never left uninitialized.
	if (wcgs_object.lazy_load_gallery == '1' && !is_pagespeed() && 'IntersectionObserver' in window) {
		const galleryEl = document.querySelector('.wcgs-woocommerce-product-gallery');
		if (galleryEl) {
			const viewportObserver = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting) {
					viewportObserver.disconnect();
					initGallerySlider();
				}
			}, { threshold: 0.1 });
			viewportObserver.observe(galleryEl);
		}
	} else {
		jQuery(document).ready(initGallerySlider);
	}
})(jQuery);
