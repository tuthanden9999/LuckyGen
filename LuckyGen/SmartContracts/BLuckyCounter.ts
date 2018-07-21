const ErrorMessages = {
    MASTER_ADDRESS_INVALID: "masterAddress isn't exist.",
    GAME_INVALID: "game isn't exist.",
    BUSINESS_ADDRESS_INVALID: "businessAddress isn't exist.",
    GAME_FINISHED: "game is finished.",
    PLAYER_EXIST: "player is exist.",
    PLAYER_INVALID: "player isn't exist."
}

const Validator = {
    checkValidGame: function(currentGame) {
        if( ! currentGame) {
            throw new Error(ErrorMessages.GAME_INVALID);
        }
    },
    checkBusinessAddress: function(businessAddress) {
        if(Blockchain.transaction.from !== businessAddress) {
            throw new Error(ErrorMessages.BUSINESS_ADDRESS_INVALID);
        }
    },
    checkGameFinished: function(currentGame) {
        if(currentGame.isFinished) {
            throw new Error(ErrorMessages.GAME_FINISHED);
        }
    },
    checkMasterAddress: function(masterAddress) {
        if(Blockchain.transaction.from !== masterAddress) {
            throw new Error(ErrorMessages.MASTER_ADDRESS_INVALID);
        }
    }
}

class Business {
    businessId: string;
    gameIdList: number[];
    public constructor(businessId) {
        this.businessId = businessId;
        this.gameIdList = [];
    }
}

class Game {
    gameId: number;
    businessAddress: string;
    playerList: Player[];
    correctPlayerList: Player[];
    isFinished: boolean;

    winner: Player;
    numberOfCorrectPlayer: number;
    correctAnswerList: string[];

    public constructor(gameId, text ? : string) {
        if(text) {
            let gameObj = JSON.parse(text);
            this.gameId = gameId;
            this.businessAddress = gameObj.businessAddress;
            this.playerList = [];
            this.isFinished = false;

            this.winner = new Player();
            this.numberOfCorrectPlayer = 0;
            this.correctAnswerList = [];
            this.correctPlayerList = [];
        } else {
            this.gameId = 0;
            this.businessAddress = "";
            this.playerList = [];
            this.isFinished = false;

            this.winner = new Player();
            this.numberOfCorrectPlayer = 0;
            this.correctAnswerList = [];
            this.correctPlayerList = [];
        }
    }
}

class Player {
    playerId: string;
    playerName: string;
    playerAddress: string;
    answerList: string[];
    predictedNumber: number;
    joinTimestamp: number;
    playTimestamp: number;
    public constructor(text ? : string) {
        if(text) {
            let playerObj = JSON.parse(text);
            this.playerId = playerObj.playerId;
            this.playerName = playerObj.playerName;
            this.playerAddress = playerObj.playerAddress;
            this.answerList = [];
            this.predictedNumber = 0;
            this.joinTimestamp = 0;
            this.playTimestamp = 0;
        } else {
            this.playerId = "0";
            this.playerName = "";
            this.playerAddress = "";
            this.answerList = [];
            this.predictedNumber = 0;
            this.joinTimestamp = 0;
            this.playTimestamp = 0;
        }
    }
}

class BLuckyCounter {
    constructor() {
        LocalContractStorage.defineMapProperties(this, {
            "businessMap": null,
            "gameMap": null
        });
        LocalContractStorage.defineProperty(this, "masterAddress");
        LocalContractStorage.defineProperty(this, "gameSize");
    }

    init() {
        this.masterAddress = Blockchain.transaction.from;
        this.gameSize = 0;
    }

    addNewGameToBusiness(businessId, gameText) {
        Validator.checkMasterAddress(this.masterAddress);
        var currentBusiness = this.businessMap.get(businessId);
        if( ! currentBusiness) {
            currentBusiness = new Business(businessId);
            this.businessMap.put(currentBusiness.businessId, currentBusiness);
        }

        var newGame = new Game(this.gameSize + 1, gameText);
        this.gameMap.put(newGame.gameId, newGame);
        this.gameSize = this.gameSize + 1;
        currentBusiness.gameIdList.push(newGame.gameId);
        this.businessMap.put(currentBusiness.businessId, currentBusiness);

        return JSON.stringify({ gameId: newGame.gameId });
    }

    addNewPlayerToGame(gameId, playerText) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        Validator.checkBusinessAddress(currentGame.businessAddress);
        Validator.checkGameFinished(currentGame);

