const BigNumber = require("bignumber.js");
const SHA3 = require("sha3");
const CursorBuffer = require("../common/cursorBuffer");
const Addresses = require("../constants/addresses");
const EdDsa = require("../crypto/edDsa");
/**
 * Contains all the information relevant to a particular users accounts.
 * Beware of stale data though. Will implement refresh logic soon.
 *
 *
 */
class AccountState {
    /**
     * Returns an empty AccountState
     */
    static default(address) {
        return new AccountState(new Uint8Array(Buffer.from(address, 'hex')), new BigNumber(0), new BigNumber.default(0), new BigNumber.default(0), new BigNumber.default(0));
    }
    static from(bytes) {
        const cursor = new CursorBuffer.CursorBuffer(bytes);
        const authenticationKeyLen = cursor.read32();
        const authenticationKey = cursor.readXBytes(authenticationKeyLen);
        const balance = cursor.read64();
        const receivedEventsCount = cursor.read64();
        const sentEventsCount = cursor.read64();
        const sequenceNumber = cursor.read64();
        return new AccountState(authenticationKey, balance, receivedEventsCount, sentEventsCount, sequenceNumber);
    }
    constructor(authenticationKey, balance, receivedEventsCount, sentEventsCount, sequenceNumber) {
        this.balance = balance;
        this.sequenceNumber = sequenceNumber;
        this.authenticationKey = authenticationKey;
        this.sentEventsCount = sentEventsCount;
        this.receivedEventsCount = receivedEventsCount;
    }
}
exports.AccountState = AccountState;
class Account {
    static fromSecretKeyBytes(secretKeyBytes) {
        return new Account(EdDsa.KeyPair.fromSecretKey(secretKeyBytes));
    }
    static fromSecretKey(secretKeyHex) {
        const keyBytes = new Uint8Array(Buffer.from(secretKeyHex, 'hex'));
        return Account.fromSecretKeyBytes(keyBytes);
    }
    constructor(keyPair) {
        this.keyPair = keyPair;
    }
    getAddress() {
        if (this.address !== undefined) {
            return this.address;
        }
        const sha3 = new SHA3.SHA3(256);
        sha3.update(Buffer.from(this.keyPair.getPublicKey()));
        this.address = new AccountAddress(new Uint8Array(sha3.digest()));
        return this.address;
    }
}
exports.Account = Account;
/**
 * Represents a validated Account address
 *
 */
class AccountAddress {
    static isValidString(addressHex) {
        const length = String(addressHex).replace(' ', '').length;
        return length === Addresses.AddressLength * 2;
    }
    static isValidBytes(addressBytes) {
        return addressBytes.length === Addresses.AddressLength;
    }
    static default() {
        return new AccountAddress(new Uint8Array(Addresses.AddressLength));
    }
    constructor(hash) {
        if (!AccountAddress.isValidBytes(hash)) {
            throw new Error(`The address is of invalid length [${hash.length}]`);
        }
        this.addressBytes = hash.slice(0, Addresses.AddressLength);
    }
    isDefault() {
        return AccountAddress.default().toHex() === this.toHex();
    }
    toBytes() {
        return this.addressBytes;
    }
    toHex() {
        return Buffer.from(this.addressBytes).toString('hex');
    }
    /**
     * Alias for toHex()
     */
    toString() {
        return this.toHex();
    }
}
exports.AccountAddress = AccountAddress;
