var element = document.getElementById('forceMe');
var element2 = document.getElementById('forceMe2');
var forceValueOutput = document.getElementById('forceValue');
var background = document.getElementById('background');
var touch = null;

//addForceTouchToElement(element);

// Hux Forcer.js

var qf = new QuickForce(document.querySelector("#forceMe"));
qf.on('forcechange', function(e){
    //console.log(e.force)
    renderElement(e.force)
});

var qf2 = new QuickForce(document.querySelector("#forceMe2"));
qf2.on('forcechange', function(e){
    //console.log(e.force)
    renderElement2(e.force)
});

function renderElement(forceValue) {
  element.style.webkitTransform = 'translateX(-50%) translateY(-50%) scale(' + (1 + forceValue * 1.5) + ')';
  background.style.webkitFilter = 'blur(' + forceValue * 30 + 'px)';
  forceValueOutput.innerHTML = 'Force: ' + forceValue.toFixed(4);
}

function renderElement2(forceValue) {
  element2.style.webkitTransform = 'translateX(-50%) translateY(-50%) scale(' + (1 + forceValue * 1.5) + ')';
  background.style.webkitFilter = 'blur(' + forceValue * 30 + 'px)';
  forceValueOutput.innerHTML = 'Force: ' + forceValue.toFixed(4);
}
