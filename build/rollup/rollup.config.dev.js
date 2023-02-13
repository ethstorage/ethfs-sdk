import json from '@rollup/plugin-json'
import {babel} from '@rollup/plugin-babel'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'

export default {
  input: 'src/index.js',
  output: [
    {
      file: `lib/index.esm.js`,
      format: 'esm'
    },
    {
      file: `lib/index.umd.js`,
      format: 'umd',
      name: 'JSUTILS'
    },
    {
      file: 'lib/index.cjs.js',
      format: 'cjs'
    }
  ],
  plugins: [
    json(
      {
        exclude: [ 'node_modules/**' ],
      }
    ),
    babel(
      {
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      }
    ),
    nodeResolve({
      preferBuiltins: false
    }),
    commonjs(
      {
      sourceMap: false
      }
    ),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],
  external: ['fs']
}
