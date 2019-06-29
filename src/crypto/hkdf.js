/* tslint:disable */
const hkdf = require('futoin-hkdf');
/* tslint:enable */
// Todo: Update implementation to work not only with Node
class Hkdf {
    constructor(hashAlgorithm) {
        this.hashAlgorithm = hashAlgorithm;
    }
    extract(ikm, salt) {
        const ikmBuffer = Buffer.from(ikm);
        const prk = hkdf.extract(this.hashAlgorithm, this.hashLength, ikmBuffer, salt);
        return new Uint8Array(prk);
    }
    expand(prk, info, outputLen) {
        const prkBuffer = Buffer.from(prk);
        const okm = hkdf.expand(this.hashAlgorithm, this.hashLength, prkBuffer, outputLen, info);
        return new Uint8Array(okm);
    }
    get hashLength() {
        return hkdf.hash_length(this.hashAlgorithm);
    }
}
exports.Hkdf = Hkdf;
