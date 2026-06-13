# Cache4Chat

一个基于[酒馆助手（JS-Slash-Runner）](https://github.com/N0VI028/JS-Slash-Runner)运行的 SillyTavern 脚本：
在提示词中**声明式**启用 Anthropic API 格式的 Prompt Caching（`cache_control`），
无需修改 SillyTavern 服务器配置，缓存断点跟着预设走。

## 安装

1. 从 [Releases](https://github.com/QinZhengqing/Cache4Chat/releases) 页面下载 `Cache4Chat-TavernHelper-Script.json`；
2. 在酒馆助手（JS-Slash-Runner）的脚本库中**导入**该文件并启用；
3. 控制台出现 `[Cache4Chat] v1.0.0 loaded` 即加载成功。

开发者也可从源码构建：`npm install && npm run build`，产物为 `dist/bundle.js`。

## 适用范围

| API 来源                         | 是否支持 | 说明                                                                         |
| -------------------------------- | -------- | ---------------------------------------------------------------------------- |
| Custom（OpenAI 兼容端点 / 反代） | ✅       | SillyTavern 后端原样透传 messages                                            |
| OpenRouter                       | ✅       | 原生支持消息级 `cache_control`                                               |
| Claude 直连源                    | ❌       | ST 后端转换器会丢弃自定义键，请改用 `config.yaml` 的 `claude.cachingAtDepth` |

注意：开启**任何** Prompt Post-Processing（提示词后处理）选项都会导致消息被后端
压平重建，`cache_control` 键随之丢失。使用本脚本时请保持该选项为 None。

## 使用方法

在提示词的任意位置（预设、角色卡、世界书条目、聊天消息等）写入标记块：

```text
<Cache_control>
type: ephemeral
ttl: 1h #或者5m
</Cache_control>
```

发送消息时，脚本会在提示词组装完毕、发往后端之前自动：

1. **剥离**标记块本身——模型永远不会看到 `<Cache_control>` 字样；
2. 将块内的 YAML 内容**转换**为 JSON 对象；
3. 把该对象作为 `cache_control` 键**双挂**写入：一份写在命中的文本块内
   （`content[]` 内的 `text` block，Anthropic 官方位置），一份写在消息对象上
   （与 `content` 同层，OpenRouter 方言），由下游各取所需。

### 转化示例

酒馆组装出的原始消息：

```json
{
  "role": "system",
  "content": "你是一个温柔的森林守护者……（大段角色设定）\n<Cache_control>\ntype: ephemeral\nttl: 1h\n</Cache_control>"
}
```

脚本处理后实际发出的消息：

```json
{
  "role": "system",
  "content": [
    {
      "type": "text",
      "text": "你是一个温柔的森林守护者……（大段角色设定）\n",
      "cache_control": { "type": "ephemeral", "ttl": "1h" }
    }
  ],
  "cache_control": { "type": "ephemeral", "ttl": "1h" }
}
```
注意：若酒馆启用了任何提示词后处理，即使只是合并相同发言人消息，也会导致content内缓存字段被删除。

### 块内容写什么

块内写什么键值对，就原样转成什么 JSON。脚本不校验、不解释语义，
具体含义由你的 API 端点决定。例如 Anthropic 格式常用：

```text
<Cache_control>
type: ephemeral
</Cache_control>
```

对应写入 `"cache_control": { "type": "ephemeral" }`（文本块内与消息层各一份）。

## 行为细则

- **标签大小写不敏感**：`<cache_control>`、`<CACHE_CONTROL>` 均可识别。
- **多个标记块**：同一条消息出现多个块时，全部剥离，取**最后一个解析成功**的块生效
  （解析失败的块不会覆盖之前成功的值）。
- **双挂写入**：`cache_control` 同时写在两个位置——命中的文本块内
  （Anthropic 官方位置）与消息对象上（OpenRouter 方言），由下游各取所需；
  纯文本消息命中时 content 会升格为单元素 text block 数组。
- **多模态消息**：消息内容为多段（文本 + 图片）时，只扫描文本段，图片不受影响；
  每个命中的文本段独立写入块内键，消息层取最后命中的值。
- **容错**：块内 YAML 语法错误或块为空时，块**照样被剥离**（保证脏文本不发给模型），
  但不追加键，并通过右上角 toast 弹出警告。
- **dryRun 跳过**：token 预估、提示词预览等场景（dryRun）不做任何处理，
  所以在酒馆界面预览提示词时仍能看到标记块，属正常现象。
- **无标记消息不受影响**：没有写标记块的消息完全不会被修改，其余原生键
  （`name`、`tool_calls` 等）也原样保留。

## 工作原理

脚本监听酒馆的 `CHAT_COMPLETION_PROMPT_READY` 事件——该事件在提示词最终组装完毕、
发往后端之前触发，事件携带的消息数组就是即将发出的请求体。脚本对其就地修改后，
SillyTavern 后端（Custom 源）会将 messages 原样透传给下游 OpenAI 兼容端点。
