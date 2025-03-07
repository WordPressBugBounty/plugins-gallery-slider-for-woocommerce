; (function ($) {

	const hash = window.location.hash.replace('#', '');
	$(window).on('hashchange', function() {
		let hash = window.location.hash.replace('#', '').split('#')[1];
		// if ('get-started' === hash || 'recommended' === hash || 'lite-to-pro' === hash || 'about-us' === hash) {
		// 	$('.wcgs-nav.wcgs-nav-options ul li:last-child a').addClass('wcgs-section-active');
		// 	$('#wcgs-section-help').show();
		// }
		// if( !hash ) {
		// 	$('#wcgs-section-help').hide();
		// }
	})
	// Help page tab menu script.
	$('.sp-woo-gallery-slider-help').on('click', '.wcgs-header-nav-menu a', function (e) {
		if ($(this).hasClass('active')) {
			return;
		}
		let tabId = $(this).attr('data-id');
		$('.wcgs-header-nav-menu a').each((i, item) => {
			$(item).removeClass('active');
			$('#' + $(item).attr('data-id')).css('display', 'none');
		})
		$(this).addClass('active');

		$('#' + tabId).css('display', 'block');
	})
	if ('recommended' === hash) {
		$('.sp-woo-gallery-slider-help .wcgs-header-nav-menu a[data-id="recommended-tab"]').trigger('click');
	}
	if ('lite-to-pro' === hash) {
		$('.sp-woo-gallery-slider-help .wcgs-header-nav-menu a[data-id="lite-to-pro-tab"]').trigger('click');
	}
	if ('about-us' === hash) {
		$('.sp-woo-gallery-slider-help .wcgs-header-nav-menu a[data-id="about-us-tab"]').trigger('click');
	}

	$('body').on('click', '.install-now', function (e) {
		var _this = $(this);
		var _href = _this.attr('href');

		_this.addClass('updating-message').html('Installing...');

		$.get(_href, function (data) {
			location.reload();
		});

		e.preventDefault();
	});

})(jQuery);