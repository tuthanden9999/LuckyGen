
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

    public toString() {
        return JSON.stringify(this);
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
            this.correctAnswerList = gameObj.correctList;
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

    public toString() {
        return JSON.stringify(this);
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

    public toString() {
        return JSON.stringify(this);
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
    }

    addNewGameToBusiness(businessId, gameText) {
        var currentBusiness = this.businessMap.get(businessId);
        var newGame = new Game(gameText);
        this.gameMap.put(newGame.gameId, newGame);
        currentBusiness.gameIdList.push(newGame.gameId);
    }

    _indexOfPlayer(playerList, player) {
        for(var i = 0; i < playerList.length; i++) {
            if(playerList[i].playerId = player.playerId) {
                return i;
            }
        }
        return -1;
    }

    addNewPlayerToGame(gameId, playerText) {
        var tmpPlayer = new Player(playerText);
        var currentGame = this.gameMap.get(gameId);
        var indexOfTmpPlayer = this._indexOfPlayer(currentGame.playerList, tmpPlayer);
        if(indexOfTmpPlayer > -1) {
            currentGame.playerList.push(tmpPlayer);
            if(Util.isSameArray(currentGame.correctList, tmpPlayer.answerList)) {
                currentGame.numberOfCorrectPlayer = currentGame.numberOfCorrectPlayer + 1;
                this.gameMap[currentGame.gameId] = currentGame;
            }
        } else {
            return;
        }
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
                if(Util.isSameArray(currentGame.correctAnswerList, currentGame.playerList[i].answerList)) {
                    if(currentGame.playerList[i].numberGuess == currentGame.numberOfCorrectPlayer) {
                        currentGame.theWinnerId = currentGame.playerList[i].playerId;
                        this.gameMap[currentGame.gameId] = currentGame;
                        return currentGame.playerList[i].toString();
                    }
                }
            }
        }
    }

    getGameResultByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        return currentGame.toString(); 
    }

    getGameHistoryByBusinessId(businessId) {
        var currentBusiness = this.businessMap.get(businessId);
        return currentBusiness.toString();
    }

    stopGame(businessId, gameId) {
        var currentGame = this.gameMap.get(gameId);
        if(currentGame.isFinished) {
            return;
        }
        var currentBusiness = this.businessMap.get(businessId);
        for(var i = 0; i < currentBusiness.gameIdList.length; i++) {
            if(currentBusiness.gameIdList[i] == gameId) {
                this.getGameResultByGameId(gameId);
                currentGame.isFinished = true;
                this.gameMap[currentGame.gameId] = currentGame;
                return;
            }
        }
    }
}