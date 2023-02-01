<!---
Copyright © 2020 Interplanetary Database Association e.V.,
Planetmint and IPDB software contributors.
SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
Code is AGPL-3.0-or-later and docs are CC-BY-4.0
--->

# Quick Notes
`dotenv` is listed as a dependencies in `package.json`.
If you want to use this, add a `.env` file to the root of this project (same level as this `README.md` file)
and replace the variables to fit your specific config.

```
PLANETMINT_API_PATH=https://test.ipdb.io/api/v1/
```

# Usage
`npm install` -> Installs all required dependencies to run these examples.

## Different Examples
**Basic Usage**: Create asset and transfer it to new owner. 
-> `npm start`

**Async/Await Basic Usage**: Basic usage example rewritten with async/await.
-> `npm run basic-async`

**Querying for Assets**: Query for assetdata or metadata.
-> `npm run query-assets`

**Seed/Keypair Functionality**: Create keypair with bip39 library.
-> `npm run seed-func`
