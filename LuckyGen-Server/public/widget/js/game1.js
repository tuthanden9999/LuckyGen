const html = `
<div align="center" id="lucky-spin-div-id">
    <div id="lucky-spin-indicator" style="font-size: 20px; height: 100%;">Initializing game. Please wait...</div>
    <div id="lucky-spin-overlay" style="position: absolute;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        font-size: 25px;"></div>
    <table id="lucky-spin-main" border="0" cellpadding="0" cellspacing="0" style="display: none">
        <tbody>
            <tr>
                <div class="lgx-subscribe-form">
                    <div class="form-group form-group-email">
                        <input type="text" name="fname" id="player-address" placeholder="Your nebulas address" class="form-control lgx-input-form form-control">
                    </div>
                    <div class="form-group form-group-submit">
                        <button type="button" onclick="submitNewPlayer();" name="lgx-submit" id="submit" class="lgx-btn lgx-submit"><span>Submit</span></button>
                    </div>
                </div>
            </tr>
            <tr>
                <td>
                    <div class="power_controls">
                        <img alt="spin" disabled="" id="spin_button" onclick="playSpin();" src="https://rawgit.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/image/spin_off.png">
                            <br>
                                <br>
                                    <!-- <div id="number">Turns remaining: </div> -->
                                    Turns remaining:
                                    <a id="number">
                                        ...
                                    </a>
                                    <!-- <br>
                                        <a align="center" href="#" onclick="resetWheel(); return false;">
                                            Reset
                                        </a>
                                    </br> -->
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
    "https://rawgit.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/js/Winwheel.js", 
    "http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js", 
    "http://localhost:8080/widget/js/nebPay.js", "http://localhost:8080/widget/js/nebulas.js"
]

const CSS_DEPENDENCIES = ['https://rawgit.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/css/lucky-spin.css']
window.wheelGame = {
    gameId: null,
    theWheel: null
}
Object.defineProperty(window.wheelGame, 'initialized', {
    set(value) {
        if (value === true) {
            document.querySelector('#lucky-spin-indicator').style.display = 'none'
            document.querySelector('#lucky-spin-main').style.display = 'table'
        }
    },
    get() {
        if (this.initialized === undefined) return false
        return true
    }
})
const GAS_PRICE = "1000000"
const GAS_LIMIT = "2000000"
const HOST_ADDR = 'n1NjDYdhrCSKyapUriiJo2xMk1jhUC93Be5'
var CALLBACK_URL
const INTERVAL_TIME = 5000
const NOT_WIN_PRIZE_TEXT = ""

function initSpin({
    game_id,
    player_id,
    submit_url,
    contract_address
}) {
    window.wheelGame.gameId = game_id
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

        window.wheelGame.contractAddress = contract_address
        window.wheelGame.submitUrl = submit_url
        window.wheelGame.gameId = game_id
        window.wheelGame.playerId = player_id
        CALLBACK_URL = NebPay.config.testnetUrl
            
        getGameInfo(window.wheelGame.gameId).then(function(gameInfo) {
            window.wheelGame.theWheel = initWheel(gameInfo)
            window.wheelGame.initialized = true
        })
        getPlayerById(player_id);
    })
}

function initWheel(gameInfo) {
    let totalPercentage = 0

    let segments = gameInfo.prizeStructure.map(function(prize) {
        totalPercentage += prize.prizePercentage
        return {
            'fillStyle': randColor(),
            'text': prize.prize.prizeName
        }
    })

    if (totalPercentage < 100) {
        segments = segments.concat([{
            'fillStyle': randColor(),
            'text': NOT_WIN_PRIZE_TEXT
        }])
        window.wheelGame.notWinPrizeIndex = segments.length
    }

    return new Winwheel({
        'numSegments': segments.length, // Include 'not win' prize
        'outerRadius': 212,
        'textFontSize': 28,
        'segments': segments,
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
    return neb.api.call(HOST_ADDR, window.wheelGame.contractAddress, "0", "0", GAS_PRICE, GAS_LIMIT, contract).then(function(res) {
        return JSON.parse(JSON.parse(res.result))
    })
}

function randColor() {
    const colors = ["#f03434", "#EC644B", "#D24D57", "#F22613", "#D91E18", "#96281B", "#EF4836", "#D64541", "#C0392B", "#CF000F", "#E74C3C", "#DB0A5B", "#F64747", "#F1A9A0", "#D2527F", "#E08283", "#F62459", "#E26A6A", "#947CB0", "#DCC6E0", "#663399", "#674172", "#AEA8D3", "#913D88", "#9A12B3", "#BF55EC", "#BE90D4", "#8E44AD", "#9B59B6", "#013243", "#446CB3", "#E4F1FE", "#4183D7", "#59ABE3", "#81CFE0", "#52B3D9", "#C5EFF7", "#22A7F0", "#3498DB", "#2C3E50", "#19B5FE", "#336E7B", "#22313F", "#6BB9F0", "#1E8BC3", "#3A539B", "#34495E", "#67809F", "#2574A9", "#1F3A93", "#89C4F4", "#4B77BE", "#5C97BF", "#00e640", "#91b496", "#4ECDC4", "#A2DED0", "#87D37C", "#90C695", "#03C9A9", "#68C3A3", "#65C6BB", "#1BBC9B", "#1BA39C", "#66CC99", "#36D7B7", "#C8F7C5", "#86E2D5", "#2ECC71", "#16a085", "#3FC380", "#019875", "#03A678", "#4DAF7C", "#2ABB9B", "#00B16A", "#1E824C", "#049372", "#26C281", "#F5D76E", "#F7CA18", "#F4D03F", "#fabe58", "##e9d460", "#FDE3A7", "#F89406", "#EB9532", "#E87E04", "#F4B350", "#F2784B", "#EB974E", "#F5AB35", "#D35400", "#F39C12", "#F9690E", "#F9BF3B", "#F27935", "#E67E22", "#ececec", "#6C7A89", "#D2D7D3", "#EEEEEE", "#BDC3C7", "#ECF0F1", "#95A5A6", "#DADFE1", "#ABB7B7", "#F2F1EF", "#BFBFBF"]
    return colors[Math.floor(Math.random()*colors.length)]
}

function submitNewPlayer() {
    showOverlay('<i class="fa fa-spin fa-spinner"></i>We are create your new play account. <br>Please wait about 30s...')
    $.post(wheelGame.submitUrl, {
        player_address: document.getElementById('player-address').value,
        game_id: wheelGame.gameId,
        player_id: wheelGame.playerId
    }, function(data, status) {
        getPlayerById(wheelGame.playerId)
        setTimeout(() => {
            hideOverlay()
        }, 500)
    });
}

var intervalQuery

function playSpin() {
    if ($("#player-address").val() == '') {
        alert('Please enter nebulas address then submit before play the game!')
        return
    }
    var options = {
        callback: CALLBACK_URL
    }
    var callFunction = "spin";
    var callArgs = JSON.stringify([window.wheelGame.gameId, window.wheelGame.playerId]);
    const serialNumber = nebPay.call(window.wheelGame.contractAddress, "0", callFunction, callArgs, options);

    showOverlay('<i class="fa fa-spin fa-spinner"></i> Waiting the result for you. <br />Please wait about 30s...')

    intervalQuery = setInterval(() => {
        funcIntervalQuery(serialNumber);
    }, INTERVAL_TIME);
}

function funcIntervalQuery(serialNumber) {
    var options = {
        callback: CALLBACK_URL
    }
    nebPay.queryPayInfo(serialNumber, options).then((resp) => {
        var respObject = JSON.parse(resp)
        console.log({respObject})
        if (respObject.data.status === 1) {
            hideOverlay()

            var result = JSON.parse(respObject.data.execute_result)
            if (result == "-1") {
                startSpin(window.wheelGame.notWinPrizeIndex);
            } else {
                startSpin(result);
            }
            getPlayerById(window.wheelGame.playerId)
            clearInterval(intervalQuery);
        } else if (respObject.data.status === 0) {
            clearInterval(intervalQuery);
        }
    }).catch(err => console.log(err))
}

function getPlayerById(playerId) {
    const callFunction = "getPlayerById";
    const callArgs = JSON.stringify([window.wheelGame.gameId, playerId]);
    const contract = {
        "function": callFunction,
        "args": callArgs
    }
    return neb.api.call(HOST_ADDR, window.wheelGame.contractAddress, "0", "0", GAS_PRICE, GAS_LIMIT, contract).then(function(res) {
        result = JSON.parse(JSON.parse(res.result));
        document.getElementById('player-address').value = result.playerAddress;
        document.getElementById('player-address').disabled = true;
        document.getElementById('submit').disabled = true;
        if (result.spinNumberOf != "0") {
            document.getElementById('spin_button').src = "https://raw.githubusercontent.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/image/spin_on.png";
            document.getElementById('spin_button').className = "clickable";
        }
        document.getElementById("number").innerHTML = result.spinNumberOf;
    }).catch((err) => {
        console.log({ err })
        document.getElementById("number").innerHTML = "0";
    })
}
var wheelSpinning = false;

function startSpin(prize) {
    resetWheel()
    var stopAt = ((360 / wheelGame.theWheel.numSegments) * (prize - 1)) + 1 + Math.floor((Math.random() * ((360 / wheelGame.theWheel.numSegments) - 2)));
    console.log({stopAt})
    wheelGame.theWheel.animation.stopAngle = stopAt;
    if (wheelSpinning == false) {
        document.getElementById('spin_button').src = "https://rawgit.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/image/spin_off.png";
        document.getElementById('spin_button').className = "";
        wheelGame.theWheel.startAnimation();
        wheelSpinning = true;
    }
}

function resetWheel() {
    wheelGame.theWheel.stopAnimation(false);
    wheelGame.theWheel.rotationAngle = 0;
    wheelGame.theWheel.draw();
    wheelSpinning = false;
    document.getElementById('spin_button').src = "https://raw.githubusercontent.com/tuthanden9999/LuckyGen/master/LuckyGen/LuckySpin/image/spin_on.png";
    document.getElementById('spin_button').className = "clickable";
}

function alertPrize(indicatedSegment) {
    if (indicatedSegment.text === NOT_WIN_PRIZE_TEXT) {
        alert('Oops. You don\'t win this game. Play again?')
    } else {
        alert("Congratulation! You have won " + indicatedSegment.text);        
    }
}

function hideOverlay(){
    $("#lucky-spin-overlay").html('')
    $("#lucky-spin-overlay").css('display', 'none')
    $("#lucky-spin-main").css('opacity', '1')   
}

function showOverlay(msg) {
    $("#lucky-spin-overlay").html(msg)
    $("#lucky-spin-overlay").css('display', 'flex')
    $("#lucky-spin-main").css('opacity', '0.3')
}