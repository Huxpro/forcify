!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.Forcify=t():e.Forcify=t()}(this,function(){return function(e){function t(o){if(n[o])return n[o].exports;var r=n[o]={exports:{},id:o,loaded:!1};return e[o].call(r.exports,r,r.exports,t),r.loaded=!0,r.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){e.exports=n(1)},function(e,t,n){"use strict";function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),i=0;Object.extend=Object.assign?Object.assign:function(e,t){for(var n in t)e[n]=t[n];return e};var u=function(){function e(t,n){o(this,e),this.uid=++i,this.element=t,this.handlers={},this.touch=null,this.timer=null,this._pressTimeStamp=0;var r=Object.extend({},e.defaults);this.options=Object.extend(r,n),this.element.__fuid__=this.uid;var u=e.cache;u[this.uid]=this}return r(e,[{key:"on",value:function(e,t){var n=this.handlers;return n[e]=n[e]||[],n[e].push(t),this}},{key:"invokeHandlers",value:function(e,t){console.log(t),e.handlers.force.forEach(function(e){e(t)})}}]),e}();t["default"]=u,new(n(2))(u),new(n(3))(u),new(n(4))(u),new(n(5))(u),u.emitEvent=function(e,t){var n=t.type;if(console.log("type: "+n),console.log(t),t.preventDefault(),("touchend"==n||"touchmove"==n||"touchstart"==n)&&e.handleTouch(e,t),("webkitmouseforcewillbegin"==n||"webkitmouseforcechanged"==n)&&(u.detection.OSXFORCE=!0,e.handleMouseForce(e,t)),"mousedown"==n||"mouseup"==n){if(u.detection.OSXFORCE)return;e.handlePress(e,t)}},u.config=function(e){e.defaults&&(u.defaults=Object.extend(u.defaults,e.defaults))},u.cache={},u.defaults={LONG_PRESS_DELAY:200,LONG_PRESS_DURATION:100,FALLBACK_TO_LONGPRESS:!0,SHIM_WEIRD_BROWSER:!0},u.detection={TOUCH3D:!1,OSXFORCE:!1,WEIRD_CHROME:!1,ANDROID:navigator.userAgent.match(/(Android);?[\s\/]+([\d.]+)?/)},e.exports=t["default"]},function(e,t){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),r=function(){function e(t){n(this,e),this.init(t)}return o(e,[{key:"init",value:function(e){var t=e.prototype;t.handleTouch=function(t,n){var o=n.type;if("touchend"==o)return t.touch=null,void t.handlePress(t,n);if(t.options.SHIM_WEIRD_BROWSER&&(1==n.targetTouches[0].force&&1==n.targetTouches[0].webkitForce&&(e.detection.WEIRD_CHROME=!0),e.detection.WEIRD_CHROME||e.detection.ANDROID))return console.log("CHROME, send into handlePress.."),void t.handlePress(t,n);var r=n.targetTouches[0].force;return"undefined"==typeof r?void t.handlePress(t,n):(r>0&&1>r&&!e.detection.ANDROID&&(e.detection.TOUCH3D=!0),"0"==r&&(e.detection.TOUCH3D||(console.log("send into handlePress.."),t.handlePress(t,n))),void(n.targetTouches&&n.targetTouches.length>1||t.touch||(t.touch=n.targetTouches[0],t.pollingTouchForce.bind(t.touch,t,n)())))},t.pollingTouchForce=function(t,n){console.log("polling...");var o=this,r=0,i=!0;if(t.touch?(r=o.force,r>0&&1>r&&(e.detection.TOUCH3D=!0),setTimeout(t.pollingTouchForce.bind(t.touch,t,n),10),0!=r||e.detection.TOUCH3D||(i=!1)):(r=0,i=!0),i){var u={force:r,nativeEvent:n};t.invokeHandlers(t,u)}}}}]),e}();t["default"]=r,e.exports=t["default"]},function(e,t){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),r=function(){function e(t){n(this,e),this.init(t)}return o(e,[{key:"init",value:function(e){var t=e.prototype;t.handleMouseForce=function(e,t){var n=t.webkitForce/3,o={force:n,nativeEvent:t};e.invokeHandlers(e,o)}}}]),e}();t["default"]=r,e.exports=t["default"]},function(e,t){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),r=function(){function e(t){n(this,e),this.init(t)}return o(e,[{key:"init",value:function(e){var t=e.prototype;t.handlePress=function(e,t){if(e.options.FALLBACK_TO_LONGPRESS){var n=e.options.LONG_PRESS_DELAY,o=(e.options.LONG_PRESS_DURATION,t.type);if(("mousedown"===o||"touchstart"===o)&&(e._pressTimeStamp=Date.now(),e.timer=window.setTimeout(function(){e.repeatPushForceValue(e,t)},n)),("mouseup"===o||"touchend"===o)&&(window.clearTimeout(e.timer),Date.now()-e._pressTimeStamp>n)){e._pressTimeStamp=0;var r={force:0,nativeEvent:t};e.invokeHandlers(e,r)}}},t.repeatPushForceValue=function(t,n){if(!e.detection.TOUCH3D&&0!=t._pressTimeStamp){console.log("start pushing...");var o=t.options.LONG_PRESS_DELAY,r=t.options.LONG_PRESS_DURATION,i=(Date.now()-t._pressTimeStamp-o)/r,u=i>=1?1:i,c={force:u,nativeEvent:n};t.invokeHandlers(t,c),window.setTimeout(t.repeatPushForceValue.bind(null,t,n,o),20)}}}}]),e}();t["default"]=r,e.exports=t["default"]},function(e,t){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),r=function(){function e(t){n(this,e),this.init(t)}return o(e,[{key:"init",value:function t(e){function t(){var e=["mousedown","mouseup","touchstart","touchmove","touchend","webkitmouseforcewillbegin","webkitmouseforcechanged"];e.forEach(function(e){document.addEventListener(e,n)})}function n(t){var n=t.target,o=n.__fuid__,r=e.cache;o&&r[o]&&e.emitEvent(r[o],t)}t()}}]),e}();t["default"]=r,e.exports=t["default"]}])});