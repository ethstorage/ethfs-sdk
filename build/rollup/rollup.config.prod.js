import path from 'path'
import json from '@rollup/plugin-json'
import {babel} from '@rollup/plugin-babel'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'

const getPath = _path => path.resolve(__dirname, _path)

export default {
  input: 'src/index.ts',
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
    typescript({
      tsconfig: getPath('../../tsconfig.json'),
      extensions: ['.js', '.ts']
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    json(
      {
        exclude: [ 'node_modules/**' ],
      }
    ),
    babel(
      {
        babelHelpers: 'bundled',
        extensions: ['.js', '.ts'],
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
    )
  ],
  external: ['fs']
}
