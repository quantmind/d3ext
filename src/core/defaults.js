import {default as scopeFactory} from './scope';

export const constants = {
    DEFAULT_VIZ_GROUP: 'default_viz_group',
    WIDTH: 400,
    HEIGHT: 300,
    vizevents: ['data', 'change', 'start', 'tick', 'end'],
    pointEvents: ["mouseenter", "mousemove", "touchstart", "touchmove", "mouseleave", "mouseout"],
    //
    // Events a giotto group can fire, added by pluigins
    groupEvents: [],
    //
    // leaflet url
    leaflet: 'http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css'
};


function giottoScope (scope, self, options) {
    scope.$extend(options);
    scope.$self = self;
    return scope;
}


export class GiottoBase {

    constructor (parent, options) {
        var scope;
        if (arguments.length === 1)
            scope = parent;
        else {
            scope = parent ? parent.$scope.$new() : scopeFactory()();
        }
        this.$scope = GiottoBase.scope(scope, this, options);
    }

    get id () {
        return this.$scope.$id;
    }

    get name () {
        return this.$scope.$name || this.id;
    }

    /**
     * Return the data object
     * @returns {*}
     */
    get data () {
        return this.$scope.$$data;
    }

    /**
     * Return the paper object which own this object
     * @returns {*}
     */
    get paper () {
        return this.$scope.$$paper;
    }

    get parent () {
        var parent = this.$scope.$parent;
        return parent ? parent.$self : null;
    }

    get root () {
        return this.$scope.$root.$self;
    }

    get logger () {
        return this.$scope.$logger;
    }

    /**
     * Draw itself into a paper.layer
     *
     * This method is called by the paper when it needs to draw the drawing
     * It should not be called directly
     */
    draw () {
    }

    /**
     * Set or return the options for this giotto object
     */
    scope (_) {
        if (arguments.length === 0) return this.$scope;
        this.$scope.$extend(_);
        return this;
    }

    broadcast () {
        this.$scope.$broadcast.apply(this.$scope, arguments);
        return this;
    }

    on () {
        this.$scope.$on.apply(this.$scope, arguments);
        return this;
    }
}


GiottoBase.scope = giottoScope;
