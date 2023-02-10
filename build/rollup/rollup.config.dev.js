import json from '@rollup/plugin-json' // 解析json文件
import { babel } from '@rollup/plugin-babel' // 转换es6语法
import { nodeResolve } from '@rollup/plugin-node-resolve' // 处理node_modeules依赖
import commonjs from '@rollup/plugin-commonjs' // 处理 common 模块js
import replace from '@rollup/plugin-replace' // 全局替换
import { version } from '../../package.json'

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
        babelHelpers: 'bundled', // 需要指定，不然会提示警告
        exclude: 'node_modules/**'
      }
    ),
    nodeResolve({
      preferBuiltins: false
    }),
    commonjs(
      {
      sourceMap: false // 不映射源文件，提高性能
      }
    ),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],
  external: ['fs'] // 忽略的依赖
}