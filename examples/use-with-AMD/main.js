/**
 * Forcify Example
 * use with AMD
 *
 *
 * This example use Require.js to load AMD Module.
 */


// Require Path Config
require.config({
    paths: {
        Forcify: "../../dist/forcify.min"
    }
})


// AMD Wrapper
define(['Forcify'], function(Forcify){


/**
 * Cache Element
 */
var element             = document.getElementById('forceMe');
var element2            = document.getElementById('forceMe2');
var forceValueOutput    = document.getElementById('forceValue');
var background          = document.getElementById('background');



/**
 * Create Forcify Instances
 */
var qf = new Forcify(element);
qf.on('force', function(e){
    renderElement(e.force, element)
});

// Forcify support Muti-touch!
var qf2 = new Forcify(element2);
qf2.on('force', function(e){
    renderElement(e.force, element2)
});



/**
 * Render!
 */
function renderElement(forceValue, _element) {
    // animate element
    _element.style.webkitTransform =
        'translateX(-50%) translateY(-50%) scale(' +
        (1 + forceValue * 1.5) +
        ')';

    // blur background, only in iOS/OSX for performance reasons.
    if(Forcify.detection.TOUCH3D || Forcify.detection.OSXFORCE){
        background.style.webkitFilter = 'blur(' + forceValue * 30 + 'px)';
    }

    // output force value
    forceValueOutput.innerHTML = 'Force: ' + forceValue.toFixed(4);
}


// Wrapper End.
})
