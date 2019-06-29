// you may need to use require for node
const { LibraWallet } = require('../src');

// generate wallet, the salt default value is LIBRA
// const wallet = new LibraWallet({
//   salt: '123456',
// });
//
// console.log('mnemonic: ', wallet.getConfig().mnemonic);

// import wallet by mnemonic and salt
const wallet = new LibraWallet({
  mnemonic: 'approve panic token quit north walnut nest tape squirrel brass verify lounge keep bracket spatial physical umbrella guilt doll stomach away sound include taxi',
  salt: '123456',
});

console.log('wallet: ', wallet);

console.log('mnemonic: ', wallet.getConfig().mnemonic);

console.log('salt: ', wallet.getConfig().salt);

// create account 1
const account1 = wallet.newAccount();
const account1Address = account1.getAddress().toHex();
console.log('account 1 address is', account1Address);
console.log('account 1 address public key is', Buffer.from(account1.keyPair.getPublicKey()).toString('hex'));
console.log('account 1 address private key is', Buffer.from(account1.keyPair.getSecretKey()).toString('hex'));


// create account 2
const account2 = wallet.newAccount();
const account2Address = account2.getAddress().toHex();
console.log('account 2 address is', account2Address);
console.log('account 2 address public key is', Buffer.from(account2.keyPair.getPublicKey()).toString('hex'));
console.log('account 2 address private key is', Buffer.from(account2.keyPair.getSecretKey()).toString('hex'));
