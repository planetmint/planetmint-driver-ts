// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import test from 'ava'
import rewire from 'rewire'

const baseRequestFile = rewire('../../src/baseRequest.js')
const baseRequest = baseRequestFile.__get__('baseRequest')
const handleResponse = baseRequestFile.__get__('handleResponse')

test('HandleResponse does not throw error for response ok', async t => {
    const testObj = {
        ok: true
    }
    const expected = testObj
    const actual = await handleResponse(testObj)

    t.deepEqual(actual, expected)
})

test('baseRequest test query and vsprint', async t => {
    const error = await t.throwsAsync(baseRequest('https://%s.com/', {
        urlTemplateSpec: ['google'],
        query: 'teapot'
    }), { instanceOf: Error, message: 'HTTP Error: Requested page not reachable' })

    t.is(error.requestURI, 'https://www.google.com/teapot')
    t.is(error.status, '418 I\'m a Teapot')
})
