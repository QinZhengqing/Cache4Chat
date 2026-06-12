/* host.d.ts - 宿主全局 API 类型声明
 *
 * 声明由酒馆助手（JS-Slash-Runner）注入到 iframe window 上的全局对象和函数。
 * 运行时由宿主 predefine.js 提供，此处仅供 TypeScript 类型检查使用。
 */

import type { z as ZodNamespace } from 'zod';

// ═══════════════════════════════════════════
//  宿主注入的全局库
// ═══════════════════════════════════════════

declare global {
  /** Zod 运行时校验库（v4，由酒馆助手注入） */
  const z: typeof ZodNamespace;

  /** YAML 解析库（npm `yaml` 包，由酒馆助手注入） */
  const YAML: {
    parse(input: string, options?: unknown): unknown;
    stringify(value: unknown, options?: unknown): string;
  };

  /** lodash（由 SillyTavern 宿主注入） */
  const _: typeof import('lodash');

  /** jQuery（由 SillyTavern 宿主注入） */
  const $: JQueryStatic;

  /** Toast 通知库（由 SillyTavern 宿主注入） */
  const toastr: {
    success(message: string, title?: string, options?: unknown): void;
    error(message: string, title?: string, options?: unknown): void;
    warning(message: string, title?: string, options?: unknown): void;
    info(message: string, title?: string, options?: unknown): void;
  };

  /** Markdown 转 HTML（由 SillyTavern 宿主注入） */
  const showdown: unknown;
}

// ═══════════════════════════════════════════
//  事件系统
// ═══════════════════════════════════════════

declare global {
  /** 事件监听返回值 */
  interface EventOnReturn {
    stop: () => void;
  }

  /** 注册事件监听 */
  function eventOn(eventType: string, listener: (...args: unknown[]) => void): EventOnReturn;

  /** 注册为最后执行的监听 */
  function eventMakeLast(eventType: string, listener: (...args: unknown[]) => void): EventOnReturn;

  /** 注册为最先执行的监听 */
  function eventMakeFirst(eventType: string, listener: (...args: unknown[]) => void): EventOnReturn;

  /** 一次性监听 */
  function eventOnce(eventType: string, listener: (...args: unknown[]) => void): EventOnReturn;

  /** 广播事件 */
  function eventEmit(eventType: string, ...data: unknown[]): Promise<void>;

  /** 广播事件并等待 */
  function eventEmitAndWait(eventType: string, ...data: unknown[]): void;

  /** 移除指定监听 */
  function eventRemoveListener(eventType: string, listener: (...args: unknown[]) => void): void;

  /** 清除事件的所有监听 */
  function eventClearEvent(eventType: string): void;

  /** 清除监听函数的所有注册 */
  function eventClearListener(listener: (...args: unknown[]) => void): void;

  /** 清除本 iframe 所有监听 */
  function eventClearAll(): void;

  /** 酒馆事件枚举 */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- 名称由宿主 predefine.js 决定
  const tavern_events: {
    readonly APP_READY: 'app_ready';
    readonly MESSAGE_SWIPED: 'message_swiped';
    readonly MESSAGE_SENT: 'message_sent';
    readonly MESSAGE_RECEIVED: 'message_received';
    readonly MESSAGE_EDITED: 'message_edited';
    readonly MESSAGE_DELETED: 'message_deleted';
    readonly MESSAGE_UPDATED: 'message_updated';
    readonly CHAT_CHANGED: 'chat_id_changed';
    readonly GENERATION_STARTED: 'generation_started';
    readonly GENERATION_STOPPED: 'generation_stopped';
    readonly GENERATION_ENDED: 'generation_ended';
    readonly WORLDINFO_ENTRIES_LOADED: 'worldinfo_entries_loaded';
    readonly CHARACTER_MESSAGE_RENDERED: 'character_message_rendered';
    readonly USER_MESSAGE_RENDERED: 'user_message_rendered';
    readonly CHAT_COMPLETION_PROMPT_READY: 'chat_completion_prompt_ready';
    readonly CHAT_COMPLETION_SETTINGS_READY: 'chat_completion_settings_ready';
    readonly [key: string]: string;
  };

  /** iframe 事件枚举 */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- 名称由宿主 predefine.js 决定
  const iframe_events: {
    readonly GENERATION_STARTED: 'js_generation_started';
    readonly STREAM_TOKEN_RECEIVED_FULLY: 'js_stream_token_received_fully';
    readonly STREAM_TOKEN_RECEIVED_INCREMENTALLY: 'js_stream_token_received_incrementally';
    readonly GENERATION_ENDED: 'js_generation_ended';
    readonly MESSAGE_IFRAME_RENDER_STARTED: 'message_iframe_render_started';
    readonly MESSAGE_IFRAME_RENDER_ENDED: 'message_iframe_render_ended';
  };
}

// ═══════════════════════════════════════════
//  变量系统
// ═══════════════════════════════════════════

