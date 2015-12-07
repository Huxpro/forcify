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
        let fn = Forcify.prototype;
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
                if( nativeEvent.targetTouches[0].force == 1 &&
                    nativeEvent.targetTouches[0].webkitForce == 1
                ) Forcify.detection.WEIRD_CHROME = true;

                // if it's Weird Chrome or Android(ensure unsupport now)
                if(Forcify.detection.WEIRD_CHROME || Forcify.detection.ANDROID){
                    console.log("CHROME, send into handlePress..");
                    _instance.handlePress(_instance, nativeEvent);
                    return;
                };
            }


            /**
             * Fallback to handlePress.
             */
            let _force = nativeEvent.targetTouches[0].force;

            // if 'force' props is undefined
            // let handlePress to handle unsupport devices
            if(typeof _force == "undefined"){
                _instance.handlePress(_instance, nativeEvent);
                return;
            }

            // seeing Nexus5, we had to abandon android.
            // would change if there is android devices support a real 3DTouch
            if(_force > 0 && _force < 1 && !Forcify.detection.ANDROID)
            Forcify.detection.TOUCH3D = true;


            // If forceValue == 0, Forcify sent events to handlePress
            // but keep handleTouch procedure (for pre-polling)
            // alert(nativeEvent.targetTouches[0].force)
            if(_force == "0"){
                if(!Forcify.detection.TOUCH3D){
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
            if(nativeEvent.targetTouches && nativeEvent.targetTouches.length > 1) return;
            if(_instance.touch) return;                         // prevent repeat binding
            _instance.touch = nativeEvent.targetTouches[0];     // get first

            // seeing we don't have `touchforcechange` event,
            // so we need to do it ourselves with polling.
            _instance.pollingTouchForce.bind(_instance.touch, _instance, nativeEvent)();
        }

        fn.pollingTouchForce = function(_instance, nativeEvent){
            /**
             * Start Polling procedure
             */
            console.log('polling...');

            var touchEvent = this;
            var force = 0;
            let sendEvent = true;

            if(_instance.touch) {
                force = touchEvent.force;
                // dynamic detection real 3DTouch
                if(force > 0 && force < 1) Forcify.detection.TOUCH3D = true;

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
                if(force == 0 && !Forcify.detection.TOUCH3D){
                    sendEvent = false;
                }
            }else{
                // touchend trigger! sent 0; 
                force = 0;
                sendEvent = true;
            }

            if(sendEvent){
                let _e = { force, nativeEvent };
                _instance.invokeHandlers(_instance, _e)
            }
        }
    }
}
