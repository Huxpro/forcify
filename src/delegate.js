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
        function bindEvent(){
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
            // stop event propagation.
            // check e.target only.
            if(!Forcify.__EVENT_BOBBLE__){
                let _target = nativeEvent.target;
                let _uid = _target.__fuid__;
                emitByUID(_uid, nativeEvent)
                return;
            }

            // support event bubble
            // taversal e.path
            let _path   = nativeEvent.path;
            _path.forEach((ele) => {
                if(!ele.__fuid__) return;   // fuid is ensure > 0
                let _uid = ele.__fuid__;
                emitByUID(_uid, nativeEvent);
            })
        }

        function emitByUID(_uid, nativeEvent){
            let caches = Forcify.cache;
            // if element targeted is a registered Forcify Instance.
            if (caches[_uid]) {
                // Target! Let's emit the event
                Forcify.emitEvent(caches[_uid], nativeEvent);
            }
        }

        bindEvent();
    }
}
