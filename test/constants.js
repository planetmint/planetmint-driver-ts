// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

/* eslint-disable import/no-unresolved */
import { createHash } from 'crypto'
import base58 from 'bs58'
import { Ed25519Sha256 } from 'crypto-conditions'
import { CID } from 'multiformats/cid'
import { code, encode } from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

import { Transaction, Ed25519Keypair } from '../src'
// TODO: Find out if ava has something like conftest, if so put this there.

export const API_PATH = 'http://localhost:9984/api/v1/'
// export const API_PATH = 'https://test.ipdb.io/api/v1/'

// transaction schema v2
// NOTE: It's safer to cast `Math.random()` to a string, to avoid differences
// in "float interpretation" between languages (e.g. JavaScript and Python)
export function assetV2() { return { message: `${Math.random()}` } }
export const metaDataV2 = { message: 'metaDataMessage' }

export async function toCID(obj) {
    const bytes = encode(obj)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, code, hash)
    return cid.toString()
}

export const assetData = () => toCID(assetV2())
export const metaData = toCID(metaDataV2)
export const assetCID = 'bagaaiera4oymiquy7qobjgx36tejs35zeqt24qpemsnzgtfeswmrw6csxbkq'
export const metaDataCID = 'bagaaiera5r325lbynbzbhydggnsk4fj7gjv7lc6mfvksbabyiyxhonkzuaxq'

export const alice = new Ed25519Keypair()
export const aliceCondition = Transaction.makeEd25519Condition(alice.publicKey)
export const aliceOutput = Transaction.makeOutput(aliceCondition)
export const createTx = Transaction.makeCreateTransaction(
    [assetCID],
    metaDataCID,
    [aliceOutput],
    [alice.publicKey]
)
export const transferTx = Transaction.makeTransferTransaction(
    [{ tx: createTx, output_index: 0 }],
    [aliceOutput],
    metaDataCID
)

export const createTxV2 = Transaction.makeCreateTransactionV2(
    assetV2(),
    metaDataV2,
    [aliceOutput],
    alice.publicKey
)
export const transferTxV2 = Transaction.makeTransferTransactionV2(
    [{ tx: createTxV2, output_index: 0 }],
    [aliceOutput],
    metaDataV2
)

export const bob = new Ed25519Keypair()
export const bobCondition = Transaction.makeEd25519Condition(bob.publicKey)
export const bobOutput = Transaction.makeOutput(bobCondition)

export function delegatedSignTransaction(...keyPairs) {
    return function sign(serializedTransaction, input) {
        const transactionUniqueFulfillment = input.fulfills ? serializedTransaction
            .concat(input.fulfills.transaction_id)
            .concat(input.fulfills.output_index) : serializedTransaction
        const transactionHash = createHash('sha3-256').update(transactionUniqueFulfillment).digest()
        const filteredKeyPairs = keyPairs.filter(
            ({ publicKey }) => input.owners_before.includes(publicKey)
        )

        const ed25519Fulfillment = new Ed25519Sha256()
        filteredKeyPairs.forEach(keyPair => {
            // const privateKey = Buffer.from(base58.decode(keyPair.privateKey))
            const privateKey = (base58.decode(keyPair.privateKey))
            ed25519Fulfillment.sign(transactionHash, privateKey)
        })
        return ed25519Fulfillment.serializeUri()
    }
}

export const zenroomContract = `
    Scenario 'test': Script verifies input
    Given that I have a 'string dictionary' named 'houses'
    Then print the string 'ok'
`

export const zenroomInputs = {
    "houses": [
        {
            "name": "Harry",
            "team": "Gryffindor",
        },
        {
            "name": "Draco",
            "team": "Slytherin",
        },
    ],
}
