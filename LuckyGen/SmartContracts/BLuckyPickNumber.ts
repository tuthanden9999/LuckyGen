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

const ErrorMessages = {
    MASTER_ADDRESS_INVALID: "masterAddress isn't exist.",
    GAME_INVALID: "game isn't exist.",
    BUSINESS_ADDRESS_INVALID: "businessAddress isn't exist.",
    GAME_FINISHED: "game is finished.",
    PLAYER_EXIST: "player is exist.",
    PLAYER_INVALID: "player isn't exist."
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
    isFinished: boolean;

    prizeStructure: PrizeStructure[];
    winners: WinnerStructure[];
    allPickedNumbers: number[];

    public constructor(gameId, text ? : string) {
        if(text) {
            let gameObj = JSON.parse(text);
            this.gameId = gameId;
            this.businessAddress = gameObj.businessAddress;
            this.playerList = [];
            this.isFinished = false;

            this.prizeStructure = gameObj.prizeStructure;
            for(var i = 0; i < this.prizeStructure.length; i++) {
                this.prizeStructure[i].prize.prizeId = i + 1;
                this.prizeStructure[i].prizeRemain = this.prizeStructure[i].prizeNumberOf;
            }
            this.winners = [];
            this.allPickedNumbers = [];
        } else {
            this.gameId = 0;
            this.businessAddress = "";
            this.playerList = [];
            this.isFinished = false;

            this.prizeStructure = [];
            this.winners = [];
            this.allPickedNumbers = [];
        }
    }
}

