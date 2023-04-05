// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import stableStringify from 'json-stable-stringify'
import clone from 'clone'
import base58 from 'bs58'
import { Ed25519Sha256, PreimageSha256, ThresholdSha256 } from 'crypto-conditions'
import ccJsonify from './utils/ccJsonify'
import sha256Hash from './sha256Hash'

/**
 * Construct Transactions
 */
export default class Transaction {
    /**
     * Canonically serializes a transaction into a string by sorting the keys
     * @param {Object} (transaction)
     * @return {string} a canonically serialized Transaction
     */
    static serializeTransactionIntoCanonicalString(transaction) {
        // Planetmint signs fulfillments by serializing transactions into a
        // "canonical" format where
        const tx = clone(transaction)
        // TODO: set fulfillments to null
        // Sort the keys
        return stableStringify(tx, (a, b) => (a.key > b.key ? 1 : -1))
    }

    static makeInputTemplate(publicKeys = [], fulfills = null, fulfillment = null) {
        return {
            fulfillment,
            fulfills,
            'owners_before': publicKeys,
        }
    }

    static makeTransactionTemplate(version = '3.0') {
        const txTemplate = {
            id: null,
            operation: null,
            outputs: [],
            inputs: [],
            metadata: null,
            ...(version === '3.0' && { assets: null }),
            ...(version === '2.0' && { asset: null }),
            version,
        }
        return txTemplate
    }

    static makeTransaction(
        operation,
        assets,
        metadata = null,
        outputs = [],
        inputs = [],
        version = '3.0',
        script = null
    ) {
        const tx = Transaction.makeTransactionTemplate(version)
        tx.operation = operation
        if (version === '3.0') {
            tx.assets = assets
        } else if (version === '2.0') {
            tx.asset = assets
        }
        tx.metadata = metadata
        tx.inputs = inputs
        tx.outputs = outputs
        if (script) {
            tx.script = script
        }
        return tx
    }

    /**
     * Generate a `CREATE` transaction holding the `asset`, `metadata`, and `outputs`, to be signed by
     * the `issuers`.
     * @param {Object|string[]} asset Created asset's data as object or CIDs
     * @param {Object|string} metadata Metadata for the Transaction as object or CID
     * @param {Object[]} outputs Array of Output objects to add to the Transaction.
     *                           Think of these as the recipients of the asset after the transaction.
     *                           For `CREATE` Transactions, this should usually just be a list of
     *                           Outputs wrapping Ed25519 Conditions generated from the issuers' public
     *                           keys (so that the issuers are the recipients of the created asset).
     * @param {string[]} issuers Public key of one or more issuers to the asset being created by this
     *                              Transaction.
     *                              Note: Each of the private keys corresponding to the given public
     *                              keys MUST be used later (and in the same order) when signing the
     *                              Transaction (`signTransaction()`).
     * @param {Object} script Script object containing zenroom script, inputs and outputs
     * @returns {Object} Unsigned transaction -- make sure to call signTransaction() on it before
     *                   sending it off!
     */
    static makeCreateTransaction(assetData, metadata, outputs, issuers, script) {
        // TODO: validate assetData and metadata
        const assets = assetData.map(el => ({
            data: el || null,
        }))
        const inputs = issuers.map((issuer) => Transaction.makeInputTemplate([issuer]))
        return Transaction.makeTransaction('CREATE', assets, metadata, outputs, inputs, '3.0', script)
    }

    static makeCreateTransactionV2(assetData, metadata, outputs, ...issuers) {
        const asset = {
            data: assetData || null,
        }
        const inputs = issuers.map((issuer) => Transaction.makeInputTemplate([issuer]))
        return Transaction.makeTransaction('CREATE', asset, metadata, outputs, inputs, '2.0')
    }

    /**
     * Create an Ed25519 Cryptocondition from an Ed25519 public key
     * to put into an Output of a Transaction
     * @param {string} publicKey base58 encoded Ed25519 public key for the recipient of the Transaction
     * @param {boolean} [json=true] If true returns a json object otherwise a crypto-condition type
     * @returns {Object} Ed25519 Condition (that will need to wrapped in an Output)
     */
    static makeEd25519Condition(publicKey, json = true) {
        const publicKeyBuffer = base58.decode(publicKey)
        const ed25519Fulfillment = new Ed25519Sha256()
        ed25519Fulfillment.setPublicKey(publicKeyBuffer)
        return json ? ccJsonify(ed25519Fulfillment) : ed25519Fulfillment
    }

