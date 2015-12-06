/**
 * Forcify Example
 * use with ES6
 *
 *
 * this example use Babel to transform ES6 into ES5 code.
 */


//Import Forcify
import Forcify from 'forcify';



/**
 * Cache Element
 */
let element             = document.getElementById('forceMe');
let element2            = document.getElementById('forceMe2');
let forceValueOutput    = document.getElementById('forceValue');
let background          = document.getElementById('background');



/**
 * Create Forcify Instances
 */
let qf = new Forcify(element);
qf.on('force', (e) => {
    renderElement(e.force, element)
});

// Forcify support Muti-touch!
let qf2 = new Forcify(element2);
qf2.on('force', (e) => {
    renderElement(e.force, element2)
});



/**
 * Render!
 */
function renderElement(forceValue, _element) {
    // animate element
    _element.style.webkitTransform = `translateX(-50%) translateY(-50%) scale(${(1 + forceValue * 1.5)})`;

    // blur background, only in iOS/OSX for performance reasons.
    if(Forcify.detection.TOUCH3D || Forcify.detection.OSXFORCE){
        background.style.webkitFilter = `blur(${forceValue * 30}px)`;
    }

    // output force value
    forceValueOutput.innerHTML = `Force: ${forceValue.toFixed(4)}`;
}
