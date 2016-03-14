import {map} from 'd3-collection';
import {GiottoBase, model} from './defaults';
import {prefix} from './scope';
import {popKey} from '../utils/object';

/**
 * Base class for Plugins
 */
export class Plugin extends GiottoBase {

    constructor (parent, opts, scope) {
        scope = scope.$new().$extend(opts);
        super(scope);
        this.$scope.$self = parent;
        this.$scope.$$paper = parent;
        this.$scope.$active = opts ? true : false;
    }

    get active () {
        return this.$scope.$active;
    }

    draw () {}
}

// Optional paper plugins
Plugin.$plugins = map();


/**
 * Register a Plugin class to the Paper prototype
 *
 * @param Class: Plugin class
 * @param active: if true the plugin is active by default and to switch it off one must set the plugin name to false.
 * @param pluginDefaults: optional defaults
 */
Plugin.register = function (Class, active, pluginDefaults) {
    var name = popKey(pluginDefaults, 'name');
    if(!name) name = Class.name;
    name = name.toLowerCase();
    Plugin.$plugins.set(name, {
        Class: Class,
        active: active,
        defaults: pluginDefaults
    });
};


Plugin.$apply = function (paper) {
    var scope = paper.$scope;

    Plugin.$plugins.each( (p, name) => {

        var bits = name.split('.'),
            namespace = bits[0],
            $namespace = prefix + namespace,
            opts = scope[namespace],
            root = _parentScope(scope.$root, namespace, bits[1], p.defaults);

        name = bits[1];
        if (opts === undefined) opts = p.active;
        if (opts === true) opts = {};

        var plugin = new p.Class(paper, opts, root);

        if (name) {
            if (!scope[$namespace]) scope[$namespace] = map();
            scope[$namespace].set(name, plugin);
        }
        else scope[$namespace] = plugin;

        scope.$plugins.push(plugin);
    });
};


export function _parentScope(scope, namespace, name, defaults) {
    var $$namespace = prefix + prefix + namespace,
        container = scope[$$namespace],
        parentScope;

    if (name) {
        if (!container) scope[$$namespace] = container = map();
        parentScope = container.get(name);
    }
    else
        parentScope = container;

    //
    // parent scope not available
    if (!parentScope) {
        if (scope.$parent && scope.$parent !== scope) {
            parentScope = _parentScope(scope.$parent, namespace, name, defaults);
            parentScope = model(parentScope, scope);
        }
        else {
            parentScope = scope.$new(true).$extend(defaults);
            parentScope.$self = scope.$self;
            parentScope.$name = name ? namespace + '.' + name : namespace;
        }

        if (name)
            container.set(name, parentScope);
        else
            scope[$$namespace] = parentScope;
    }
    return parentScope;
}
