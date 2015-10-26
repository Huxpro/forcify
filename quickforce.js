;(function(){
    'use strict';



    // private members
    let _id = 0;

    // init
    function init(){
        // event need to be delegated
        let events = [
            'click',
            'touchstart',
            'touchmove',
            'touchend',
            'webkitmouseforcewillbegin',
            'webkitmouseforcechanged'
        ];
        events.forEach((e) => {
            document.addEventListener(e, handleDelegate)
        })
    }
    init();

    function handleDelegate(nativeEvent){
        //console.log(nativeEvent.target);
        let _target = nativeEvent.target

        // if element targeted is a QuickForce Instance.
        let caches = QuickForce.cache;
        for (let key in caches) {
            if (caches[key].element === _target) {
                // Target! Let's emit the event
                QuickForce.emitQFEvent(caches[key].instance, nativeEvent);
            }
        }
    }


    // CLASS
    class QuickForce{
        /**
         * Init
         * @param  {Element} element [description]
         * @param  {Object} options [description]
         * @return {Object}         [description]
         */
        constructor(element, options){

            // cache element
            _id++;
            this.id = _id;
            this.element = element;

            let caches = QuickForce.cache;
            caches[_id] = caches[_id] || {};
            caches[_id].element = this.element;
            caches[_id].instance = this;

            // inner handlers
            this.handlers = {};

            // unique touch id
            this.touch = null;
        }

        invokeHandlers(_instance, e){
            //console.log(_instance);
            console.log(e);
            _instance.handlers['forcechange'].forEach((fn) => {
                fn(e);
            })
        }

        pollTouchForce(_instance, nativeEvent){
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

        // This polling is not right, need fixed
        refreshForceValue(_instance, nativeEvent){
            var touchEvent = this;
            var force = 0;
            if(_instance.touch) {
                force = touchEvent.force || 0;
                // polling
                setTimeout(_instance.refreshForceValue.bind(_instance.touch, _instance, nativeEvent), 17);
            }else{
                force = 0;
            }

            let _e = { id: _instance.id, force, nativeEvent };
            _instance.invokeHandlers(_instance, _e)
        }

        /**
         * Bind event
         * @param  {[type]} event   [description]
         * @param  {[type]} handler [description]
         * @return {[type]}         [description]
         */
        on(event, handler){
            let handlers = this.handlers;

            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);

            return this;
        }
    }

    // Cache elements reference
    QuickForce.cache = {}

    // Static
    QuickForce.emitQFEvent = function(_instance, nativeEvent){
        let force = 0;
        let type = nativeEvent.type;

        console.log(type);
        console.log(nativeEvent);
        nativeEvent.preventDefault();

        // wrap type.
        if(type == "touchend"){
            _instance.touch = null;
        }
        if(type == "touchmove" || type == "touchstart"){
            // seeing we don't have touchforcechange event,
            // so we need to do it ourselves with polling.
            _instance.pollTouchForce(_instance, nativeEvent);
        }

        if(type == 'webkitmouseforcewillbegin' || type == 'webkitmouseforcechanged'){
            // max value for trackpad is 3.0 compare to 1.0 on iOS
            force = nativeEvent.webkitForce/3;
            let _e = {
                id: _instance.id,
                force,
                nativeEvent
            };
            _instance.invokeHandlers(_instance, _e)
        }
    }

    // Module
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// AMD. Register as an anonymous module.
		define(function() {
			return QuickForce;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		//module.exports = QuickForce.attach;
		module.exports.QuickForce = QuickForce;
	} else {
		window.QuickForce = QuickForce;
	}
})();
