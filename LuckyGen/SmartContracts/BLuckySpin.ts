
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

interface Prize {
    prizeId: number;
    prizeName: string;
}

interface PrizeStructure {
    prize: Prize;
    prizePercentage: number;
    prizeNumberOf: number;
    prizeRemain: number;
}

interface WinnerStructure {
    player: Player;
    prize: Prize;
}

interface PlayerHistoryStructure {
    turn: number;
    prize: Prize;
}

class Game {
    gameId: number;
    playerList: Player[];
    isFinished: boolean;

    prizeStructure: PrizeStructure[];
    winners: WinnerStructure[];

    public constructor(text ? : string) {
        if(text) {
            let gameObj = JSON.parse(text);
            this.gameId = gameObj.gameId;
            this.playerList = gameObj.playerList;
            this.isFinished = gameObj.isFinished;

            this.prizeStructure = gameObj.prizeStructure;
            this.winners = gameObj.winners;
        } else {
            this.gameId = 0;
            this.playerList = [];
            this.isFinished = false;

            this.prizeStructure = [];
            this.winners = [];
        }
    }
}

class Player {
    playerId: number;
    playerName: string;
    playerAddress: string;
    spinNumberOf: number;
    history: PlayerHistoryStructure[];
    public constructor(text ? : string) {
        if(text) {
            let playerObj = JSON.parse(text);
            this.playerId = playerObj.playerId;
            this.playerName = playerObj.playerName;
            this.playerAddress = playerObj.playerAddress;
            this.spinNumberOf = playerObj.spinNumberOf;
            this.history = playerObj.history;
        } else {
            this.playerId = 0;
            this.playerName = "";
            this.playerAddress = "";
            this.spinNumberOf = 0;
            this.history = [];
        }
    }
}

