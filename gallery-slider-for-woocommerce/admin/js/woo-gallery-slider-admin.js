jQuery(document).ready(function ($) {
	'use strict';

	/*
	 * The images of a variation gallery: its hidden field holds JSON "[12,34]"
	 * (older data may hold "12,34").
	 */
	function readGallery(field) {
		var value = $.trim(String(field.val() || '')).replace(/^\[|\]$/g, '');
		if (value === '') {
			return [];
		}
		return $.map(value.split(','), function (id) {
			id = parseInt(id, 10);
			return id > 0 ? id : null;
		});
	}

	/*
	 * Store a media selection in a variation gallery's field (all of it, as
	 * 3.x did) and show its first `data-limit` images (2 in the free
	 * version), with the "Upgrade to Pro" notice when it holds more.
	 */
	function renderGallery(variationID, models) {
		var gallery = $('.wcgs-gallery-items' + variationID);
		var buttons = gallery.next('p');
		var limit = parseInt(gallery.data('limit'), 10) || 0;
		var ids = [];
		gallery.empty();
		$.each(models, function (index, attachment) {
			var item = attachment.toJSON();
			ids.push(item.id);
			if (limit && ids.length > limit) {
				return;
			}
			var wcgsCompat = item.compat && item.compat.item ? item.compat.item : '';
			var videoLink = $(wcgsCompat).find('.compat-field-wcgs_video input').val() || '';
			var hasVideo = videoLink.length > 0;
			var sizes = item.sizes || {};
			var itemUrl = sizes.thumbnail ? sizes.thumbnail.url : (sizes.full ? sizes.full.url : item.url);
			var image = $('<div class="wcgs-image"><img style="max-width:100%;display:inline-block;" /><div class="wcgs-image-remover"><span class="dashicons dashicons-no"></span></div></div>');
			image.attr('data-attachmentid', item.id).find('img').attr('src', itemUrl);
			if (hasVideo) {
				image.addClass('wcgs-video').append('<div class="wcgs-video-icons"><i class="dashicons dashicons-video-alt3"></i></div>');
			}
			gallery.append(image);
		});
		gallery.parents('.woocommerce_variable_attributes').find('.wcgs-gallery').val(ids.length ? JSON.stringify(ids) : '').trigger('change');
		buttons.find('.wcgs-upload-image').toggle(ids.length === 0);
		buttons.find('.wcgs-edit, .wcgs-remove-all-images, .wcgs-upload-more-image').toggle(ids.length > 0);
		buttons.find('.wcgs-pro-notice').toggleClass('hidden', !(limit && models.length > limit)).toggle(!!(limit && models.length > limit));
	}

	function variationSelector(element) {
		return '#' + $(element).parents('.woocommerce_variation').find('.variable_post_id').val();
	}

	/*
	* Upload image(s) event
	*/
	$(document).on('click', '.wcgs-upload-image', function (e) {
		e.preventDefault();
		var variationID = variationSelector(this);
		var wcgsGalleryUploader = wp.media({
			library: {
				type: 'image'
			},
			frame: 'post',
			state: 'gallery',
			multiple: true
		});
		wcgsGalleryUploader.open();
		// The button shows only while the gallery is empty.
		wcgsGalleryUploader.on('update', function (selection) {
			renderGallery(variationID, selection.models);
		});
	});

	/*
	* Add more image and edit gallery events
	*/
	$(document).on('click', '.wcgs-upload-more-image, .wcgs-edit', function (e) {
		e.preventDefault();
		var variationID = variationSelector(this);
		var isAddMore = $(this).hasClass('wcgs-upload-more-image');
		var current = readGallery($(this).parents('.woocommerce_variable_attributes').find('.wcgs-gallery'));
		window.wp.media.gallery.edit('[gallery ids="' + current.join(',') + '"]').on('update', function (selection) {
			renderGallery(variationID, selection.models);
		});
		if (isAddMore) {
			$(document).find(".media-menu-item:contains('Add to Gallery')").click();
		}
	});

	/*
	 * Remove image event
	 */
	$(document).on('click', '.wcgs-remove-all-images', function (e) {
		e.preventDefault();
		var variationID = variationSelector(this);
		$('.wcgs-gallery-items' + variationID).find('.wcgs-image').remove();
		$('.wcgs-gallery-items' + variationID).parents('.woocommerce_variable_attributes').find('.wcgs-gallery').val('').trigger('change');
		$(this).hide();
		$(this).siblings('.wcgs-upload-more-image').hide();
		$(this).siblings('.wcgs-edit').hide();
		$(this).siblings('.wcgs-upload-image').show();
		$(this).siblings('.wcgs-pro-notice').hide();
	});

	// Single remover
	$(document).on('click', '.wcgs-image-remover', function (e) {
		e.preventDefault();
		var variationID = variationSelector(this);
		var attachmentID = parseInt($(this).parent('.wcgs-image').data('attachmentid'), 10);
		var field = $(this).parents('.woocommerce_variable_attributes').find('.wcgs-gallery');
		var wcgsAttachmentArr = readGallery(field);
		var index = wcgsAttachmentArr.indexOf(attachmentID);
		if (index > -1) {
			wcgsAttachmentArr.splice(index, 1);
		}
		$(this).parent('.wcgs-image').remove();
		field.val(wcgsAttachmentArr.length ? JSON.stringify(wcgsAttachmentArr) : '').trigger('change');

		var buttons = $('.wcgs-gallery-items' + variationID).next('p');
		var limit = parseInt($('.wcgs-gallery-items' + variationID).data('limit'), 10) || 0;
		// A stored image beyond the limit moves up: draw the gallery again.
		if (limit && wcgsAttachmentArr.length > $('.wcgs-gallery-items' + variationID).find('.wcgs-image').length && window.wp && wp.media) {
			var models = wcgsAttachmentArr.map(function (id) {
				return wp.media.attachment(id);
			});
			$.when.apply($, models.map(function (model) {
				return model.fetch();
			})).always(function () {
				renderGallery(variationID, models);
			});
			return;
		}
		buttons.find('.wcgs-pro-notice').toggle(!!(limit && wcgsAttachmentArr.length > limit));
		if (wcgsAttachmentArr.length === 0) {
			buttons.find('.wcgs-upload-image').show();
			buttons.find('.wcgs-edit, .wcgs-remove-all-images, .wcgs-upload-more-image').hide();
		}
	});

	/**
	 * Whether an attachment in WooCommerce core's variation gallery has a video.
	 * An attachment the media modal has loaded is read from its compat fields
	 * (they follow a video link edited there); any other from the IDs the
	 * server listed in `.wcgs-core-gallery-video-ids`.
	 *
	 * @param {string}   id            Attachment ID.
	 * @param {string[]} savedVideoIds Saved attachment IDs that have a video.
	 * @return {boolean} Whether the attachment has a video link.
	 */
	function wcgsCoreAttachmentHasVideo(id, savedVideoIds) {
		var hasVideo = savedVideoIds.indexOf(id) !== -1;
		if (window.wp && wp.media && typeof wp.media.attachment === 'function') {
			var compat = wp.media.attachment(id).get('compat');
			if (compat && typeof compat.item === 'string') {
				var videoLink = $('<table>' + compat.item + '</table>').find('.compat-field-wcgs_video input').val();
				hasVideo = !!(videoLink && $.trim(videoLink).length);
			}
		}
		return hasVideo;
	}

	/**
	 * Saved attachment IDs with a video in a variation row (core gallery mode).
	 *
	 * @param {jQuery} $variation Variation row.
	 * @return {string[]} Attachment IDs.
	 */
	function wcgsCoreSavedVideoIds($variation) {
		return String($variation.find('.wcgs-core-gallery-video-ids').val() || '').split(',');
	}

	/**
	 * Put the video icon on the thumbnails and the large image of WooCommerce
	 * core's variation gallery field that have a video. Core rebuilds its
	 * thumbnails and swaps the large image, so this runs after each change.
	 *
	 * @param {jQuery} $variation Variation row.
	 */
	function wcgsMarkCoreVideos($variation) {
		var savedVideoIds = wcgsCoreSavedVideoIds($variation);
		$variation.find('.wc-variation-gallery-thumb').each(function () {
			var id = String($(this).attr('data-attachment_id') || '');
			$(this).toggleClass('wcgs-has-video', '' !== id && wcgsCoreAttachmentHasVideo(id, savedVideoIds));
		});
		$variation.find('.wc-variation-gallery-field__hero').each(function () {
			var heroId = String($(this).find('.wc-variation-gallery-field__hero-img').attr('data-id') || '');
			$(this).toggleClass('wcgs-has-video', '' !== heroId && wcgsCoreAttachmentHasVideo(heroId, savedVideoIds));
		});
	}

	// Core shows the clicked thumbnail as the large image without a change event.
	$(document).on('click', '.wc-variation-gallery-thumb__button', function () {
		wcgsMarkCoreVideos($(this).closest('.woocommerce_variation'));
	});

	// Image and video count badge in the variation row header.
	$(document).on('change', '.woocommerce_variation', function () {
		$('.woocommerce_variation').each(function () {
			var _this = $(this);
			var variationID = '#' + _this.find('.variable_post_id').val();
			var $legacyItems = $('.wcgs-gallery-items' + variationID);
			var $coreIds = _this.find('.wc-variation-gallery-image-ids');
			var $item_length = 0;
			var $video_length = 0;
			// Core's field can show next to the plugin's when the site turns the core gallery off for the plugin.
			wcgsMarkCoreVideos(_this);
			if ($legacyItems.length) {
				$video_length = $legacyItems.find(' .wcgs-image .wcgs-video-icons').length;
				$item_length = $legacyItems.find('.wcgs-image').length;
				var upload_image_id = _this.find('.upload_image_id').val();
				if (upload_image_id && upload_image_id != '0') {
					$item_length = $item_length + 1;
				}
			} else if ($coreIds.length) {
				// WooCommerce core's variation gallery: its hidden input lists the
				// variation image followed by the gallery.
				var savedVideoIds = wcgsCoreSavedVideoIds(_this);
				var coreIds = $.grep(String($coreIds.val() || '').split(','), function (id) {
					return /^\d+$/.test($.trim(id)) && '0' !== $.trim(id);
				});
				$item_length = coreIds.length;
				$.each(coreIds, function (index, id) {
					if (wcgsCoreAttachmentHasVideo($.trim(id), savedVideoIds)) {
						$video_length++;
					}
				});
			} else {
				return;
			}
			var $image_length = $item_length - $video_length;
			if (_this.find('.wcgs-variation-number').length == 0 && $item_length > 0) {
				_this.find('h3').append('<span class="wcgs-variation-number"><span class="image-count">' + $image_length + ' Image</span> <span class="video-count">' + $video_length + ' Video</span></span>');
			}
			if ($item_length > 0) {
				var $image_length_content = $image_length > 1 ? $image_length + " Images" : $image_length + " Image";
				var $video_length_content = $video_length > 1 ? $video_length + " Videos" : $video_length + " Video";
				_this.find('h3 .image-count').html($image_length_content);
				_this.find('h3 .video-count').html($video_length_content);
				_this.find('h3 .video-count').toggleClass('hidden', $video_length < 1);
				_this.find('h3 .image-count').toggleClass('hidden', $image_length < 1);
			} else {
				// Every image was removed: hide the stale counts.
				_this.find('h3 .image-count, h3 .video-count').addClass('hidden');
			}
		});
	});
	// Variation gallery show under variation image
	$(document).on('click', '.woocommerce_variation', function () {
		var galleryHTML = $(this).find('.wcgs-variation-gallery');
		var galleryHTML_length = $(this).find('.wcgs-variation-gallery+.form-row.form-row-full.options').length;
		if (!galleryHTML_length) {
			$(this).find('.form-row.form-row-full.options').eq(0).before($(galleryHTML));
		}
	});
});
