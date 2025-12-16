$.fn.drawColsLine = function drawLine(data, colour, cols) {

		var el = $(this);

		function calculate(data, index, d) {
				var valueRatio = data[index] / 100 * d;
				return d - valueRatio;
		};

		data['sorted'] = data.sort(function(a, b) {
				return parseFloat(a.x, 10) - parseFloat(b.x, 10);
		});

		data['y'] = new Array();

		for (var i = 0; i < data['sorted'].length; i++) {
				data['y'][i] = data['sorted'][i].y;
		}

		var canvas = el[0],
				ctx = canvas.getContext('2d');

		var t = 0;
		var interval = setInterval(function() {
				var x = ((canvas.width / cols.length) + parseInt(cols.css('margin-left')) / 2) * t + ((canvas.width / (cols.length * 2)) - parseInt(cols.css('margin-left')));
				var y = calculate(data['y'], t, canvas.height);
				ctx.lineTo(x, y);
				ctx.strokeStyle = colour;
				ctx.moveTo(x, y);
				ctx.stroke();
				t = t + 1;
				if (t > data['sorted'].length) {
						clearInterval(interval);
				}
		}, 800 / data['sorted'].length);
};

$.fn.drawLine = function drawLine(data, colour) {

		function calculate(data, index, d, max) {
				var valueRatio = data[index] / max * d - 10;
				return d - valueRatio;
		};

		function getMax(data) {
				return Math.max.apply(null, data);
		}

		data['sorted'] = data.sort(function(a, b) {
				return parseFloat(a.x, 10) - parseFloat(b.x, 10);
		});
		data['x'] = new Array();
		data['y'] = new Array();

		for (var i = 0; i < data['sorted'].length; i++) {
				data['x'][i] = data['sorted'][i].x;
				data['y'][i] = data['sorted'][i].y;
		}

		var canvas = $(this)[0],
				ctx = canvas.getContext('2d'),
				maxx = getMax(data['x']),
				maxy = getMax(data['y']);

		setTimeout(function() {
				var t = 0;
				var interval = setInterval(function() {
						var x = canvas.width - calculate(data['x'], t, canvas.width, maxx);
						var y = calculate(data['y'], t, canvas.height, maxy);
						ctx.lineTo(x, y);
						ctx.strokeStyle = colour;
						ctx.moveTo(x, y);
						ctx.stroke();
						t = t + 1;
						if (t > data['sorted'].length) {
								clearInterval(interval);
						}
				}, 800 / data['sorted'].length);
		}, 500);
};

