/* interceptor.test.ts - 消息处理单元测试
 *
 * - ../src/modules/interceptor.ts
 * - setup.ts（注入 YAML 全局模拟）
 */

import { describe, expect, it } from 'vitest';

import { processChat, processMessage } from '../src/modules/interceptor.ts';
import type { SendingMessage } from '../src/types/index.ts';

// ═══════════════════════════════════════════
//  processMessage - 字符串 content
// ═══════════════════════════════════════════

describe('processMessage（字符串 content）', () => {
  it('剥离标记块并双挂 cache_control（消息级 + 文本元素内）', () => {
    const message: SendingMessage = {
      role: 'system',
      content: '提示词<Cache_control>\ntype: ephemeral\nttl: 1h\n</Cache_control>',
    };
    const errors = processMessage(message);
    expect(message.content).toEqual([
      { type: 'text', text: '提示词', cache_control: { type: 'ephemeral', ttl: '1h' } }, // content 升格为数组，键写入文本元素
    ]);
    expect(message.cache_control).toEqual({ type: 'ephemeral', ttl: '1h' }); // 消息级同时保留
    expect(errors).toEqual([]);
  });

  it('无标记块时不修改消息、不追加键', () => {
    const message: SendingMessage = { role: 'user', content: '普通消息' };
    processMessage(message);
    expect(message.content).toBe('普通消息');
    expect('cache_control' in message).toBe(false); // 未追加键
  });

  it('解析失败时剥离块但不追加键，返回警告', () => {
    const message: SendingMessage = {
      role: 'user',
      content: '<Cache_control>[broken: {{{</Cache_control>正文',
    };
    const errors = processMessage(message);
    expect(message.content).toBe('正文');
    expect('cache_control' in message).toBe(false);
    expect(errors).toHaveLength(1);
  });

  it('保留消息上的其他原生键', () => {
    const message: SendingMessage = {
      role: 'assistant',
      content: '<Cache_control>type: ephemeral</Cache_control>回复',
      name: 'Bot', // 原生键应原样保留
    };
    processMessage(message);
    expect(message['name']).toBe('Bot');
    expect(message.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('解析失败时 content 保持字符串形态（不升格数组）', () => {
    const message: SendingMessage = {
      role: 'user',
      content: '<Cache_control>[broken: {{{</Cache_control>正文',
    };
    processMessage(message);
    expect(message.content).toBe('正文'); // 未取到值：不升格，仅剥离
  });
});

// ═══════════════════════════════════════════
//  processMessage - 数组 content
// ═══════════════════════════════════════════

describe('processMessage（数组 content）', () => {
  it('扫描文本块并双挂 cache_control（消息级 + 命中元素内）', () => {
    const message: SendingMessage = {
      role: 'user',
      content: [
        { type: 'text', text: '描述<Cache_control>type: ephemeral</Cache_control>' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,xxx' } },
      ],
    };
    processMessage(message);
    expect(message.content).toEqual([
      { type: 'text', text: '描述', cache_control: { type: 'ephemeral' } }, // 剥离 + 键写入命中元素
      { type: 'image_url', image_url: { url: 'data:image/png;base64,xxx' } }, // 非文本块不动
    ]);
    expect(message.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('多个文本块命中时后者覆盖前者', () => {
    const message: SendingMessage = {
      role: 'user',
      content: [
        { type: 'text', text: '<Cache_control>type: first</Cache_control>' },
        { type: 'text', text: '<Cache_control>type: second</Cache_control>' },
      ],
    };
    processMessage(message);
    expect(message.cache_control).toEqual({ type: 'second' }); // 跨块覆盖
  });
});

// ═══════════════════════════════════════════
//  processChat
// ═══════════════════════════════════════════

describe('processChat', () => {
  it('遍历处理所有消息并汇总警告', () => {
    const chat: SendingMessage[] = [
      { role: 'system', content: '<Cache_control>type: ephemeral</Cache_control>系统' },
      { role: 'user', content: '普通消息' },
      { role: 'user', content: '<Cache_control>[broken: {{{</Cache_control>用户' },
    ];
    const errors = processChat(chat);
    expect(chat[0]?.cache_control).toEqual({ type: 'ephemeral' }); // 第一条生效
    expect('cache_control' in (chat[1] ?? {})).toBe(false); // 第二条不动
    expect('cache_control' in (chat[2] ?? {})).toBe(false); // 第三条解析失败不追加
    expect(chat[2]?.content).toBe('用户'); // 但失败块仍被剥离
    expect(errors).toHaveLength(1); // 汇总一条警告
  });
});
