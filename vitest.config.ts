/* vitest.config.ts - 测试配置
 *
 * - tsconfig.json
 * - tests/setup.ts
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'], // 测试文件匹配
    environment: 'node', // 测试运行环境
    globals: true, // 启用全局测试 API（describe、it、expect）
    setupFiles: ['tests/setup.ts'], // 全局 setup（注入宿主模拟）
  },
  resolve: {
    alias: {
      '@': './src', // 路径别名（与 tsconfig 一致）
    },
  },
});
