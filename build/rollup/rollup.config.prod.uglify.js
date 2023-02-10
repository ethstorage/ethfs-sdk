import path from 'path'
import json from '@rollup/plugin-json' // 解析json文件
import { babel } from '@rollup/plugin-babel' // 转换es6语法
import { nodeResolve } from '@rollup/plugin-node-resolve' // 处理node_modeules依赖
import commonjs from '@rollup/plugin-commonjs' // 处理 common 模块js
import replace from '@rollup/plugin-replace' // 全局替换
import { uglify } from 'rollup-plugin-uglify' // 压缩文件
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
      tsconfig: getPath('../../tsconfig.json'), // 导入本地ts配置
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
      sourceMap: false // 不映射源文件，提高性能
      }
    ),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    uglify()
  ],
  external: ['fs'] // 忽略的依赖
}