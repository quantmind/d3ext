
    g.createviz('chart', {
        margin: {top: 30, right: 30, bottom: 30, left: 30},
        chartTypes: ['map', 'pie', 'bar', 'line', 'point', 'custom'],
        xaxis: true,
        yaxis: true,
        yaxis2: true,
        serie: {
            x: function (d) {return d[0];},
            y: function (d) {return d[1];}
        }
    },

    function (chart) {

        var series = [],
            allranges = {},
            drawing;

        chart.numSeries = function () {
            return series.length;
        };

        // iterator over each serie
        chart.each = function (callback) {
            series.forEach(callback);
            return chart;
        };

        chart.forEach = chart.each;

        chart.addSeries = function (series) {
            addSeries(series);
            return chart;
        };

        chart.addSerie = function (serie) {
            addSeries([serie]);
            return chart;
        };

        chart.clear = function () {
            chart.paper().clear();
            series = [];
            return chart;
        };

        chart.drawing  = function () {
            return drawing;
        };

        chart.render = function () {
            var opts = chart.options(),
                paper = chart.paper();
            drawing = true;

            if (opts.type !== paper.type()) {
                paper = chart.paper(true);
                chart.each(function (serie) {
                    serie.clear();
                });
            }

            chart.each(function (serie) {
                serie.draw();
            });

            drawing = false;

            // Render the chart
            paper.render();
            return chart;
        };

        chart.setSerieOption = function (type, field, value) {
            var opts = chart.options();
            if (opts.chartTypes.indexOf(type) === -1) return;

            if (!chart.numSeries()) {
                opts[type][field] = value;
            } else {
                var stype;
                chart.each(function (serie) {
                    stype = serie[type];
                    if (stype)
                        if (isFunction(stype.set))
                            stype.set(field, value);
                        else
                            stype[field] = value;
                });
            }
        };

        // Return the giotto group which manage the axis for a serie
        chart.axisGroup = function (serie) {
            if (serie && serie.axisgroup)
                return chart.paper().select('.' + axisGroupId(serie.axisgroup));
        };


        chart.on('tick.main', function () {
            // Chart don't need ticking unless explicitly required (real time updates for example)
            chart.stop();
            chart.render();
        });

        // INTERNALS

        chart.on('data.build_series', function () {
            var data = chart.data();
            series = [];
            addSeries(data);
        });

        function chartSerie (data) {
            var opts = chart.options(),
                serie = extend({}, opts.serie),
                group, color, show, scaled;

            if (!data) return;

            if (!g.data.isData(data)) {
                extend(serie, data);
                data = serie.data;
                delete serie.data;
                if (!data) return;
            }

            serie.index = series.length;

            series.push(serie);

            if (!serie.label)
                serie.label = 'serie ' + series.length;

            opts.chartTypes.forEach(function (type) {
                var o = serie[type];
                if (isArray(o) && !serie.data) {
                    serie.data = o;
                    o = {}; // an ampty object so that it is shown
                }
                if (o || (opts[type] && opts[type].show)) {
                    serie[type] = extend({}, opts[type], o);
                    show = true;
                }
            });

            // None of the chart are shown, specify line
            if (!show)
                serie.line = extend({}, opts.line);

            opts.chartTypes.forEach(function (type) {
                var o = serie[type];

                if (o && chartTypes[type].scaled) {
                    // pick a default color if one is not given
                    if (!color)
                        color = chartColor(chart, o);
                    if (!o.color)
                        o.color = color;
                    scaled = true;
                }
            });

            if (scaled) {
                if (serie.yaxis === undefined)
                    serie.yaxis = 1;
                if (!serie.axisgroup) serie.axisgroup = 1;

                var ranges = allranges[serie.axisgroup];

                if (!ranges) {
                    // ranges not yet available for this chart axisgroup,
                    // mark the serie as the reference for this axisgroup
                    serie.reference = true;
                    allranges[serie.axisgroup] = ranges = {};
                }

                if (!isObject(serie.xaxis)) serie.xaxis = opts.xaxis;
                if (serie.yaxis === 2) serie.yaxis = opts.yaxis2;
                if (!isObject(serie.yaxis)) serie.yaxis = opts.yaxis;
            }

            serie.group = function () {
                return group;
            };

            serie.clear = function () {
                if (group) group.remove();
                group = null;
                return serie;
            };

            serie.data = function (_) {
                if (!arguments.length) return data;

                // check axis and ranges
                if (scaled) {

                    var ranges = allranges[serie.axisgroup],
                        p = ranges[serie.xaxis.position],
                        xy = xyData(_, serie.x, serie.y),
                        stype;

                    _ = xy.data;

                    if (!p) {
                        ranges[serie.xaxis.position] = p = {
                            range: xy.xrange,
                            ordinal: xy.xordinal,
                            serie: serie
                        };
                        serie.drawXaxis = true;
                    } else {
                        p.range[0] = Math.min(p.range[0], xy.xrange[0]);
                        p.range[1] = Math.max(p.range[1], xy.xrange[1]);
                    }

                    p = ranges[serie.yaxis.position];
                    if (!p) {
                        ranges[serie.yaxis.position] = p = {
                            range: xy.yrange,
                            ordinal: xy.yordinal,
                            serie: serie
                        };
                        serie.drawYaxis = true;
                    } else {
                        p.range[0] = Math.min(p.range[0], xy.yrange[0]);
                        p.range[1] = Math.max(p.range[1], xy.yrange[1]);
                    }
                }
                data = _;

                opts.chartTypes.forEach(function (type) {
                    stype = serie[type];
                    if (stype && isFunction(stype.data))
                        stype.data(data);
                });

                return serie;
            };

            serie.draw = function () {
                var opts = chart.options(),
                    stype;

                if (!group) {

                    // Remove previous serie drawing if any
                    opts.chartTypes.forEach(function (type) {
                        stype = serie[type];
                        if (stype) {
                            if(isFunction(stype.options))
                                stype = stype.options();
                            serie[type] = stype;
                        }
                    });

                    group = chart.paper().classGroup(slugify(serie.label), extend({}, serie));

                    // Is this the reference serie for its axisgroup?
                    if (serie.reference)
                        group.element().classed('reference', true)
                                       .classed(axisGroupId(serie.axisgroup), true);

                    // Draw X axis or set the scale of the reference X-axis
                    if (serie.drawXaxis)
                        domain(group.xaxis(), 'x').drawXaxis();
                    else if (serie.axisgroup)
                        scale(group.xaxis());

                    // Draw Y axis or set the scale of the reference Y-axis
                    if (serie.drawYaxis)
                        domain(group.yaxis(), 'y').drawYaxis();
                    else if (serie.axisgroup)
                        scale(group.yaxis());

                    opts.chartTypes.forEach(function (type) {
                        stype = serie[type];
                        if (stype)
                            serie[type] = chartTypes[type](group, serie.data(), stype).label(serie.label);
                    });
                } else {
                    opts.chartTypes.forEach(function (type) {
                        stype = serie[type];
                        if (stype)
                            serie[type].label(serie.label);
                    });
                    serie.drawXaxis ? domain(group.xaxis()) : scale(group.xaxis());
                    serie.drawYaxis ? domain(group.yaxis()) : scale(group.yaxis());
                }

                return serie;

                function domain(axis, xy) {
                    var p = allranges[serie.axisgroup][axis.orient()],
                        o = axis.options(),
                        scale = axis.scale(),
                        opadding = 0.1;

                    if (p.ordinal) scale = group.ordinalScale(axis);

                    p.scale = scale;
                    if (scale.rangeBand) {
                        scale.domain(data.map(function (d) {return d[xy];}));
                    } else if (o.auto) {
                        scale.domain([p.range[0], p.range[1]]).nice();
                        if (!isNull(o.min))
                            scale.domain([o.min, scale.domain()[1]]);
                        else if (!isNull(o.max))
                            scale.domain([scale.domain()[0], o.max]);
                    } else {
                        scale.domain([o.min, o.max]);
                    }
                    return group;
                }

                function scale (axis) {
                    if (serie.axisgroup) {
                        var p = allranges[serie.axisgroup][axis.orient()];
                        axis.scale(p.scale);
                    }
                }
            };

            return serie.data(data);
        }

        function addSeries (series) {
            // Loop through series and add them to the chart series collection
            // No drawing nor rendering involved
            if (!series.forEach) series = [series];

            series.forEach(function (serie) {

                if (isFunction(serie))
                    serie = serie(chart);

                chartSerie(serie);
            });
        }

        function axisGroupId (axisgroup) {
            return 'axisgroup' + chart.uid() + '-' + axisgroup;
        }

    });

    function scaled (c) {

        function f(group, data, opts) {
            return c(group, data, opts)
                        .x(function (d) {return d.x;})
                        .y(function (d) {return d.y;});
        }

        f.scaled = true;

        return f;
    }

    var chartTypes = {

        map: function (group, data, opts) {
            return group.map(data, opts);
        },

        pie: function (group, data, opts) {
            return group.pie(data, opts);
        },

        bar: scaled(function (group, data, opts) {
            return group.barchart(data, opts);
        }),

        line: scaled(function (group, data, opts) {
            return group.path(data, opts);
        }),

        point: scaled(function (group, data, opts) {
            return group.points(data, opts);
        }),

        custom: function (group, data, opts) {
            var draw = drawing(group, function () {
                    return opts.show.call(this);
                }).options(opts).data(data);

            if (group.type() === 'canvas') {
                draw = canvasMixin(draw);
                draw.each = function (callback) {
                    callback.call(draw);
                    return draw;
                };
            }

            return group.add(draw);
        }
    };

    g.chart = g.viz.chart;


    var xyData = function (data, x, y) {
        if (!data) return;
        if (!data.data) data = {data: data};

        var xy = data.data,
            xmin = Infinity,
            ymin = Infinity,
            xmax =-Infinity,
            ymax =-Infinity,
            xordinal = false,
            yordinal = false,
            v,
            xm = function (x) {
                v = +x;
                if (isNaN(v)) {
                    xordinal = true;
                    return x;
                }
                else {
                    xmin = v < xmin ? v : xmin;
                    xmax = v > xmax ? v : xmax;
                    return v;
                }
            },
            ym = function (y) {
                v = +y;
                if (isNaN(v)) {
                    yordinal = true;
                    return y;
                }
                else {
                    ymin = v < ymin ? v : ymin;
                    ymax = v > ymax ? v : ymax;
                    return v;
                }
            };
        var xydata = [];
        xy.forEach(function (d) {
            xydata.push({x: xm(x(d)), y: ym(y(d))});
        });
        data.data = xydata;
        data.xrange = [xmin, xmax];
        data.yrange = [ymin, ymax];
        data.xordinal = xordinal;
        data.yordinal = yordinal;
        return data;
    };
