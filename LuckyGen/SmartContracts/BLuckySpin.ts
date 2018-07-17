
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
    spinNumberOf: number
    public constructor(text ? : string) {
        if(text) {
            let playerObj = JSON.parse(text);
            this.playerId = playerObj.playerId;
            this.playerName = playerObj.playerName;
            this.playerAddress = playerObj.playerAddress;
            this.spinNumberOf = playerObj.spinNumberOf;
        } else {
            this.playerId = 0;
            this.playerName = "";
            this.playerAddress = "";
            this.spinNumberOf = 0;
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
        this.gameMap.put(currentGame.gameId, currentGame);
        return "addNewPlayerToGame success";
    }

    _rand() {
        //Math.random.seed(Blockchain.block.seed + Blockchain.transaction.hash);
        return Math.floor(Math.random() * 10000 + 1);
    }

    spin(gameId, playerId) {
        var currentGame = this.gameMap.get(gameId);
        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId == playerId);
        if(tmpPlayerIndex == -1) {
            return "This player isn't exist.";
        } 

        if(currentGame.playerList[tmpPlayerIndex].spinNumberOf > 0) {
            var randNumber = this._rand();
            var currentPointToWin = 0; 
            currentGame.playerList[tmpPlayerIndex].spinNumberOf = currentGame.playerList[tmpPlayerIndex].spinNumberOf - 1;

            for(var i = 0; i < currentGame.prizeStructure.length; i++) {
                currentPointToWin = currentPointToWin + currentGame.prizeStructure[i].prizePercentage * 100;
                if(randNumber <= currentPointToWin) {
                    var newWinner = {};
                    newWinner.player = currentGame.playerList[tmpPlayerIndex];
                    newWinner.prize = currentGame.prizeStructure[i].prize;
                    currentGame.winners.push(newWinner);
                    break;
                }
            }
            this.gameMap.put(currentGame.gameId, currentGame);
        }
    }

    getWinnersByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        return JSON.stringify(currentGame.winners);
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

    // _createPlayerText(playerId, playerName, playerAddress, spinNumberOf) {
    //     var player = {}
    //     player.playerId = playerId;
    //     player.playerName = playerName;
    //     player.playerAddress = playerAddress;
    //     player.spinNumberOf = spinNumberOf;
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
    //     result = result + "                                                                                              ";
    //     var playerText1 = this._createPlayerText(1, "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText1);
    //     this.spin(1, 1);
    //     var playerText2 = this._createPlayerText(2, "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText2);
    //     this.spin(1, 2);
    //     var playerText3 = this._createPlayerText(3, "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText3);
    //     this.spin(1, 3);
    //     var playerText4 = this._createPlayerText(4, "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText4);
    //     this.spin(1, 4);
    //     var playerText5 = this._createPlayerText(5, "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText5);
    //     this.spin(1, 5);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.getWinnersByGameId(1);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.getGameHistoryByBusinessId(1);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.getGameResultByGameId(1);
    //     result = result + "                                                                                              ";
    //     result = result + " " + this.stopGame(1, 1);
    //     return result;
    // }
}

module.exports = BLuckySpin;