declare global {
  /** 变量存储选项 */
  interface VariableOption {
    type: 'global' | 'chat' | 'character' | 'preset' | 'message' | 'script' | 'extension';
    message_id?: number | 'latest';
    script_id?: string;
    extension_id?: string;
  }

  /** 获取变量 */
  function getVariables(option?: VariableOption): Record<string, unknown>;

  /** 获取合并后的变量 */
  function getAllVariables(): Record<string, unknown>;

  /** 替换变量 */
  function replaceVariables(variables: Record<string, unknown>, option?: VariableOption): void;

  /** 函数式更新变量 */
  function updateVariablesWith(
    updater: (variables: Record<string, unknown>) => Record<string, unknown>,
    option?: VariableOption
  ): Record<string, unknown>;

  /** 插入或赋值变量 */
  function insertOrAssignVariables(
    variables: Record<string, unknown>,
    option?: VariableOption
  ): Record<string, unknown>;

  /** 仅插入变量 */
  function insertVariables(
    variables: Record<string, unknown>,
    option?: VariableOption
  ): Record<string, unknown>;

  /** 删除变量 */
  function deleteVariable(path: string, option?: VariableOption): void;

  /** 注册变量 Schema */
  function registerVariableSchema(schema: unknown, option?: { type?: string }): void;
}

// ═══════════════════════════════════════════
//  全局共享
// ═══════════════════════════════════════════

declare global {
  /** 初始化全局共享对象 */
  function initializeGlobal(name: string, value: unknown): void;

  /** 等待全局共享对象初始化 */
  function waitGlobalInitialized(name: string): Promise<unknown>;
}

// ═══════════════════════════════════════════
//  宏系统
// ═══════════════════════════════════════════

declare global {
  /** 注册文本宏 */
  function registerMacroLike(
    regex: RegExp,
    replaceFn: (
      context: { message_id?: number; role?: string },
      substring: string,
      ...args: unknown[]
    ) => string
  ): { unregister: () => void };

  /** 注销文本宏 */
  function unregisterMacroLike(regex: RegExp): void;

  /** 宏替换 */
  function substitudeMacros(text: string): Promise<string>;
}

// ═══════════════════════════════════════════
//  LLM 生成
// ═══════════════════════════════════════════

declare global {
  /** LLM 生成 */
  function generate(config: Record<string, unknown>): Promise<string>;

  /** LLM 原始生成 */
  function generateRaw(config: Record<string, unknown>): Promise<string>;
}

// ═══════════════════════════════════════════
//  脚本管理
// ═══════════════════════════════════════════

declare global {
  /** 脚本按钮 */
  interface ScriptButton {
    name: string;
    visible: boolean;
  }

  function getButtonEvent(buttonName: string): string;
  function getScriptButtons(): ScriptButton[];
  function replaceScriptButtons(buttons: ScriptButton[]): void;
  function updateScriptButtonsWith(
    updater: (buttons: ScriptButton[]) => ScriptButton[]
  ): ScriptButton[];
  function appendInexistentScriptButtons(buttons: ScriptButton[]): void;
  function getScriptName(): string;
  function getScriptInfo(): string;
  function replaceScriptInfo(info: string): void;
}

// ═══════════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════════

declare global {
  function triggerSlash(command: string): Promise<unknown>;
  function reloadIframe(): void;
  function getIframeName(): string;
  function getCurrentMessageId(): number;
  function getScriptId(): string;
  function getLastMessageId(): number;
  function getMessageId(iframeName: string): number;
  function errorCatched<T extends (...args: unknown[]) => unknown>(fn: T): T;
  function injectPrompts(
    prompts: unknown[],
    options?: Record<string, unknown>
  ): { uninject: () => void };
  function uninjectPrompts(ids: string[]): void;
}

// ═══════════════════════════════════════════
//  SillyTavern 上下文（常用子集）
// ═══════════════════════════════════════════

declare global {
  const SillyTavern: {
    readonly chat: Array<{
      name: string;
      is_user: boolean;
      is_system: boolean;
      mes: string;
      swipe_id?: number;
      swipes?: string[];
      variables?: Record<string, unknown>[] | { [swipeId: number]: Record<string, unknown> };
      extra?: Record<string, unknown>;
    }>;
    readonly characters: unknown[];
    readonly name1: string;
    readonly name2: string;
    readonly characterId: string;
    readonly chatId: string;
    readonly getCurrentChatId: () => string;
    readonly getRequestHeaders: () => Record<string, string>;
    readonly reloadCurrentChat: () => Promise<void>;
    readonly saveChat: () => Promise<void>;
    readonly chatMetadata: Record<string, unknown>;
    readonly callGenericPopup: (
      content: unknown,
      type: number,
      inputValue?: string,
      popupOptions?: Record<string, unknown>
    ) => Promise<number | string | boolean | undefined>;
    readonly POPUP_TYPE: {
      TEXT: number;
      CONFIRM: number;
      INPUT: number;
      DISPLAY: number;
    };
    readonly POPUP_RESULT: {
      AFFIRMATIVE: number;
      NEGATIVE: number;
      CANCELLED: number;
    };
    readonly getContext: () => typeof SillyTavern;
    readonly [key: string]: unknown;
  };
}

export {};
