
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
    allPickedNumbers: number[];

    public constructor(text ? : string) {
        if(text) {
            let gameObj = JSON.parse(text);
            this.gameId = gameObj.gameId;
            this.playerList = gameObj.playerList;
            this.isFinished = gameObj.isFinished;

            this.prizeStructure = gameObj.prizeStructure;
            this.winners = gameObj.winners;
            this.allPickedNumbers = gameObj.allPickedNumbers;
        } else {
            this.gameId = 0;
            this.playerList = [];
            this.isFinished = false;

            this.prizeStructure = [];
            this.winners = [];
            this.allPickedNumbers = [];
        }
    }
}

class Player {
    playerId: number;
    playerName: string;
    playerAddress: string;
    pickedNumbers: number[];
    public constructor(text ? : string) {
        if(text) {
            let playerObj = JSON.parse(text);
            this.playerId = playerObj.playerId;
            this.playerName = playerObj.playerName;
            this.playerAddress = playerObj.playerAddress;
            this.pickedNumbers = playerObj.pickedNumbers;
        } else {
            this.playerId = 0;
            this.playerName = "";
            this.playerAddress = "";
            this.pickedNumbers = [];
        }
    }
}

class BLuckyPickNumber {
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
        var currentGame = this.gameMap.get(gameId);
        var tmpPlayer = new Player(playerText);
        if(currentGame.isFinished) {
            return "addNewPlayerToGame fail.";
        }
        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId == tmpPlayer.playerId);
        if(tmpPlayerIndex == -1) {
            currentGame.playerList.push(tmpPlayer);
            for(var i = 0; i < tmpPlayer.pickedNumbers.length; i++) {
                var tmpPickedNumber = tmpPlayer.pickedNumbers[i];
                if(currentGame.allPickedNumbers.includes(tmpPickedNumber)) {
                    continue;
                } else {
                    currentGame.allPickedNumbers.push(tmpPickedNumber);
                }
            }
            this.gameMap.put(currentGame.gameId, currentGame);
            tmpPlayerIndex = currentGame.playerList.length - 1;
        } else {
        }

        return "addNewPlayerToGame success.";
    }

    pickLuckyNumbers(gameId) {
        var luckyNumbers: number[] = [];
        var currentGame = this.gameMap.get(gameId);

        if(currentGame.isFinished) {
            return luckyNumbers;
        }

        var totalPrize = 0;
        var i = 0;
        for(var i = 0; i < currentGame.prizeStructure.length; i++) {
            totalPrize = totalPrize + currentGame.prizeStructure[i].prizeNumberOf;
        }

        var prizeLevel = 0;
        for(i = 0; i < totalPrize; i++) {
            var luckyNumberInd = Util.getRandomInt(0, currentGame.allPickedNumbers.length - 1);
            var luckyNumber = currentGame.allPickedNumbers[luckyNumberInd];
            luckyNumbers.push(luckyNumber);
            for(var j = 0; j < currentGame.playerList.length; j++) {
                if(currentGame.playerList[j].pickedNumbers.includes(luckyNumber)) {
                    var winner = {};
                    winner.player = currentGame.playerList[j];
                    winner.prize = currentGame.prizeStructure[prizeLevel].prize;
                    currentGame.prizeStructure[prizeLevel].prizeRemain = currentGame.prizeStructure[prizeLevel].prizeRemain - 1;   
                    currentGame.winners.push(winner);
                }   
            }
            if(currentGame.prizeStructure[prizeLevel].prizeRemain == 0) {
                prizeLevel++;
            }
        }

        this.gameMap.put(currentGame.gameId, currentGame);
        return luckyNumbers;
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

    // _createPlayerText(playerId, playerName, playerAddress, pickedNumbers) {
    //     var player = {}
    //     player.playerId = playerId;
    //     player.playerName = playerName;
    //     player.playerAddress = playerAddress;
    //     player.pickedNumbers = pickedNumbers;
    //     return JSON.stringify(player);
    // }

    // _createPrizeStructure(prizeId, prizeName, prizeNumberOf, prizeRemain) {
    //     var tmpPrize = {};
    //     tmpPrize.prizeId = prizeId;
    //     tmpPrize.prizeName = prizeName;
    //     var tmpPrizeStructure = {};
    //     tmpPrizeStructure.prize = tmpPrize;
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
    //     gameText.allPickedNumbers = [];

    //     gameText.prizeStructure = [];
    //     gameText.prizeStructure.push(this._createPrizeStructure(1, "The first", 1, 1));
    //     gameText.prizeStructure.push(this._createPrizeStructure(2, "The second", 1, 1));
    //     gameText.prizeStructure.push(this._createPrizeStructure(3, "The third", 1, 1));
    //     result = result + " " + this.addNewGameToBusiness(1, JSON.stringify(gameText));
    //     result = result + "          ";
    //     var playerText1 = this._createPlayerText(1, "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud", [13, 23, 15]);
    //     result = result + this.addNewPlayerToGame(1, playerText1);
    //     result = result + "          ";
    //     var playerText2 = this._createPlayerText(2, "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4", [10, 2]);
    //     result = result + this.addNewPlayerToGame(1, playerText2);
    //     result = result + "          ";
    //     var playerText3 = this._createPlayerText(3, "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws", [1, 5, 15]);
    //     result = result + this.addNewPlayerToGame(1, playerText3);
    //     result = result + "          ";
    //     var playerText4 = this._createPlayerText(4, "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S", [5]);
    //     result = result + this.addNewPlayerToGame(1, playerText4);
    //     result = result + "          ";
    //     var playerText5 = this._createPlayerText(5, "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn", [15, 16, 17]);
    //     result = result + this.addNewPlayerToGame(1, playerText5);
    //     result = result + "          ";
    //     result = result + " " + this.pickLuckyNumbers(1);
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

module.exports = BLuckyPickNumber;