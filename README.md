<!---
Copyright © 2020 Interplanetary Database Association e.V.,
Planetmint and IPDB software contributors.
SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
Code is AGPL-3.0-or-later and docs are CC-BY-4.0
--->

> Official JavaScript driver for [Planetmint](https://github.com/planetmint/planetmint) to create transactions in Node.js and the browser.

[![npm](https://img.shields.io/npm/v/planetmint-driver.svg)](https://www.npmjs.com/package/planetmint-driver)
<!-- TODO: add github actions badges -->

- [Main Documentation](https://docs.planetmint.io/)
- [Driver API reference](API.md)

## Compatibility

<!-- must be updated! -->
| Planetmint Server | Planetmint JavaScript Driver |
| ----------------- |------------------------------|
| `2.x.x`           | `0.0.x`                      |

## Table of Contents

  - [Installation and Usage](#installation-and-usage)
     - [Example: Create a transaction](#example-create-a-transaction)
     - [Browser usage](#browser-usage)
  - [Planetmint Documentation](#planetmint-documentation)
  - [Speed Optimizations](#speed-optimizations)
  - [Development](#development)
  - [Release Process](#release-process)
  - [Authors](#authors)
  - [Licenses](#licenses)

---

## Installation and Usage

```bash
npm install planetmint-driver
```

```js
const driver = require('planetmint-driver')
// or ES6+
import driver from 'planetmint-driver'
```

### Example: Create a transaction

```js
const driver = require('planetmint-driver')
const base58 = require('bs58');
const crypto = require('crypto');
const { Ed25519Sha256 } = require('crypto-conditions');

// Planetmint server instance (e.g. https://example.com/api/v1/)
const API_PATH = 'http://localhost:9984/api/v1/'

// Create a new keypair.
const alice = new driver.Ed25519Keypair()

// Construct a transaction payload
const tx = driver.Transaction.makeCreateTransaction(
    // Define the asset to store, in this example it is the current temperature
    // (in Celsius) for the city of Berlin.
    { city: 'Berlin, DE', temperature: 22, datetime: new Date().toString() },

    // Metadata contains information about the transaction itself
    // (can be `null` if not needed)
    { what: 'My first Planetmint transaction' },

    // A transaction needs an output
    [ driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(alice.publicKey))
    ],
    alice.publicKey
)

// Sign the transaction with private keys
const txSigned = driver.Transaction.signTransaction(tx, alice.privateKey)

// Or use delegateSignTransaction to provide your own signature function
function signTransaction() {
    // get privateKey from somewhere
    const privateKeyBuffer = Buffer.from(base58.decode(alice.privateKey))
    return function sign(serializedTransaction, input, index) {
        const transactionUniqueFulfillment = input.fulfills ? serializedTransaction
                .concat(input.fulfills.transaction_id)
                .concat(input.fulfills.output_index) : serializedTransaction
        const transactionHash = crypto.createHash('sha3-256').update(transactionUniqueFulfillment).digest()
        const ed25519Fulfillment = new Ed25519Sha256();
        ed25519Fulfillment.sign(transactionHash, privateKeyBuffer);
        return ed25519Fulfillment.serializeUri();
    };
}
const txSigned = driver.Transaction.delegateSignTransaction(tx, signTransaction())

// Send the transaction off to Planetmint
const conn = new driver.Connection(API_PATH)

conn.postTransactionCommit(txSigned)
    .then(retrievedTx => console.log('Transaction', retrievedTx.id, 'successfully posted.'))
```

### Browser usage

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Planetmint boilerplate</title>
        <!-- Adjust version to your needs -->
        <script src="https://unpkg.com/planetmint-driver@0.0.1/dist/browser/planetmint-driver.window.min.js"></script>

        <script>
            // Planetmint server instance (e.g. https://example.com/api/v1/)
            const API_PATH = 'http://localhost:9984/api/v1/'

            // Create a new keypair.
            const alice = new Planetmint.Ed25519Keypair()

            // Construct a transaction payload
            const tx = Planetmint.Transaction.makeCreateTransaction(
                // Define the asset to store, in this example it is the current temperature
                // (in Celsius) for the city of Berlin.
                { city: 'Berlin, DE', temperature: 22, datetime: new Date().toString() },

                // Metadata contains information about the transaction itself
                // (can be `null` if not needed)
                { what: 'My first Planetmint transaction' },

                // A transaction needs an output
                [ Planetmint.Transaction.makeOutput(
                        Planetmint.Transaction.makeEd25519Condition(alice.publicKey))
                ],
                alice.publicKey
            )

            // Sign the transaction with private keys
            const txSigned = Planetmint.Transaction.signTransaction(tx, alice.privateKey)

            // Send the transaction off to Planetmint
            let conn = new Planetmint.Connection(API_PATH)

            conn.postTransactionCommit(txSigned)
                .then(res => {
                    const elem = document.getElementById('lastTransaction')
                    elem.href = API_PATH + 'transactions/' + txSigned.id
                    elem.innerText = txSigned.id
                    console.log('Transaction', txSigned.id, 'accepted')
                })
            // Check console for the transaction's status
        </script>
    </head>
    <body id="home">
        <h1>Hello Planetmint</h1>
        <p>Your transaction id is: <a id="lastTransaction" target="_blank"><em>processing</em></a></p>
    </body>
</html>
```

## Planetmint Documentation

- [The Hitchhiker's Guide to BigchainDB](https://www.bigchaindb.com/developers/guide/)
- [HTTP API Reference](https://docs.bigchaindb.com/projects/server/en/latest/http-client-server-api.html)
- [The Transaction Model](https://github.com/bigchaindb/BEPs/tree/master/13/)
- [Asset Transfer](https://docs.planetmint.io/using-planetmint#transfer-transactions)
- [All Planetmint Documentation](https://docs.planetmint.io/)

## Speed Optimizations

This implementation plays "safe" by using JS-native (or downgradable) libraries for its crypto-related functions to keep compatibilities with the browser. If you do want some more speed, feel free to explore the following:

* [chloride](https://github.com/dominictarr/chloride), or its underlying [sodium](https://github.com/paixaop/node-sodium) library
* [node-sha3](https://github.com/phusion/node-sha3) -- **MAKE SURE** to use [steakknife's fork](https://github.com/steakknife/node-sha3) if [the FIPS 202 upgrade](https://github.com/phusion/node-sha3/pull/25) hasn't been merged (otherwise, you'll run into all kinds of hashing problems)

## Development

```js
git clone git@github.com:planetmint/planetmint-driver-ts.git
cd planetmint-driver-ts/

npm i
npm run dev
```

After updating source files in `src/`, make sure to update the API documentation. The following command will scan all source files and create the Markdown output into `./API.md`:

```bash
npm run doc
```

## Release Process

See the file named [RELEASE_PROCESS.md](RELEASE_PROCESS.md).

## Authors

* Planetmint <contact@ipdb.global>
* Planetmint contributors

## Licenses

See [LICENSE](LICENSE) and [LICENSE-docs](LICENSE-docs).
