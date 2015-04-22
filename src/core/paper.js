    //
    // Create a new paper for drawing stuff
    g.paper = function (element, p) {

        var events = d3.dispatch.apply(null,
                extendArray(['change', 'active', 'activeout'], g.constants.pointEvents)),
            // Create the paper using giottoMixin
            paper = giottoMixin(d3.rebind({}, events, 'on'), p),
            tasks = [],
            resizing = false;

        p = _paperSize(element, paper.options());

        var type = p.type;

        element = p.__paper__;

        paper.event = function (name) {
            return events[name] || noop;
        };

        // Create a new group for this paper
        //	- opts: optional object with options for the new group
        paper.group = function (opts) {
            // Inject plugins
            opts = p.copy(opts);
            // Create the group
            var group = g.group[opts.type](paper, opts),
                plugins = g.paper.plugins;

            group.element().classed(p.giotto, true);
            for (var i=0; i < plugins.length; ++i)
                plugins[i](group, opts);
            return group;
        };

        paper.size = function () {
            return [p.size[0], p.size[1]];
        };

        // Select a group based on attributes
        paper.select = function (attr) {
            var selection = paper.svg().selectAll('.' + p.giotto),
                node;
            if (attr) selection = selection.filter(attr);
            node = selection.node();
            if (node) return node.__group__;
            selection = paper.canvas().selectAll('.' + p.giotto);
            if (attr) selection = selection.filter(attr);
            node = selection.node();
            if (node) return node.__group__;
        };

        paper.each = function (filter, callback) {
            if (arguments.length === 1) {
                callback = filter;
                filter = '*';
            }
            paper.svg().selectAll(filter).each(function () {
                if (this.__group__)
                    callback.call(this.__group__);
            });
            paper.canvas().selectAll(filter).each(function () {
                if (this.__group__)
                    callback.call(this.__group__);
            });
            return paper;
        };

        // Clear everything
        paper.clear = function () {
            paper.svg().remove();
            paper.canvas().remove();
            paper.canvasOverlay().remove();
            p.colorIndex = 0;
            return paper;
        };

        paper.render = function () {
            var back = paper.canvasBackground().node(),
                over = paper.canvasOverlay().node(),
                c, i;
            if (back)
                d3.canvas.clear(back.getContext('2d'));
            if (over)
                d3.canvas.clear(over.getContext('2d'));
            if (p.fill)
                paper.element().style('background', p.fill);
            paper.each(function () {
                this.render();
            });
            return paper;
        };

        paper.element = function () {
            return d3.select(element);
        };

        paper.classGroup = function (cn, opts) {
            var gg = paper.select('.' + cn);
            if (!gg) {
                gg = paper.group(opts);
                gg.element().classed(cn, true);
            }
            return gg;
        };

        // Resize the paper and fire the resize event if resizing was performed
        paper.resize = function (size) {
            resizing = true;
            if (!size) size = paper.boundingBox();
            if (p.size[0] !== size[0] || p.size[1] !== size[1]) {
                p.size[0] = size[0];
                p.size[1] = size[1];
                paper.canvasOverlay();
                paper.canvasBackground(false, true);
                paper.each(function () {
                    this.resize();
                });
                events.change.call(paper, {type: 'change'});
            }
            resizing = false;
            return paper;
        };

        paper.boundingBox = function () {
            var w = p.elwidth ? getWidth(p.elwidth) : p.size[0],
                h;
            if (p.height_percentage)
                h = d3.round(w*p.height_percentage, 0);
            else
                h = p.elheight ? getHeight(p.elheight) : p.size[1];
            if (p.min_height)
                h = Math.max(h, p.min_height);
            return [Math.round(w), Math.round(h)];
        };

        // Create an svg container
        paper.svg = function (build) {
            var svg = paper.element().select('svg.giotto');
            if (!svg.node() && build)
                svg = paper.element().append('svg')
                                .attr('class', 'giotto')
                                .attr('width', p.size[0])
                                .attr('height', p.size[1]);
                if (!p.resize)
                    svg.attr("viewBox", "0 0 " + p.size[0] + " " + p.size[1]);
            return svg;
        };

        // Background svg group
        paper.svgBackground = function (build) {
            var svg = paper.svg();
            if (svg.size()) {
                var gr = svg.select('.giotto-background');
                if (!gr.size() && build)
                    gr = svg.insert('g', '*').classed('giotto-background', true);
                return gr;
            }
        };

        // Access the canvas container
        paper.canvas = function (build) {
            var canvas = paper.element().select('div.canvas-container');
            if (!canvas.node() && build) {
                canvas = paper.element().append('div')
                                .attr('class', 'canvas-container')
                                .style('position', 'relative');
            }
            return canvas;
        };

        // Access the canvas background
        paper.canvasBackground = function (build, clear) {
            var canvas = paper.canvas();

            if (canvas.size()) {
                var gr = canvas.select('.giotto-background'),
                    node = gr.node();
                if (!node && build) {
                    canvas.selectAll('*').style({"position": "absolute", "top": "0", "left": "0"});
                    gr = canvas.insert('canvas', '*').classed('giotto-background', true);
                    d3.canvas.retinaScale(gr.node().getContext('2d'), p.size[0], p.size[1]);
                }
                if (node && clear)
                    d3.canvas.resize(node.getContext('2d'), p.size[0], p.size[1]);
                return gr;
            }
            return canvas;
        };

        paper.canvasOverlay = function () {
            var canvas = paper.element().select('.canvas-overlay'),
                node = canvas.node();

            if (!node && paper.canvas().node()) {
                canvas = paper.element().append('canvas')
                                .attr('class', 'canvas-overlay')
                                .style({
                                    'position': 'absolute',
                                    'top': '0',
                                    'left': '0'
                                });
                node = canvas.node();
                d3.canvas.retinaScale(node.getContext('2d'), p.size[0], p.size[1]);
                paper.registerEvents(canvas, g.constants.pointEvents);
            } else if (node)
                d3.canvas.resize(node.getContext('2d'), p.size[0], p.size[1]);
            return canvas;
        };

        paper.canvasDataAtPoint = function (point) {
            var data = [];
            paper.canvas().selectAll('*').each(function () {
                if (this.__group__)
                    this.__group__.dataAtPoint(point, data);
            });
            return data;
        };

        paper.encodeSVG = function () {
            var svg = paper.svg();
            if (svg.node())
                return btoa(unescape(encodeURIComponent(
                    svg.attr("version", "1.1")
                        .attr("xmlns", "http://www.w3.org/2000/svg")
                        .node().parentNode.innerHTML)));
        };

        paper.imageSVG = function () {
            var svg = paper.encodeSVG();
            if (svg)
                return "data:image/svg+xml;charset=utf-8;base64," + svg;
        };

        paper.imagePNG = function () {
            var canvas = paper.canvas();
            if (!canvas.node()) return;

            var target = paper.group({
                    type: 'canvas',
                    margin: {left: 0, right: 0, top: 0, bottom: 0}
                }),
                ctx = target.context(),
                img, group;

            canvas.selectAll('*').each(function () {
                if (this.__group__ !== target) {
                    img = new Image();
                    img.src = this.getContext('2d').canvas.toDataURL();
                    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
                }
            });
            var dataUrl = ctx.canvas.toDataURL();
            target.remove();
            return dataUrl;
        };

        paper.image = function () {
            return p.type === 'svg' ? paper.imageSVG() : paper.imagePNG();
        };


        // paper type
        paper.type = function () {
            return type;
        };
        //
        // register events on a DOM selection.
        paper.registerEvents = function (selection, events, uid, callback) {
            var target, ename;

            events.forEach(function (event) {
                ename = uid ? event + '.' + uid : event;

                selection.on(ename, function () {
                    if (uid && !paper.element().select('#' + uid).size())
                        // remove the event handler
                        selection.on(event + '.' + uid, null);
                    else {
                        target = callback ? callback.call(this) : this;
                        paper.event(d3.event.type).call(target);
                    }
                });
            });

            return selection;
        };
        //
        paper.task = function (callback) {
            tasks.push(callback);
        };
        //
        if (p.css)
            addCss('#giotto-paper-' + paper.uid(), p.css);

        // Auto resize the paper
        if (p.resize) {
            //
            d3.select(window).on('resize.paper' + paper.uid(), function () {
                if (!resizing) {
                    if (p.resizeDelay) {
                        resizing = true;
                        d3.timer(function () {
                            paper.resize();
                            return true;
                        }, p.resizeDelay);
                    } else {
                        paper.resize();
                    }
                }
            });
        }

        d3.timer(function () {
            if (!paper.element().size()) return true;
            for (var i=0; i<tasks.length; ++i) {
                tasks[i]();
            }
        });
        //
        activeEvents(paper);
        //
        return paper;
    };

    g.paper.plugins = [];
    g.paper.plugin = registerPlugin(g.paper.plugins);
