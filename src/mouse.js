/**
 *  mouse.js
 *
 *  Mouse module of forcify.js
 *  created by @huxpro
 */

export default class Mouse{
    constructor(Forcify){
        this.init(Forcify);
    }
    init(Forcify){
        let fn = Forcify.prototype

        // if mouse support force
        fn.handleMouseForce = function(_instance, nativeEvent){
            // max value for trackpad is 3.0 compare to 1.0 on iOS
            let force = nativeEvent.webkitForce/3;
            let _e = {
                force,
                nativeEvent
            };
            _instance.invokeHandlers(_instance, _e)
        }
    }
}
