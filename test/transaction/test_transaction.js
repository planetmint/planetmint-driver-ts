// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import test from 'ava'
import sinon from 'sinon'

import { Transaction } from '../../src'

import {
    alice,
    aliceOutput,
    metaDataCID,
    createTx,
    transferTx
} from '../constants'

test('Create valid output with default amount', t => {
    const condition = {
        details: {
            type: 'ed25519-sha-256',
            public_key: 'abc'
        }
    }
    const expected = {
        amount: '1',
        condition,
        public_keys: ['abc']
    }
    const res = Transaction.makeOutput(condition)
    t.deepEqual(res, expected)
})

test('Create valid output with custom amount', t => {
    const condition = {
        details: {
            type: 'ed25519-sha-256',
            public_key: 'abc'
        }
    }
    const customAmount = '1337'
    const expected = {
        amount: customAmount,
        condition,
        public_keys: ['abc']
    }
    const res = Transaction.makeOutput(condition, customAmount)
    t.deepEqual(res, expected)
})

test('Pass condition not based on public_keys to makeOutput', t => {
    const condition = {
        details: {
            idea: 'just pretend this is e.g. a hashlock'
        }
    }
    const expected = {
        amount: '1',
        condition,
        public_keys: []
    }
    const res = Transaction.makeOutput(condition)
    t.deepEqual(res, expected)
})

test('makeOutput throws TypeError with incorrect amount type', t => {
    t.throws(() => Transaction.makeOutput({}, 1337), { instanceOf: TypeError })
})

test('Create TRANSFER transaction based on CREATE transaction', t => {
    sinon.spy(Transaction, 'makeTransaction')
    Transaction.makeTransferTransaction(
        [{ tx: createTx, output_index: 0 }],
        [aliceOutput],
        metaDataCID
    )
    const expected = [
        'TRANSFER',
        [{ id: createTx.id }],
        metaDataCID,
        [aliceOutput],
        [Transaction.makeInputTemplate(
            [alice.publicKey],
            { output_index: 0, transaction_id: createTx.id }
        )],
        '3.0'
    ]
    // NOTE: `src/transaction/makeTransaction` is `export default`, hence we
    // can only mock `makeTransaction.default` with a hack:
    // See: https://stackoverflow.com/a/33676328/1263876
    t.truthy(Transaction.makeTransaction.calledWith(...expected))
    Transaction.makeTransaction.restore()
})

test('Create TRANSFER transaction based on TRANSFER transaction', t => {
    sinon.spy(Transaction, 'makeTransaction')
    Transaction.makeTransferTransaction(
        [{ tx: transferTx, output_index: 0 }],
        [aliceOutput],
        metaDataCID
    )
    const expected = [
        'TRANSFER',
        [{ id: transferTx.assets[0].id }],
        metaDataCID,
        [aliceOutput],
        [Transaction.makeInputTemplate(
            [alice.publicKey],
            { output_index: 0, transaction_id: transferTx.id }
        )],
        '3.0'
    ]

    t.truthy(Transaction.makeTransaction.calledWith(...expected))
    Transaction.makeTransaction.restore()
})
