/* .prettierrc.cjs - Prettier 代码格式化配置（CJS 扩展名：package.json type=module 下需显式声明）
 *
 * - .eslintrc.json
 * - .editorconfig
 * - .gitattributes
 */

module.exports = {
  /* ========== 基础格式 ========== */
  semi: true, // 在语句末尾添加分号
  singleQuote: true, // 使用单引号而非双引号
  printWidth: 100, // 每行最大字符数
  tabWidth: 2, // 缩进使用的空格数
  useTabs: false, // 使用空格而非 Tab 字符
  bracketSpacing: true, // 对象字面量的括号之间打印空格

  /* ========== 尾随逗号 ========== */
  trailingComma: 'es5', // 在多行结构的最后一项后添加尾随逗号

  /* ========== 箭头函数 ========== */
  arrowParens: 'always', // 箭头函数参数始终使用括号

  /* ========== 换行符 ========== */
  endOfLine: 'lf', // 使用 Unix 风格的换行符

  /* ========== 对象属性引号 ========== */
  quoteProps: 'as-needed', // 对象属性仅在需要时添加引号
};
