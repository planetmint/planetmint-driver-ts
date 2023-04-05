// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import test from 'ava'
import { Ed25519Keypair, Transaction, Connection } from '../../src'

import {
    API_PATH,
    alice,
    aliceCondition,
    aliceOutput,
    bob,
    bobOutput,
    assetData,
    metaData,
    delegatedSignTransaction
} from '../constants'

test('Keypair is created', t => {
    const keyPair = new Ed25519Keypair()

    t.truthy(keyPair.publicKey)
    t.truthy(keyPair.privateKey)
})

test('Valid CREATE transaction with default node', async t => {
    const conn = new Connection()
    const tx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const txSigned = Transaction.signTransaction(tx, alice.privateKey)

    const resTx = await conn.postTransaction(txSigned)
    t.truthy(resTx)
})

test('Valid CREATE transaction using async', async t => {
    const conn = new Connection(API_PATH)

    const tx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const txSigned = Transaction.signTransaction(tx, alice.privateKey)

    const resTx = await conn.postTransactionAsync(txSigned)
    t.truthy(resTx)
})

test('Valid CREATE transaction using sync', async t => {
    const conn = new Connection(API_PATH)

    const tx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const txSigned = Transaction.signTransaction(tx, alice.privateKey)
    const resTx = await conn.postTransactionSync(txSigned)
    t.truthy(resTx)
})

test('Valid TRANSFER transaction with single Ed25519 input', async t => {
    const conn = new Connection(API_PATH)
    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 0 }],
        [aliceOutput],
        await metaData
    )
    const transferTxSigned = Transaction.signTransaction(
        transferTx,
        alice.privateKey
    )
    const resTx = await conn.postTransactionCommit(transferTxSigned)
    t.truthy(resTx)
})

test('Valid TRANSFER transaction with multiple Ed25519 inputs', async t => {
    const conn = new Connection(API_PATH)
    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput, bobOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 0 }, { tx: createTxSigned, output_index: 1 }],
        [Transaction.makeOutput(aliceCondition, '2')],
        await metaData,
    )
    const transferTxSigned = Transaction.signTransaction(
        transferTx,
        alice.privateKey,
        bob.privateKey
    )
    const resTx = await conn.postTransactionCommit(transferTxSigned)
    t.truthy(resTx)
})

test('Valid TRANSFER transaction with multiple Ed25519 inputs from different transactions', async t => {
    const conn = new Connection(API_PATH)
    const carol = new Ed25519Keypair()
    const carolCondition = Transaction.makeEd25519Condition(carol.publicKey)
    const carolOutput = Transaction.makeOutput(carolCondition)
    const trent = new Ed25519Keypair()
    const trentCondition = Transaction.makeEd25519Condition(trent.publicKey)
    const trentOutput = Transaction.makeOutput(trentCondition)
    const eli = new Ed25519Keypair()
    const eliCondition = Transaction.makeEd25519Condition(eli.publicKey)

    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput, bobOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const transferTx1 = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 0 }],
        [carolOutput],
        await metaData
    )
    const transferTxSigned1 = Transaction.signTransaction(
        transferTx1,
        alice.privateKey
    )
    const transferTx2 = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 1 }],
        [trentOutput],
        await metaData
    )
    const transferTxSigned2 = Transaction.signTransaction(
        transferTx2,
        bob.privateKey
    )

    await conn.postTransactionCommit(transferTxSigned1)
    await conn.postTransactionCommit(transferTxSigned2)
    const transferTxMultipleInputs = Transaction.makeTransferTransaction(
        [{ tx: transferTxSigned1, output_index: 0 },
            { tx: transferTxSigned2, output_index: 0 }],
        [Transaction.makeOutput(eliCondition, '2')],
        await metaData
    )
    const transferTxSignedMultipleInputs = Transaction.signTransaction(
        transferTxMultipleInputs,
        carol.privateKey,
        trent.privateKey
    )
    const resTx = await conn.postTransactionCommit(transferTxSignedMultipleInputs)
    t.truthy(resTx)
})

test('Valid CREATE transaction using delegateSign with default node', async t => {
    const conn = new Connection()

    const tx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )

    const txSigned = Transaction.delegateSignTransaction(
        tx,
        delegatedSignTransaction(alice)
    )

    const resTx = await conn.postTransaction(txSigned)
    t.truthy(resTx)
})

