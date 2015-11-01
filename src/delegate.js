/**
 *  delegate.js
 *
 *  Delegate module of forcify.js
 *  created by @huxpro
 */

export default class Delegate{
    constructor(Forcify){
        this.init(Forcify);
    }
    init(Forcify){
        function init(){
            // event need to be delegated
            let events = [
                'mousedown',
                'mouseup',
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
        function handleDelegate(nativeEvent){
            //console.log(nativeEvent.target);
            let _target = nativeEvent.target;
            let _uid = _target.__fuid__;
            let caches = Forcify.cache;

            // if element targeted is a registered Forcify Instance.
            if (_uid && caches[_uid]) {
                // Target! Let's emit the event
                Forcify.emitEvent(caches[_uid], nativeEvent);
            }
        }
        init();
    }
}
