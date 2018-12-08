const html = `
<div align="center" id="lucky-spin-div-id" style="background-color: rgb(186, 238, 206);">
    <div class="lucky-spin-indicator" style="font-size: 20px; height: 100%;">Initializing game. Please wait...</div>
    <table class="lucky-spin-main" border="0" cellpadding="0" cellspacing="0" style="display: none">
        <tbody>
            <tr>
                Your Address:
                <input id="address" name="fname" placeholder="Your nebulas address" style="width:400;text-align:center " type="text">
                    <input id="submit" onclick="submit();" type="submit" value="Submit">
                    </input>
                </input>
            </tr>
            <tr>
                <td>
                    <div class="power_controls">
                        <img alt="spin" disabled="" id="spin_button" onclick="Play_spin();" src="https://cdn.jsdelivr.net/gh/tuthanden9999/LuckyGen/LuckyGen/LuckySpin/image/spin_off.png">
                            <br>
                                <br>
                                    <!-- <div id="number">so luot quay: </div> -->
                                    So luot quay:
                                    <a id="number">
                                        ...
                                    </a>
                                    <br>
                                        <a align="center" href="#" onclick="resetWheel(); return false;">
                                            Reset
                                        </a>
                                    </br>
                                </br>
                            </br>
                        </img>
                    </div>
                </td>
                <td align="center" class="the_wheel" height="582" valign="center" width="438">
                    <canvas height="434" id="canvas" width="434">
                    </canvas>
                </td>
            </tr>
        </tbody>
    </table>
</div>
`

const JS_DEPENDENCIES = [
    "https://cdn.jsdelivr.net/gh/tuthanden9999/LuckyGen/LuckyGen/LuckySpin/js/Winwheel.js", 
    "http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js", 
    "js/nebPay.js", 
    "js/nebulas.js", 
    "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"
]

const CSS_DEPENDENCIES = [
    'https://rawgit.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/css/lucky-spin.css'
]

window.wheelGame = {
    gameId: null,
    theWheel: null
}

Object.defineProperty(window.wheelGame, 'initialized', {
    set(value) {
        if (value === true) {
            document.querySelector('.lucky-spin-indicator').style.display = 'none'
            document.querySelector('.lucky-spin-main').style.display = 'table'
        }
    },
    get() {
        if (this.initialized === undefined) return false
        return true
    }
})

const GAS_PRICE = "1000000"
const GAS_LIMIT = "2000000"
const SMART_CONSTRACT_ADDR = 'n1pX9zsdTN8yV89b39CeWM8wX5EBZY96TEa' // Test net
const HOST_ADDR = 'n1NjDYdhrCSKyapUriiJo2xMk1jhUC93Be5'
const INTERVAL_TIME = 5000

function initSpin(gameID, playerID, submitPlayerURL) {
    window.wheelGame.gameId = gameID

    loadCSS(CSS_DEPENDENCIES, document.head)
    loadJS(JS_DEPENDENCIES, document.body).then(function() {
        document.getElementById('game-container').innerHTML = html

        window.NebPay = require("nebpay");
        window.nebPay = new NebPay();
        // Nebulas init
        window.nebulas = require("nebulas")
        window.Account = nebulas.Account
        window.neb = new nebulas.Neb();
        
        window.neb.setRequest(new nebulas.HttpRequest("https://testnet.nebulas.io"));

        getGameInfo(window.wheelGame.gameId).then(function(gameInfo) {
            window.wheelGame.theWheel = initWheel(gameInfo)
            window.wheelGame.initialized = true
        })

        getPlayerById(playerID);
    })
}

function initWheel(gameInfo) {
    const notWinPrizeSegment = {
        'fillStyle': randColor(),
        'text': 'Good luck :)'
    }

    return new Winwheel({
        'numSegments': gameInfo.prizeStructure.length + 1, // Include 'not win' prize
        'outerRadius': 212,
        'textFontSize': 28,
        'segments': gameInfo.prizeStructure.map(function(prize) {
            return {
                'fillStyle': randColor(),
                'text': prize.prize.prizeName
            }
        }).concat([notWinPrizeSegment]),
        'animation': {
            'type': 'spinToStop',
            'duration': 5,
            'spins': 8,
            'callbackFinished': alertPrize
        }
    });
}

