import path from 'path'
import json from '@rollup/plugin-json'
import {babel} from '@rollup/plugin-babel'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import {uglify} from 'rollup-plugin-uglify'
import typescript from 'rollup-plugin-typescript2'

const getPath = _path => path.resolve(__dirname, _path)

export default {
  input: 'src/index.ts',
  output: [
    {
      file: `lib/index.esm.min.js`,
      format: 'esm'
    },
    {
      file: `lib/index.umd.min.js`,
      format: 'umd',
      name: 'JSUTILS'
    },
    {
      file: 'lib/index.cjs.min.js',
      format: 'cjs'
    }
  ],
  plugins: [
    typescript({
      tsconfig: getPath('../../tsconfig.json'),
      extensions: ['.js', '.ts']
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
    ),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    uglify()
  ],
  external: ['fs']
}
