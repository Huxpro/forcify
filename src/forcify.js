/**
 *  forcify.js
 *
 *  Core of forcify.js
 *  created by @huxpro
 */

// uuid
let _uid = 0;

// polyfill
Object.extend = Object.assign ? Object.assign : (function(copy, src){
    for(let prop in src){
        copy[prop] = source[prop];
    }
    return copy;
})

/**
 * class Forcify
 */
class Forcify{
    /**
     * constructor. create a new Forcify Object.
     * @param  {Node}   element     TODO: support Selector
     * @param  {Object} options
     * @return {Forcify}            Instance of Forcify, you can call it 'Forcify Object'
     */
    constructor(element, options){
        this.uid = ++_uid;          // uid
        this.element = element;     // cache element
        this.handlers = {};         // event handlers
        this.touch = null;          // unique touch id
        this.timer = null;          // unique press timer
        this._pressTimeStamp = 0;   // unique press-time stamp

        // Instance Options.
        let _temp = Object.extend({}, Forcify.defaults)
        this.options = Object.extend(_temp, options);

        // Set uid to DOM object for future use. Decrease time complexity
        this.element.__fuid__ = this.uid;

        // Cache forcify instance (this)
        let caches = Forcify.cache;
        caches[this.uid] = this;
    }

    /**
     * Bind event
     * @param  {String} event      Type of event
     * @param  {fn}     handler    Event handlers, TODO: support fn[]
     * @return {Forcify}
     */
    on(event, handler){
        let handlers = this.handlers;

        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);

        return this;
    }

    /**
     * Invoke event handlers
     * @param  {Forcify} _instance
     * @param  {Object}  e         Forcify custom event object
     * @return {null}
     */
    invokeHandlers(_instance, e){
        //console.log(_instance);
        console.log(e);
        _instance.handlers['force'].forEach((fn) => {
            fn(e);
        })
    }
}


// import modules
new (require('./touch'))(Forcify)
new (require('./mouse'))(Forcify)
new (require('./press'))(Forcify)
new (require('./delegate'))(Forcify)


// Cache elements reference
Forcify.cache = {}


// Static Members
Forcify.emitEvent = function(_instance, nativeEvent){
    let force = 0;
    let type = nativeEvent.type;

    console.log(type);
    console.log(nativeEvent);
    nativeEvent.preventDefault();   // !important

    // Force Recognizer
    if(type == "touchend" || type == "touchmove" || type == "touchstart"){
        _instance.handleTouch(_instance, nativeEvent);
    }

    if(type == 'webkitmouseforcewillbegin' || type == 'webkitmouseforcechanged'){
        // if these event triggered, this is OSX.
        Forcify.detection.OSX = true;
        _instance.handleMouseForce(_instance, nativeEvent);
    }
    if(type == 'mousedown' || type == 'mouseup'){
        if(Forcify.detection.OSX) return;   // OSX should skip this
        _instance.handlePress(_instance, nativeEvent);
    }

}


// Default Options
Forcify.defaults = {
    /**
     * Delay to trigger fake Force Touch
     * @type {Number}
     * @default 200
     */
    LONG_PRESS_DELAY : 200,

    /**
     * Duration from MIN to MAX of the fake Force Touch
     * @type {Number}
     * @default 1000
     */
    LONG_PRESS_DURATION: 100,
}


Forcify.detection = {
    /**
     * Unfortunately there is not a feature detection for Force so far, so Forcify use a dynamic detection to detect it
     * If Forcify detects that force is support, all hacking stop
     *
     * @type {Boolean}
     * @default false
     */
    FORCE: false,

    /**
     * OSX support real webkit force touch
     *
     * @type {Boolean}
     * @default false
     */
    OSX: false,

    /**
     * Chrome give any touchevent a force with value:1. Forcify has to hack it.
     *
     * @type {Boolean}
     * @default false
     */
    CHROME: false,

    /**
     * Android is really acts odd, different and difficult to handle, so Forcify has to use UA detection.
     *
     * @type {Boolean}
     * @default false
     */
    ANDROID: navigator.userAgent.match(/(Android);?[\s\/]+([\d.]+)?/),
}

// ES6 export
export default Forcify;

// debugging use.
window.Forcify = Forcify;

// Module
// if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
// 	// AMD. Register as an anonymous module.
// 	define(function() {
// 		return Forcify;
// 	});
// } else if (typeof module !== 'undefined' && module.exports) {
// 	//module.exports = Forcify.attach;
// 	module.exports.Forcify = Forcify;
// } else {
// 	window.Forcify = Forcify;
// }
