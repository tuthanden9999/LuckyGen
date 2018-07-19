
class Util {
    static fromNasToWei(value) {
        return new BigNumber("1000000000000000000").times(value);
    }
    static fromWeiToNas(value) {
        if (value instanceof BigNumber) {
            return value.dividedBy("1000000000000000000");
        } else {
            return new BigNumber(value).dividedBy("1000000000000000000");
        }
    }
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    static isSameArray(arr1, arr2) {
        return arr1.length === arr2.length && arr1.every((v,i) => v === arr2[i]);
    }
}

class Business {
    businessId: number;
    gameIdList: number[];
    public constructor(text ? : string) {
        if(text) {
            let businessObj = JSON.parse(text);
            this.businessId = businessObj.businessId;
            this.gameIdList = businessObj.gameIdList;
        } else {
            this.businessId = 0;
            this.gameIdList = [];
        }
    }
}

class Game {
    gameId: number;
    correctAnswerList: string[];
    playerList: Player[];
    numberOfCorrectPlayer: number;
    isFinished: boolean;
    theWinnerId: number;

    public constructor(text ? : string) {
        if(text) {
            let gameObj = JSON.parse(text);
            this.gameId = gameObj.gameId;
            this.correctAnswerList = gameObj.correctAnswerList;
            this.playerList = gameObj.playerList;
            this.numberOfCorrectPlayer = 0;
            for(var i = 0; i < this.playerList.length; i++) {
                if(Util.isSameArray(this.correctAnswerList, this.playerList[i].answerList)) {
                    this.numberOfCorrectPlayer = this.numberOfCorrectPlayer + 1;
                }
            }
            this.isFinished = gameObj.isFinished;
            this.theWinnerId = gameObj.theWinnerId;
        } else {
            this.gameId = 0;
            this.correctAnswerList = [];
            this.playerList = [];
            this.numberOfCorrectPlayer = 0;
            this.isFinished = false;
            this.theWinnerId = -1;
        }
    }
}

class Player {
    playerId: number;
    playerName: string;
    playerAddress: string;
    answerList: string[];
    numberGuess: number;
    public constructor(text ? : string) {
        if(text) {
            let playerObj = JSON.parse(text);
            this.playerId = playerObj.playerId;
            this.playerName = playerObj.playerName;
            this.playerAddress = playerObj.playerAddress;
            this.answerList = playerObj.answerList;
            this.numberGuess = playerObj.numberGuess;
        } else {
            this.playerId = 0;
            this.playerName = "";
            this.playerAddress = "";
            this.answerList = [];
            this.numberGuess = 0;
        }
    }
}

class BLuckyCounter {
    constructor() {
        LocalContractStorage.defineMapProperties(this, {
            "businessMap": null,
            "gameMap": null
        });
    }

    init() {
    }

    addNewBusiness(businessText) {
        var newBusiness = new Business(businessText);
        this.businessMap.put(newBusiness.businessId, newBusiness);
        return "addNewBusiness success";
    }

    addNewGameToBusiness(businessId, gameText) {
        var currentBusiness = this.businessMap.get(businessId);
        var newGame = new Game(gameText);
        this.gameMap.put(newGame.gameId, newGame);
        currentBusiness.gameIdList.push(newGame.gameId);
        return "addNewGameToBusiness success";
    }

    addNewPlayerToGame(gameId, playerText) {
        var tmpPlayer = new Player(playerText);
        var currentGame = this.gameMap.get(gameId);
        if(currentGame.isFinished) {
            return "Game is finished.";
        }

        var isExistPlayer = currentGame.playerList.includes(tmpPlayer)
        if(!isExistPlayer) {
            currentGame.playerList.push(tmpPlayer);
        } else {
        }
        if(Util.isSameArray(currentGame.correctAnswerList, tmpPlayer.answerList)) {
            currentGame.numberOfCorrectPlayer = currentGame.numberOfCorrectPlayer + 1;
        }
        this.gameMap.put(currentGame.gameId, currentGame);
        return "addNewPlayerToGame success";
    }

    getWinnerResultByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        if(currentGame.isFinished) {
            for(var i = 0; i < currentGame.playerList.length; i++) {
                if(currentGame.playerList[i].playerId == currentGame.theWinnerId) {
                    return currentGame.playerList[i].toString();
                }
            }
        } else {
            for(var i = 0; i < currentGame.playerList.length; i++) {
                var tmpPlayer = currentGame.playerList[i];
                if(Util.isSameArray(currentGame.correctAnswerList, tmpPlayer.answerList)) {
                    if(tmpPlayer.numberGuess == currentGame.numberOfCorrectPlayer) {
                        currentGame.theWinnerId = tmpPlayer.playerId;
                        this.gameMap.put(currentGame.gameId, currentGame);
                        return JSON.stringify(tmpPlayer);
                    }
                }
            }
        }
        return JSON.stringify(new Player());
    }

    getGameResultByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        return JSON.stringify(currentGame); 
    }

    getGameHistoryByBusinessId(businessId) {
        var currentBusiness = this.businessMap.get(businessId);
        return JSON.stringify(currentBusiness);
    }

    stopGame(businessId, gameId) {
        var currentGame = this.gameMap.get(gameId);
        if(currentGame.isFinished) {
            return "stopGame is stopped";
        }
        var currentBusiness = this.businessMap.get(businessId);
        for(var i = 0; i < currentBusiness.gameIdList.length; i++) {
            if(currentBusiness.gameIdList[i] == gameId) {
                this.getGameResultByGameId(gameId);
                currentGame.isFinished = true;
                this.gameMap.put(currentGame.gameId, currentGame);
                return "stopGame success";
            }
        }
        return "stopGame fail";
    }

    _createPlayerText(playerId, playerName, playerAddress, answerList, numberGuess) {
        var player = {}
        player.playerId = playerId;
        player.playerName = playerName;
        player.playerAddress = playerAddress;
        player.answerList = answerList;
        player.numberGuess = numberGuess;
        return JSON.stringify(player);
    }

    // testAll() {
    //     var result = "";
    //     var businessText = {};
    //     businessText.businessId = 1;
    //     businessText.gameIdList = [1, 2, 3];
    //     result = result + " "+ this.addNewBusiness(JSON.stringify(businessText));
    //     result = result + "                                                                                              ";
    //     var gameText = {};
    //     gameText.gameId = 1;
    //     gameText.correctAnswerList = ["A", "C"];
    //     gameText.playerList = [];
    //     gameText.numberOfCorrectPlayer = 0;
    //     gameText.isFinished = false;
    //     gameText.theWinnerId = -1;
    //     result = result + " " + this.addNewGameToBusiness(1, JSON.stringify(gameText));
    //     result = result + "                                                                                              ";
    //     var playerText1 = this._createPlayerText(1, "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud", ["B","C"], 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText1);
    //     var playerText2 = this._createPlayerText(2, "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4", ["A","A"], 2);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText2);
    //     var playerText3 = this._createPlayerText(3, "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws", ["A","C"], 3);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText3);
    //     var playerText4 = this._createPlayerText(4, "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S", ["A","C"], 4);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText4);
    //     var playerText5 = this._createPlayerText(5, "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn", ["A","C"], 5);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText5);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.getWinnerResultByGameId(1);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.getGameHistoryByBusinessId(1);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.getGameResultByGameId(1);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.stopGame(1, 1);
    //     return result;
    // }
}

module.exports = BLuckyCounter;