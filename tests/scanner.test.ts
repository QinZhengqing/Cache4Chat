/* scanner.test.ts - 标记块扫描与剥离单元测试
 *
 * - ../src/modules/scanner.ts
 * - setup.ts（注入 YAML 全局模拟）
 */

import { describe, expect, it } from 'vitest';

import { hasMarker, scanText } from '../src/modules/scanner.ts';

// ═══════════════════════════════════════════
//  hasMarker
// ═══════════════════════════════════════════

describe('hasMarker', () => {
  it('存在标记块时返回 true', () => {
    expect(hasMarker('前文<Cache_control>type: ephemeral</Cache_control>后文')).toBe(true);
  });

  it('标签大小写不敏感', () => {
    expect(hasMarker('<cache_control>a: 1</cache_control>')).toBe(true);
    expect(hasMarker('<CACHE_CONTROL>a: 1</CACHE_CONTROL>')).toBe(true);
  });

  it('无标记块时返回 false', () => {
    expect(hasMarker('普通文本，没有标记')).toBe(false);
  });

  it('只有开标签没有闭标签时返回 false', () => {
    expect(hasMarker('<Cache_control>type: ephemeral')).toBe(false);
  });

  it('连续调用结果稳定（全局正则游标不残留）', () => {
    const text = '<Cache_control>a: 1</Cache_control>';
    expect(hasMarker(text)).toBe(true);
    expect(hasMarker(text)).toBe(true); // 第二次调用不受 lastIndex 影响
  });
});

// ═══════════════════════════════════════════
//  scanText
// ═══════════════════════════════════════════

describe('scanText', () => {
  it('剥离标记块并解析 YAML 为对象', () => {
    const text = '系统提示词\n<Cache_control>\ntype: ephemeral\nttl: 1h\n</Cache_control>\n正文';
    const result = scanText(text);
    expect(result.cleanedText).toBe('系统提示词\n\n正文'); // 块整体移除，前后文本保留
    expect(result.cacheControl).toEqual({ type: 'ephemeral', ttl: '1h' }); // YAML → JSON
    expect(result.errors).toEqual([]);
  });

  it('块内键值对原样转换，不校验语义', () => {
    const text = '<Cache_control>\nfoo: bar\nnested:\n  a: 1\n</Cache_control>';
    const result = scanText(text);
    expect(result.cacheControl).toEqual({ foo: 'bar', nested: { a: 1 } }); // 任意键值对透传
  });

  it('多个标记块全部剥离，取最后一个有效值', () => {
    const text =
      '<Cache_control>type: first</Cache_control>中间' +
      '<Cache_control>type: second</Cache_control>';
    const result = scanText(text);
    expect(result.cleanedText).toBe('中间'); // 两个块都被剥离
    expect(result.cacheControl).toEqual({ type: 'second' }); // 后者覆盖前者
  });

  it('YAML 解析失败时剥离块但不取值，并记录警告', () => {
    const text = '<Cache_control>\n[invalid: yaml: {{{\n</Cache_control>正文';
    const result = scanText(text);
    expect(result.cleanedText).toBe('正文'); // 失败块也被剥离
    expect(result.cacheControl).toBeUndefined(); // 未取值
    expect(result.errors).toHaveLength(1); // 记录警告
    expect(result.errors[0]).toContain('YAML 解析失败');
  });

  it('空块剥离且不取值，并记录警告', () => {
    const result = scanText('<Cache_control>   \n  </Cache_control>正文');
    expect(result.cleanedText).toBe('正文');
    expect(result.cacheControl).toBeUndefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('为空');
  });

  it('解析失败的块不覆盖之前成功的值', () => {
    const text =
      '<Cache_control>type: valid</Cache_control>' + '<Cache_control>[broken: {{{</Cache_control>';
    const result = scanText(text);
    expect(result.cacheControl).toEqual({ type: 'valid' }); // 失败块不覆盖
    expect(result.errors).toHaveLength(1);
  });

  it('无标记块时原样返回文本', () => {
    const result = scanText('普通文本');
    expect(result.cleanedText).toBe('普通文本');
    expect(result.cacheControl).toBeUndefined();
    expect(result.errors).toEqual([]);
  });
});
