import {view, viewReady} from 'd3-view';

import components from './components/index';
import modelApp from './model';


viewReady(start);


// Start the application
function start () {

    // Build the model-view pair
    var vm = view({
            model: modelApp()
        });

    //
    // Mount the UI
    vm.use(components)
        .mount('body');
}
