/**
 *  touch.js
 *
 *  Touch module of forcify.js
 *  created by @huxpro
 */

export default class Touch{
    constructor(Forcify){
        this.init(Forcify);
    }
    init(Forcify){
        let fn = Forcify.prototype
        fn.handleTouch = function(_instance, nativeEvent){
            let type = nativeEvent.type;

            // Forcify strictly limit every view respond to only one finger
            // So targetTouches always empty when touchend,
            // So we first deal with touchend
            if(type == "touchend"){
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
             * Events from Chrome Mobile include force:1 and webkitForce:1,
             *
             * Events from Nexus5 Chrome support a very weird force value!!
             * It's seems like the value is about the area of the touch..
             */

            // So we use a dynamic detection to do that:
            // detect Chrome
            if( nativeEvent.targetTouches[0].force == 1 &&
                nativeEvent.targetTouches[0].webkitForce == 1
            ) Forcify.detection.CHROME = true;

            // detect unsupported iPhone
            let _force = nativeEvent.targetTouches[0].force || 0
            if(_force > 0 && _force < 1 && !Forcify.detection.ANDROID) Forcify.detection.FORCE = true;

            // If forceValue == 0, Forcify sent events to
            // both handlePress and handleTouch
            //alert(nativeEvent.targetTouches[0].force)
            if(!nativeEvent.targetTouches[0].force){    // undefined or 0
                if(!Forcify.detection.FORCE){
                    console.log("send into handlePress..");
                    _instance.handlePress(_instance, nativeEvent);
                }
                //return;
            }

            // if it's Chrome
            if(Forcify.detection.CHROME || Forcify.detection.ANDROID){
                console.log("CHROME, send into handlePress..");
                _instance.handlePress(_instance, nativeEvent);
                return;
            };

            // Forcify support multi-touch in multi-view,
            // But in one view we only use the first touch.
            if(nativeEvent.targetTouches && nativeEvent.targetTouches.length > 1) return;
            if(_instance.touch) return;                         // prevent repeat binding
            _instance.touch = nativeEvent.targetTouches[0];     // get first

            // seeing we don't have `touchforcechange` event,
            // so we need to do it ourselves with polling.
            _instance.pollingTouchForce.bind(_instance.touch, _instance, nativeEvent)();
        }

        fn.pollingTouchForce = function(_instance, nativeEvent){
            console.log('polling...');
            var touchEvent = this;
            var force = 0;
            let sendEvent = true;
            if(_instance.touch) {
                force = touchEvent.force;
                // dynamic detection
                if(force > 0 && force < 1) Forcify.detection.FORCE = true;

                // polling
                setTimeout(_instance.pollingTouchForce.bind(_instance.touch, _instance, nativeEvent), 10);

                // So hacking!!
                // if force here == 0, this must be a unsuppot iPhone with force:0,
                // so we would not send event, let handlePress to fake
                if(force == 0){
                    sendEvent = false;
                }
            }else{
                // Forcify only sent 0 when touchend trigger!
                force = 0;
            }

            if(sendEvent){
                let _e = { force, nativeEvent };
                _instance.invokeHandlers(_instance, _e)
            }

        }
    }
}
