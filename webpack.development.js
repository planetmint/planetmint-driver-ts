// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

/* eslint-disable strict, no-console, object-shorthand, import/no-extraneous-dependencies */

'use strict'

const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
    devtool: 'inline-source-map',
    optimization: {
        minimizer: [
            new TerserPlugin({
                test: /vendor/,
            }),
            new TerserPlugin({
                test: /^((?!(vendor)).)*.js$/,
            })
        ],
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    }
}
