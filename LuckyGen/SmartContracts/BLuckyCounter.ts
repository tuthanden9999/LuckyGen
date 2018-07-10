
class BLuckyCounter {
    constructor() {
        LocalContractStorage.defineMapProperty(this, "correctList");
        LocalContractStorage.defineProperty(this, "count");
        LocalContractStorage.defineProperty(this, "count");
    }

    init() {
        this.count = 0;
    }

    initCorrectList(pCorrectList) {
        for(var i = 0; i < pCorrectList.length; i++) {
            this.correctList.put(i, pCorrectList);
        }
    }


}