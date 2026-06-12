/**
 * Vitest 全局 setup
 *
 * 模拟酒馆助手 iframe 环境注入的全局变量，
 * 使依赖全局对象的模块在测试中能正常运行。
 */
import * as YAML from 'yaml';
import { z } from 'zod';

// ═══════════════════════════════════════════
//  注入宿主全局模拟
// ═══════════════════════════════════════════

// Zod（模拟酒馆助手 predefine.js 的行为）
(globalThis as Record<string, unknown>)['z'] = z;

// YAML（模拟酒馆助手 predefine.js 注入的 npm `yaml` 包）
(globalThis as Record<string, unknown>)['YAML'] = YAML;

// toastr（静默 mock）
(globalThis as Record<string, unknown>)['toastr'] = {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
};

// 事件系统（最小 mock）
(globalThis as Record<string, unknown>)['eventOn'] = () => ({ stop: () => {} });
(globalThis as Record<string, unknown>)['eventOnce'] = () => ({ stop: () => {} });
(globalThis as Record<string, unknown>)['eventEmit'] = async () => {};
(globalThis as Record<string, unknown>)['eventClearAll'] = () => {};
(globalThis as Record<string, unknown>)['eventRemoveListener'] = () => {};

// 变量系统（最小 mock）
(globalThis as Record<string, unknown>)['getVariables'] = () => ({});
(globalThis as Record<string, unknown>)['getAllVariables'] = () => ({});
(globalThis as Record<string, unknown>)['replaceVariables'] = () => {};

// 酒馆事件枚举（常用子集）
(globalThis as Record<string, unknown>)['tavern_events'] = {
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_SWIPED: 'message_swiped',
  CHAT_CHANGED: 'chat_id_changed',
  GENERATION_STARTED: 'generation_started',
  GENERATION_ENDED: 'generation_ended',
  CHAT_COMPLETION_PROMPT_READY: 'chat_completion_prompt_ready', // 本项目核心拦截点
  CHAT_COMPLETION_SETTINGS_READY: 'chat_completion_settings_ready', // generate_data 组装完成
};

// iframe 事件枚举
(globalThis as Record<string, unknown>)['iframe_events'] = {
  GENERATION_STARTED: 'js_generation_started',
  STREAM_TOKEN_RECEIVED_FULLY: 'js_stream_token_received_fully',
  STREAM_TOKEN_RECEIVED_INCREMENTALLY: 'js_stream_token_received_incrementally',
  GENERATION_ENDED: 'js_generation_ended',
};
