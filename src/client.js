const axios_1 = require("axios");
const bignumber_js_1 = require("bignumber.js");
const grpc_1 = require("grpc");
const admission_control_grpc_pb_1 = require("./proto/admission_control_grpc_pb");
const admission_control_pb_1 = require("./proto/admission_control_pb");
const get_with_proof_pb_1 = require("./proto/get_with_proof_pb");
const transaction_pb_1 = require("./proto/transaction_pb");
const CursorBuffer_1 = require("./common/CursorBuffer");
const PathValues_1 = require("./constants/PathValues");
const Transactions_1 = require("./Transactions");
const Accounts_1 = require("./wallet/Accounts");
const DefaultFaucetServerHost = 'faucet.testnet.libra.org';
const DefaultTestnetServerHost = 'ac.testnet.libra.org';
var LibraNetwork;
(function (LibraNetwork) {
    LibraNetwork["Testnet"] = "testnet";
    // Mainnet = 'mainnet'
})(LibraNetwork = exports.LibraNetwork || (exports.LibraNetwork = {}));
class LibraClient {
    constructor(config) {
        this.config = config;
        if (config.host === undefined) {
            // since only testnet for now
            this.config.host = DefaultTestnetServerHost;
        }
        if (config.port === undefined) {
            this.config.port = '80';
        }
        const connectionAddress = `${this.config.host}:${this.config.port}`;
        this.client = new admission_control_grpc_pb_1.AdmissionControlClient(connectionAddress, grpc_1.credentials.createInsecure());
    }
    /**
     * Fetch the current state of an account.
     *
     *
     * @param {string} address Accounts address
     */
    async getAccountState(address) {
        const result = await this.getAccountStates([address]);
        return result[0];
    }
    /**
     * Fetches the current state of multiple accounts.
     *
     * @param {string[]} addresses Array of users addresses
     */
    async getAccountStates(addresses) {
        for (const address of addresses) {
            if (!Accounts_1.AccountAddress.isValidString(address)) {
                throw new Error(`[${address}] is not a valid address`);
            }
        }
        const request = new get_with_proof_pb_1.UpdateToLatestLedgerRequest();
        addresses.forEach(address => {
            const requestItem = new get_with_proof_pb_1.RequestItem();
            const getAccountStateRequest = new get_with_proof_pb_1.GetAccountStateRequest();
            getAccountStateRequest.setAddress(Uint8Array.from(Buffer.from(address, 'hex')));
            requestItem.setGetAccountStateRequest(getAccountStateRequest);
            request.addRequestedItems(requestItem);
        });
        return new Promise((resolve, reject) => {
            this.client.updateToLatestLedger(request, (error, response) => {
                if (error) {
                    return reject(error);
                }
                resolve(response.getResponseItemsList().map((item, index) => {
                    const stateResponse = item.getGetAccountStateResponse();
                    const stateWithProof = stateResponse.getAccountStateWithProof();
                    if (stateWithProof.hasBlob()) {
                        const stateBlob = stateWithProof.getBlob();
                        const blob = stateBlob.getBlob_asU8();
                        const accountState = this._decodeAccountStateBlob(blob);
                        return accountState;
                    }
                    return Accounts_1.AccountState(addresses[index]);
                }));
            });
        });
    }
    /**
     * Uses the faucetService on testnet to mint coins to be sent
     * to receiver.
     *
     * Returns the sequence number for the transaction used to mint
     *
     * Note: `numCoins` should be in base unit i.e microlibra (10^6 I believe).
     */
    async mintWithFaucetService(receiver, numCoins, waitForConfirmation = true) {
        const serverHost = this.config.faucetServerHost || DefaultFaucetServerHost;
        const coins = new bignumber_js_1(numCoins).toString(10);
        const address = receiver.toString();
        const response = await axios_1.get(`http://${serverHost}?amount=${coins}&address=${address}`);
        if (response.status !== 200) {
            throw new Error(`Failed to query faucet service. Code: ${response.status}, Err: ${response.data.toString()}`);
        }
        const sequenceNumber = response.data;
        if (waitForConfirmation) {
            await this.waitForConfirmation(Accounts_1.AccountAddress.default(), sequenceNumber);
        }
        return sequenceNumber;
    }
    /**
     * Keeps polling the account state of address till sequenceNumber is computed.
     *
     */
    async waitForConfirmation(accountAddress, transactionSequenceNumber) {
        const sequenceNumber = new bignumber_js_1(transactionSequenceNumber);
        const address = accountAddress.toString();
        let maxIterations = 50;
        const poll = (resolve, reject) => {
            setTimeout(() => {
                maxIterations--;
                this.getAccountState(address)
                    .then(accountState => {
                    if (accountState.sequenceNumber.gte(sequenceNumber)) {
                        return resolve();
                    }
                    if (maxIterations === -1) {
                        reject(new Error(`Confirmation timeout for [${address}]:[${sequenceNumber.toString(10)}]`));
                    }
                    else {
                        poll(resolve, reject);
                    }
                })
                    .catch(reject);
            }, 500);
        };
        return new Promise((resolve, reject) => {
            poll(resolve, reject);
        });
    }
    /**
     * Transfer coins from sender to receipient.
     * numCoins should be in libraCoins based unit.
     *
     * @param sender
     * @param receipientAddress
     * @param numCoins
     */
    async transferCoins(sender, receipientAddress, numCoins) {
        const response = await this.execute(Transactions_1.LibraTransaction.createTransfer(receipientAddress, new bignumber_js_1(numCoins)), sender);
        return response;
    }
    /**
     * Execute a transaction by sender.
     *
     * @param transaction
     * @param sender
     */
    async execute(transaction, sender) {
        let senderAddress = transaction.sendersAddress;
        if (senderAddress.isDefault()) {
            senderAddress = sender.getAddress();
        }
        let sequenceNumber = transaction.sequenceNumber;
        if (sequenceNumber.isNegative()) {
            const senderAccountState = await this.getAccountState(senderAddress.toHex());
            sequenceNumber = senderAccountState.sequenceNumber;
        }
        // Still working on this part
        const program = new transaction_pb_1.Program();
        program.setCode(transaction.program.code);
        // program.setArgumentsList([new TransactionArgument()]);
        // program.setModulesList([])
        // TODO: Change grpc library. Some of this values should not be numbers
        const rawTransaction = new transaction_pb_1.RawTransaction();
        rawTransaction.setSenderAccount(senderAddress.toBytes());
        rawTransaction.setSequenceNumber(sequenceNumber.toNumber());
        rawTransaction.setProgram(program);
        rawTransaction.setMaxGasAmount(transaction.gasContraint.maxGasAmount.toNumber());
        rawTransaction.setGasUnitPrice(transaction.gasContraint.gasUnitPrice.toNumber());
        rawTransaction.setExpirationTime(transaction.expirationTime.toNumber());
        const signedTransaction = new transaction_pb_1.SignedTransaction();
        signedTransaction.setSenderPublicKey(sender.keyPair.getPublicKey());
        signedTransaction.setSenderSignature('');
        signedTransaction.setRawTxnBytes('');
        const request = new admission_control_pb_1.SubmitTransactionRequest();
        request.setSignedTxn(signedTransaction);
        return new Promise((resolve, reject) => {
            this.client.submitTransaction(request, (error, response) => {
                if (error) {
                    return reject(error);
                }
                resolve(response);
            });
        });
    }
    _decodeAccountStateBlob(blob) {
        const cursor = new CursorBuffer_1.CursorBuffer(blob);
        const blobLen = cursor.read32();
        const state = {};
        for (let i = 0; i < blobLen; i++) {
            const keyLen = cursor.read32();
            const keyBuffer = new Uint8Array(keyLen);
            for (let j = 0; j < keyLen; j++) {
                keyBuffer[j] = cursor.read8();
            }
            const valueLen = cursor.read32();
            const valueBuffer = new Uint8Array(valueLen);
            for (let k = 0; k < valueLen; k++) {
                valueBuffer[k] = cursor.read8();
            }
            state[Buffer.from(keyBuffer).toString('hex')] = valueBuffer;
        }
        return Accounts_1.AccountState.from(state[PathValues_1.AccountStatePath]);
    }
}
exports.LibraClient = LibraClient;
exports.default = LibraClient;
