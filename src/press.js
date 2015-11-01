/**
 *  press.js
 *
 *  Press module of forcify.js
 *  created by @huxpro
 */

export default class Press{
    constructor(Forcify){
        this.init(Forcify);
    }
    init(Forcify){
        let fn = Forcify.prototype

        // fallback to long press (mouse || touch)
        fn.handlePress = function(_instance, nativeEvent){
            let delay = _instance.options.LONG_PRESS_DELAY;
            let duration = _instance.options.LONG_PRESS_DURATION;
            let type = nativeEvent.type;

            if(type === "mousedown" || type === "touchstart"){
                _instance._pressTimeStamp = Date.now();
                _instance.timer = window.setTimeout(()=>{
                    // Long Press!
                    // Let's trigger fake Force now.
                    _instance.repeatPushForceValue(_instance, nativeEvent)
                }, delay)
            }
            if(type === 'mouseup' || type === "touchend"){
                window.clearTimeout(_instance.timer);
                if(Date.now() - _instance._pressTimeStamp > delay){
                    // stop pushing
                    _instance._pressTimeStamp = 0;

                    // reset force.
                    let _e = {
                        force: 0,
                        nativeEvent
                    };
                    _instance.invokeHandlers(_instance, _e)
                }
            }
        }

        fn.repeatPushForceValue = function(_instance, nativeEvent){
            // This pushing is never stop until
            //      - touchend or mouseup trigger
            //      - Force support is detected to true
            if(Forcify.detection.FORCE) return;

            console.log('pushing...');
            let delay = _instance.options.LONG_PRESS_DELAY;
            let duration = _instance.options.LONG_PRESS_DURATION;

            // if _pressTimeStamp is reset. stop pushing!
            if(_instance._pressTimeStamp == 0) return;

            // calculate fake force value (the max value is 1)
            let _ratio = ((Date.now() - _instance._pressTimeStamp) - delay)/duration;
            let _force = (_ratio >= 1) ? 1 : _ratio;

            // invoke event handlers
            let _e = {
                force: _force,
                nativeEvent
            };
            _instance.invokeHandlers(_instance, _e)
            window.setTimeout(_instance.repeatPushForceValue.bind(null, _instance, nativeEvent, delay), 20)
        }
    }
}
