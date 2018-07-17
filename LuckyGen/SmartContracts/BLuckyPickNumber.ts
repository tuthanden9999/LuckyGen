
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
                    prizeLevel++;
                    currentGame.winners.push(winner);
                }
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
}

module.exports = BLuckyPickNumber;