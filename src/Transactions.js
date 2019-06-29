const bignumber_js_1 = require("bignumber.js");
const accounts_1 = require("./wallet/accounts");
class LibraTransaction {
    static createTransfer(receipientAddress, numAccount) {
        throw new Error('Method not implemented. Still working on compiling and encoding programs');
    }
    /**
     * Create a new Transaction
     *
     * @param program
     * @param gasConstraint
     * @param expirationTime
     * @param sendersAddress
     * @param sequenceNumber
     */
    constructor(program, gasConstraint, expirationTime, sendersAddress, sequenceNumber) {
        this.program = program;
        this.gasContraint = gasConstraint;
        this.expirationTime = new bignumber_js_1(expirationTime);
        this.sendersAddress = new accounts_1.AccountAddress(sendersAddress);
        this.sequenceNumber = new bignumber_js_1(sequenceNumber);
    }
}
exports.LibraTransaction = LibraTransaction;
