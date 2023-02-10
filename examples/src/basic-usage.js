// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

/* eslint-disable import/no-unresolved */

const driver = require('@planetmint/driver')
// const driver = require('../../dist/node/index')
const { CID } = require('multiformats/cid')
const json = require('multiformats/codecs/json')
const { sha256 } = require('multiformats/hashes/sha2')
require('dotenv').config()

// ======== Preparation ======== //
const conn = new driver.Connection(process.env.PLANETMINT_API_PATH || 'https://test.ipdb.io/api/v1/', {
    header1: 'header1_value',
    header2: 'header2_value'
})

const alice = new driver.Ed25519Keypair()
const bob = new driver.Ed25519Keypair()

const assetdata = {
    'bicycle': {
        'serial_number': 'abcd1234',
        'manufacturer': 'Bicycle Inc.',
    }
}

const metadata = { 'planet': 'earth' }

async function toCID(obj) {
    const bytes = json.encode(obj)
    const assetHash = await sha256.digest(bytes)
    return CID.create(1, json.code, assetHash).toString()
}

async function basicUsage() {
    const assetCID = await toCID(assetdata)
    const metadataCID = await toCID(metadata)

    // ======== Create Transaction Bicycle ======== //
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        [assetCID],
        metadataCID,
        [
            driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey))
        ],
        alice.publicKey
    )

    const txCreateAliceSimpleSigned =
        driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)

    // ======== POST CREATE Transaction ======== //
    const createdTx = await conn.postTransactionCommit(txCreateAliceSimpleSigned)

    const metadatTransferCID = await toCID({ price: '100 euro' })
    // ======== POST TRANSFER Transaction ======== //
    const txTransferBob = driver.Transaction.makeTransferTransaction(
        [{ tx: createdTx, output_index: 0 }],
        [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))],
        metadatTransferCID
    )

    const txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)

    const tx = await conn.postTransactionCommit(txTransferBobSigned)

    console.log('Is Bob the owner?', tx.outputs[0].public_keys[0] === bob.publicKey) // eslint-disable-line no-console
    console.log('Was Alice the previous owner?', tx.inputs[0].owners_before[0] === alice.publicKey) // eslint-disable-line no-console

    // ======== Querying Assets ======== //
    const assets = await conn.searchAssets(assetCID)
    console.log(assets) // eslint-disable-line no-console
}

// Call async basic usage function
(async () => {
    try {
        await basicUsage()
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
})()