function loadJS(urls, location) {
    return new Promise(function(resolve, reject) {
        var loaded = 0
        urls.forEach(function(url) {
            var scriptTag = document.createElement('script');
            scriptTag.src = url;
            scriptTag.onload = function() {
                if (++loaded === urls.length) {
                    resolve()
                }
            }
            location.appendChild(scriptTag);
        })
    })
};

function loadCSS(urls, location) {
    return new Promise(function(resolve, reject) {
        var loaded = 0
        urls.forEach(function(url) {
            var styleTag = document.createElement('link');
            styleTag.href = url;
            styleTag.rel = "stylesheet";
            styleTag.onload = function() {
                if (++loaded === urls.length) {
                    resolve()
                }
            }
            location.appendChild(styleTag);
        })
    })
};

function getGameInfo(gameId) {
    var contract = {
        "function": 'getGameResultByGameId',
        "args": JSON.stringify([gameId])
    }

    return neb.api.call(HOST_ADDR, SMART_CONSTRACT_ADDR, "0", "0", GAS_PRICE, GAS_LIMIT, contract)
        .then(function(res) {
            return JSON.parse(JSON.parse(res.result))
        })
}

function randColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function submit() {
    //alert($("#address").val());           
    $.post("addressurl.html", {
        address: document.getElementById('address').value
    }, function(data, status) {
        alert("Data: " + data + "\nStatus: " + status);
    });
}

function funcIntervalQuery(serialNumber) {
    var options = {
        callback: callbackUrl
    }
    nebPay.queryPayInfo(serialNumber, options).then((resp) => {
        var respObject = JSON.parse(resp)
        if (respObject.data.status === 1) {
            var result = JSON.parse(respObject.data.execute_result)
            if (result == "-1") {
                startSpin(5);
            } else {
                startSpin(result);
            }
            clearInterval(this.intervalQuery);
        } else if (respObject.data.status === 0) {
            clearInterval(this.intervalQuery);
        }
    }).catch(err => console.log(err))
}

function Play_spin() {
    var gameId = 1;
    var playerId = 2;
    var to = SMART_CONSTRACT_ADDR;
    var value = 0;
    var callFunction = "spin";
    var callArgs = JSON.stringify([gameId, playerId]);
    const serialNumber = nebPay.call(to, value, callFunction, callArgs);

    this.intervalQuery = setInterval(() => {
        this.funcIntervalQuery(serialNumber);
    }, INTERVAL_TIME);
}

function getPlayerById(playerId) {
    const callFunction = "getPlayerById";
    const callArgs = JSON.stringify([window.wheelGame.gameId, playerId]);
    const contract = {
        "function": callFunction,
        "args": callArgs
    }
    return neb.api.call(HOST_ADDR, SMART_CONSTRACT_ADDR, "0", "0", GAS_PRICE, GAS_LIMIT, contract).then(function(res) {
        result = JSON.parse(JSON.parse(res.result));
        document.getElementById('address').value = result.playerAddress;
        document.getElementById('address').disabled = true;
        document.getElementById('submit').disabled = true;
        if (result.spinNumberOf != "0") {
            document.getElementById('spin_button').src = "https://raw.githubusercontent.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/image/spin_on.png";
            document.getElementById('spin_button').className = "clickable";
        }
        document.getElementById("number").innerHTML = result.spinNumberOf;
    }).catch((err) => {
        console.log({
            err
        })
        document.getElementById("number").innerHTML = "0";
    })
}

var wheelSpinning = false;

function startSpin(prize) {
    console.log("prize= " + prize);
    var stopAt = ((360 / theWheel.numSegments) * (prize - 1)) + 1 + Math.floor((Math.random() * ((360 / theWheel.numSegments) - 2)));
    theWheel.animation.stopAngle = stopAt;
    if (wheelSpinning == false) {
        document.getElementById('spin_button').src = "https://cdn.jsdelivr.net/gh/tuthanden9999/LuckyGen/LuckyGen/LuckySpin/image/spin_off.png";
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