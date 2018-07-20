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
    PLAYER_ADDRESS_INVALID: "playerAddress isn't exist.",
    PRIZE_STRUCTURE_INVALID: "prize structure is invalid.",
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
    checkPlayerAddress: function(playerAddress) {
        if(Blockchain.transaction.from !== playerAddress) {
            throw new Error(ErrorMessages.PLAYER_ADDRESS_INVALID);
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
    },
    checkPrizeStructure: function(prizeStructure) {
        for(var i = 0; i < prizeStructure.length; i++) {
            if(prizeStructure[i].prizeRemain === 0) {
                throw new Error(ErrorMessages.PRIZE_STRUCTURE_INVALID);
            }
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
    isFinished: boolean;

    prizeStructure: PrizeStructure[];
    winners: WinnerStructure[];
    allPickedNumbers: number[];
    luckyNumbers: number[];

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
            this.luckyNumbers = [];
        } else {
            this.gameId = 0;
            this.businessAddress = "";
            this.playerList = [];
            this.isFinished = false;

            this.prizeStructure = [];
            this.winners = [];
            this.allPickedNumbers = [];
            this.luckyNumbers = [];
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
            this.pickedNumbers = [];
        } else {
            this.playerId = "0";
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
        Validator.checkMasterAddress(this.masterAddress);
        var currentBusiness = this.businessMap.get(businessId);
        if( ! currentBusiness) {
            currentBusiness = new Business(businessId);
            this.businessMap.put(currentBusiness.businessId, currentBusiness);
        }

        var newGame = new Game(this.gameSize + 1, gameText);
        Validator.checkValidGame(newGame);
        Validator.checkPrizeStructure(newGame.prizeStructure);

        this.gameMap.put(newGame.gameId, newGame);
        this.gameSize = this.gameSize + 1;
        currentBusiness.gameIdList.push(newGame.gameId);
        this.businessMap.put(currentBusiness.businessId, currentBusiness);
        return JSON.stringify({gameId: newGame.gameId});
    }

    addNewPlayerToGame(gameId, playerText) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        Validator.checkBusinessAddress(currentGame.businessAddress);
        Validator.checkGameFinished(currentGame);

        var tmpPlayer = new Player(playerText);
        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId === tmpPlayer.playerId || p.playerAddress === tmpPlayer.playerAddress);
        if(tmpPlayerIndex === -1) {
            currentGame.playerList.push(tmpPlayer);
        } else {
            throw new Error(ErrorMessages.PLAYER_EXIST);
        }
        this.gameMap.put(currentGame.gameId, currentGame);
        return JSON.stringify({playerId: tmpPlayer.playerId});
    }

    updatePickNumbersOfPlayer(gameId, playerId, playerAddress, pickedNumbers) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        Validator.checkGameFinished(currentGame);
        Validator.checkPlayerAddress(playerAddress);

        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId === playerId && p.playerAddress === playerAddress);
        if(tmpPlayerIndex === -1) {
            throw new Error(ErrorMessages.PLAYER_INVALID);
        } else {
            currentGame.playerList[tmpPlayerIndex].pickedNumbers = pickedNumbers;
            var tmpPlayer = currentGame.playerList[tmpPlayerIndex];
            for(var i = 0; i < tmpPlayer.pickedNumbers.length; i++) {
                var tmpPickedNumber = tmpPlayer.pickedNumbers[i];
                if(currentGame.allPickedNumbers.includes(tmpPickedNumber)) {
                    continue;
                } else {
                    currentGame.allPickedNumbers.push(tmpPickedNumber);
                }
            }
        }
        this.gameMap.put(currentGame.gameId, currentGame);
        return JSON.stringify({playerId: currentGame.playerList[tmpPlayerIndex].playerId});
    }

    _getRandomInt(min, max) {
        //Math.random.seed(Blockchain.block.seed + Blockchain.transaction.hash);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    pickLuckyNumbers(gameId) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        Validator.checkGameFinished(currentGame);
        Validator.checkBusinessAddress(currentGame.businessAddress);

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
            while(currentGame.luckyNumbers.includes(luckyNumber));
            currentGame.luckyNumbers.push(luckyNumber);
            
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

        currentGame.isFinished = true;
        this.gameMap.put(currentGame.gameId, currentGame);
        return currentGame.luckyNumbers.length;
    }

    getPlayerById(gameId, playerId) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
        var tmpPlayer = currentGame.playerList.find(p => p.playerId === playerId);
        return JSON.stringify(tmpPlayer);
    }

    getWinnersByGameId(gameId) {
        var currentGame = this.gameMap.get(gameId);
        Validator.checkValidGame(currentGame);
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
    //     var playerText1 = this._createPlayerText("1", "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud");
    //     result = result + this.addNewPlayerToGame(1, playerText1);
    //     result = result + this.updatePickNumbersOfPlayer(1, "1", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud", [13, 23, 15]);
    //     result = result + "          ";
    //     var playerText2 = this._createPlayerText("2", "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4");
    //     result = result + this.addNewPlayerToGame(1, playerText2);
    //     result = result + this.updatePickNumbersOfPlayer(1, "2", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4", [10, 2]);
    //     result = result + "          ";
    //     var playerText3 = this._createPlayerText("3", "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws");
    //     result = result + this.addNewPlayerToGame(1, playerText3);
    //     result = result + this.updatePickNumbersOfPlayer(1, "3", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws", [1, 5, 15]);
    //     result = result + "          ";
    //     var playerText4 = this._createPlayerText("4", "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S");
    //     result = result + this.addNewPlayerToGame(1, playerText4);
    //     result = result + this.updatePickNumbersOfPlayer(1, "4", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S", [5]);
    //     result = result + "          ";
    //     var playerText5 = this._createPlayerText("5", "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn");
    //     result = result + this.addNewPlayerToGame(1, playerText5);
    //     result = result + this.updatePickNumbersOfPlayer(1, "5", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn", [15, 16, 17]);
    //     result = result + "          ";
    //     result = result + " " + this.pickLuckyNumbers(1);
    //     result = result + "          ";
    //     result = result + " " + this.getWinnersByGameId(1);
    //     result = result + "          ";
    //     result = result + " " + this.getGameHistoryByBusinessId("1");
    //     result = result + "          ";
    //     result = result + " " + this.getGameResultByGameId(1);
    //     return result;
    // }
}

module.exports = BLuckyPickNumber;