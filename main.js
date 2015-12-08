/**
 * Forcify Homepage
 * offcial site
 *
 * created by @huxpro
 */



/**
 * Cache Element
 */
 var element             = document.getElementById('forceMe');
 var forceValueOutput    = document.getElementById('forceValue');
 var background          = document.getElementById('bg');



/**
 * Create Forcify Instances
 */
var qf = new Forcify(element, {
    LONG_PRESS_DELAY: 200,
    LONG_PRESS_DURATION: 300
});
qf.on('force', function(e){
    renderElement(e.force, element)
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

    _element.style.opacity = String(1 - forceValue*0.5)

    // blur background only in latest iOS/OSX for performance reasons.
    if(Forcify.detection.TOUCH3D || Forcify.detection.OSXFORCE){
        background.style.webkitFilter = 'blur(' + forceValue * 10 + 'px)';
    }

    // improve performance in others. (fakers)
    if(!Forcify.detection.TOUCH3D && !Forcify.detection.OSXFORCE){
        _element.style.webkitTransition = "all .1s"
    }

    // output force value
    forceValueOutput.innerHTML = 'Force: ' + forceValue.toFixed(4);
}
