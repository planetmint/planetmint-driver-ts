// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

/* eslint-disable import/no-unresolved */

const { CID } = require('multiformats/cid')
const json = require('multiformats/codecs/json')
const { sha256 } = require('multiformats/hashes/sha2')
const driver = require('planetmint-driver')
require('dotenv').config()

// ======== Preparation ======== //
const conn = new driver.Connection(process.env.PLANETMINT_API_PATH || 'https://example.com/api/v1/', {
    header1: 'header1_value',
    header2: 'header2_value'
})

const alice = new driver.Ed25519Keypair()

// ======== Asset Array ======== //
const assetArray = []
assetArray.push({ 'bicycle': { 'serial_number': 'abc', 'manufacturer': 'BicyclesInc' } })
assetArray.push({ 'bicycle': { 'serial_number': 'cde', 'manufacturer': 'BicyclesInc' } })
assetArray.push({ 'bicycle': { 'serial_number': 'fgh', 'manufacturer': 'BicyclesInc' } })

const metadata = { 'planet': 'Pluto' }

async function toCID(obj) {
    const bytes = json.encode(obj)
    const assetHash = await sha256.digest(bytes)
    return CID.create(1, json.code, assetHash).toString()
}

// ======== Create Transactions for bicycles ======== //
async function createTx(assetdata) {
    const assetCID = await toCID(assetdata)
    const metadataCID = await toCID(metadata)
    const txCreate = driver.Transaction.makeCreateTransaction(
        [assetCID],
        metadataCID,
        [
            driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey))
        ],
        alice.publicKey
    )

    const txCreateSigned = driver.Transaction.signTransaction(txCreate, alice.privateKey)
    return conn.postTransactionCommit(txCreateSigned)
}

async function queryAssets() {
    // ======== Execute all promises in order to post transactions and fetch them ======== //
    await Promise.all(assetArray.map(createTx))
    const assetCID = await toCID(assetArray[0])
    const assets = await conn.searchAssets(assetCID)
    console.log(`Found assets with CID: ${assetCID}`, assets) // eslint-disable-line no-console
}

queryAssets.catch(e => {
    console.error(e)
    process.exit(1)
})
