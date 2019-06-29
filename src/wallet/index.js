const accounts = require("./accounts");
const KeyFactory = require("./keyFactory");
const Mnemonic = require("./mnemonic");
class LibraWallet {
    constructor(config) {
        this.lastChild = 1;
        this.accounts = {};
        this.config = config || {};
        const mnemonic = (this.config.mnemonic === undefined) ? new Mnemonic.Mnemonic().toString() : this.config.mnemonic;
        this.config.mnemonic = mnemonic;
        const seed = KeyFactory.Seed.fromMnemonic(mnemonic.split(' '), this.config.salt);
        this.keyFactory = new KeyFactory.KeyFactory(seed);
    }
    newAccount() {
        const newAccount = this.generateAccount(this.lastChild);
        this.lastChild++;
        return newAccount;
    }
    generateAccount(depth) {
        if (isNaN(depth)) {
            throw new Error(`depth [${depth}] must be a number`);
        }
        const account = new accounts.Account(this.keyFactory.generateKey(depth));
        this.addAccount(account);
        return account;
    }
    addAccount(account) {
        this.accounts[account.getAddress().toHex()] = account;
    }
    getConfig() {
        return this.config;
    }
    getAccounts() {
        return this.accounts;
    }
}
exports.LibraWallet = LibraWallet;
exports.default = LibraWallet;
