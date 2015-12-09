(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Forcify"] = factory();
	else
		root["Forcify"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  forcify.js
	 *
	 *  Core of forcify.js
	 *  created by @huxpro
	 */

	// uuid
	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _uid = 0;

	// polyfill
	Object.extend = Object.assign ? Object.assign : function (copy, src) {
	    for (var prop in src) {
	        copy[prop] = src[prop];
	    }
	    return copy;
	};

	/**
	 * @class Forcify
	 */

	var Forcify = (function () {

	    /**
	     * @constructor                     create a new Forcify Object.
	     * @param  {Node}   element         TODO: support Selector
	     * @param  {Object} options         customize options
	     * @return {Forcify}                Instance of Forcify, you can call it 'Forcify Object'
	     */

	    function Forcify(element, options) {
	        _classCallCheck(this, Forcify);

	        this.uid = ++_uid; // uid
	        this.element = element; // cache element
	        this.handlers = {}; // event handlers
	        this.touch = null; // unique touch id
	        this.timer = null; // unique press timer
	        this._pressTimeStamp = 0; // unique press-time stamp

	        // Merge Instance Options.
	        var _temp = Object.extend({}, Forcify.defaults);
	        this.options = Object.extend(_temp, options);

	        // Set uid to DOM object for cache use. Decrease time complexity
	        this.element.__fuid__ = this.uid;

	        // Cache forcify instance (this)
	        var caches = Forcify.cache;
	        caches[this.uid] = this;
	    }

	    // Static Members

	    /**
	     * Bind event
	     * @param  {String} event           Type of event
	     * @param  {fn}     handler         Event handlers, TODO: support fn[]
	     * @return {Forcify}
	     */

	    _createClass(Forcify, [{
	        key: 'on',
	        value: function on(event, handler) {
	            var handlers = this.handlers;

	            handlers[event] = handlers[event] || [];
	            handlers[event].push(handler);

	            return this;
	        }

	        /**
	         * Invoke event handlers
	         * @param  {Forcify} _instance
	         * @param  {Object}  e              Forcify custom event object
	         * @return {null}
	         */
	    }, {
	        key: 'invokeHandlers',
	        value: function invokeHandlers(_instance, e) {
	            //console.log(_instance);
	            console.log(e);
	            _instance.handlers['force'].forEach(function (fn) {
	                fn(e);
	            });
	        }
	    }]);

	    return Forcify;
	})();

	exports['default'] = Forcify;
	Forcify.emitEvent = function (_instance, nativeEvent) {
	    var force = 0;
	    var type = nativeEvent.type;

	    console.log('type: ' + type);
	    console.log(nativeEvent);
	    nativeEvent.preventDefault(); // !important

	    // Event Recognizer
	    if (type == "touchend" || type == "touchmove" || type == "touchstart") {
	        _instance.handleTouch(_instance, nativeEvent);
	    }

	    if (type == 'webkitmouseforcewillbegin' || type == 'webkitmouseforcechanged') {
	        Forcify.detection.OSXFORCE = true; // if these event triggered, this is OSX.
	        _instance.handleMouseForce(_instance, nativeEvent);
	    }
	    if (type == 'mousedown' || type == 'mouseup') {
	        if (Forcify.detection.OSXFORCE) return; // OSX should skip this
	        _instance.handlePress(_instance, nativeEvent);
	    }
	};

	/**
	 * Forcify global coniguration
	 * @param  {object} _config
	 */
	Forcify.config = function (_config) {
	    // Merge config.defaults into Forcify.defaults
	    if (_config.defaults) {
	        Forcify.defaults = Object.extend(Forcify.defaults, _config.defaults);
	    }
	};

	// Cache elements reference
	Forcify.cache = {};

	// whether event bobble, globally
	// inner options for now.
	Forcify.__EVENT_BOBBLE__ = true;

	// Default Options
	Forcify.defaults = {
	    /**
	     * Delay to trigger fake Force Touch
	     * @type {Number}
	     * @default 200(ms)
	     */
	    LONG_PRESS_DELAY: 200,

	    /**
	     * Duration from MIN to MAX of the fake Force Touch
	     * @type {Number}
	     * @default 1000(ms)
	     */
	    LONG_PRESS_DURATION: 100,

	    /**
	     * if Forcify fallback to long press on unsupport devices
	     * if set false, Forcify will not fallback 'force' to 'long press'
	     * @type {Boolean}
	     * @default true
	     */
	    FALLBACK_TO_LONGPRESS: true,

	    /**
	     * Some browser, such as Chrome, provide a very weird force value.
	     * if set false, Forcify would not try to find and ignore those weird
	     * behavior.
	     * Which means your "Force Actions" may
	     *   - be triggered just by a click in some 'force: 1' devices.
	     *   - be influenced in device like Nexus5 to give a force in (0,1)
	     * @type {Boolean}
	     * @default true
	     */
	    SHIM_WEIRD_BROWSER: true
	};

	// Detections
	Forcify.detection = {
	    /**
	     * Unfortunately there is not a feature detection for 3DTouch so far, so Forcify use a dynamic detection to detect it
	     * If Forcify detects that force is support, all hacking stop
	     *
	     * @type {Boolean}
	     * @default false
	     */
	    TOUCH3D: false,

	    /**
	     * OSX support real webkit force touch
	     *
	     * @type {Boolean}
	     * @default false
	     */
	    OSXFORCE: false,

	    /**
	     * Chrome Mobile give any touchevent a 'force' property with value: 1.
	     * Forcify has to hack it.
	     * Forcify not detect Chrome by UA but behaviors.
	     *
	     * @type {Boolean}
	     * @default false
	     */
	    WEIRD_CHROME: false,

	    /**
	     * Android performs really odd, which performs different in diff devices.
	     * Forcify has to use UA detection to handle them.
	     *
	     * @type {Boolean}
	     * @default false
	     */
	    ANDROID: navigator.userAgent.match(/(Android);?[\s\/]+([\d.]+)?/)
	};

	// import modules
	new (__webpack_require__(2))(Forcify);
	new (__webpack_require__(3))(Forcify);
	new (__webpack_require__(4))(Forcify);
	new (__webpack_require__(5))(Forcify);

	// debugging use.
	// window.Forcify = Forcify;
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports) {

	/**
	 *  touch.js
	 *
	 *  Touch module of forcify.js
	 *  created by @huxpro
	 */

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Touch = (function () {
	    function Touch(Forcify) {
	        _classCallCheck(this, Touch);

	        this.init(Forcify);
	    }

	    _createClass(Touch, [{
	        key: "init",
	        value: function init(Forcify) {
	            var fn = Forcify.prototype;
	            fn.handleTouch = function (_instance, nativeEvent) {
	                var type = nativeEvent.type;

	                // Forcify strictly limit every view respond to only one finger
	                // So targetTouches always empty when touchend,
	                // So we first deal with touchend
	                if (type == "touchend") {
	                    // reset touch ref
	                    _instance.touch = null;
	                    // also send to handlePress
	                    _instance.handlePress(_instance, nativeEvent);
	                    return;
	                }

	                /**
	                 * It's hard to judge if Force Touch is truly supported:
	                 *
	                 * Events from supported iPhone always begin with force:0,
	                 * Events from unsupport iPhone with iOS 9 also include force:0,
	                 * We never know if a iPhone is unsupported or just not be "force-touched"
	                 *
	                 * Events from Chrome Touchable-PC include only force:0, behave well.
	                 * Events from Chrome Emulator     include only force:1, not shim yet
	                 * Events from Chrome Mobile       include both force:1 and webkitForce:1,
	                 *
	                 * Events from Chrome Nexus5 provide a very weird force value,
	                 * which seems depend on the AREA of the finger touched to screen!
	                 *
	                 *
	                 * Soooooooooooo sad,
	                 * Forcify has to use a Dynamic Detection to try to shim them
	                 */

	                /**
	                 * Shim weird browser
	                 */
	                if (_instance.options.SHIM_WEIRD_BROWSER) {

	                    // detect Weird Chrome
	                    if (nativeEvent.targetTouches[0].force == 1 && nativeEvent.targetTouches[0].webkitForce == 1) Forcify.detection.WEIRD_CHROME = true;

	                    // if it's Weird Chrome or Android(ensure unsupport now)
	                    if (Forcify.detection.WEIRD_CHROME || Forcify.detection.ANDROID) {
	                        console.log("CHROME, send into handlePress..");
	                        _instance.handlePress(_instance, nativeEvent);
	                        return;
	                    };
	                }

	                /**
	                 * Fallback to handlePress.
	                 */
	                var _force = nativeEvent.targetTouches[0].force;

	                // if 'force' props is undefined
	                // let handlePress to handle unsupport devices
	                if (typeof _force == "undefined") {
	                    _instance.handlePress(_instance, nativeEvent);
	                    return;
	                }

	                // seeing Nexus5, we had to abandon android.
	                // would change if there is android devices support a real 3DTouch
	                if (_force > 0 && _force < 1 && !Forcify.detection.ANDROID) Forcify.detection.TOUCH3D = true;

	                // If forceValue == 0, Forcify sent events to handlePress
	                // but keep handleTouch procedure (for pre-polling)
	                // alert(nativeEvent.targetTouches[0].force)
	                if (_force == "0") {
	                    if (!Forcify.detection.TOUCH3D) {
	                        console.log("send into handlePress..");
	                        _instance.handlePress(_instance, nativeEvent);
	                    }
	                    //not return
	                }

	                /**
	                 * All Test Passed, try to polling force value
	                 */
	                // Forcify support multi-touch in multi-view,
	                // But in one view we only use the first touch.
	                if (nativeEvent.targetTouches && nativeEvent.targetTouches.length > 1) return;
	                if (_instance.touch) return; // prevent repeat binding
	                _instance.touch = nativeEvent.targetTouches[0]; // get first

	                // seeing we don't have `touchforcechange` event,
	                // so we need to do it ourselves with polling.
	                _instance.pollingTouchForce.bind(_instance.touch, _instance, nativeEvent)();
	            };

	            fn.pollingTouchForce = function (_instance, nativeEvent) {
	                /**
	                 * Start Polling procedure
	                 */
	                console.log('polling...');

	                var touchEvent = this;
	                var force = 0;
	                var sendEvent = true;

	                if (_instance.touch) {
	                    force = touchEvent.force;
	                    // dynamic detection real 3DTouch
	                    if (force > 0 && force < 1) Forcify.detection.TOUCH3D = true;

	                    // repeat polling
	                    setTimeout(_instance.pollingTouchForce.bind(_instance.touch, _instance, nativeEvent), 10);

	                    // a little hacking!!
	                    // if force == 0 passed to here,
	                    // this may well be a unsuppoted device provided force:0, such as iPhone5
	                    // but also probably a supported device with not "force" pressed.
	                    //
	                    // so we dont know and would NOT send force event:
	                    // for unsupport device, let handlePress fake it.
	                    // for supported device, event force:0 is useless until detected.
	                    if (force == 0 && !Forcify.detection.TOUCH3D) {
	                        sendEvent = false;
	                    }
	                } else {
	                    // touchend trigger! sent 0;
	                    force = 0;
	                    sendEvent = true;
	                }

	                if (sendEvent) {
	                    var _e = { force: force, nativeEvent: nativeEvent };
	                    _instance.invokeHandlers(_instance, _e);
	                }
	            };
	        }
	    }]);

	    return Touch;
	})();

	exports["default"] = Touch;
	module.exports = exports["default"];

/***/ },
/* 3 */
/***/ function(module, exports) {

	/**
	 *  mouse.js
	 *
	 *  Mouse module of forcify.js
	 *  created by @huxpro
	 */

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Mouse = (function () {
	    function Mouse(Forcify) {
	        _classCallCheck(this, Mouse);

	        this.init(Forcify);
	    }

	    _createClass(Mouse, [{
	        key: "init",
	        value: function init(Forcify) {
	            var fn = Forcify.prototype;

	            // if mouse support force
	            fn.handleMouseForce = function (_instance, nativeEvent) {
	                // max value for trackpad is 3.0 compare to 1.0 on iOS
	                var force = nativeEvent.webkitForce / 3;
	                var _e = {
	                    force: force,
	                    nativeEvent: nativeEvent
	                };
	                _instance.invokeHandlers(_instance, _e);
	            };
	        }
	    }]);

	    return Mouse;
	})();

	exports["default"] = Mouse;
	module.exports = exports["default"];

/***/ },
/* 4 */
/***/ function(module, exports) {

	/**
	 *  press.js
	 *
	 *  Press module of forcify.js
	 *  created by @huxpro
	 */

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Press = (function () {
	    function Press(Forcify) {
	        _classCallCheck(this, Press);

	        this.init(Forcify);
	    }

	    _createClass(Press, [{
	        key: "init",
	        value: function init(Forcify) {
	            var fn = Forcify.prototype;

	            // fallback to long press (mouse || touch)
	            fn.handlePress = function (_instance, nativeEvent) {

	                // if not fallback, early return everything.
	                if (!_instance.options.FALLBACK_TO_LONGPRESS) return;

	                /**
	                 * Start do fallback!
	                 */
	                var delay = _instance.options.LONG_PRESS_DELAY;
	                var duration = _instance.options.LONG_PRESS_DURATION;
	                var type = nativeEvent.type;

	                // Press Down
	                if (type === "mousedown" || type === "touchstart") {
	                    _instance._pressTimeStamp = Date.now();
	                    _instance.timer = window.setTimeout(function () {
	                        // Long Press!
	                        // Let's trigger fake Force now.
	                        _instance.repeatPushForceValue(_instance, nativeEvent);
	                    }, delay);
	                }

	                // Press Up
	                if (type === 'mouseup' || type === "touchend") {
	                    window.clearTimeout(_instance.timer);
	                    if (Date.now() - _instance._pressTimeStamp > delay) {
	                        // stop pushing
	                        _instance._pressTimeStamp = 0;

	                        // reset force.
	                        var _e = {
	                            force: 0,
	                            nativeEvent: nativeEvent
	                        };
	                        _instance.invokeHandlers(_instance, _e);
	                    }
	                }
	            };

	            fn.repeatPushForceValue = function (_instance, nativeEvent) {
	                // This pushing is repeating except:
	                //
	                //  - Force support is detected to true
	                if (Forcify.detection.TOUCH3D) return;

	                //  - touchend or mouseup trigger (_pressTimeStamp is reset)
	                if (_instance._pressTimeStamp == 0) return;

	                /**
	                 * Start Pushing procedure
	                 */
	                console.log('start pushing...');

	                var delay = _instance.options.LONG_PRESS_DELAY;
	                var duration = _instance.options.LONG_PRESS_DURATION;

	                // calculate fake force value
	                var _ratio = (Date.now() - _instance._pressTimeStamp - delay) / duration;
	                // the max force value is 1
	                var _force = _ratio >= 1 ? 1 : _ratio;

	                // invoke event handlers
	                var _e = {
	                    force: _force,
	                    nativeEvent: nativeEvent
	                };
	                _instance.invokeHandlers(_instance, _e);

	                /**
	                 * repeat pushing...
	                 */
	                window.setTimeout(_instance.repeatPushForceValue.bind(null, _instance, nativeEvent, delay), 20);
	            };
	        }
	    }]);

	    return Press;
	})();

	exports["default"] = Press;
	module.exports = exports["default"];

/***/ },
/* 5 */
/***/ function(module, exports) {

	/**
	 *  delegate.js
	 *
	 *  Delegate module of forcify.js
	 *  created by @huxpro
	 */

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var Delegate = (function () {
	    function Delegate(Forcify) {
	        _classCallCheck(this, Delegate);

	        this.init(Forcify);
	    }

	    _createClass(Delegate, [{
	        key: 'init',
	        value: function init(Forcify) {
	            function bindEvent() {
	                // event need to be delegated
	                var events = ['mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'webkitmouseforcewillbegin', 'webkitmouseforcechanged'];
	                events.forEach(function (e) {
	                    document.addEventListener(e, handleDelegate);
	                });
	            }

	            function handleDelegate(nativeEvent) {
	                // stop event propagation.
	                // check e.target only.
	                if (!Forcify.__EVENT_BOBBLE__) {
	                    var _target = nativeEvent.target;
	                    var _uid = _target.__fuid__;
	                    emitByUID(_uid, nativeEvent);
	                    return;
	                }

	                // support event bubble
	                // taversal e.path
	                var _path = nativeEvent.path;
	                _path.forEach(function (ele) {
	                    if (!ele.__fuid__) return; // fuid is ensure > 0
	                    var _uid = ele.__fuid__;
	                    emitByUID(_uid, nativeEvent);
	                });
	            }

	            function emitByUID(_uid, nativeEvent) {
	                var caches = Forcify.cache;
	                // if element targeted is a registered Forcify Instance.
	                if (caches[_uid]) {
	                    // Target! Let's emit the event
	                    Forcify.emitEvent(caches[_uid], nativeEvent);
	                }
	            }

	            bindEvent();
	        }
	    }]);

	    return Delegate;
	})();

	exports['default'] = Delegate;
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;