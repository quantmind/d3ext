    //
    describe("Test svg paper", function() {
        var g = d3.giotto,
            _ = g._;

        it("Check basic properties", function() {
            var paper = g.paper();
            expect(_.isObject(paper)).toBe(true);
            expect(paper.type()).toBe('svg');
            var current = paper.current();
            expect(current.node().tagName).toBe('svg');
            expect(paper.parent().current()).toBe(current);

            // Default size
            expect(paper.width()).toBe(g.constants.WIDTH);
            expect(paper.height()).toBe(g.constants.HEIGHT);
        });

        it("Check axis linear scale", function () {
            var paper = g.paper();
            checkScale(paper);
            //
            // custom size
            paper = g.paper({width: 600, height: 500});
            expect(paper.width()).toBe(600);
            expect(paper.height()).toBe(500);
            checkScale(paper);
        });

        it("Check scalex scaley methods", function () {
            var paper = g.paper();

            expect(paper.scalex(1)).toBe(paper.width());
            expect(paper.scaley(1)).toBe(paper.height());
        });

        it("Check group", function () {
            var paper = g.paper(),
                gr = paper.group();
            expect(gr.node().tagName).toBe('g');
            expect(paper.current()).toBe(gr);
            //expect(paper.parent().current()).toBe(paper.root().current());
        });

        it("Check circle", function () {
            var paper = g.paper(),
                c = paper.circle(0.5, 0.5, 0.3);

            expect(c.node().tagName).toBe('circle');
            expect(+c.attr('cx')).toBe(0.5*paper.width());
            expect(+c.attr('cy')).toBe(0.5*paper.height());
            expect(+c.attr('r')).toBe(0.3*paper.width());
        });

        it("Check rect", function () {
            var paper = g.paper({width: 600, height: 500});
            paper.xAxis().scale().domain([-1, 1]);
            paper.yAxis().scale().domain([-1, 1]);

            var r = paper.rect(-0.5, -0.5, 1, 1);

            expect(+r.attr('x')).toBe(150);
            expect(+r.attr('y')).toBe(125);
        });

        it("Check resize", function () {
            var paper = g.paper({width: 600, height: 500});

            function listener (e) {
                expect(e.type).toBe('resize');
                expect(e.size[0]).toBe(400);
                expect(e.size[1]).toBe(300);
            }

            paper.on('resize', listener);
            paper.resize([400, 300]);
            expect(paper.width()).toBe(400);
            expect(paper.height()).toBe(300);
        });

        function checkScale(paper) {
            var width = paper.width(),
                height = paper.height(),
                scale = paper.xAxis().scale();

            expect(scale(1)).toBe(width);
            expect(scale(0.5)).toBe(0.5*width);
            expect(scale(0)).toBe(0);
            expect(scale(-1)).toBe(-width);
            //
            // Now check scale change
            paper.xAxis().scale().domain([-1, 1]);
            //
            expect(scale(1)).toBe(width);
            expect(scale(0)).toBe(0.5*width);
            expect(scale(-1)).toBe(0);
        }
    });