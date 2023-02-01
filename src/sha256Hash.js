// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

/* eslint-disable camelcase */
import { sha3_256 } from 'js-sha3'

export default function sha256Hash(data) {
    return sha3_256
        .create()
        .update(data)
        .hex()
}
/* eslint-enable camelcase */
