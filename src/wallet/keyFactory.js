const KeyPrefixes = require("../constants/keyPrefixes");
const EdDsa = require("../crypto/edDsa");
const Hkdf = require("../crypto/hkdf");
const Pbkdf = require("../crypto/pbkdf");
const Mnemonic = require("./mnemonic");
/**
 * Seed is used by KeyFactory to generate
 * new key pairs for accounts
 *
 */
class Seed {
    static fromMnemonic(words, salt = 'LIBRA') {
        const mnemonic = Array.isArray(words) ? new Mnemonic.Mnemonic(words) : words;
        const mnemonicBytes = mnemonic.toBytes();
        const parsedSalt = `${KeyPrefixes.MnemonicSalt}${salt}`;
        const bytes = new Pbkdf.Pbkdf('sha3-256').extract(mnemonicBytes, parsedSalt, 2048, 32);
        return new Seed(bytes);
    }
    /**
     *
     */
    constructor(data) {
        if (data.length !== 32) {
            throw new Error('Seed data length must be 32 bits');
        }
        this.data = data;
    }
}
exports.Seed = Seed;
class KeyFactory {
    constructor(seed) {
        this.seed = seed;
        this.hkdf = new Hkdf.Hkdf('sha3-256');
        this.masterPrk = this.hkdf.extract(this.seed.data, KeyPrefixes.MasterKeySalt);
    }
    /**
     * Generates a new key pair at the number position.
     *
     */
    generateKey(childDepth) {
        const info = `${KeyPrefixes.DerivedKey}${childDepth}`;
        const secretKey = this.hkdf.expand(this.masterPrk, info, 32);
        return EdDsa.KeyPair.fromSecretKey(secretKey);
    }
}
exports.KeyFactory = KeyFactory;
