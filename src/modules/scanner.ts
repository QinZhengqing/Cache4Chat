/* scanner.ts - 标记块扫描与剥离
 *
 * - ../types/index.ts
 * - ../types/host.d.ts（宿主全局 YAML）
 */

import type { ScanResult } from '../types/index.ts';

// ═══════════════════════════════════════════
//  常量
// ═══════════════════════════════════════════

/**
 * 标记块匹配正则
 *
 * - 标签名大小写不敏感（i 标志）
 * - 惰性匹配块体（[\s\S]*?），支持跨行
 * - 全局匹配（g 标志），一段文本中可命中多个块
 */
const MARKER_PATTERN = /<cache_control>([\s\S]*?)<\/cache_control>/gi;

// ═══════════════════════════════════════════
//  扫描函数
// ═══════════════════════════════════════════

/**
 * 扫描文本中的 `<Cache_control>` 标记块
 *
 * 剥离所有标记块（含标签本身），将块内文本用宿主 YAML 解析为对象。
 * 同一段文本出现多个块时全部剥离，解析成功的后者覆盖前者（取最后一个有效值）。
 * 解析失败或块体为空的块仅剥离不取值，并记录警告信息。
 *
 * @param text - 待扫描的原始文本
 * @returns 扫描结果（剥离后的文本、解析出的 cache_control 值、警告列表）
 */
export function scanText(text: string): ScanResult {
  let cacheControl: unknown; // 最终生效的 cache_control 值（后者覆盖前者）
  const errors: string[] = []; // 警告信息收集

  // 替换所有命中的标记块为空串，同时逐块尝试解析
  const cleanedText = text.replace(MARKER_PATTERN, (_match, body: string) => {
    const trimmed = body.trim(); // 去除块体首尾空白后再解析

    if (trimmed === '') {
      errors.push('标记块内容为空，已剥离但未生效'); // 空块：仅剥离
      return '';
    }

    try {
      const parsed: unknown = YAML.parse(trimmed); // 宿主全局 YAML（npm yaml 包）
      if (parsed === null || parsed === undefined) {
        errors.push('标记块解析结果为空值，已剥离但未生效'); // YAML 解析出 null
      } else {
        cacheControl = parsed; // 解析成功：覆盖之前的值
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error); // 提取错误信息
      errors.push(`标记块 YAML 解析失败，已剥离但未生效：${reason}`);
    }

    return ''; // 无论解析成败，块本身都从文本中剥离
  });

  return { cleanedText, cacheControl, errors };
}

/**
 * 快速判断文本中是否存在标记块
 *
 * 用于在完整扫描前廉价短路，避免对无标记的消息做替换操作。
 *
 * @param text - 待检测的文本
 * @returns 存在标记块时返回 true
 */
export function hasMarker(text: string): boolean {
  MARKER_PATTERN.lastIndex = 0; // 重置全局正则游标，避免 test 的状态残留
  return MARKER_PATTERN.test(text);
}
