'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

;(function () {
    'use strict';

    // private members
    var _id = 0;

    // init
    function init() {
        // event need to be delegated
        var events = ['click', 'touchstart', 'touchmove', 'touchend', 'webkitmouseforcewillbegin', 'webkitmouseforcechanged'];
        events.forEach(function (e) {
            document.addEventListener(e, handleDelegate);
        });
    }
    init();

    function handleDelegate(nativeEvent) {
        //console.log(nativeEvent.target);
        var _target = nativeEvent.target;

        // if element targeted is a QuickForce Instance.
        var caches = QuickForce.cache;
        for (var key in caches) {
            if (caches[key].element === _target) {
                // Target! Let's emit the event
                QuickForce.emitQFEvent(caches[key].instance, nativeEvent);
            }
        }
    }

    // CLASS

    var QuickForce = (function () {
        /**
         * Init
         * @param  {Element} element [description]
         * @param  {Object} options [description]
         * @return {Object}         [description]
         */

        function QuickForce(element, options) {
            _classCallCheck(this, QuickForce);

            // cache element
            _id++;
            this.id = _id;
            this.element = element;

            var caches = QuickForce.cache;
            caches[_id] = caches[_id] || {};
            caches[_id].element = this.element;
            caches[_id].instance = this;

            // inner handlers
            this.handlers = {};

            // unique touch id
            this.touch = null;
        }

        _createClass(QuickForce, [{
            key: 'invokeHandlers',
            value: function invokeHandlers(_instance, e) {
                //console.log(_instance);
                console.log(e);
                _instance.handlers['forcechange'].forEach(function (fn) {
                    fn(e);
                });
            }
        }, {
            key: 'pollTouchForce',
            value: function pollTouchForce(_instance, nativeEvent) {
                // find the match touch
                // let touches = nativeEvent.touches;
                // for (var i = touches.length - 1; i > 0; i--) {
                //     if(touches[i].target == _instance.element){
                //         _instance.touch = touches[i];
                //     }
                // }
                // TODO: support multi-touch
                _instance.touch = nativeEvent.touches[0];

                // bind touch to check later, seeing touchstart/touchend has no touches.
                setTimeout(_instance.refreshForceValue.bind(_instance.touch, _instance, nativeEvent), 17);
            }
        }, {
            key: 'refreshForceValue',

            // This polling is not right, need fixed
            value: function refreshForceValue(_instance, nativeEvent) {
                var touchEvent = this;
                var force = 0;
                if (_instance.touch) {
                    force = touchEvent.force || 0;
                    // polling
                    setTimeout(_instance.refreshForceValue.bind(_instance.touch, _instance, nativeEvent), 17);
                } else {
                    force = 0;
                }

                var _e = { id: _instance.id, force: force, nativeEvent: nativeEvent };
                _instance.invokeHandlers(_instance, _e);
            }
        }, {
            key: 'on',

            /**
             * Bind event
             * @param  {[type]} event   [description]
             * @param  {[type]} handler [description]
             * @return {[type]}         [description]
             */
            value: function on(event, handler) {
                var handlers = this.handlers;

                handlers[event] = handlers[event] || [];
                handlers[event].push(handler);

                return this;
            }
        }]);

        return QuickForce;
    })();

    // Cache elements reference
    QuickForce.cache = {};

    // Static
    QuickForce.emitQFEvent = function (_instance, nativeEvent) {
        var force = 0;
        var type = nativeEvent.type;

        console.log(type);
        console.log(nativeEvent);
        nativeEvent.preventDefault();

        // wrap type.
        if (type == 'touchend') {
            _instance.touch = null;
        }
        if (type == 'touchmove' || type == 'touchstart') {
            // seeing we don't have touchforcechange event,
            // so we need to do it ourselves with polling.
            _instance.pollTouchForce(_instance, nativeEvent);
        }

        if (type == 'webkitmouseforcewillbegin' || type == 'webkitmouseforcechanged') {
            // max value for trackpad is 3.0 compare to 1.0 on iOS
            force = nativeEvent.webkitForce / 3;
            var _e = {
                id: _instance.id,
                force: force,
                nativeEvent: nativeEvent
            };
            _instance.invokeHandlers(_instance, _e);
        }
    };

    // Module
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function () {
            return QuickForce;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        //module.exports = QuickForce.attach;
        module.exports.QuickForce = QuickForce;
    } else {
        window.QuickForce = QuickForce;
    }
})();
