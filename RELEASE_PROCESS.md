<!---
Copyright © 2020 Interplanetary Database Association e.V.,
Planetmint and IPDB software contributors.
SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
Code is AGPL-3.0-or-later and docs are CC-BY-4.0
--->

# Our Release Process

## Notes

Planetmint follows
[the Python form of Semantic Versioning](https://packaging.python.org/tutorials/distributing-packages/#choosing-a-versioning-scheme)
(i.e. MAJOR.MINOR.PATCH),
which is almost identical
to [regular semantic versioning](http://semver.org/), but there's no hyphen, e.g.

- `0.9.0` for a typical final release
- `4.5.2a1` not `4.5.2-a1` for the first Alpha release
- `3.4.5rc2` not `3.4.5-rc2` for Release Candidate 2

**Note:** For Git tags (which are used to identify releases on GitHub), we append a `v` in front.

We follow [BEP-1](https://github.com/bigchaindb/BEPs/tree/master/1), which is our variant of C4, the Collective Code Construction Contract, so a release is just a [tagged commit](https://git-scm.com/book/en/v2/Git-Basics-Tagging) on the `master` branch, i.e. a label for a particular Git commit.

## Steps

1. Make sure you have a recent version of node and npm.
2. `npm install`
3. Update all npm package dependencies, where possible. You might have to freeze some versions. Run all tests locally (`npm run test`) and make sure they pass. Make a pull request (to be merged into the `master` branch) and make sure all tests are passing there (in Travis). Merge the pull request.
4. Make sure your local `master` branch is in sync with GitHub: `git checkout master` and `git pull`
5. Do a test build:

   `npm run build`

   If that fails, then get it working.
6. We use the [release-it](https://www.npmjs.com/package/release-it) package (from npm) to automate most of the release. Make sure you have a recent version.
7. Login to npm using your npm credentials, so you can publish a new [planetmint-driver](https://www.npmjs.com/package/planetmint-driver) package there. (The npm account must have permission to do so).

   `npm login`

8. release-it needs a Github personal access token so it can interact with GitHub on your behalf. To get one, go to:

   [https://github.com/settings/tokens](https://github.com/settings/tokens)

   and then make that token available as an environment variable, e.g.

   `export GITHUB_TOKEN="f941e0..."`

9. Do the release:

   - For a patch release, do `npm run release`
   - For a minor release, do `npm run release-minor`
   - For a major release, do `npm run release-major`

   If your npm account is using two-factor authentication,
   you will have to append a one-time password (OTP) like `--npm.otp=123456`.
   The above command will automatically do a bunch of things:

   - bump the project version in `package.json`, then git commit and git push it.
   - create a new Git tag of the form `v{verson}`, e.g. `v1.2.3`
   - create a new [GitHub release](https://github.com/planetmint/planetmint-driver-ts/releases).
   - publish a new npm release

   To see all the arguments passed to `release-it`, search for "release" in [package.json](package.json). The arguments are documented in the [release-it GitHub repo](https://github.com/release-it/release-it).

10. Make sure everything worked as expected.

   - Was the version number bumped properly in [package.json](package.json)?
   - Was a new Git tag created? See the [list of tags](https://github.com/planetmint/planetmint-driver-ts/tags).
   - Was a new GitHub release created? See the [list of releases](https://github.com/planetmint/planetmint-driver-ts/releases).
   - Was a new npm package published on npm? [Check on npmjs.com](https://www.npmjs.com/package/planetmint-driver).

11. You can edit the description of the GitHub release to add or remove details.

Congratulations, you have released a new version of the BigchainDB JavaScript Driver!
