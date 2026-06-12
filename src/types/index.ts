/* index.ts - 业务类型定义
 *
 * - host.d.ts
 * - ../modules/scanner.ts
 * - ../modules/interceptor.ts
 */

// ═══════════════════════════════════════════
//  发送消息结构
// ═══════════════════════════════════════════

/** 消息 content 数组中的文本块 */
export interface TextContentPart {
  type: 'text'; // 块类型标识
  text: string; // 文本内容
  [key: string]: unknown; // 允许携带其他自定义键
}

/** 消息 content 数组中的任意块（文本、图片等） */
export type ContentPart = TextContentPart | { type: string; [key: string]: unknown };

/**
 * 发送给 LLM 的单条消息
 *
 * 对应 CHAT_COMPLETION_PROMPT_READY 事件 chat 数组的元素结构
 * （SillyTavern openai.js getChat() 的产物）。
 */
export interface SendingMessage {
  role: string; // 消息角色（system / user / assistant / tool）
  content: string | ContentPart[]; // 消息内容（纯文本或多模态块数组）
  cache_control?: unknown; // 本脚本双挂之一：消息级缓存键（另一份在命中的 text block 内）
  [key: string]: unknown; // 其余原生键（name / tool_calls 等）原样保留
}

// ═══════════════════════════════════════════
//  扫描结果
// ═══════════════════════════════════════════

/** 单段文本的标记块扫描结果 */
export interface ScanResult {
  cleanedText: string; // 剥离所有标记块后的文本
  cacheControl: unknown; // 解析出的 cache_control 对象（undefined 表示未命中或无有效值）
  errors: string[]; // 扫描过程中产生的警告信息（YAML 解析失败、空块等）
}
