/**
 * -----------------------------------------------------------
 *
 * Shapedplugin Framework
 *
 * -----------------------------------------------------------
 *
 */
; (function ($, window, document, undefined) {
  'use strict';

  //
  // Constants
  //
  var WCGS = WCGS || {};

  WCGS.funcs = {};

  WCGS.vars = {
    onloaded: false,
    $body: $('body'),
    $window: $(window),
    $document: $(document),
    is_rtl: $('body').hasClass('rtl'),
    code_themes: [],
  };

  //
  // Helper Functions
  //
  WCGS.helper = {

    //
    // Generate UID
    //
    uid: function (prefix) {
      return (prefix || '') + Math.random().toString(36).substr(2, 9);
    },

    // Quote regular expression characters
    //
    preg_quote: function (str) {
      return (str + '').replace(/(\[|\-|\])/g, "\\$1");
    },

    //
    // Reneme input names
    //
    name_nested_replace: function ($selector, field_id) {

      var checks = [];
      var regex = new RegExp('(' + WCGS.helper.preg_quote(field_id) + ')\\[(\\d+)\\]', 'g');

      $selector.find(':radio').each(function () {
        if (this.checked || this.orginal_checked) {
          this.orginal_checked = true;
        }
      });

      $selector.each(function (index) {
        $(this).find(':input').each(function () {
          this.name = this.name.replace(regex, field_id + '[' + index + ']');
          if (this.orginal_checked) {
            this.checked = true;
          }
        });
      });

    },

    //
    // Debounce
    //
    debounce: function (callback, threshold, immediate) {
      var timeout;
      return function () {
        var context = this, args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) {
            callback.apply(context, args);
          }
        };
        var callNow = (immediate && !timeout);
        clearTimeout(timeout);
        timeout = setTimeout(later, threshold);
        if (callNow) {
          callback.apply(context, args);
        }
      };
    },

    //
    // Get a cookie
    //
    get_cookie: function (name) {

      var e, b, cookie = document.cookie, p = name + '=';

      if (!cookie) {
        return;
      }

      b = cookie.indexOf('; ' + p);

      if (b === -1) {
        b = cookie.indexOf(p);

        if (b !== 0) {
          return null;
        }
      } else {
        b += 2;
      }

      e = cookie.indexOf(';', b);

      if (e === -1) {
        e = cookie.length;
      }

      return decodeURIComponent(cookie.substring(b + p.length, e));

    },

    //
    // Set a cookie
    //
    set_cookie: function (name, value, expires, path, domain, secure) {

      var d = new Date();

      if (typeof (expires) === 'object' && expires.toGMTString) {
        expires = expires.toGMTString();
      } else if (parseInt(expires, 10)) {
        d.setTime(d.getTime() + (parseInt(expires, 10) * 1000));
        expires = d.toGMTString();
      } else {
        expires = '';
      }

      document.cookie = name + '=' + encodeURIComponent(value) +
        (expires ? '; expires=' + expires : '') +
        (path ? '; path=' + path : '') +
        (domain ? '; domain=' + domain : '') +
        (secure ? '; secure' : '');

    },

    //
    // Remove a cookie
    //
    remove_cookie: function (name, path, domain, secure) {
      WCGS.helper.set_cookie(name, '', -1000, path, domain, secure);
    },

  };

  //
  // Custom clone for textarea and select clone() bug
  //
  $.fn.wcgs_clone = function () {

    var base = $.fn.clone.apply(this, arguments),
      clone = this.find('select').add(this.filter('select')),
      cloned = base.find('select').add(base.filter('select'));

    for (var i = 0; i < clone.length; ++i) {
      for (var j = 0; j < clone[i].options.length; ++j) {

        if (clone[i].options[j].selected === true) {
          cloned[i].options[j].selected = true;
        }

      }
    }

    this.find(':radio').each(function () {
      this.orginal_checked = this.checked;
    });

    return base;

  };

  //
  // Expand All Options
  //
  $.fn.wcgs_expand_all = function () {
    return this.each(function () {
      $(this).on('click', function (e) {

        e.preventDefault();
        $('.wcgs-wrapper').toggleClass('wcgs-show-all');
        $('.wcgs-section').wcgs_reload_script();
        $(this).find('.fa').toggleClass('fa-indent').toggleClass('fa-outdent');

      });
    });
  };

  //
  // Options Navigation
  //
  $.fn.wcgs_nav_options = function () {
    return this.each(function () {

      var $nav = $(this),
        $links = $nav.find('a'),
        $hidden = $nav.closest('.wcgs').find('.wcgs-section-id'),
        $last_section;

      $(window).on('hashchange', function () {

        var hash = window.location.hash.match(new RegExp('tab=([^&]*)'));
        var slug = hash ? hash[1] : $links.first().attr('href').replace('#tab=', '');
        var $link = $('#wcgs-tab-link-' + slug);



        if ($link.length > 0) {
          $link.closest('.wcgs-tab-depth-0').addClass('wcgs-tab-active').siblings().removeClass('wcgs-tab-active');
          $links.removeClass('wcgs-section-active');
          $link.addClass('wcgs-section-active');

          if ($last_section !== undefined) {
            $last_section.hide();
          }

          var $section = $('#wcgs-section-' + slug);
          $section.css({ display: 'block' });
          $section.wcgs_reload_script();

          $hidden.val(slug);

          $last_section = $section;

        }

      }).trigger('hashchange');

    });
  };
  $(document).on('click', '.wcgs-tabbed-nav a', function (event) {
		var gallery_last_open_tab = $(this).attr('id');
		WCGS.helper.set_cookie('wcgs-gallery-last-open-tab', gallery_last_open_tab);
	});
  //
  // Metabox Tabs
  //
  $.fn.wcgs_nav_metabox = function () {
    return this.each(function () {

      var $nav = $(this),
        $links = $nav.find('a'),
        unique_id = $nav.data('unique'),
        post_id = $('#post_ID').val() || 'global',
        $last_section,
        $last_link;

      $links.on('click', function (e) {

        e.preventDefault();

        var $link = $(this),
          section_id = $link.data('section');

        if ($last_link !== undefined) {
          $last_link.removeClass('wcgs-section-active');
        }

        if ($last_section !== undefined) {
          $last_section.hide();
        }

        $link.addClass('wcgs-section-active');

        var $section = $('#wcgs-section-' + section_id);
        $section.css({ display: 'block' });
        $section.wcgs_reload_script();

        WCGS.helper.set_cookie('wcgs-last-metabox-tab-' + post_id + '-' + unique_id, section_id);

        $last_section = $section;
        $last_link = $link;

      });

      var get_cookie = WCGS.helper.get_cookie('wcgs-last-metabox-tab-' + post_id + '-' + unique_id);

      if (get_cookie) {
        $nav.find('a[data-section="' + get_cookie + '"]').trigger('click');
      } else {
        $links.first('a').trigger('click');
      }

    });
  };

  //
  // Search
  //
  $.fn.wcgs_search = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('input');

      $input.on('change keyup', function () {

        var value = $(this).val(),
          $wrapper = $('.wcgs-wrapper'),
          $section = $wrapper.find('.wcgs-section'),
          $fields = $section.find('> .wcgs-field:not(.hidden)'),
          $titles = $fields.find('> .wcgs-title, .wcgs-search-tags');

        if (value.length > 3) {

          $fields.addClass('wcgs-hidden');
          $wrapper.addClass('wcgs-search-all');

          $titles.each(function () {

            var $title = $(this);

            if ($title.text().match(new RegExp('.*?' + value + '.*?', 'i'))) {

              var $field = $title.closest('.wcgs-field');

              $field.removeClass('wcgs-hidden');
              $field.parent().wcgs_reload_script();

            }

          });

        } else {

          $fields.removeClass('wcgs-hidden');
          $wrapper.removeClass('wcgs-search-all');

        }

      });

    });
  };

  //
  // Sticky Header
  //
  $.fn.wcgs_sticky = function () {
    return this.each(function () {

      var $this = $(this),
        $window = $(window),
        $inner = $this.find('.wcgs-header-inner'),
        padding = parseInt($inner.css('padding-left')) + parseInt($inner.css('padding-right')),
        offset = 32,
        scrollTop = 0,
        lastTop = 0,
        ticking = false,
        stickyUpdate = function () {

          var offsetTop = $this.offset().top,
            stickyTop = Math.max(offset, offsetTop - scrollTop),
            winWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

          if (stickyTop <= offset && winWidth > 782) {
            $inner.css({ width: $this.outerWidth() - padding });
            $this.css({ height: $this.outerHeight() }).addClass('wcgs-sticky');
          } else {
            $inner.removeAttr('style');
            $this.removeAttr('style').removeClass('wcgs-sticky');
          }

        },
        requestTick = function () {

          if (!ticking) {
            requestAnimationFrame(function () {
              stickyUpdate();
              ticking = false;
            });
          }

          ticking = true;

        },
        onSticky = function () {

          scrollTop = $window.scrollTop();
          requestTick();

        };

      $window.on('scroll resize', onSticky);

      onSticky();

    });
  };

  //
  // Dependency System
  //
  $.fn.wcgs_dependency = function () {
    return this.each(function () {

      var $this = $(this),
        ruleset = $.wcgs_deps.createRuleset(),
        depends = [],
        is_global = false;

      $this.children('[data-controller]').each(function () {

        var $field = $(this),
          controllers = $field.data('controller').split('|'),
          conditions = $field.data('condition').split('|'),
          values = $field.data('value').toString().split('|'),
          rules = ruleset;

        if ($field.data('depend-global')) {
          is_global = true;
        }

        $.each(controllers, function (index, depend_id) {

          var value = values[index] || '',
            condition = conditions[index] || conditions[0];

          rules = rules.createRule('[data-depend-id="' + depend_id + '"]', condition, value);

          rules.include($field);

          depends.push(depend_id);

        });

      });

      if (depends.length) {

        if (is_global) {
          $.wcgs_deps.enable(WCGS.vars.$body, ruleset, depends);
        } else {
          $.wcgs_deps.enable($this, ruleset, depends);
        }

      }

    });
  };

  //
  // Field: code_editor
  //
  $.fn.wcgs_field_code_editor = function () {
    return this.each(function () {

      if (typeof CodeMirror !== 'function') { return; }

      var $this = $(this),
        $textarea = $this.find('textarea'),
        $inited = $this.find('.CodeMirror'),
        data_editor = $textarea.data('editor');

      if ($inited.length) {
        $inited.remove();
      }

      var interval = setInterval(function () {
        if ($this.is(':visible')) {

          var code_editor = CodeMirror.fromTextArea($textarea[0], data_editor);

          // load code-mirror theme css.
          if (data_editor.theme !== 'default' && WCGS.vars.code_themes.indexOf(data_editor.theme) === -1) {

            var $cssLink = $('<link>');

            $('#wcgs-codemirror-css').after($cssLink);

            $cssLink.attr({
              rel: 'stylesheet',
              id: 'wcgs-codemirror-' + data_editor.theme + '-css',
              href: data_editor.cdnURL + '/theme/' + data_editor.theme + '.min.css',
              type: 'text/css',
              media: 'all'
            });

            WCGS.vars.code_themes.push(data_editor.theme);

          }

          CodeMirror.modeURL = data_editor.cdnURL + '/mode/%N/%N.min.js';
          CodeMirror.autoLoadMode(code_editor, data_editor.mode);

          code_editor.on('change', function (editor, event) {
            $textarea.val(code_editor.getValue()).trigger('change');
          });

          clearInterval(interval);

        }
      });

    });
  };


  //
  // Field: slider
  //
  $.fn.wcgs_field_slider = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('input'),
        $slider = $this.find('.wcgs-slider-ui'),
        data = $input.data(),
        value = $input.val() || 0;

      if ($slider.hasClass('ui-slider')) {
        $slider.empty();
      }

      $slider.slider({
        range: 'min',
        value: value,
        min: data.min,
        max: data.max,
        step: data.step,
        slide: function (e, o) {
          $input.val(o.value).trigger('change');
        }
      });

      $input.on('keyup', function () {
        $slider.slider('value', $input.val());
      });

    });
  };


  //
  // Field: spinner
  //
  $.fn.wcgs_field_spinner = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('input'),
        $inited = $this.find('.ui-spinner-button');

      if ($inited.length) {
        $inited.remove();
      }

      $input.spinner({
        max: $input.data('max') || 100,
        min: $input.data('min') || 0,
        step: $input.data('step') || 1,
        spin: function (event, ui) {
          $input.val(ui.value).trigger('change');
        }
      });


    });
  };

  //
  // Field: switcher
  //
  $.fn.wcgs_field_switcher = function () {
    return this.each(function () {

      var $switcher = $(this).find('.wcgs--switcher');

      $switcher.on('click', function () {

        var value = 0;
        var $input = $switcher.find('input');

        if ($switcher.hasClass('wcgs--active')) {
          $switcher.removeClass('wcgs--active');
        } else {
          value = 1;
          $switcher.addClass('wcgs--active');
        }

        $input.val(value).trigger('change');

      });

    });
  };


  //
  // Confirm
  //
  $.fn.wcgs_confirm = function () {
    return this.each(function () {
      $(this).on('click', function (e) {

        var confirm_text = $(this).data('confirm') || window.wcgs_vars.i18n.confirm;
        var confirm_answer = confirm(confirm_text);
        WCGS.vars.is_confirm = true;

        if (!confirm_answer) {
          e.preventDefault();
          WCGS.vars.is_confirm = false;
          return false;
        }

      });
    });
  };

  $.fn.serializeObject = function () {

    var obj = {};

    $.each(this.serializeArray(), function (i, o) {
      var n = o.name,
        v = o.value;

      obj[n] = obj[n] === undefined ? v
        : $.isArray(obj[n]) ? obj[n].concat(v)
          : [obj[n], v];
    });

    return obj;

  };

  //
  // Options Save
  //
  $.fn.wcgs_save = function () {
    return this.each(function () {

      var $this = $(this),
        $buttons = $('.wcgs-save'),
        $panel = $('.wcgs-options'),
        flooding = false,
        timeout;

      $this.on('click', function (e) {

        if (!flooding) {

          var $text = $this.data('save'),
            $value = $this.val();

          $buttons.attr('value', $text);

          if ($this.hasClass('wcgs-save-ajax')) {

            e.preventDefault();

            $panel.addClass('wcgs-saving');
            $buttons.prop('disabled', true);

            window.wp.ajax.post('wcgs_' + $panel.data('unique') + '_ajax_save', {
              data: $('#wcgs-form').serializeJSONWCGS()
            })
              .done(function (response) {

                clearTimeout(timeout);

                var $result_success = $('.wcgs-form-success');

                $result_success.empty().append(response.notice).slideDown('fast', function () {
                  timeout = setTimeout(function () {
                    $result_success.slideUp('fast');
                  }, 2000);
                });

                // clear errors
                $('.wcgs-error').remove();

                var $append_errors = $('.wcgs-form-error');

                $append_errors.empty().hide();

                if (Object.keys(response.errors).length) {

                  var error_icon = '<i class="wcgs-label-error wcgs-error">!</i>';

                  $.each(response.errors, function (key, error_message) {

                    var $field = $('[data-depend-id="' + key + '"]'),
                      $link = $('#wcgs-tab-link-' + ($field.closest('.wcgs-section').index() + 1)),
                      $tab = $link.closest('.wcgs-tab-depth-0');

                    $field.closest('.wcgs-fieldset').append('<p class="wcgs-text-error wcgs-error">' + error_message + '</p>');

                    if (!$link.find('.wcgs-error').length) {
                      $link.append(error_icon);
                    }

                    if (!$tab.find('.wcgs-arrow .wcgs-error').length) {
                      $tab.find('.wcgs-arrow').append(error_icon);
                    }

                    console.log(error_message);

                    $append_errors.append('<div>' + error_icon + ' ' + error_message + '</div>');

                  });

                  $append_errors.show();

                }

                $panel.removeClass('wcgs-saving');
                $buttons.prop('disabled', false).attr('value', $value);
                flooding = false;

              })
              .fail(function (response) {
                wcgs-alert(response.error);
              });

          }

        }

        flooding = true;

      });

    });
  };


  //
  // Helper Checkbox Checker
  //
  $.fn.wcgs_checkbox = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('.wcgs--input'),
        $checkbox = $this.find('.wcgs--checkbox');

      $checkbox.on('click', function () {
        $input.val(Number($checkbox.prop('checked'))).trigger('change');
      });

    });
  };

  //
  // Siblings
  //
  $.fn.wcgs_siblings = function () {
    return this.each(function () {

      var $this = $(this),
        $siblings = $this.find('.wcgs--sibling:not(.wcgs-pro-only)'),
        multiple = $this.data('multiple') || false;
      $this.find('.wcgs--sibling.wcgs-pro-only').find('input').prop('disable', true)
      $siblings.on('click', function () {

        var $sibling = $(this);

        if (multiple) {
          if ($sibling.hasClass('wcgs--active')) {
            $sibling.removeClass('wcgs--active');
            $sibling.find('input').prop('checked', false).trigger('change');
          } else {
            $sibling.addClass('wcgs--active');
            $sibling.find('input').prop('checked', true).trigger('change');
          }
        } else {
          $this.find('input').prop('checked', false);
          $sibling.find('input').prop('checked', true).trigger('change');
          $sibling.addClass('wcgs--active').siblings().removeClass('wcgs--active');
        }
      });
    });
  };

  //
  // WP Color Picker
  //
  if (typeof Color === 'function') {

    Color.fn.toString = function () {

      if (this._alpha < 1) {
        return this.toCSS('rgba', this._alpha).replace(/\s+/g, '');
      }

      var hex = parseInt(this._color, 10).toString(16);

      if (this.error) { return ''; }

      if (hex.length < 6) {
        for (var i = 6 - hex.length - 1; i >= 0; i--) {
          hex = '0' + hex;
        }
      }

      return '#' + hex;

    };

  }

  WCGS.funcs.parse_color = function (color) {

    var value = color.replace(/\s+/g, ''),
      trans = (value.indexOf('rgba') !== -1) ? parseFloat(value.replace(/^.*,(.+)\)/, '$1') * 100) : 100,
      rgba = (trans < 100) ? true : false;

    return { value: value, transparent: trans, rgba: rgba };

  };

  $.fn.wcgs_color = function () {
    return this.each(function () {

      var $input = $(this),
        picker_color = WCGS.funcs.parse_color($input.val()),
        palette_color = window.wcgs_vars.color_palette.length ? window.wcgs_vars.color_palette : true,
        $container;

      // Destroy and Reinit
      if ($input.hasClass('wp-color-picker')) {
        $input.closest('.wp-picker-container').after($input).remove();
      }

      $input.wpColorPicker({
        palettes: palette_color,
        change: function (event, ui) {

          var ui_color_value = ui.color.toString();

          $container.removeClass('wcgs--transparent-active');
          $container.find('.wcgs--transparent-offset').css('background-color', ui_color_value);
          $input.val(ui_color_value).trigger('change');

        },
        create: function () {

          $container = $input.closest('.wp-picker-container');

          var a8cIris = $input.data('a8cIris'),
            $transparent_wrap = $('<div class="wcgs--transparent-wrap">' +
              '<div class="wcgs--transparent-slider"></div>' +
              '<div class="wcgs--transparent-offset"></div>' +
              '<div class="wcgs--transparent-text"></div>' +
              '<div class="wcgs--transparent-button button button-small">transparent</div>' +
              '</div>').appendTo($container.find('.wp-picker-holder')),
            $transparent_slider = $transparent_wrap.find('.wcgs--transparent-slider'),
            $transparent_text = $transparent_wrap.find('.wcgs--transparent-text'),
            $transparent_offset = $transparent_wrap.find('.wcgs--transparent-offset'),
            $transparent_button = $transparent_wrap.find('.wcgs--transparent-button');

          if ($input.val() === 'transparent') {
            $container.addClass('wcgs--transparent-active');
          }

          $transparent_button.on('click', function () {
            if ($input.val() !== 'transparent') {
              $input.val('transparent').trigger('change').removeClass('iris-error');
              $container.addClass('wcgs--transparent-active');
            } else {
              $input.val(a8cIris._color.toString()).trigger('change');
              $container.removeClass('wcgs--transparent-active');
            }
          });

          $transparent_slider.slider({
            value: picker_color.transparent,
            step: 1,
            min: 0,
            max: 100,
            slide: function (event, ui) {

              var slide_value = parseFloat(ui.value / 100);
              a8cIris._color._alpha = slide_value;
              $input.wpColorPicker('color', a8cIris._color.toString());
              $transparent_text.text((slide_value === 1 || slide_value === 0 ? '' : slide_value));

            },
            create: function () {

              var slide_value = parseFloat(picker_color.transparent / 100),
                text_value = slide_value < 1 ? slide_value : '';

              $transparent_text.text(text_value);
              $transparent_offset.css('background-color', picker_color.value);

              $container.on('click', '.wp-picker-clear', function () {

                a8cIris._color._alpha = 1;
                $transparent_text.text('');
                $transparent_slider.slider('option', 'value', 100);
                $container.removeClass('wcgs--transparent-active');
                $input.trigger('change');

              });

              $container.on('click', '.wp-picker-default', function () {

                var default_color = WCGS.funcs.parse_color($input.data('default-color')),
                  default_value = parseFloat(default_color.transparent / 100),
                  default_text = default_value < 1 ? default_value : '';

                a8cIris._color._alpha = default_value;
                $transparent_text.text(default_text);
                $transparent_slider.slider('option', 'value', default_color.transparent);

              });

              $container.on('click', '.wp-color-result', function () {
                $transparent_wrap.toggle();
              });

              $('body').on('click.wpcolorpicker', function () {
                $transparent_wrap.hide();
              });

            }
          });
        }
      });

    });
  };
  //
  // Field: tabbed
  //
  $.fn.wcgs_field_tabbed = function () {
    return this.each(function () {

      var $this = $(this),
        $links = $this.find('.wcgs-tabbed-nav a'),
        $sections = $this.find('.wcgs-tabbed-section');

      $sections.eq(0).wcgs_reload_script();

      $links.on('click', function (e) {

        e.preventDefault();

        var $link = $(this),
          index = $link.index(),
          $section = $sections.eq(index);

        $link.addClass('wcgs-tabbed-active').siblings().removeClass('wcgs-tabbed-active');
        $section.wcgs_reload_script();
        $section.removeClass('hidden').siblings().addClass('hidden');

      });

    });
  };
  //
  // ChosenJS
  //
  $.fn.wcgs_chosen = function () {
    return this.each(function () {

      var $this = $(this),
        $inited = $this.parent().find('.chosen-container'),
        is_multi = $this.attr('multiple') || false,
        set_width = is_multi ? '100%' : 'auto',
        set_options = $.extend({
          allow_single_deselect: true,
          disable_search_threshold: 15,
          width: set_width
        }, $this.data());

      if ($inited.length) {
        $inited.remove();
      }

      $this.chosen(set_options);

    });
  };

  //
  // Number (only allow numeric inputs)
  //
  $.fn.wcgs_number = function () {
    return this.each(function () {

      $(this).on('keypress', function (e) {

        if (e.keyCode !== 0 && e.keyCode !== 8 && e.keyCode !== 45 && e.keyCode !== 46 && (e.keyCode < 48 || e.keyCode > 57)) {
          return false;
        }

      });

    });
  };

  //
  // Help Tooltip
  //
  $.fn.wcgs_help = function () {
    return this.each(function () {

      var $this = $(this),
        $tooltip,
        offset_left;

      $this.on({
        mouseenter: function () {
          $tooltip = $('<div class="wcgs-tooltip"></div>').html($this.find('.wcgs-help-text').html()).appendTo('body');
          offset_left = (WCGS.vars.is_rtl) ? ($this.offset().left + 38) : ($this.offset().left + 38);

          $tooltip.css({
            top: $this.offset().top - (($tooltip.outerHeight() / 2) - 14),
            left: offset_left,
            textAlign: 'left',
          });

        },
        mouseleave: function () {
          if ($tooltip !== undefined) {
            if (!$tooltip.is(':hover')) {
              $tooltip.remove();
            }
          }
        }
      });
     // Event delegation to handle tooltip removal when the cursor leaves the tooltip itself.
      $('body').on('mouseleave', '.wcgs-tooltip', function () {
        if ($tooltip !== undefined) {
          $tooltip.remove();
        }
      });
    });
  };

  //
  // Customize Refresh
  //
  $.fn.wcgs_customizer_refresh = function () {
    return this.each(function () {

      var $this = $(this),
        $complex = $this.closest('.wcgs-customize-complex');

      if ($complex.length) {

        var $input = $complex.find(':input'),
          $unique = $complex.data('unique-id'),
          $option = $complex.data('option-id'),
          obj = $input.serializeObjectWCGS(),
          data = (!$.isEmptyObject(obj)) ? obj[$unique][$option] : '',
          control = wp.customize.control($unique + '[' + $option + ']');

        // clear the value to force refresh.
        control.setting._value = null;

        control.setting.set(data);

      } else {

        $this.find(':input').first().trigger('change');

      }

      $(document).trigger('wcgs-customizer-refresh', $this);

    });
  };

  //
  // Customize Listen Form Elements
  //
  $.fn.wcgs_customizer_listen = function (options) {

    var settings = $.extend({
      closest: false,
    }, options);

    return this.each(function () {

      if (window.wp.customize === undefined) { return; }

      var $this = (settings.closest) ? $(this).closest('.wcgs-customize-complex') : $(this),
        $input = $this.find(':input'),
        unique_id = $this.data('unique-id'),
        option_id = $this.data('option-id');

      if (unique_id === undefined) { return; }

      $input.on('change keyup', WCGS.helper.debounce(function () {

        var obj = $this.find(':input').serializeObjectWCGS();

        if (!$.isEmptyObject(obj) && obj[unique_id]) {

          window.wp.customize.control(unique_id + '[' + option_id + ']').setting.set(obj[unique_id][option_id]);

        }

      }, 250));

    });
  };

  //
  // Customizer Listener for Reload JS
  //
  $(document).on('expanded', '.control-section', function () {

    var $this = $(this);

    if ($this.hasClass('open') && !$this.data('inited')) {

      var $fields = $this.find('.wcgs-customize-field');
      var $complex = $this.find('.wcgs-customize-complex');

      if ($fields.length) {
        $this.wcgs_dependency();
        $fields.wcgs_reload_script({ dependency: false });
        $complex.wcgs_customizer_listen();
      }

      $this.data('inited', true);

    }

  });

  //
  // Window on resize
  //
  WCGS.vars.$window.on('resize wcgs.resize', WCGS.helper.debounce(function (event) {

    var window_width = navigator.userAgent.indexOf('AppleWebKit/') > -1 ? WCGS.vars.$window.width() : window.innerWidth;

    if (window_width <= 782 && !WCGS.vars.onloaded) {
      $('.wcgs-section').wcgs_reload_script();
      WCGS.vars.onloaded = true;
    }

  }, 200)).trigger('wcgs.resize');

  //
  // Retry Plugins
  //
  $.fn.wcgs_reload_script_retry = function () {
    return this.each(function () {

      var $this = $(this);

    });
  };

  //
  // Reload Plugins
  //
  $.fn.wcgs_reload_script = function (options) {

    var settings = $.extend({
      dependency: true,
    }, options);

    return this.each(function () {

      var $this = $(this);

      // Avoid for conflicts
      if (!$this.data('inited')) {

        // Field plugins
        $this.children('.wcgs-field-code_editor').wcgs_field_code_editor();
        $this.children('.wcgs-field-slider').wcgs_field_slider();
        //  $this.children('.wcgs-field-spinner').wcgs_field_spinner();
        $this.children('.wcgs-field-switcher:not(.pro_switcher)').wcgs_field_switcher();

        // Field colors
        $this.children('.wcgs-field-border').find('.wcgs-color').wcgs_color();
        $this.children('.wcgs-field-color').find('.wcgs-color').wcgs_color();
        $this.children('.wcgs-field-color_group').find('.wcgs-color').wcgs_color();

        // Field allows only number
        $this.children('.wcgs-field-dimensions').find('.wcgs-number').wcgs_number();
        $this.children('.wcgs-field-dimensions_res').find('.wcgs-number').wcgs_number();
        $this.children('.wcgs-field-slider').find('.wcgs-number').wcgs_number();
        $this.children('.wcgs-field-spacing').find('.wcgs-number').wcgs_number();
        $this.children('.wcgs-field-spinner').find('.wcgs-number').wcgs_number();

        // Field chosenjs
        $this.children('.wcgs-field-select').find('.wcgs-chosen').wcgs_chosen();

        // Field Checkbox
        $this.children('.wcgs-field-checkbox').find('.wcgs-checkbox').wcgs_checkbox();

        // Field Siblings
        $this.children('.wcgs-field-button_set').find('.wcgs-siblings').wcgs_siblings();
        $this.children('.wcgs-field-image_select').find('.wcgs-siblings').wcgs_siblings();
        $this.children('.wcgs-field-tabbed').wcgs_field_tabbed();
        // Help Tooptip
        $this.children('.wcgs-field').find('.wcgs-help').wcgs_help();

        if (settings.dependency) {
          $this.wcgs_dependency();
        }

        $this.data('inited', true);

        $(document).trigger('wcgs-reload-script', $this);

      }

    });
  };
  $(".spwg_shortcode .wcgs-fieldset input").on('click', function (e) {
		$(this).select();
		document.execCommand("copy");
		$(".spwg_shortcode .wcgs-fieldset").append('<div style="display: none;color:green;" class="wcgs-alert">Copied!</div>');
		setTimeout(() => {
			$(".wcgs-alert").fadeIn(200);
		}, 100);
		setTimeout(() => {
			$(".wcgs-alert").fadeOut(200);
		}, 1000);
		setTimeout(() => {
			$(".wcgs-alert").remove();
		}, 1500);
	});
  //
  // Document ready and run scripts
  //
  $(document).ready(function () {

    $('.wcgs-save').wcgs_save();
    $('.wcgs-confirm').wcgs_confirm();
    $('.wcgs-nav-options').wcgs_nav_options();
    $('.wcgs-nav-metabox').wcgs_nav_metabox();
    $('.wcgs-expand-all').wcgs_expand_all();
    $('.wcgs-search').wcgs_search();
    $('.wcgs-sticky-header').wcgs_sticky();
    $('.wcgs-onload').wcgs_reload_script();
    // Automatically activate the custom nested tab in the gallery tab upon page reload.
		setTimeout(() => {
			var wcgs_open_tab_cookie = WCGS.helper.get_cookie('wcgs-gallery-last-open-tab');
			if (wcgs_open_tab_cookie !== null && wcgs_open_tab_cookie.length > 2) {
				$(document).find('#' + wcgs_open_tab_cookie).trigger('click')
			}
		}, 200);
  });

  jQuery('.pro_only_field .wcgs-fieldset, .wcgs-field-switcher.pro_switcher .wcgs--switcher, .pro_only_slider .wcgs-table-cell, .pro_only_color .wcgs-fieldset,.wcgs-field-radio label.disabled, .pro_color_group .wcgs-field-color, .pro_slider  .wcgs-table, .pro_checkbox .wcgs-checkbox, .pro_only_field .wcgs--inputs, .pro_only_field input,.pro_only_field .wcgs--spin, .pro_only_field select, .pro_spinner .wcgs--spin, .pro_color .wcgs-field-color, .pro_border .wcgs-fieldset, .pro_dimensions .wcgs--inputs').on('click', function (e) {
    e.preventDefault();
    tb_show('', '#TB_inline?&width=440&height=225&inlineId=BuyProPopupContent');
  });
  /* Custom js */
  $("label:contains((Pro))").css({ 'pointer-events': 'none' });
  $("label:contains((Pro)) input, .pro_spinner input, .pro_checkbox input,.pro_dimensions option").attr('disabled', true).css('opacity', '0.8');
  $("label:contains((Pro)) input, .pro_spinner input,.pro_dimensions option").css('opacity', '0.8');
  $("select option:contains((Pro))").attr('disabled', true).css('opacity', '0.8');
  $(".pro_only_slider .wcgs-slider-ui").slider({ disabled: true });
  $(".pro_only_slider input").attr({ 'disabled': true, 'value': 1.5 }).css('opacity', '0.8');
  // Event handler for changing the icon type
  var selectedValue = $('.zoom_type').find('input:checked').val();
  if (selectedValue == 'in_side') {
    $('.zoom_type').find('.wcgs-text-desc').css('opacity', 0);
  } else {
    $('.zoom_type').find('.wcgs-text-desc').css('opacity', 1)
    if (selectedValue == 'right_side') {
      $('.zoom_type').find('.wcgs-text-desc span').html('Right Side Zoom')
      $('.zoom_type').find('.wcgs-text-desc').css('opacity', 1);
      }else{
        $('.zoom_type').find('.wcgs-text-desc span').html('Magnific Zoom')
        $('.zoom_type').find('.wcgs-text-desc').css('opacity', 1);
      }
  }
  $('.zoom_type').on('change', function () {
    var _this = $(this);
    setTimeout(() => {
      var selectedValue = _this.find('input:checked').val();
      if (selectedValue == 'in_side') {
        _this.find('.wcgs-text-desc').css('opacity', 0)
      } else {
        if (selectedValue == 'right_side') {
        _this.find('.wcgs-text-desc span').html('Right Side Zoom')
        _this.find('.wcgs-text-desc').css('opacity', 1);
        }else{
          _this.find('.wcgs-text-desc span').html('Magnific Zoom')
          _this.find('.wcgs-text-desc').css('opacity', 1);
        }
      }
    }, 100);
  });

  $(document).on('keyup change', '#wcgs-form', function (e) {
    e.preventDefault();
    var $button = $(this).find('.wcgs-save.wcgs-save-ajax');
    $button.css({ "background-color": "#00C263", "pointer-events": "initial" }).val('Save Settings');
  });
  $(".wcgs-save").on('click', function (e) {
    e.preventDefault();
    $(this).css({ "background-color": "#C5C5C6", "pointer-events": "none", "padding-left": "38px" }).val('Changes Saved');
  })
})(jQuery, window, document);