test('Valid TRANSFER transaction with multiple Ed25519 inputs using delegateSign', async t => {
    const conn = new Connection(API_PATH)
    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput, bobOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 0 }, { tx: createTxSigned, output_index: 1 }],
        [Transaction.makeOutput(aliceCondition, '2')],
        await metaData
    )

    const transferTxSigned = Transaction.delegateSignTransaction(
        transferTx,
        delegatedSignTransaction(alice, bob)
    )

    const resTx = await conn.postTransactionCommit(transferTxSigned)
    t.truthy(resTx)
})

test('Search for spent and unspent outputs of a given public key', async t => {
    const conn = new Connection(API_PATH)
    const carol = new Ed25519Keypair()
    const carolCondition = Transaction.makeEd25519Condition(carol.publicKey)
    const carolOutput = Transaction.makeOutput(carolCondition)
    const trent = new Ed25519Keypair()
    const trentCondition = Transaction.makeEd25519Condition(trent.publicKey)
    const trentOutput = Transaction.makeOutput(trentCondition)

    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [carolOutput, carolOutput],
        [carol.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        carol.privateKey,
        carol.privateKey
    )

    // We spent output 1 (of 0, 1)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 1 }],
        [trentOutput],
        await metaData
    )
    const transferTxSigned = Transaction.signTransaction(
        transferTx,
        carol.privateKey,
    )

    await conn.postTransactionCommit(createTxSigned)
    await conn.postTransactionCommit(transferTxSigned)
    const outputs = await conn.listOutputs(carol.publicKey)
    // now listOutputs should return us outputs 0 and 1 (unfiltered)
    t.truthy(outputs.length === 2)
})

test('Search for unspent outputs for a given public key', async t => {
    const conn = new Connection(API_PATH)
    const carol = new Ed25519Keypair()
    const carolCondition = Transaction.makeEd25519Condition(carol.publicKey)
    const carolOutput = Transaction.makeOutput(carolCondition)
    const trent = new Ed25519Keypair()
    const trentCondition = Transaction.makeEd25519Condition(trent.publicKey)
    const trentOutput = Transaction.makeOutput(trentCondition)

    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [carolOutput, carolOutput, carolOutput],
        [carol.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        carol.privateKey,
        carol.privateKey
    )

    // We spent output 1 (of 0, 1, 2)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 1 }],
        [trentOutput],
        await metaData
    )
    const transferTxSigned = Transaction.signTransaction(
        transferTx,
        carol.privateKey,
    )

    await conn.postTransactionCommit(createTxSigned)
    await conn.postTransactionCommit(transferTxSigned)
    const outputs = await conn.listOutputs(carol.publicKey, 'false')
    // now listOutputs should return us outputs 0 and 2 (1 is spent)
    t.truthy(outputs.length === 2)
})

test('Search for spent outputs for a given public key', async t => {
    const conn = new Connection(API_PATH)
    const carol = new Ed25519Keypair()
    const carolCondition = Transaction.makeEd25519Condition(carol.publicKey)
    const carolOutput = Transaction.makeOutput(carolCondition)
    const trent = new Ed25519Keypair()
    const trentCondition = Transaction.makeEd25519Condition(trent.publicKey)
    const trentOutput = Transaction.makeOutput(trentCondition)

    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [carolOutput, carolOutput, carolOutput],
        [carol.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        carol.privateKey,
        carol.privateKey
    )

    // We spent output 1 (of 0, 1, 2)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 1 }],
        [trentOutput],
        await metaData
    )
    const transferTxSigned = Transaction.signTransaction(
        transferTx,
        carol.privateKey,
    )

    await conn.postTransactionCommit(createTxSigned)
    await conn.postTransactionCommit(transferTxSigned)
    const outputs = await conn.listOutputs(carol.publicKey, true)
    // now listOutputs should only return us output 1 (0 and 2 are unspent)
    t.truthy(outputs.length === 1)
})

