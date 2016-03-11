import {stack} from 'd3-shape';
import {isArray} from 'd3-quant';
import {GiottoBase} from './defaults';
import {Paper} from './paper';
import {_parentScope} from './plugin';

/**
 * Drawing Class
 *
 * base class for all drawings in a Paper
 */
export class Drawing extends GiottoBase {

    constructor(scope) {
        super(scope);
        if (!scope.from) scope.from = 'default';
        if (!isArray(scope.from)) scope.from = [scope.from];
    }

    get data () {
        var data = this.root.data();
        return data;
    }

    get paper () {
        return this.parent;
    }

    get marks () {
        return this.$scope.marks;
    }

    /**
     * Draw itself into a paper.layer
     *
     * This method is called by the paper when it needs to draw the drawing
     * It should not be called directly
     */
    draw () {
    }

    getSeries () {
        var series = [],
            data = this.data,
            serie;
        this.$scope.from.forEach( function (name) {
            serie = data.get(name);
            if (serie) series.push(serie);
        });
        if (series.length === this.$scope.from.length)
            return series;
    }

    canDraw (layer, series) {
        if (!series || this.broadcast('draw', series).defaultPrevented) return;
        this.logger.info('Drawing ' + this.marks + ' from series ' + concatNames(series));
        var current = this.$scope.$currentSeries;
        this.$scope.$currentSeries = series;
        return current || true;
    }
}

export class StackedDrawing extends Drawing {

    draw () {
        var data = this.data();
        var options = this.options;
        this.st = stack()
                    .keys(data.fields)
                    .order(options.stackOrder)
                    .offset(options.stackOffset);

    }
}


export function paperDraw (Class, defaultOptions) {
    var name = Class.name.toLowerCase();

    Paper.prototype[name] = function (options) {
        // default options from giotto
        var root = _parentScope(this.$scope, name, defaultOptions),
            draw = new Class(root.$new().$extend(options));

        // add the draw to paper draws
        this.$scope.$draws.push(draw);
        // draw to the paper
        return draw.draw();
    };

    Paper.prototype[name].defaults = defaultOptions;
}


Drawing.prototype.show = paperBound('show');


export function paperBound (name) {

    return function (_) {
        var d = self.get(this);
        if (arguments.length === 0) return d[name];
        var current = d[name];
        if (_ != current) {
            d[name] = _;
            this.paper.scheduleRedraw();
        }
        return this;
    }
}


function concatNames (array) {
    return array.reduce(_concatNames, '');
}

function _concatNames(a, b) {
    b = '"' + b.name + '"';
    return a ? a + ', ' + b : b;
}