        var tmpPlayer = new Player(playerText);
        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId === tmpPlayer.playerId || p.playerAddress === tmpPlayer.playerAddress);
        if(tmpPlayerIndex === -1) {
            tmpPlayer.joinTimestamp = Date.now();
            currentGame.playerList.push(tmpPlayer);
        } else {
            throw new Error(ErrorMessages.PLAYER_EXIST);
        }
        this.gameMap.put(currentGame.gameId, currentGame);

        return JSON.stringify({ playerId: tmpPlayer.playerId });
    }

    updateAnswersOfPlayer(gameId, playerId, answerList, predictedNumber) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        Validator.checkGameFinished(currentGame);

        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId === playerId && p.playerAddress === Blockchain.transaction.from);
        //var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId === playerId);
        if(tmpPlayerIndex === -1) {
            throw new Error(ErrorMessages.PLAYER_INVALID);
        } else {
            if(currentGame.playerList[tmpPlayerIndex].predictedNumber === 0) {
                currentGame.playerList[tmpPlayerIndex].predictedNumber = predictedNumber;
                currentGame.playerList[tmpPlayerIndex].answerList = answerList;
                currentGame.playerList[tmpPlayerIndex].playTimestamp = Date.now();
            }
            else {
                //this player was played.
            }
        }
        this.gameMap.put(currentGame.gameId, currentGame);
        return JSON.stringify({playerId: currentGame.playerList[tmpPlayerIndex].playerId});
    }

    _isSameArray(arr1, arr2) {
        return arr1.length === arr2.length && arr1.every((v,i) => v === arr2[i]);
    }

    updateCorrectAnswersAndWinner(gameId, correctAnswerList) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        Validator.checkGameFinished(currentGame);
        Validator.checkBusinessAddress(currentGame.businessAddress);

        currentGame.correctAnswerList = correctAnswerList;
        for(var i = 0; i < currentGame.playerList.length; i++) {
            if(this._isSameArray(currentGame.correctAnswerList, currentGame.playerList[i].answerList)) {
                currentGame.correctPlayerList.push(currentGame.playerList[i]);
                currentGame.numberOfCorrectPlayer = currentGame.numberOfCorrectPlayer + 1;
            }
        }

        var minPlayTimestamp = 99999999999999;
        var winner = new Player();
        for(var i = 0; i < currentGame.correctPlayerList.length; i++) {
            if(currentGame.correctPlayerList[i].predictedNumber === currentGame.numberOfCorrectPlayer) {
                if(minPlayTimestamp > currentGame.correctPlayerList[i].playTimestamp) {
                    minPlayTimestamp = currentGame.playerList[i].playTimestamp;
                    winner = currentGame.correctPlayerList[i];
                }
            }
        }

        currentGame.winner = winner;

        this.gameMap.put(currentGame.gameId, currentGame);
        return currentGame.winner.playerId;
    }

    getPlayerById(gameId, playerId) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        var tmpPlayer = currentGame.playerList.find(p => p.playerId === playerId);
        return JSON.stringify(tmpPlayer);
    }

    getWinnerByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        return JSON.stringify(currentGame.winner);
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
        Validator.checkValidGame(currentGame);
        Validator.checkGameFinished(currentGame);
        
        var currentBusiness = this.businessMap.get(businessId);
        for(var i = 0; i < currentBusiness.gameIdList.length; i++) {
            if(currentBusiness.gameIdList[i] == gameId) {
                currentGame.isFinished = true;
                this.gameMap.put(currentGame.gameId, currentGame);
                break;
            }
        }
    }

    // _createPlayerText(playerId, playerName, playerAddress) {
    //     var player = {}
    //     player.playerId = playerId;
    //     player.playerName = playerName;
    //     player.playerAddress = playerAddress;
    //     return JSON.stringify(player);
    // }

    // testAll() {
    //     var result = "";
    //     var gameText = {};
    //     gameText.businessAddress = "n1XyBCnMqZF1WSZQvRtmb48n9pFAutGDC4n";
    //     result = result + " " + this.addNewGameToBusiness("1", JSON.stringify(gameText));

    //     result = result + "       ";
    //     var playerText1 = this._createPlayerText("1", "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud");
    //     result = result + " " + this.addNewPlayerToGame(1, playerText1);
    //     result = result + " " + this.updateAnswersOfPlayer(1, "1", ["A", "C"], 1);
    //     result = result + "       ";
    //     var playerText2 = this._createPlayerText("2", "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4");
    //     result = result + " " + this.addNewPlayerToGame(1, playerText2);
    //     result = result + " " + this.updateAnswersOfPlayer(1, "2", ["A", "C"], 2);
    //     result = result + "       ";
    //     var playerText3 = this._createPlayerText("3", "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws");
    //     result = result + " " + this.addNewPlayerToGame(1, playerText3);
    //     result = result + " " + this.updateAnswersOfPlayer(1, "3", ["B", "C"], 3);
    //     result = result + "       ";
    //     var playerText4 = this._createPlayerText("4", "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S");
    //     result = result + " " + this.addNewPlayerToGame(1, playerText4);
    //     result = result + " " + this.updateAnswersOfPlayer(1, "4", ["A", "C"], 5);
    //     result = result + "       ";
    //     var playerText5 = this._createPlayerText("5", "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn");
    //     result = result + " " + this.addNewPlayerToGame(1, playerText5);
    //     result = result + " " + this.updateAnswersOfPlayer(1, "5", ["A", "C"], 4);
    //     result = result + "       ";
    //     result = result + " " + this.updateCorrectAnswersAndWinner(1, ["A", "C"]);
    //     result = result + "       ";
    //     result = result + " " + this.getPlayerById(1, "2");
    //     result = result + "       ";
    //     result = result + " " + this.getWinnerByGameId(1);
    //     result = result + "       ";
    //     result = result + " " + this.getGameHistoryByBusinessId("1");
    //     result = result + "       ";
    //     result = result + " " + this.getGameResultByGameId(1);
    //     result = result + "       ";
    //     result = result + " " + this.stopGame("1", 1);
    //     return result;
    // }
}

module.exports = BLuckyCounter;