$(document).ready(function() {

		var data1 = [{
				x: 14.31,
				y: 12.31
		}, {
				x: 9.34,
				y: 10.34
		}, {
				x: 5.26,
				y: 10.26
		}, {
				x: 16,
				y: 9
		}, {
				x: 12.21,
				y: 8.21
		}, {
				x: 18.41,
				y: 13.41
		}, {
				x: 25.43,
				y: 14.43
		}, {
				x: 2.31,
				y: 23.31
		}, {
				x: 19.41,
				y: 13.41
		}, {
				x: 18.4,
				y: 11.4
		}, {
				x: 45.34,
				y: 28.34
		}, {
				x: 36.21,
				y: 29.21
		}];

		var linegraph = $('.line-only').find('canvas');
		linegraph.drawLine(data1, linegraph.css('border-color'));
		var $container = $('#container');
		// init
		$container.packery({
				itemSelector: '.card',
				gutter: 10,
				columnWidth: '.card'
		});
		var $window = $(window);
		revealOnScroll();
		$window.on('scroll', revealOnScroll);

		function revealOnScroll() {
				var rings = $('.ring-chart');
				var columns = $('.column-chart');
				var bars = $('.bar-chart');
				var colline = $('.line-column-chart');

				var data = new Array();

				rings.each(function() {
						var chart = $(this);
						var win_height_padded = $window.height() * 1.1;
						var scrolled = $window.scrollTop();
						var offsetTop = chart.parents('.chart-wrap').offset().top;
						var offsetBottom = chart.parents('.chart-wrap').offset().top + parseInt(chart.parents('.chart-wrap').outerHeight());
						/* Clipping */
						var width = chart.width();
						var height = chart.height();
						var clipmask = 'rect(0,' + width + 'px,' + height + 'px,' + width / 2 + 'px)';
						var clipfill = 'rect(0,' + width / 2 + 'px,' + height + 'px,0)';
						chart.find('.mask').css({
								'clip': clipmask
						});
						chart.find('.mask').find('.fill').css({
								'clip': clipfill
						});

						if (scrolled + win_height_padded > offsetTop) {
								/* Percentage */
								var per = parseInt(chart.attr('data-progress'));
								var csshalf = {
										'-webkit-transform': 'rotate(' + 180 * per / 100 + 'deg)',
										'transform': 'rotate(' + 180 * per / 100 + 'deg)'
								};
								var cssfull = {
										'-webkit-transform': 'rotate(' + 360 * per / 100 + 'deg)',
										'transform': 'rotate(' + 360 * per / 100 + 'deg)'
								};
								setTimeout(function() {
										chart.find('.mask.full').css(csshalf);
										chart.find('.fill').css(csshalf);
										chart.find('.fix').css(cssfull);
								}, 500);
						} else if (scrolled + win_height_padded < offsetTop) {
								var cssempty = {
										'-webkit-transform': 'rotate(0deg)',
										'transform': 'rotate(0deg)'
								};
								setTimeout(function() {
										chart.find('.mask.full').css(cssempty);
										chart.find('.fill').css(cssempty);
										chart.find('.fix').css(cssempty);
								}, 0);
						}
				});

				columns.each(function() {
						var parts = $(this).find('.column');
						var win_height_padded = $window.height() * 1.1;
						var scrolled = $window.scrollTop();
						var offsetTop = parts.parents('.chart-wrap').offset().top;
						var offsetBottom = parts.parents('.chart-wrap').offset().top + parseInt(parts.parents('.chart-wrap').outerHeight());

						if (scrolled + win_height_padded > offsetTop) {
								parts.each(function(a, b) {
										var column = $(this);
										var cssheight = column.attr('data-progress');
										setTimeout(function() {
												column.css({
														'height': cssheight + '%'
												});
												setTimeout(function() {
														column.find('.col-data').remove();
														column.append('<div class="col-data">' + cssheight + '%</div>');
												}, 50);
										}, 500 + (125 * a));
								});
						} else if (scrolled + win_height_padded < offsetTop) {
								parts.each(function(a, b) {
										var column = $(this);
										var cssheight = column.attr('data-progress');
										setTimeout(function() {
												column.removeAttr('style');
										}, 0);
								});
						}
				});

				colline.each(function() {
						var parts = $(this).find('.column');
						var win_height_padded = $window.height() * 1.1;
						var scrolled = $window.scrollTop();
						var offsetTop = parts.parents('.chart-wrap').offset().top;
						var offsetBottom = parts.parents('.chart-wrap').offset().top + parseInt(parts.parents('.chart-wrap').outerHeight());

						if (scrolled + win_height_padded > offsetTop) {
								parts.each(function(a, b) {
										var column = $(this);
										var cssheight = column.attr('data-progress');
										data.push({
												x: a,
												y: parseInt(cssheight)
										});
										setTimeout(function() {
												column.css({
														'height': cssheight + '%'
												});
												setTimeout(function() {
														column.find('.col-data').remove();
														column.append('<div class="col-data">' + cssheight + '%</div>');
												}, 50);
										}, 500 + (125 * a));
								});
								setTimeout(function() {
										var linegraph = parts.parent().next();
										if (linegraph.attr('data-line') != 'true') {
												linegraph.drawColsLine(data, linegraph.css('border-color'), parts);
										}
										linegraph.attr('data-line', 'true');
										data = [];
								}, 500 + (125 * (parts.length + 1)));
						} else if (scrolled + win_height_padded < offsetTop) {
								parts.each(function(a, b) {
										var column = $(this);
										var cssheight = column.attr('data-progress');
										setTimeout(function() {
												column.removeAttr('style');
										}, 0);
								});
						}
				});
				var stackedcol = $('.stacked-column-chart');

				stackedcol.each(function() {
						var parts = $(this).find('.column');
						var win_height_padded = $window.height() * 1.1;
						var scrolled = $window.scrollTop();
						var offsetTop = parts.parents('.chart-wrap').offset().top;
						var offsetBottom = parts.parents('.chart-wrap').offset().top + parseInt(parts.parents('.chart-wrap').outerHeight());

						if (scrolled + win_height_padded > offsetTop) {
								parts.each(function(a, b) {
										var column = $(this);
										var cssheight = column.attr('data-progress');
										setTimeout(function() {
												column.css({
														'height': cssheight + '%'
												});
										}, 500 + (125 * a));
										setTimeout(function() {
												var colparts = column.find('.col-part');
												var colpartspos = 0;
												colparts.each(function(c, d) {
														var colpart = $(this);
														var partheight = colpart.attr('data-progress');
														setTimeout(function() {
																if (c == 0) {
																		colpart.stop().animate({
																				'height': partheight + '%'
																		});
																} else {
																		colpart.stop().animate({
																				'height': partheight + '%',
																				'bottom': colpartspos + '%'
																		});
																}
																colpartspos = colpartspos + parseInt(partheight);
																setTimeout(function() {
																		column.find('.stacked-col-data').remove();
																		column.append('<div class="stacked-col-data">' + cssheight + '%</div>');
																}, 125 * c);
														}, 500 + (125 * c));
												});
										}, 500 + (125 * parts.length));
								});
						} else if (scrolled + win_height_padded < offsetTop) {
								parts.each(function(a, b) {
										var column = $(this);
										var cssheight = column.attr('data-progress');
										setTimeout(function() {
												column.removeAttr('style');
										}, 0);
								});
						}
				});

				bars.each(function() {
						var parts = $(this).find('.bar');
						var win_height_padded = $window.height() * 1.1;
						var scrolled = $window.scrollTop();
						var offsetTop = parts.parents('.chart-wrap').offset().top;
						var offsetBottom = parts.parents('.chart-wrap').offset().top + parseInt(parts.parents('.chart-wrap').outerHeight());

						if (scrolled + win_height_padded > offsetBottom) {

								parts.each(function(a, b) {
										var bar = $(this);
										var csswidth = bar.attr('data-progress');
										setTimeout(function() {
												bar.css({
														'width': csswidth + '%'
												});
												setTimeout(function() {
														bar.find('.bar-data').remove();
														bar.append('<div class="bar-data">' + csswidth + '%</div>');
												}, 50);
										}, 500 + (125 * a));
								});
						} else if (scrolled + win_height_padded < offsetTop) {
								parts.each(function(a, b) {
										var bar = $(this);
										var cssheight = bar.attr('data-progress');
										setTimeout(function() {
												bar.removeAttr('style');
										}, 0);
								});
						}
				});
		}
});