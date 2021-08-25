/* import json from "@rollup/plugin-json"; {{{1
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from "rollup-plugin-node-polyfills"; }}} */
import pkg from './package.json';

export default [
	/* // browser-friendly UMD build {{{1
	{
		input: 'src/recurring.main.js',
		output: {
			name: 'recurring',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
      json(),
      nodePolyfills(),
			resolve(), // so Rollup can find `ms`
			commonjs({
        namedExports: {
          "stellar-sdk": [
          "StrKey",
          "xdr",
          "Transaction",
          "Keypair",
          "Networks",
          "Account",
          "TransactionBuilder",
          "BASE_FEE",
          "Operation",
          "Asset",
          "Memo",
          "MemoHash",
          "Server",
        ],
      //"@stellar/wallet-sdk": ["KeyManager", "KeyManagerPlugins", "KeyType"],
        },
      }) // so Rollup can convert `ms` to an ES module
		]
	}, // }}}1 */

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify
	// `file` and `format` for each target)
	{
		input: 'src/recurring.main.js',
		external: ['stellar-sdk', 'moment'],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
];
