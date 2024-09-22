; (function ($) {
	'use strict';
	jQuery(function () {
		var wcgs_swiper_thumb,
			wcgs_swiper_gallery;
		var players = []; // Array to store player instances
		// Fn to allow an event to fire after all images are loaded
		$.fn.wpgspimagesLoaded = function () {
			// Get all the images (excluding those with no src attribute)
			var $imgs = this.find('img[src!=""]');
			// If there's no images, just return an already resolved promise
			if (!$imgs.length) { return $.Deferred().resolve().promise(); }

			// For each image, add a deferred object to the array which resolves when the image is loaded (or if loading fails)
			var dfds = [];
			$imgs.each(function () {
				var dfd = $.Deferred();
				dfds.push(dfd);
				var img = new Image();
				img.onload = function () { dfd.resolve(); }
				img.onerror = function () { dfd.resolve(); }
				img.src = this.src;
			});

			// return a master promise object which will resolve when all the deferred objects have resolved
			// IE - when all the images are loaded
			return $.when.apply($, dfds);
		}

		// set all settings
		var settings = wcgs_object.wcgs_settings,
			wcgs_product_wrapper = wcgs_object.wcgs_product_wrapper,
			wcgs_body_font_size = parseInt(wcgs_object.wcgs_body_font_size),
			gallery_w = 0,
			summary_w = 0;
		var pagination = (settings.pagination == '1') ? true : false;
		// 	var navigation = (settings.navigation == '1') ? true : false;
		var navigation = true;
		if (typeof settings.navigation != 'undefined') {
			navigation = settings.navigation == '1' ? true : false;
		}
		var wcgs_zoom = true;
		if (typeof settings.zoom != 'undefined') {
			wcgs_zoom = settings.zoom == '1' ? true : false;
		}
		var video_only_popup = true;
		if (typeof settings.video_popup_place != 'undefined' && settings.video_popup_place == 'inline') {
			video_only_popup = false;
		}
		var $single_combination = typeof settings.single_combination !== 'undefined' ? settings.single_combination : 'all';
		var wcgs_swiper = true;
		function SwiperSlide(selector, options) {
			if (typeof WCGSSwiper !== 'undefined') {
				return new WCGSSwiper(selector, options);
			} else if (typeof Swiper !== 'undefined') {
				return new Swiper(selector, options);
			} else {
				console.log("Swiper is undefined");
				wcgs_swiper = false;
			}
		}
		// Youtube API script function.
		function wcgs_add_youtube_api_script() {
			var youtubeScriptId = 'youtube-api';
			var youtubeScript = document.getElementById(youtubeScriptId);
			if (youtubeScript === null) {
				var tag = document.createElement('script');
				var firstScript = document.getElementsByTagName('script')[0];
				tag.src = 'https://www.youtube.com/iframe_api';
				tag.id = youtubeScriptId;
				firstScript.parentNode.insertBefore(tag, firstScript);
			}
		}
		// Initialize YouTube videos.
		function initializeYouTubeVideos() {
			$('.wcgs-carousel .wcgs-slider-image .wcgs-youtube-video').each(function (index) {
				var videoId = $(this).data('video-id');
				var playbackTimes = {};
				var wcgs_player = new YT.Player(this, {
					videoId: videoId,
					// origin: decodeURIComponent("http://localhost:8888"),
					// origin: false,
					playerVars: {
						modestbranding: 1,
						showinfo: 0,
						fs: 1,
						start: playbackTimes[videoId] || 0
					},
					events: {
						'onStateChange': function (event) {
							if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
								playbackTimes[videoId] = event.target.getCurrentTime();
							}
						}
					}
				});
				players[videoId] = wcgs_player;
			});
		}

		if (!video_only_popup) {
			wcgs_add_youtube_api_script(); // load YT script,
			// Use setInterval to repeatedly check for YT object.
			var checkYTInterval = setInterval(function () {
				if (typeof YT === 'object' && typeof YT.Player === 'function') {
					clearInterval(checkYTInterval); // Clear the interval once YT object is available.
					initializeYouTubeVideos();
				}
			}, 300); // Check every 300 milliseconds.
		}
		// Add video icon on thumbnail.
		function videoIcon() {
			$('.wcgs-slider-image, .wcgs-thumb').each(function () {
				var icon = $(this).find('img').data('type');
				if (icon) {
					$(this).append('<div class="wcgs-video-icon"></div>');
				}
			})
		}
		// Function to check and hide/show navigation arrows
		function checkArrowsVisibility(nav_swiper) {
			setTimeout(function () {
				var allowSlidePrev = typeof nav_swiper.allowSlidePrev != 'undefined' ? nav_swiper.allowSlidePrev : false;
				var allowSlideNext = typeof nav_swiper.allowSlideNext != 'undefined' ? nav_swiper.allowSlideNext : false;
				if (allowSlidePrev || allowSlideNext) {
					$(".gallery-navigation-carousel-wrapper .wcgs-swiper-arrow").show();
				} else {
					$(".gallery-navigation-carousel-wrapper .wcgs-swiper-arrow").hide();
				}
			}, 300);
		}
		function wcgs_slider_func(width) {
			var width_unit = width > 100 ? 'px' : '%';
			if ($(window).width() < 992) {
				if (settings.gallery_responsive_width.width > 0) {
					width_unit = settings.gallery_responsive_width.unit;
				}
			}
			if ($(window).width() < 768) {
				width_unit = settings.gallery_responsive_width.unit;
			}

			setTimeout(function () {
				// For % unit
				if ('%' === width_unit) {
					summary_w = (100 - width);
					summary_w = summary_w > 20 ? 'calc( ' + summary_w + '% - 30px )' : '';
				} else {
					// For px or em unit
					var parent_wrapper = $('#wpgs-gallery').parent('*');
					var parent_wrapper_width = parent_wrapper.width() > ($('#wpgs-gallery').width() + 100) ? parent_wrapper.width() : 0;
					summary_w = parent_wrapper_width > 200 ? (parent_wrapper_width - width) : 0;
					summary_w = summary_w > 150 ? (summary_w - 35) + width_unit : '';
					// For em unit
					if ('em' === width_unit) {
						parent_wrapper_width = parent_wrapper_width / wcgs_body_font_size;
						summary_w = parent_wrapper_width > width ? (parent_wrapper_width - width) : 0;
						summary_w = summary_w > 12 ? (summary_w - 3) + width_unit : '';
					}
				}
				$('#wpgs-gallery ~ .summary').css('maxWidth', summary_w);
			}, 100);

			$("#wpgs-gallery").css('minWidth', 'auto').css('maxWidth', width + width_unit);
			var wcgs_img_count = $("#wpgs-gallery").find('.gallery-navigation-carousel .wcgs-thumb').length;
			var thumbnails_item_to_show = parseInt(settings.thumbnails_item_to_show);
			var thumbnails_sliders_space = typeof settings.thumbnails_sliders_space != 'undefined' ? settings.thumbnails_sliders_space.width : 6;
			var adaptive_height = (settings.adaptive_height == '1') ? true : false;
			var accessibility = (settings.accessibility == '1') ? true : false;

			var slider_dir = (settings.slider_dir == '1' || $('body').hasClass('rtl')) ? true : false;

			var thumbnail_nav = (settings.thumbnailnavigation == 1) ? true : false;
			var slide_orientation = 'horizontal';
			if (typeof settings.slide_orientation != 'undefined') {
				slide_orientation = settings.slide_orientation == 'vertical' ? 'vertical' : 'horizontal';
			}
			var infinite_loop = true;
			if (typeof settings.infinite_loop != 'undefined') {
				infinite_loop = (settings.infinite_loop == '1') ? true : false;
			}
			// Free mode Default true.
			var free_mode = true;
			if (typeof settings.free_mode != 'undefined') {
				free_mode = settings.free_mode == '1' ? true : false;
			}
			var mouse_wheel = false;
			if (typeof settings.mouse_wheel != 'undefined') {
				mouse_wheel = settings.mouse_wheel == '1' ? true : false;
			}
			// hide nav carousel if item is one!
			if (wcgs_img_count <= 1) {
				$("#wpgs-gallery").find('.gallery-navigation-carousel-wrapper').hide();
				$("#wpgs-gallery .wcgs-swiper-arrow").hide()
			} else {
				$("#wpgs-gallery").find('.gallery-navigation-carousel-wrapper').show();
				$("#wpgs-gallery .wcgs-swiper-arrow:not(.swiper-button-lock)").show()
			}
			$('#wpgs-gallery').wpgspimagesLoaded().then(function () {
				if (wcgs_img_count > 1) {
					setTimeout(function () {
						var maxHeight = 0,
							selector = '.wcgs-carousel .wcgs-slider-image img';
						$(selector).each(function (i) {
							if ($(this).innerHeight() > maxHeight) {
								maxHeight = $(this).innerHeight();
							}
						})
						if (slide_orientation == 'vertical') {
							$('#wpgs-gallery .wcgs-carousel .swiper-slide').css({ 'maxHeight': maxHeight })
						}
						$('#wpgs-gallery .wcgs-carousel .swiper-slide').css({
							"display": "flex",
							"justify-content": "center",
							"align-items": "center",
						});
					}, 200)
				}
			});
			// $('.wcgs-carousel').show();
			var carousel_items = $('.wcgs-carousel .wcgs-slider-image').length;
			if (carousel_items > 0) {
				wcgs_swiper_thumb = new SwiperSlide(".gallery-navigation-carousel", {
					slidesPerView: thumbnails_item_to_show,
					direction: 'horizontal',
					loop: infinite_loop,
					autoplay: false,
					watchSlidesVisibility: true,
					watchSlidesProgress: true,
					autoHeight: false,
					watchOverflow: true,
					spaceBetween: parseInt(thumbnails_sliders_space),
					freeMode: free_mode,
					observer: true,
					mousewheel: mouse_wheel,
					simulateTouch: true,
					a11y: accessibility ? ({
						prevSlideMessage: 'Previous slide',
						nextSlideMessage: 'Next slide',
					}) : false,
					on: {
						afterInit: function () {
							setTimeout(() => {
								$('#wpgs-gallery').removeClass('wcgs-swiper-before-init');
								if (pagination) {
									if ($('.wcgs-carousel .swiper-slide.swiper-slide-active').find('.wcgs-youtube-video').length > 0) {
										$('.wcgs-carousel .swiper-pagination').hide();
									} else {
										$('.wcgs-carousel .swiper-pagination').show();
									}
								}
							}, 400);
						},
					}
				});
				if ('vertical' == slide_orientation) {
					adaptive_height = true;
				}
				wcgs_swiper_gallery = new SwiperSlide(".wcgs-carousel", {
					autoplay: false,
					autoHeight: adaptive_height,
					direction: slide_orientation,
					slidesPerView: 1,
					spaceBetween: 0,
					loop: infinite_loop,
					effect: 'slide',
					speed: 500,
					observer: true,
					watchOverflow: true,
					observeParents: true,
					a11y: accessibility ? ({
						prevSlideMessage: 'Previous slide',
						nextSlideMessage: 'Next slide',
					}) : false,
					navigation: navigation ? ({
						nextEl: ".wcgs-carousel .wcgs-swiper-button-next",
						prevEl: ".wcgs-carousel .wcgs-swiper-button-prev",
					}) : thumbnail_nav ? ({
						nextEl: ".gallery-navigation-carousel .wcgs-swiper-button-next",
						prevEl: ".gallery-navigation-carousel .wcgs-swiper-button-prev",
					}) : false,
					pagination: pagination ? ({
						el: '.wcgs-carousel .swiper-pagination',
						type: 'bullets',
						clickable: true,
					}) : false,
					thumbs: {
						swiper: wcgs_swiper_thumb,
					},
				});
			}
			$(document).find('.wcgs-thumb').on('click', function () {
				if (infinite_loop) {
					let index = $(this).data('swiper-slide-index');
					wcgs_swiper_gallery.slideToLoop(index);
				} else {
					let index = $(this).index();
					wcgs_swiper_gallery.slideTo(index);
				}
			});
			checkArrowsVisibility(wcgs_swiper_thumb);

			if (wcgs_swiper) {
				wcgs_swiper_gallery.on("slideChange", () => {
					var currentSlide = wcgs_swiper_gallery.activeIndex;
					var previousIndex = wcgs_swiper_gallery.previousIndex;
					var $previousItem = $('.wcgs-carousel .swiper-slide').eq(previousIndex);
					var $activeItem = $('.wcgs-carousel .swiper-slide').eq(currentSlide);
					setTimeout(function () {
						if (pagination) {
							if ($($activeItem).find('.wcgs-youtube-video').length > 0) {
								$('.wcgs-carousel .swiper-pagination').hide();
							} else {
								$('.wcgs-carousel .swiper-pagination').show();
							}
						}
						if ($($previousItem).find('.wcgs-youtube-video').length > 0) {
							var video_id = $($previousItem).find('.wcgs-youtube-video').data('video-id');
							if (players.hasOwnProperty(video_id)) {
								// Check if the player's pauseVideo function exists.
								if (players[video_id] && $.isFunction(players[video_id].pauseVideo)) {
									// Pause the YouTube video.
									players[video_id].pauseVideo();
								} else {
									// Stop the YouTube video.
									if ($.isFunction(players[video_id].stopVideo)) {
										players[video_id].stopVideo();
									}
								}
							}
						}
					}, 500);
				});
			}
			// Trigger current item after clicking on lightbox icon
			$(document).on('click', '.wcgs-carousel .wcgs-lightbox,.wcgs-carousel .wcgs-video-icon, .wcgs-carousel .wcgs-photo', function (e) {
				$(document).find('.wcgs-carousel .swiper-slide-active a.wcgs-slider-lightbox').trigger('click');
			});

			// Theme savoy.
			if ($('body').hasClass('theme-savoy')) {
				var swiperArrow = ['.sp_wgs-icon-left-open', '.sp_wgs-icon-right-open', '.sp_wgs-icon-left-open', '.sp_wgs-icon-right-open'];
				$.each(swiperArrow, function (i, item) {
					$('#wpgs-gallery ' + item).addClass('wcgs-swiper-arrow');
				})
			}

			if (settings.lightbox == '1') {
				if (!$('#wpgs-gallery .wcgs-carousel .wcgs-lightbox').length) {
					$('#wpgs-gallery .wcgs-carousel').append('<div class="wcgs-lightbox top_right"><span class="sp_wgs-lightbox"><span class="sp_wgs-icon-search"></span></button></div>');
				}
			}

			var pagination_visibility = (settings.pagination_visibility == 'hover') ? true : false;
			if (pagination_visibility) {
				$("#wpgs-gallery .swiper-pagination").hide()
				$("#wpgs-gallery .wcgs-carousel").on({
					mouseenter: function () {
						$("#wpgs-gallery .swiper-pagination").show();
					},
					mouseleave: function () {
						$("#wpgs-gallery .swiper-pagination").hide();
					}
				});
			}
			// Carousel navigation visibility.
			var navigation_visibility = (settings.navigation_visibility == 'hover') ? true : false;
			if (navigation_visibility) {
				$("#wpgs-gallery .wcgs-carousel .wcgs-swiper-arrow").hide()
				$("#wpgs-gallery .wcgs-carousel").on({
					mouseenter: function () {
						$("#wpgs-gallery .wcgs-carousel .wcgs-swiper-arrow:not(.swiper-button-lock)").show();
					},
					mouseleave: function () {
						$("#wpgs-gallery .wcgs-carousel .wcgs-swiper-arrow").hide();
					}
				});
			}
			// Thumb navigation visibility.
			var thumb_navigation_visibility = (settings.thumb_nav_visibility == 'hover') ? true : false;
			if (thumb_navigation_visibility) {
				$("#wpgs-gallery .gallery-navigation-carousel .wcgs-swiper-arrow").hide()
				$("#wpgs-gallery .gallery-navigation-carousel").on({
					mouseenter: function () {
						$("#wpgs-gallery .gallery-navigation-carousel .wcgs-swiper-arrow:not(.swiper-button-lock)").show();
					},
					mouseleave: function () {
						$("#wpgs-gallery .gallery-navigation-carousel .wcgs-swiper-arrow").hide();
					}
				});
			}

			var isPreloader = (settings.preloader == 1) ? true : false;
			if (isPreloader) {
				if (!$('.wcgs-gallery-preloader').length) {
					$('#wpgs-gallery').append('<div class="wcgs-gallery-preloader"></div>');
				}
			}

		}
		$('#wpgs-gallery').wpgspimagesLoaded().then(function () {
			$(".wcgs-gallery-preloader").css("opacity", 0);
			$(".wcgs-gallery-preloader").css("z-index", -99);
		});
		if (navigation) {
			$('.gallery-navigation-carousel .wcgs-swiper-button-next').on('click', function () {
				$('.wcgs-carousel .wcgs-swiper-button-next').trigger('click');
			});
			$('.gallery-navigation-carousel .wcgs-swiper-button-prev').on('click', function () {
				$('.wcgs-carousel .wcgs-swiper-button-prev').trigger('click');
			});
		}
		// Add data-scale and data-image attributes when hover on wrapper.
		function dataZoom() {
			$('.wcgs-slider-image').on('mouseenter mouseleave', function () {
				$(this).attr('data-scale', '1.5');
				var img = $(this).find('img').attr('src');
				$(this).attr('data-image', img);
			});
		}

		// Zoom function defines.
		function zoomFunction() {
			$('.wcgs-slider-image')
				.on('mouseover', function () {
					$(this).children('.wcgs-photo').css({
						'transform': 'scale(' + $(this).attr('data-scale') + ')',
						'transition': 'all .5s'
					});
				})
				.on('mouseout', function () {
					$(this).children('.wcgs-photo').css({ 'transform': 'scale(1)', 'transition': 'all .5s' });
				})
				.on('mousemove', function (e) {
					$(this).children('.wcgs-photo').css({
						'transform-origin': ((e.pageX - $(this).offset().left) / $(this).width()) * 100 + '% ' + ((e.pageY - $(this).offset().top) / $(this).height()) * 100 + '%', 'transition': 'transform 1s ease-in'
					});
				})
				.each(function () {
					var icon = $(this).find('img').data('type');
					var photoLength = $(this).find('.wcgs-photo').length;
					if (photoLength === 0 && !icon) {
						$(this).append('<div class="wcgs-photo"></div>');
					}
					$(this).children('.wcgs-photo').css({ 'background-image': 'url(' + $(this).find('img').attr('src') + ')' });
				});
		}

		// Determine when zoomFunction apply.
		function zoomEffect() {
			if ($(window).width() < 480 && settings.mobile_zoom == 1) {
				return '';
			}
			$(document).on('click', '.wcgs-slider-image', function () {
				zoomFunction();
			});
			$(".wcgs-slider-image").on({
				mouseenter: function () {
					zoomFunction();
				},
				mouseleave: function () {
					zoomFunction();
				}
			});
		}

		// Add lightbox with gallery.
		function wcgsLightbox() {
			var lightbox = (settings.lightbox == 1) ? true : false;
			if (lightbox && typeof $.fancybox !== 'undefined') {
				var gl_btns = [
					"zoom"
				];
				if (settings.gallery_fs_btn == 1) {
					gl_btns.push("fullScreen");
				}
				if (settings.gallery_share == 1) {
					gl_btns.push("share");
				}
				gl_btns.push("close");
				$.fancybox.defaults.buttons = gl_btns;
				var counter = (settings.l_img_counter == 1) ? true : false;
				$('.wcgs-carousel').fancybox({
					selector: '.wcgs-carousel .wcgs-slider-lightbox',
					backFocus: false,
					baseClass: "wcgs-fancybox-custom-wrapper",
					caption: function () {
						var caption = '';
						if (settings.lightbox_caption == 1) {
							caption = $(this).parent('.wcgs-slider-image ').find('img').data('cap') || '';
						}
						return caption;
					},
					afterShow: function (instance, current) {
						$(".wcgs-fancybox-custom-wrapper~.elementor-lightbox").remove();
					},
					infobar: counter,
					buttons: gl_btns,
					loop: true
				});
			} else {
				$('.wcgs-carousel .wcgs-slider-lightbox').removeAttr("data-fancybox href");
				console.error("Fancybox is not defined.");
			}
		}
		function wcgs_initialize() {
			var gallery_width = settings.gallery_width;
			gallery_w = gallery_width;
			summary_w = (100 - gallery_width);

			if ($(window).width() >= 992) {
				summary_w = summary_w > 20 ? summary_w : '100%';
				$('#wpgs-gallery ~ .summary').css('maxWidth', 'calc(' + summary_w + '% - 30px)');
			}

			if ($('body').hasClass('et_divi_builder') || $('body').hasClass('theme-Divi')) {
				var gallery_divi_width = $('.wcgs-gallery-slider.et-db #et-boc .et-l .et_pb_gutters3 .et_pb_column_1_2').width();
				if (typeof gallery_divi_width === "number") {
					gallery_w = gallery_divi_width;
				}
			}

			if ($('body').hasClass('theme-flatsome')) {
				var gallery_flatsome_width = $('.single-product .product .row.content-row .product-gallery').width();
				if (typeof gallery_flatsome_width === "number") {
					gallery_w = gallery_flatsome_width;
				}
			}

			if ($('.wcgs-woocommerce-product-gallery').parents('.hestia-product-image-wrap').length) {
				var gallery_hestia_width = $('.wcgs-woocommerce-product-gallery').parents('.hestia-product-image-wrap').width();
				if (typeof gallery_hestia_width === "number") {
					gallery_w = gallery_hestia_width;
				}
			}

			if ($(window).width() < 992) {
				if (settings.gallery_responsive_width.width > 0) {
					gallery_w = settings.gallery_responsive_width.width;
				}
			}
			if ($(window).width() < 768) {
				gallery_w = settings.gallery_responsive_width.height;
			}
			if ($(window).width() < 480) {
				gallery_w = settings.gallery_responsive_width.height2;
			}

			wcgs_slider_func(gallery_w);
		}

		wcgs_initialize();

		$(window).on("resize", function () {
			wcgs_initialize();
		});
		$(window).on("load", function () {
			$(".wcgs-gallery-preloader").css("opacity", 0);
			$(".wcgs-gallery-preloader").css("z-index", -99);
		});
		videoIcon();
		if (wcgs_zoom) {
			dataZoom();
			zoomEffect();
		}
		wcgsLightbox();

		function uniqueMultidimensionalArray(arr, key) {
			var uniqueArray = [];
			var uniqueKeys = [];

			$.each(arr, function (index, item) {
				// Check if the key value is not already in the uniqueKeys array
				if ($.inArray(item[key], uniqueKeys) === -1) {
					uniqueKeys.push(item[key]); // Add the key value to the uniqueKeys array
					uniqueArray.push(item);      // Add the entire item to the uniqueArray
				}
			});
			return uniqueArray;
		}
		// Event listener for change event on select elements within elements with the class '.variations'
		$(document).on('change', '.variations select', function () {
			// Object to store selected variations
			var variations_items = [];
			var variationsArray = {};
			// Iterate over each table row with class '.variations'
			$('.variations tr').each(function (i) {
				// Get attribute name and value for each select element
				var attributeName = $(this).find('select').data('attribute_name');
				var attributeValue = $(this).find('select').val();

				// Check if attribute value is not empty
				if (attributeValue) {
					variationsArray[attributeName] = attributeValue; // Store attribute and its value in variationsArray
				}
			});
			var video_showed = false;
			// Check if wcgs_object.wcgs_data is not empty
			if (wcgs_object.wcgs_data && wcgs_object.wcgs_data.length > 0) {
				var data = wcgs_object.wcgs_data;
				$.each(data, function (i, v) {
					var v0 = JSON.stringify(v[0]) == '[]' ? '{}' : JSON.stringify(v[0]);
					var applied_variation = JSON.stringify(variationsArray);
					applied_variation = $single_combination !== 'all' ? applied_variation.slice(1, -1) : applied_variation;

					if ($.isEmptyObject(variationsArray)) {
						if (v0 === JSON.stringify(variationsArray)) {
							var response = v[1];
							if (response.length > 0) {
								$.merge(variations_items, response);
							}
						}
					} else {
						if (v0.indexOf(applied_variation) !== -1) {
							var response = v[1];
							if (response.length > 0) {
								$.merge(variations_items, response);
							}
						}
					}
				});
				// Check if variationsArray matches the current data item.
				if (variations_items.length > 0) {
					variations_items = uniqueMultidimensionalArray(variations_items, 'full_url');
					// Display preloader while updating the gallery
					$('.wcgs-gallery-preloader').css('z-index', 99);
					$('.wcgs-gallery-preloader').css('opacity', 0);
					$('#wpgs-gallery').addClass('wcgs-transition-none');
					// Destroy existing Swiper instances and clear gallery elements.
					wcgs_swiper_thumb.destroy(true);
					wcgs_swiper_gallery.destroy(true);
					$('#wpgs-gallery .wcgs-carousel .swiper-wrapper > *, #wpgs-gallery .gallery-navigation-carousel .swiper-wrapper > *').remove();
					// Process each item in the response array to update the gallery
					var gallery = variations_items;
					gallery.forEach(function (item, index) {
						// Create HTML elements for gallery and thumbnails.
						var caption = (item.cap.length > 0) ? item.cap : '';
						if (item != null) {
							if (typeof item.video != 'undefined' && (Object.keys(variationsArray).length === 0) && (item.video.indexOf('youtub') > -1) && !video_showed) {
								var video = item.video;
								var youtubeCheck = (video.indexOf('youtub') > -1) ? true : false;
								if (youtubeCheck) {
									var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
									var match = video.match(regExp);
									var id = (match && match[7].length == 11) ? match[7] : false;
									if (!video_only_popup) {
										$('#wpgs-gallery .wcgs-carousel .swiper-wrapper').append('<div class="swiper-slide"><div class="wcgs-slider-image"><a class="wcgs-slider-lightbox" href="' + video + '" data-fancybox="view" data-fancybox-height="600" data-fancybox-width="400" aria-label="lightbox" ></a><div class="wcgs-iframe-wrapper"><div class="skip-lazy wcgs-iframe wcgs-youtube-video" data-video-id="' + id + '" data-src="' + video + '"></div><img style="visibility: hidden" alt="' + caption + '" src="' + item.url + '" data-type="youtube" data-image="' + item.full_url + '" /></div></div></div>');
										$('#wpgs-gallery .gallery-navigation-carousel .swiper-wrapper').append('<div class="wcgs-thumb swiper-slide"><img alt="' + caption + '" src="' + item.thumb_url + '" data-type="youtube" data-image="' + item.url + '" /></div>');
									} else {
										$('#wpgs-gallery .wcgs-carousel .swiper-wrapper').append('<div class="swiper-slide"><div class="wcgs-slider-image"><a class="wcgs-slider-lightbox" href="' + video + '" data-fancybox="view" data-fancybox-height="600" data-fancybox-width="400" aria-label="lightbox" ></a><img alt="' + caption + '" src="' + item.url + '" data-type="youtube" data-image="' + item.full_url + '" /></div></div>');

										$('#wpgs-gallery .gallery-navigation-carousel .swiper-wrapper').append('<div class="wcgs-thumb swiper-slide"><img alt="' + caption + '" src="' + item.thumb_url + '" data-type="youtube" data-image="' + item.url + '" /></div>');
									}
									video_showed = true;
								}
							} else {
								$('#wpgs-gallery .wcgs-carousel .swiper-wrapper').append('<div class="swiper-slide"><div class="wcgs-slider-image"><a class="wcgs-slider-lightbox" href="' + item.full_url + '" data-fancybox="view" aria-label="lightbox"></a><img alt="' + caption + '" src="' + item.url + '" data-image="' + item.full_url + '" /></div></div>');

								$('#wpgs-gallery .gallery-navigation-carousel .swiper-wrapper').append('<div class="wcgs-thumb swiper-slide"><img alt="' + caption + '" src="' + item.thumb_url + '" data-image="' + item.url + '" /></div>');
							}

						}
					});
					// Perform actions after images are loaded.
					$('#wpgs-gallery').wpgspimagesLoaded().then(function () {
						setTimeout(function () {
							// Check if zoom is enabled and apply zoom functionality.
							if (wcgs_zoom) {
								dataZoom();
								zoomEffect();
							}
							initializeYouTubeVideos();
							// Add video icon, lightbox functionality, and remove preloader.
							videoIcon();
							wcgsLightbox();
							$('.wcgs-gallery-preloader').css('z-index', -99);
							$('.wcgs-gallery-preloader').css('opacity', 0);
							setTimeout(() => {
								$('#wpgs-gallery').removeClass('wcgs-transition-none');
							}, 600);
						}, 200);
					});
				}
			}

		});
		// Fix the conflict of Variation Swatches plugin.
		$(document).on('click', '.wcgs-gallery-slider .variations .select-option.swatch-wrapper', function (e) {
			var $this = $(this);
			var $option_wrapper = $this.closest('div.select').eq(0);
			var $wc_select_box = $option_wrapper.find('select').first();
			$wc_select_box.trigger('change');
		});

	});
})(jQuery);
