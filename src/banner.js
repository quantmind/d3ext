//      <%= pkg.title || pkg.name %> - v<%= pkg.version %>

//      Compiled <%= grunt.template.today("yyyy-mm-dd") %>.
//      Copyright (c) <%= grunt.template.today("yyyy") %> - <%= pkg.author.name %>
//      Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>.
//      For all details and documentation:
//      <%= pkg.homepage %>
//
(function (factory) {
    var root;
    if (typeof module === "object" && module.exports)
        root = module.exports;
    else
        root = window;
    //
    if (typeof define === 'function' && define.amd) {
        // Support AMD. Register as an anonymous module.
        // NOTE: List all dependencies in AMD style
        define(['d3'], function () {
            return factory(d3, root);
        });
    } else if (typeof module === "object" && module.exports) {
        // No AMD. Set module as a global variable
        // NOTE: Pass dependencies to factory function
        // (assume that d3 is also global.)
        factory(d3, root);
    }
}(function(d3, root) {
    //"use strict";
    var giotto = {
            version: "<%= pkg.version %>",
            d3: d3,
            math: {},
            svg: {},
            canvas: {},
            geo: {},
            data: {}
        },
        g = giotto;

    d3.giotto = giotto;
    d3.canvas = {};

    // Warps RequireJs call so it can be used in conjunction with
    //  require-config.js
    //
    //  http://quantmind.github.io/require-config-js/
    g.require = function (deps, callback) {
        if (root.rcfg && root.rcfg.min)
            deps = root.rcfg.min(deps);
        require(deps, callback);
        return g;
    };
