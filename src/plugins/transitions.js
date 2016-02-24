import {easeLinear, easeQuadIn, easeQuadOut} from 'd3-ease';
import {Plugin} from '../core/paper';

var easing = {
    'linear': easeLinear,
    'quadIn': easeQuadIn,
    'quadOut': easeQuadOut
};

/**
 * An Axis is associated with a given paper as well as a given drawing
 *
 * At most a paper can draw two x-axis and two y-axis
 */
class Transitions extends Plugin {

    /**
     * @returns The d3-ease function
     */
    get easing () {
        var fun = easing[self.get(this).easing];
        if (!fun) fun = easing['linear'];
        return fun;
    }
}

Plugin.register(Transitions, true, {
    steps: 60,
    easing: 'linear'
});
