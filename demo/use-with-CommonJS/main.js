/**
 * Forcify Demo
 * use with CommonJS
 *
 * If you want to run CommonJS in browser, you need build tool
 * this example is built by webpack, you can use browserify as well.
 */


let Forcify = require('../build/forcify.js')


var element = document.getElementById('forceMe');
var element2 = document.getElementById('forceMe2');
var forceValueOutput = document.getElementById('forceValue');
var background = document.getElementById('background');
var touch = null;


// Hux Forcer.js

var qf = new Forcify(document.querySelector("#forceMe"));
qf.on('force', function(e){
    //console.log(e.force)
    renderElement(e.force, element)
});

var qf2 = new Forcify(document.querySelector("#forceMe2"));
qf2.on('force', function(e){
    //console.log(e.force)
    renderElement(e.force, element2)
});

function renderElement(forceValue, _element) {
    _element.style.webkitTransform = 'translateX(-50%) translateY(-50%) scale(' + (1 + forceValue * 1.5) + ')';
    //background.style.webkitFilter = 'blur(' + forceValue * 30 + 'px)';
    forceValueOutput.innerHTML = 'Force: ' + forceValue.toFixed(4);
}
