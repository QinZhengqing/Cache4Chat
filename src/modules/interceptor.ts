/* interceptor.ts - 事件监听与消息修改
 *
 * - scanner.ts
 * - ../types/index.ts
 * - ../types/host.d.ts（宿主全局 eventOn / tavern_events / toastr）
 */

import type { ContentPart, SendingMessage, TextContentPart } from '../types/index.ts';

import { hasMarker, scanText } from './scanner.ts';

// ═══════════════════════════════════════════
//  消息处理
// ═══════════════════════════════════════════

/**
 * 判断 content 块是否为文本块
 *
 * @param part - 待判断的 content 块
 * @returns 文本块时返回 true（类型收窄为 TextContentPart）
 */
function isTextPart(part: ContentPart): part is TextContentPart {
  return part.type === 'text' && typeof part['text'] === 'string';
}

/**
 * 处理单条消息：扫描并剥离标记块，追加 cache_control 键
 *
 * 就地修改消息对象。content 为字符串时直接扫描；为数组时仅扫描其中的
 * 文本块。同一消息命中多个标记块时，后者覆盖前者（与 scanner 行为一致，
 * 跨 content 块时按块顺序覆盖）。
 *
 * @param message - 待处理的消息对象（来自 chat 数组）
 * @returns 本条消息产生的警告信息列表
 */
export function processMessage(message: SendingMessage): string[] {
  const errors: string[] = []; // 本条消息的警告收集
  let cacheControl: unknown; // 本条消息最终生效的 cache_control 值

  if (typeof message.content === 'string') {
    // ---- 纯文本消息 ----
    if (!hasMarker(message.content)) {
      return errors; // 无标记：短路返回
    }
    const result = scanText(message.content); // 扫描并剥离
    cacheControl = result.cacheControl;
    errors.push(...result.errors);
    if (cacheControl !== undefined) {
      // 双挂之一：将 content 升格为数组，把 cache_control 写进文本元素内
      // （Anthropic 官方位置，OpenAI→Anthropic 转换器按元素映射时更可能保留）
      message.content = [{ type: 'text', text: result.cleanedText, cache_control: cacheControl }];
    } else {
      message.content = result.cleanedText; // 未取到值：仅写回剥离后的文本
    }
  } else if (Array.isArray(message.content)) {
    // ---- 多模态消息：仅处理文本块 ----
    for (const part of message.content) {
      if (!isTextPart(part) || !hasMarker(part.text)) {
        continue; // 非文本块或无标记：跳过
      }
      const result = scanText(part.text); // 扫描并剥离
      part.text = result.cleanedText; // 写回剥离后的文本
      if (result.cacheControl !== undefined) {
        cacheControl = result.cacheControl; // 跨块时后者覆盖前者
        part['cache_control'] = result.cacheControl; // 双挂之一：写进命中的文本元素内
      }
      errors.push(...result.errors);
    }
  }

  if (cacheControl !== undefined) {
    message.cache_control = cacheControl; // 双挂之二：消息对象上保留（OpenRouter 方言）
  }

  return errors;
}

/**
 * 处理整个 chat 数组：遍历所有消息并就地修改
 *
 * @param chat - CHAT_COMPLETION_PROMPT_READY 事件携带的消息数组
 * @returns 所有消息累计的警告信息列表
 */
export function processChat(chat: SendingMessage[]): string[] {
  return chat.flatMap((message) => processMessage(message)); // 逐条处理并汇总警告
}

// ═══════════════════════════════════════════
//  事件挂接
// ═══════════════════════════════════════════

/**
 * 注册 CHAT_COMPLETION_PROMPT_READY 事件监听
 *
 * dryRun（token 预估等场景）时跳过处理；产生警告时通过 toastr 提示用户。
 *
 * @returns 监听句柄（含 stop 方法，可用于解除监听）
 */
export function registerInterceptor(): EventOnReturn {
  return eventOn(tavern_events.CHAT_COMPLETION_PROMPT_READY, (...args: unknown[]) => {
    const eventData = args[0] as { chat: SendingMessage[]; dryRun: boolean } | undefined;

    if (!eventData || eventData.dryRun || !Array.isArray(eventData.chat)) {
      return; // dryRun 或数据异常：不处理
    }

    const errors = processChat(eventData.chat); // 就地修改 chat 数组
    for (const error of errors) {
      toastr.warning(error, 'Cache4Chat'); // 逐条提示警告（YAML 解析失败等）
    }
  });
}
