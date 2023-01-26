// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

/* eslint-disable import/no-unresolved */

const driver = require('planetmint-driver')
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

// Call async basic usage function
basicUsage()

async function basicUsage() {
    // ======== Create Transaction Bicycle ======== //
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        assetdata,
        metadata,
        [
            driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey))
        ],
        alice.publicKey
    )

    const txCreateAliceSimpleSigned =
        driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)

    // ======== POST CREATE Transaction ======== //
    const createdTx = await conn.postTransactionCommit(txCreateAliceSimpleSigned)

    // ======== POST TRANSFER Transaction ======== //
    const txTransferBob = driver.Transaction.makeTransferTransaction(
        [{ tx: createdTx, output_index: 0 }],
        [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))],
        { price: '100 euro' }
    )

    const txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)

    await conn.postTransactionCommit(txTransferBobSigned)

    // ======== Querying Assets ======== //
    const assets = await conn.searchAssets('Bicycle Inc.')
    console.log(assets) // eslint-disable-line no-console
}
