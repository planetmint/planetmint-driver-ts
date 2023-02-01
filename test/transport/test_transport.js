// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import test from 'ava'

import {
    Connection
} from '../../src'
import {
    API_PATH
} from '../constants'

test('Pick connection with earliest backoff time', async t => {
    const path1 = API_PATH
    const path2 = 'http://localhostwrong:9984/api/v1/'

    // Reverse order
    const conn = new Connection([path2, path1])
    // This will trigger the 'forwardRequest' so the correct connection will be taken
    await conn.listTransactions(['example']).catch(() => {})

    const connection1 = conn.transport.connectionPool[1]

    t.deepEqual(conn.transport.pickConnection(), connection1)
})