class BLuckySpin {
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
        this.businessMap.put(currentBusiness.businessId, currentBusiness);
        return "addNewGameToBusiness success";
    }

    _rand() {
        //Math.random.seed(Blockchain.block.seed + Blockchain.transaction.hash);
        return Math.floor(Math.random() * 10000 + 1);
    }

    spin(gameId, playerText) {
        var result = -1;
        var currentGame = this.gameMap.get(gameId);

        var tmpPlayer = new Player(playerText);
        if(currentGame.isFinished) {
            return result;
        }
        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId == tmpPlayer.playerId);
        if(tmpPlayerIndex == -1) {
            currentGame.playerList.push(tmpPlayer);
            this.gameMap.put(currentGame.gameId, currentGame);
            tmpPlayerIndex = currentGame.playerList.length - 1;
        } else {
        }

        if(currentGame.playerList[tmpPlayerIndex].spinNumberOf > 0) {
            var randNumber = this._rand();
            var currentPointToWin = 0; 
            currentGame.playerList[tmpPlayerIndex].spinNumberOf = currentGame.playerList[tmpPlayerIndex].spinNumberOf - 1;

            var isWin = false;
            for(var i = 0; i < currentGame.prizeStructure.length; i++) {
                currentPointToWin = currentPointToWin + currentGame.prizeStructure[i].prizePercentage * 100;
                if(randNumber <= currentPointToWin && currentGame.prizeStructure[i].prizeRemain > 0) {
                    var newWinner = {};
                    newWinner.player = currentGame.playerList[tmpPlayerIndex];
                    newWinner.prize = currentGame.prizeStructure[i].prize;
                    currentGame.prizeStructure[i].prizeRemain = currentGame.prizeStructure[i].prizeRemain - 1;
                    currentGame.winners.push(newWinner);
                    result = i + 1;

                    //update history of player
                    var newHistoryPiece = {};
                    newHistoryPiece.turn = currentGame.playerList[tmpPlayerIndex].history.length;
                    newHistoryPiece.prize = currentGame.prizeStructure[i].prize;
                    currentGame.playerList[tmpPlayerIndex].history.push(newHistoryPiece);
                    isWin = true;
                    break;
                }
            }
            if(! isWin) {
                //update history of player
                var newHistoryPiece = {};
                newHistoryPiece.turn = currentGame.playerList[tmpPlayerIndex].history.length;
                newHistoryPiece.prize = {};
                currentGame.playerList[tmpPlayerIndex].history.push(newHistoryPiece);
            }
            this.gameMap.put(currentGame.gameId, currentGame);
        }
        return result;
    }

    getWinnersByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        return JSON.stringify(currentGame.winners);
    }

    getGameResultByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        return JSON.stringify(currentGame); 
    }

    getGameHistoryOfPlayer(gameId, playerId) {
        var currentGame = this.gameMap.get(gameId);
        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId == playerId.playerId);
        if(tmpPlayerIndex == -1) {
            return "";
        } else {
            return JSON.stringify(currentGame.playerList[tmpPlayerIndex].history);
        }
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

    // _createPlayerText(playerId, playerName, playerAddress, spinNumberOf, history) {
    //     var player = {}
    //     player.playerId = playerId;
    //     player.playerName = playerName;
    //     player.playerAddress = playerAddress;
    //     player.spinNumberOf = spinNumberOf;
    //     player.history = history;
    //     return JSON.stringify(player);
    // }

    // _createPrizeStructure(prizeId, prizeName, prizePercentage, prizeNumberOf, prizeRemain) {
    //     var tmpPrize = {};
    //     tmpPrize.prizeId = prizeId;
    //     tmpPrize.prizeName = prizeName;
    //     var tmpPrizeStructure = {};
    //     tmpPrizeStructure.prize = tmpPrize;
    //     tmpPrizeStructure.prizePercentage = prizePercentage;
    //     tmpPrizeStructure.prizeNumberOf = prizeNumberOf;
    //     tmpPrizeStructure.prizeRemain = prizeRemain;
    //     return tmpPrizeStructure;
    // }

    // testAll() {
    //     var result = "";
    //     var businessText = {};
    //     businessText.businessId = 1;
    //     businessText.gameIdList = [1, 2, 3];
    //     result = result + " "+ this.addNewBusiness(JSON.stringify(businessText));
    //     result = result + "                                                                                              ";
    //     var gameText = {};
    //     gameText.gameId = 1;
    //     gameText.playerList = [];
    //     gameText.isFinished = false;
    //     gameText.winners = [];

    //     gameText.prizeStructure = [];
    //     gameText.prizeStructure.push(this._createPrizeStructure(1, "The first", 3, 1, 1));
    //     gameText.prizeStructure.push(this._createPrizeStructure(2, "The second", 5, 3, 3));
    //     gameText.prizeStructure.push(this._createPrizeStructure(3, "The third", 10, 5, 5));
    //     gameText.prizeStructure.push(this._createPrizeStructure(4, "The forth", 15, 10, 10));
    //     result = result + " " + this.addNewGameToBusiness(1, JSON.stringify(gameText));
    //     result = result + "          ";
    //     var playerText1 = this._createPlayerText(1, "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud", 1, []);
    //     result = result + " " + this.spin(1, playerText1);
    //     result = result + "          ";
    //     var playerText2 = this._createPlayerText(2, "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4", 1, []);
    //     result = result + " " + this.spin(1, playerText2);
    //     result = result + "          ";
    //     var playerText3 = this._createPlayerText(3, "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws", 1, []);
    //     result = result + " " + this.spin(1, playerText3);
    //     result = result + "          ";
    //     var playerText4 = this._createPlayerText(4, "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S", 1, []);
    //     result = result + " " + this.spin(1, playerText4);
    //     result = result + "          ";
    //     var playerText5 = this._createPlayerText(5, "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn", 1, []);
    //     result = result + " " + this.spin(1, playerText5);
    //     result = result + "          ";
    //     result = result + "          ";
    //     result = result + " " + this.getGameHistoryOfPlayer(1, 2);
    //     result = result + "          ";
    //     result = result + " " + this.getWinnersByGameId(1);
    //     result = result + "          ";
    //     result = result + " " + this.getGameHistoryByBusinessId(1);
    //     result = result + "          ";
    //     result = result + " " + this.getGameResultByGameId(1);
    //     result = result + "          ";
    //     result = result + " " + this.stopGame(1, 1);
    //     return result;
    // }
}

module.exports = BLuckySpin;