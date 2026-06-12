/* esbuild.config.mjs - 构建配置
 *
 * - package.json
 * - tsconfig.json
 */

import { build } from 'esbuild';

const isDev = process.argv.includes('--dev');

build({
  entryPoints: ['src/index.ts'], // 入口文件
  bundle: true, // 打包所有依赖为单文件
  outfile: 'dist/bundle.js', // 输出路径
  format: 'esm', // ESM 格式（匹配宿主 iframe 加载方式）
  platform: 'browser', // 目标平台（宿主为浏览器 iframe）
  target: 'es2020', // 编译目标（与 tsconfig 一致）
  sourcemap: isDev, // 开发模式生成 sourcemap
  minify: !isDev, // 生产模式压缩
  legalComments: 'external', // 第三方许可证提取到独立文件
  alias: {
    '@': './src', // 路径别名（与 tsconfig paths 一致）
  },
})
  .then(() => {
    console.log(`Cache4Chat build complete (${isDev ? 'dev' : 'prod'})`);
  })
  .catch(() => process.exit(1));