    /**
     * Create an Output from a Condition.
     * Note: Assumes the given Condition was generated from a
     * single public key (e.g. a Ed25519 Condition)
     * @param {Object} condition Condition (e.g. a Ed25519 Condition from `makeEd25519Condition()`)
     * @param {string} amount Amount of the output
     * @returns {Object} An Output usable in a Transaction
     */
    static makeOutput(condition, amount = '1') {
        if (typeof amount !== 'string') {
            throw new TypeError('`amount` must be of type string')
        }
        const publicKeys = []
        const getPublicKeys = details => {
            if (details.type === 'ed25519-sha-256') {
                if (!publicKeys.includes(details.public_key)) {
                    publicKeys.push(details.public_key)
                }
            } else if (details.type === 'threshold-sha-256') {
                details.subconditions.map(getPublicKeys)
            }
        }
        getPublicKeys(condition.details)
        return {
            condition,
            amount,
            public_keys: publicKeys,
        }
    }

    /**
     * Create a Preimage-Sha256 Cryptocondition from a secret to put into an Output of a Transaction
     * @param {string} preimage Preimage to be hashed and wrapped in a crypto-condition
     * @param {boolean} [json=true] If true returns a json object otherwise a crypto-condition type
     * @returns {Object} Preimage-Sha256 Condition (that will need to wrapped in an Output)
     */
    static makeSha256Condition(preimage, json = true) {
        const sha256Fulfillment = new PreimageSha256()
        sha256Fulfillment.setPreimage(Buffer.from(preimage))
        return json ? ccJsonify(sha256Fulfillment) : sha256Fulfillment
    }

    /**
     * Create an Sha256 Threshold Cryptocondition from threshold to put into an Output of a Transaction
     * @param {number} threshold
     * @param {Array} [subconditions=[]]
     * @param {boolean} [json=true] If true returns a json object otherwise a crypto-condition type
     * @returns {Object} Sha256 Threshold Condition (that will need to wrapped in an Output)
     */
    static makeThresholdCondition(threshold, subconditions = [], json = true) {
        const thresholdCondition = new ThresholdSha256()
        thresholdCondition.setThreshold(threshold)
        subconditions.forEach((subcondition) => {
            // TODO: add support for Condition
            thresholdCondition.addSubfulfillment(subcondition)
            // ? Should be thresholdCondition.addSubcondition(subcondition)
        })

        return json ? ccJsonify(thresholdCondition) : thresholdCondition
    }

    static makeBaseTransferTransaction(unspentOutputs) {
        const inputs = unspentOutputs.map((unspentOutput) => {
            const { tx, outputIndex } = { tx: unspentOutput.tx, outputIndex: unspentOutput.output_index }
            const fulfilledOutput = tx.outputs[outputIndex]
            const transactionLink = {
                output_index: outputIndex,
                transaction_id: tx.id,
            }
            return Transaction.makeInputTemplate(fulfilledOutput.public_keys, transactionLink)
        })

        const { tx } = unspentOutputs[0]
        if (tx.version === '3.0') {
            const assets = tx.operation === 'CREATE' ?
                [{ id: tx.id }] :
                tx.assets.map(el => ({ id: el.id }))
            return { assets, inputs }
        }
        const asset = {
            id: tx.operation === 'CREATE' ?
                tx.id :
                tx.asset.id
        }
        return { asset, inputs }
    }

    /**
     * Generate a `TRANSFER` transaction holding the `asset`, `metadata`, and `outputs`, that fulfills
     * the `fulfilledOutputs` of `unspentTransaction`.
     * @param {Object} unspentTransaction Previous Transaction you have control over (i.e. can fulfill
     *                                    its Output Condition)
     * @param {Object} metadata Metadata for the Transaction
     * @param {Object[]} outputs Array of Output objects to add to the Transaction.
     *                           Think of these as the recipients of the asset after the transaction.
     *                           For `TRANSFER` Transactions, this should usually just be a list of
     *                           Outputs wrapping Ed25519 Conditions generated from the public keys of
     *                           the recipients.
     * @param {...number} OutputIndices Indices of the Outputs in `unspentTransaction` that this
     *                                     Transaction fulfills.
     *                                     Note that listed public keys listed must be used (and in
     *                                     the same order) to sign the Transaction
     *                                     (`signTransaction()`).
     * @returns {Object} Unsigned transaction -- make sure to call signTransaction() on it before
     *                   sending it off!
     */
    static makeTransferTransaction(
        unspentOutputs,
        outputs,
        metadata = null
    ) {
        // TODO: validate unspentOutputs, outputs and metadata
        const { assets, inputs } = this.makeBaseTransferTransaction(unspentOutputs)
        return Transaction.makeTransaction('TRANSFER', assets, metadata, outputs, inputs, '3.0')
    }

