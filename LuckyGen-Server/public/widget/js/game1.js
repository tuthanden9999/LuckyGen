// var link = document.createElement("script");
// link.setAttribute("src", "https://cdn.jsdelivr.net/npm/winwheel@1.0.1/dist/Winwheel.min.js");
// var link2 = document.createElement("script");
// link2.setAttribute("src", "http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js");
// document.querySelector('#root-src').insertAdjacentElement('beforebegin', link)
// document.querySelector('#root-src').insertAdjacentElement('beforebegin', link2)
var style = document.createElement('link')
style.setAttribute('href', ASSET_HOST + '/widget/css/game1.css')
style.setAttribute('rel', 'stylesheet')
style.setAttribute('type', 'text/css')
document.querySelector('#lucky-spin').insertAdjacentElement('beforebegin', style)

var theWheel = new Winwheel({
    'numSegments': 32,
    'outerRadius': 212,
    'textFontSize': 28,
    'segments': [{
        'fillStyle': '#ff0000',
        'text': 'Prize 1'
    }, {
        'fillStyle': '#0000ff',
        'text': 'Prize 2'
    }, {
        'fillStyle': '#33ff77',
        'text': 'Prize 3'
    }, {
        'fillStyle': '#808080',
        'text': 'Prize 4'
    }, {
        'fillStyle': '#ff33ff',
        'text': 'Prize 5'
    }, {
        'fillStyle': '#9999ff',
        'text': 'Prize 6'
    }, {
        'fillStyle': '#009966',
        'text': 'Prize 7'
    }, {
        'fillStyle': '#77773c',
        'text': 'Prize 8'
    }, {
        'fillStyle': '#ff2e00',
        'text': 'Prize 9'
    }, {
        'fillStyle': '#0023ff',
        'text': 'Prize 10'
    }, {
        'fillStyle': '#331277',
        'text': 'Prize 11'
    }, {
        'fillStyle': '#812af0',
        'text': 'Prize 12'
    }, {
        'fillStyle': '#fabc2f',
        'text': 'Prize 13'
    }, {
        'fillStyle': '#9234ef',
        'text': 'Prize 14'
    }, {
        'fillStyle': '#0092f6',
        'text': 'Prize 15'
    }, {
        'fillStyle': '#7744ac',
        'text': 'Prize 16'
    }, {
        'fillStyle': '#f234ac',
        'text': 'Prize 17'
    }, {
        'fillStyle': '#002aff',
        'text': 'Prize 18'
    }, {
        'fillStyle': '#31af77',
        'text': 'Prize 19'
    }, {
        'fillStyle': '#824380',
        'text': 'Prize 20'
    }, {
        'fillStyle': '#ff32af',
        'text': 'Prize 21'
    }, {
        'fillStyle': '#c991ff',
        'text': 'Prize 22'
    }, {
        'fillStyle': '#d0a966',
        'text': 'Prize 23'
    }, {
        'fillStyle': '#772aac',
        'text': 'Prize 24'
    }, {
        'fillStyle': '#ffb0a0',
        'text': 'Prize 25'
    }, {
        'fillStyle': '#0a50ff',
        'text': 'Prize 26'
    }, {
        'fillStyle': '#312f77',
        'text': 'Prize 27'
    }, {
        'fillStyle': '#876080',
        'text': 'Prize 28'
    }, {
        'fillStyle': '#ff3a4f',
        'text': 'Prize 29'
    }, {
        'fillStyle': '#999a5f',
        'text': 'Prize 30'
    }, {
        'fillStyle': '#009aa6',
        'text': 'Prize 31'
    }, {
        'fillStyle': '#7772ac',
        'text': 'Prize 32'
    }],
    'animation': {
        'type': 'spinToStop',
        'duration': 5,
        'spins': 8,
        'callbackFinished': alertPrize
    }
});

function updateSpin(numSegments, prizes) {
    theWheel.numSegments = numSegments;
    while (theWheel.segments.length > theWheel.numSegments + 1) {
        theWheel.segments.pop();
    }
    console.log(theWheel.numSegments);
    console.log(theWheel.segments.length);
    console.log(theWheel.segments);
    for (var i = 1; i <= theWheel.numSegments; i++) {
        theWheel.segments[i].text = prizes[i - 1];
    }
    theWheel.updateSegmentSizes();
    theWheel.draw();
}
updateSpin(5, ["test 1", "test 2", "test 3", "test 4", "test 5"]);
var wheelSpinning = false;

function startSpin(prize) {
    console.log(prize);
    var stopAt = ((360 / theWheel.numSegments) * (prize - 1)) + 1 + Math.floor((Math.random() * ((360 / theWheel.numSegments) - 2)));
    theWheel.animation.stopAngle = stopAt;
    if (wheelSpinning == false) {
        document.getElementById('spin_button').src = "https://rawgit.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/image/spin_off.png";
        document.getElementById('spin_button').className = "";
        theWheel.startAnimation();
        wheelSpinning = true;
    }
}

function resetWheel() {
    theWheel.stopAnimation(false);
    theWheel.rotationAngle = 0;
    theWheel.draw();
    wheelSpinning = false;
    document.getElementById('spin_button').src = "https://raw.githubusercontent.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/image/spin_on.png";
    document.getElementById('spin_button').className = "clickable";
}

function alertPrize(indicatedSegment) {
    alert("You have won " + indicatedSegment.text);
}