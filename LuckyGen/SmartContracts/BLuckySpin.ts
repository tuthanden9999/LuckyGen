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

const ErrorMessages = {
    MASTER_ADDRESS_INVALID: "masterAddress isn't exist.",
    GAME_INVALID: "game isn't exist.",
    PRIZE_STRUCTURE_INVALID: "prize structure is invalid.",
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

    public constructor(gameId, text ? : string ) {
        if(text) {
            let gameObj = JSON.parse(text);
            this.gameId = gameId;
            this.businessAddress = gameObj.businessAddress;
            this.playerList = [];
            this.isFinished = false;

            this.winners = [];
            this.prizeStructure = gameObj.prizeStructure;
            for(var i = 0; i < this.prizeStructure.length; i++) {
                this.prizeStructure[i].prize.prizeId = i + 1;
                this.prizeStructure[i].prizeRemain = this.prizeStructure[i].prizeNumberOf;
            }
        } else {
            this.gameId = 0;
            this.businessAddress = "";
            this.playerList = [];
            this.isFinished = false;

            this.prizeStructure = [];
            this.winners = [];
        }
    }

    public isValidPrizeStructure() {
        var totalPercent = 0;
        for(var i = 0; i < this.prizeStructure.length; i++) {
            if(this.prizeStructure[i].prizePercentage <= 0 || this.prizeStructure[i].prizePercentage >= 100) {
                return false;
            } else {
                totalPercent = totalPercent + this.prizeStructure[i].prizePercentage;
            }
        }
        
        return (totalPercent <= 100);
    }
}

class Player {
    playerId: string;
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
            this.history = [];
        } else {
            this.playerId = "";
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
        if( ! newGame.isValidPrizeStructure()) {
            throw new Error(ErrorMessages.PRIZE_STRUCTURE_INVALID);
        } 

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
        } else {
            throw new Error(ErrorMessages.PLAYER_EXIST);
        }
        this.gameMap.put(currentGame.gameId, currentGame);
    }

    _rand() {
        //Math.random.seed(Blockchain.block.seed + Blockchain.transaction.hash);
        return Math.floor(Math.random() * 10000 + 1);
    }

    spin(gameId, playerId) {
        var result = -1;
        var currentGame = this.gameMap.get(gameId);
        if( ! currentGame) {
            throw new Error(ErrorMessages.GAME_INVALID);
        }
        if(currentGame.isFinished) {
            throw new Error(ErrorMessages.GAME_FINISHED);
        }
        var tmpPlayerIndex = currentGame.playerList.findIndex(p => p.playerId === playerId);
        if(tmpPlayerIndex === -1) {
            throw new Error(ErrorMessages.PLAYER_INVALID);
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

    getPlayerById(gameId, playerId) {
        var currentGame = this.gameMap.get(gameId);
        if( ! currentGame) {
            throw new Error(ErrorMessages.GAME_INVALID);
        }
        var tmpPlayer = currentGame.playerList.find(p => p.playerId === playerId);
        return JSON.stringify(tmpPlayer);
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
            if(currentBusiness.gameIdList[i] === gameId) {
                currentGame.isFinished = true;
                this.gameMap.put(currentGame.gameId, currentGame);
                break;
            }
        }
    }

    // _createPlayerText(playerId, playerName, playerAddress, spinNumberOf) {
    //     var player = {}
    //     player.playerId = playerId;
    //     player.playerName = playerName;
    //     player.playerAddress = playerAddress;
    //     player.spinNumberOf = spinNumberOf;
    //     return JSON.stringify(player);
    // }

    // _createPrizeStructure(prizeName, prizePercentage, prizeNumberOf) {
    //     var tmpPrize = {};
    //     tmpPrize.prizeName = prizeName;
    //     var tmpPrizeStructure = {};
    //     tmpPrizeStructure.prize = tmpPrize;
    //     tmpPrizeStructure.prizePercentage = prizePercentage;
    //     tmpPrizeStructure.prizeNumberOf = prizeNumberOf;
    //     return tmpPrizeStructure;
    // }

    // testAll() {
    //     var result = "";
    //     var gameText = {};
    //     gameText.businessAddress = "n1XyBCnMqZF1WSZQvRtmb48n9pFAutGDC4n";

    //     gameText.prizeStructure = [];
    //     gameText.prizeStructure.push(this._createPrizeStructure( "The first", 3, 1));
    //     gameText.prizeStructure.push(this._createPrizeStructure( "The second", 5, 3));
    //     gameText.prizeStructure.push(this._createPrizeStructure( "The third", 10, 5));
    //     gameText.prizeStructure.push(this._createPrizeStructure( "The forth", 15, 10));
    //     result = result + " " + this.addNewGameToBusiness("1", JSON.stringify(gameText));
    //     result = result + "          ";
    //     var playerText1 = this._createPlayerText("1", "anhnhoday19915", "n1JPesSsumXpnagcTdwBXUHNsa5GofeM4Ud", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText1);
    //     result = result + "spin() result: " + this.spin(1, "1");
    //     result = result + "          ";
    //     var playerText2 = this._createPlayerText("2", "anhnhoday19916", "n1bNsEaLp7wWRUNq81juZPJU7M6FNEUzhT4", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText2);
    //     result = result + "spin() result: " + this.spin(1, "2");
    //     result = result + "          ";
    //     var playerText3 = this._createPlayerText("3", "anhnhoday19917", "n1QsAnLKpQBuxVv1GdQxQxbh1zeZyPmAmws", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText3);
    //     result = result + "spin() result: " + this.spin(1, "3");
    //     result = result + "          ";
    //     var playerText4 = this._createPlayerText("4", "anhnhoday19918", "n1VGRKhLC9PY7r9bqEoVjmH86FbrFfsgK6S", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText4);
    //     result = result + "spin() result: " + this.spin(1, "4");
    //     result = result + "          ";
    //     var playerText5 = this._createPlayerText("5", "anhnhoday19919", "n1HyMfzqqZwyz1euvZEaq7Z1MjqaQ8TkeAn", 1);
    //     result = result + " " + this.addNewPlayerToGame(1, playerText5);
    //     result = result + "spin() result: " + this.spin(1, "5");
    //     result = result + "          ";
    //     result = result + "          ";
    //     result = result + " " + this.getPlayerById(1, "2");
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

module.exports = BLuckySpin;