class Player {
    playerId: string;
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
        LocalContractStorage.defineProperty(this, "masterAddress");
        LocalContractStorage.defineProperty(this, "gameSize");
    }

    init() {
        this.masterAddress = Blockchain.transaction.from;
        this.gameSize = 0;
    }

    addNewGameToBusiness(businessId, gameText) {
        if(Blockchain.transaction.from !== this.masterAddress) {
            throw new Error(ErrorMessages.MASTER_ADDRESS_INVALID);
        }
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
    }

    addNewPlayerToGame(gameId, playerText) {
        var currentGame = this.gameMap.get(gameId);
        if( ! currentGame) {
            throw new Error(ErrorMessages.GAME_INVALID);
        }
        if(Blockchain.transaction.from !== currentGame.businessAddress) {
            throw new Error(ErrorMessages.BUSINESS_ADDRESS_INVALID);
        }
        var tmpPlayer = new Player(playerText);
        if(currentGame.isFinished) {
            throw new Error(ErrorMessages.GAME_FINISHED);
        }

        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId === tmpPlayer.playerId || p.playerAddress === tmpPlayer.playerAddress);
        if(tmpPlayerIndex === -1) {
            currentGame.playerList.push(tmpPlayer);
            for(var i = 0; i < tmpPlayer.pickedNumbers.length; i++) {
                var tmpPickedNumber = tmpPlayer.pickedNumbers[i];
                if(currentGame.allPickedNumbers.includes(tmpPickedNumber)) {
                    continue;
                } else {
                    currentGame.allPickedNumbers.push(tmpPickedNumber);
                }
            }
        } else {
            throw new Error(ErrorMessages.PLAYER_EXIST);
        }
        this.gameMap.put(currentGame.gameId, currentGame);
    }

    _getRandomInt(min, max) {
        //Math.random.seed(Blockchain.block.seed + Blockchain.transaction.hash);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    pickLuckyNumbers(gameId) {
        var currentGame = this.gameMap.get(gameId);
        if( ! currentGame) {
            throw new Error(ErrorMessages.GAME_INVALID);
        }

        if(Blockchain.transaction.from !== currentGame.businessAddress) {
            throw new Error(ErrorMessages.BUSINESS_ADDRESS_INVALID);
        }
        var luckyNumbers: number[] = [];

        if(currentGame.isFinished) {
            throw new Error(ErrorMessages.GAME_FINISHED);
        }

        var totalPrize = 0;
        var i = 0;
        for(var i = 0; i < currentGame.prizeStructure.length; i++) {
            totalPrize = totalPrize + currentGame.prizeStructure[i].prizeRemain;
        }

        var prizeLevel = 0;
        for(i = 0; i < totalPrize; i++) {
            do {
                var luckyNumberInd = this._getRandomInt(0, currentGame.allPickedNumbers.length - 1);
                var luckyNumber = currentGame.allPickedNumbers[luckyNumberInd];
            }
            while(luckyNumbers.includes(luckyNumber));
            luckyNumbers.push(luckyNumber);
            
            for(var j = 0; j < currentGame.playerList.length; j++) {
                if(currentGame.playerList[j].pickedNumbers.includes(luckyNumber)) {
                    var winner = {};
                    winner.player = currentGame.playerList[j];
                    winner.prize = currentGame.prizeStructure[prizeLevel].prize;
                    currentGame.prizeStructure[prizeLevel].prizeRemain = currentGame.prizeStructure[prizeLevel].prizeRemain - 1;   
                    currentGame.winners.push(winner);
                    break;
                }   
            }
            if(currentGame.prizeStructure[prizeLevel].prizeRemain === 0) {
                prizeLevel++;
                if( ! currentGame.prizeStructure[prizeLevel]) {
                    break;
                }
            }
        }

        this.gameMap.put(currentGame.gameId, currentGame);
        return luckyNumbers;
    }

    getWinnersByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        if( ! currentGame) {
            throw new Error(ErrorMessages.GAME_INVALID);
        }
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
        if( ! currentGame) {
            throw new Error(ErrorMessages.GAME_INVALID);
        }
        if(currentGame.isFinished) {
            throw new Error(ErrorMessages.GAME_FINISHED);
        }
        var currentBusiness = this.businessMap.get(businessId);
        for(var i = 0; i < currentBusiness.gameIdList.length; i++) {
            if(currentBusiness.gameIdList[i] == gameId) {
                currentGame.isFinished = true;
                this.gameMap.put(currentGame.gameId, currentGame);
                break;
            }
        }
    }

    // _createPlayerText(playerId, playerName, playerAddress, pickedNumbers) {
    //     var player = {}
    //     player.playerId = playerId;
    //     player.playerName = playerName;
    //     player.playerAddress = playerAddress;
    //     player.pickedNumbers = pickedNumbers;
    //     return JSON.stringify(player);
    // }

    // _createPrizeStructure(prizeName, prizeNumberOf) {
    //     var tmpPrize = {};
    //     tmpPrize.prizeName = prizeName;
    //     var tmpPrizeStructure = {};
    //     tmpPrizeStructure.prize = tmpPrize;
    //     tmpPrizeStructure.prizeNumberOf = prizeNumberOf;
    //     return tmpPrizeStructure;
    // }

    // testAll() {
    //     var result = "";
    //     var gameText = {};
    //     gameText.businessAddress = "n1XyBCnMqZF1WSZQvRtmb48n9pFAutGDC4n";
    //     gameText.prizeStructure = [];
    //     gameText.prizeStructure.push(this._createPrizeStructure("The first", 1));
    //     gameText.prizeStructure.push(this._createPrizeStructure("The second", 1));
    //     gameText.prizeStructure.push(this._createPrizeStructure("The third", 1));
    //     result = result + " " + this.addNewGameToBusiness("1", JSON.stringify(gameText));
    //     result = result + "          ";
    //     var playerText1 = this._createPlayerText("1", "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud", [13, 23, 15]);
    //     result = result + this.addNewPlayerToGame(1, playerText1);
    //     result = result + "          ";
    //     var playerText2 = this._createPlayerText("2", "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4", [10, 2]);
    //     result = result + this.addNewPlayerToGame(1, playerText2);
    //     result = result + "          ";
    //     var playerText3 = this._createPlayerText("3", "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws", [1, 5, 15]);
    //     result = result + this.addNewPlayerToGame(1, playerText3);
    //     result = result + "          ";
    //     var playerText4 = this._createPlayerText("4", "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S", [5]);
    //     result = result + this.addNewPlayerToGame(1, playerText4);
    //     result = result + "          ";
    //     var playerText5 = this._createPlayerText("5", "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn", [15, 16, 17]);
    //     result = result + this.addNewPlayerToGame(1, playerText5);
    //     result = result + "          ";
    //     result = result + " " + this.pickLuckyNumbers(1);
    //     result = result + "          ";
    //     result = result + " " + this.getWinnersByGameId(1);
    //     result = result + "          ";
    //     result = result + " " + this.getGameHistoryByBusinessId("1");
    //     result = result + "          ";
    //     result = result + " " + this.getGameResultByGameId(1);
    //     result = result + "          ";
    //     result = result + " " + this.stopGame("1", 1);
    //     return result;
    // }
}

module.exports = BLuckyPickNumber;