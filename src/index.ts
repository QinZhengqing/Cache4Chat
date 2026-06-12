/* index.ts - 脚本入口
 *
 * - modules/interceptor.ts
 * - types/host.d.ts
 * - types/index.ts
 */

import { registerInterceptor } from './modules/interceptor.ts';
import { DISPLAY_VERSION } from './version.ts';

/**
 * 脚本初始化：注册提示词拦截监听
 */
function init(): void {
  registerInterceptor(); // 挂接 CHAT_COMPLETION_PROMPT_READY
  console.log(`[Cache4Chat] ${DISPLAY_VERSION} loaded`);
}

init();