    static makeTransferTransactionV2(
        unspentOutputs,
        outputs,
        metadata = null
    ) {
        const { asset, inputs } = this.makeBaseTransferTransaction(unspentOutputs)
        return Transaction.makeTransaction('TRANSFER', asset, metadata, outputs, inputs, '2.0')
    }

    /**
     * Sign the given `transaction` with the given `privateKey`s, returning a new copy of `transaction`
     * that's been signed.
     * Note: Only generates Ed25519 Fulfillments. Thresholds and other types of Fulfillments are left as
     * an exercise for the user.
     * @param {Object} transaction Transaction to sign. `transaction` is not modified.
     * @param {...string} privateKeys Private keys associated with the issuers of the `transaction`.
     *                                Looped through to iteratively sign any Input Fulfillments found in
     *                                the `transaction`.
     * @returns {Object} The signed version of `transaction`.
     */
    static signTransaction(transaction, ...privateKeys) {
        const signedTx = clone(transaction)
        const serializedTransaction =
            Transaction.serializeTransactionIntoCanonicalString(transaction)

        signedTx.inputs.forEach((input, index) => {
            const privateKey = privateKeys[index]
            const privateKeyBuffer = base58.decode(privateKey)

            const transactionUniqueFulfillment = input.fulfills ? serializedTransaction
                .concat(input.fulfills.transaction_id)
                .concat(input.fulfills.output_index) : serializedTransaction
            const transactionHash = sha256Hash(transactionUniqueFulfillment)
            const ed25519Fulfillment = new Ed25519Sha256()
            ed25519Fulfillment.sign(Buffer.from(transactionHash, 'hex'), privateKeyBuffer)
            const fulfillmentUri = ed25519Fulfillment.serializeUri()

            input.fulfillment = fulfillmentUri
        })

        const serializedSignedTransaction =
            Transaction.serializeTransactionIntoCanonicalString(signedTx)
        signedTx.id = sha256Hash(serializedSignedTransaction)
        return signedTx
    }

    /**
     * Delegate signing of the given `transaction` returning a new copy of `transaction`
     * that's been signed.
     * @param {Object} transaction Transaction to sign. `transaction` is not modified.
     * @param {Function} signFn Function signing the transaction, expected to return the fulfillment.
     * @returns {Object} The signed version of `transaction`.
     */
    static delegateSignTransaction(transaction, signFn) {
        const signedTx = clone(transaction)
        const serializedTransaction =
            Transaction.serializeTransactionIntoCanonicalString(transaction)

        signedTx.inputs.forEach((input, index) => {
            const fulfillmentUri = signFn(serializedTransaction, input, index)
            input.fulfillment = fulfillmentUri
        })

        const serializedSignedTransaction = Transaction.serializeTransactionIntoCanonicalString(signedTx)
        signedTx.id = sha256Hash(serializedSignedTransaction)
        return signedTx
    }

    /**
    * Delegate signing of the given `transaction` returning a new copy of `transaction`
    * that's been signed.
    * @param {Object} transaction Transaction to sign. `transaction` is not modified.
    * @param {Function} signFn Function signing the transaction, expected to resolve the fulfillment.
    * @returns {Promise<Object>} The signed version of `transaction`.
    */
    static async delegateSignTransactionAsync(transaction, signFn) {
        const signedTx = clone(transaction)
        const serializedTransaction =
            Transaction.serializeTransactionIntoCanonicalString(transaction)

        await Promise.all(signedTx.inputs.map(async (input, index) => {
            const fulfillmentUri = await signFn(serializedTransaction, input, index)
            input.fulfillment = fulfillmentUri
        }))

        const serializedSignedTransaction = Transaction.serializeTransactionIntoCanonicalString(signedTx)
        signedTx.id = sha256Hash(serializedSignedTransaction)
        return signedTx
    }
}
