const crypto = require("crypto");

class Pbkdf {
    constructor(digestAlgorithm) {
        this.digestAlgorithm = digestAlgorithm;
    }
    extract(password, salt, iterations, outputLen) {
        return new Uint8Array(crypto.pbkdf2Sync(Buffer.from(password), salt, iterations, outputLen, this.digestAlgorithm));
    }
}
exports.Pbkdf = Pbkdf;
