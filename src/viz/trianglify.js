
    g.createviz('trianglify', {
        bleed: 150,
        fillOpacity: 1,
        strokeOpacity: 1,
        noiseIntensity: 0,
        gradient: null,
        cellsize: 0,
        cellpadding: 0,
        x_gradient: null,
        y_gradient: null
    }, function (tri, opts) {
        var waiting, t;

        tri.gradient = function (value) {
            if (value && typeof(value) === 'string') {
                var bits = value.split('-');
                if (bits.length === 2) {
                    var palette = Trianglify.colorbrewer[bits[0]],
                        num = +bits[1];
                    if (palette) {
                        return palette[num];
                    }
                }
            }
        };
        //
        tri.on('tick.main', function (e) {
            // Load data if not already available
            if (tri.Trianglify === undefined && typeof Trianglify === 'undefined') {
                if (!waiting) {
                    waiting = true;
                    return g.require(['trianglify'], function (Trianglify) {
                        waiting = false;
                        tri.Trianglify = Trianglify || null;
                    });
                }
            } else {
                if (tri.Trianglify === undefined)
                    tri.Trianglify = Trianglify;
                build();
                tri.stop();
            }
        });


        function build () {
            var cellsize = +opts.cellsize,
                cellpadding = +opts.cellpadding,
                fillOpacity = +opts.fillOpacity,
                strokeOpacity = +opts.strokeOpacity,
                noiseIntensity = +opts.noiseIntensity,
                gradient = tri.gradient(opts.gradient),
                x_gradient = tri.gradient(opts.x_gradient) || gradient,
                y_gradient = tri.gradient(opts.y_gradient) || gradient,
                paper = tri.paper().clear(),
                element = paper.element(),
                size = tri.paper().size();

            element.selectAll('*').remove();
            if (!t)
                t = new Trianglify();

            t.options.fillOpacity = Math.min(1, Math.max(fillOpacity, 0));
            t.options.strokeOpacity = Math.min(1, Math.max(strokeOpacity, 0));
            t.options.noiseIntensity = Math.min(1, Math.max(noiseIntensity, 0));
            if (x_gradient)
                t.options.x_gradient = x_gradient;
            if (y_gradient)
                t.options.y_gradient = y_gradient;
            if (cellsize > 0) {
                t.options.cellsize = cellsize;
                t.options.bleed = +attrs.bleed;
            }
            var pattern = t.generate(size[0], size[1]),
                telement = element.select('.trianglify-background');
            if (!telement.node()) {
                var parentNode = element.node(),
                    node = document.createElement('div'),
                    inner = parentNode.childNodes;
                while (inner.length) {
                    node.appendChild(inner[0]);
                }
                node.className = 'trianglify-background';
                parentNode.appendChild(node);
                telement = element.select('.trianglify-background');
            }
            telement.style("min-height", "100%")
                   //.style("height", this.attrs.height+"px")
                   //.style("width", this.attrs.width+"px")
                    .style("background-image", pattern.dataUrl);
        }
    });