test('Search for an asset', async t => {
    const conn = new Connection(API_PATH)
    const assetCID = await assetData()

    const createTx = Transaction.makeCreateTransaction(
        [assetCID],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const assets = await conn.searchAssets(assetCID)
    t.truthy(assets.pop(), assetCID)
})

// Metadata search is disabled in Planetmint
test.skip('Search for metadata', async t => {
    const conn = new Connection(API_PATH)
    const metaDataCID = await metaData

    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        metaDataCID,
        [aliceOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const metadataList = await conn.searchMetadata(metaDataCID)
    t.truthy(metadataList.pop(), metaDataCID)
})

test('Search blocks containing a transaction', async t => {
    const conn = new Connection(API_PATH)

    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    const { id } = await conn.postTransactionCommit(createTxSigned)
    const blocks = await conn.listBlocks(id)
    const blockHeight = blocks.height
    const block = await conn.getBlock(blockHeight)
    t.truthy(blocks.transaction_ids.some((txId) => txId === createTxSigned.id))
    t.truthy(block.transaction_ids.some((txId) => txId === createTxSigned.id))
})

test('Search transaction containing an asset', async t => {
    const conn = new Connection(API_PATH)

    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    const { id } = await conn.postTransactionCommit(createTxSigned)
    const transactions = await conn.listTransactions([id])
    t.truthy(transactions.length === 1)
})

test('Content-Type cannot be set', t => {
    t.throws(() => new Connection(API_PATH, { 'Content-Type': 'application/json' }), {
        instanceOf: Error
    })
})

test('Valid CREATE transaction with zenroom script', async t => {
    const conn = new Connection()
    const tx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey],
        {
            code: `
                Scenario 'test': Script verifies input
                Given that I have a 'string dictionary' named 'houses'
                Then print the string 'ok'
            `,
            inputs: {
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
            },
            outputs: ["ok"],
            state: "dd8bbd234f9869cab4cc0b84aa660e9b5ef0664559b8375804ee8dce75b10576",
            policies: {},
        }
    )
    const txSigned = Transaction.signTransaction(tx, alice.privateKey)

    const resTx = await conn.postTransaction(txSigned)
    t.truthy(resTx)
})

test('Invalid CREATE transaction with zenroom script', async t => {
    const conn = new Connection()
    const tx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey],
        {
            code: `
                Scenario 'test': Script verifies input
                Given that I have a 'string dictionary' named 'houses'
                Then print the string 'ok'
            `,
            inputs: {
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
            },
            outputs: ["not ok"],
            state: "dd8bbd234f9869cab4cc0b84aa660e9b5ef0664559b8375804ee8dce75b10576",
            policies: {},
        }
    )
    const txSigned = Transaction.signTransaction(tx, alice.privateKey)

    await t.throwsAsync(async () => await conn.postTransaction(txSigned), { instanceOf: Error })
})

test('Valid TRANSFER transaction with zenroom script', async t => {
    const conn = new Connection()
    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 0 }],
        [aliceOutput],
        await metaData,
        {
            code: `
                Scenario 'test': Script verifies input
                Given that I have a 'string dictionary' named 'houses'
                Then print the string 'ok'
            `,
            inputs: {
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
            },
            outputs: ["ok"],
            state: "dd8bbd234f9869cab4cc0b84aa660e9b5ef0664559b8375804ee8dce75b10576",
            policies: {},
        }
    )
    const transferTxSigned = Transaction.signTransaction(transferTx, alice.privateKey)

    const resTx = await conn.postTransaction(transferTxSigned)
    t.truthy(resTx)
})

test('Invalid TRANSFER transaction with zenroom script', async t => {
    const conn = new Connection()
    const createTx = Transaction.makeCreateTransaction(
        [await assetData()],
        await metaData,
        [aliceOutput],
        [alice.publicKey]
    )
    const createTxSigned = Transaction.signTransaction(
        createTx,
        alice.privateKey
    )

    await conn.postTransactionCommit(createTxSigned)
    const transferTx = Transaction.makeTransferTransaction(
        [{ tx: createTxSigned, output_index: 0 }],
        [aliceOutput],
        await metaData,
        {
            code: `
                Scenario 'test': Script verifies input
                Given that I have a 'string dictionary' named 'houses'
                Then print the string 'ok'
            `,
            inputs: {
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
            },
            outputs: ["not ok"],
            state: "dd8bbd234f9869cab4cc0b84aa660e9b5ef0664559b8375804ee8dce75b10576",
            policies: {},
        }
    )
    const transferTxSigned = Transaction.signTransaction(transferTx, alice.privateKey)

    await t.throwsAsync(async () => await conn.postTransaction(transferTxSigned), { instanceOf: Error })
})