# Cache4Chat

一个基于[酒馆助手（JS-Slash-Runner）](https://github.com/N0VI028/JS-Slash-Runner)运行的 SillyTavern 脚本：
在提示词中**声明式**启用 Anthropic API 格式的 Prompt Caching（`cache_control`），
无需修改 SillyTavern 服务器配置，缓存断点跟着预设走。

## 工作方式

在提示词的任意位置（预设、角色卡、世界书条目、聊天消息等）写入标记块：

```
<Cache_control>
type: ephemeral
ttl: 1h #或者5m
</Cache_control>
```

发送消息时，脚本会在提示词组装完毕、发往后端之前：

1. **剥离**标记块本身——模型永远不会看到 `<Cache_control>` 字样；
2. 将块内的 YAML **转换**为 JSON 对象；
3. 把该对象作为 `cache_control` 键**双挂**写入：一份写在命中的文本块内
   （`content[]` 内的 `text` block，Anthropic 官方位置），一份写在消息对象上
   （与 `content` 同层，OpenRouter 方言），由下游各取所需。

```jsonc
// 转化前（酒馆组装的原始消息）
{
  "role": "system",
  "content": "……大段角色设定……\n<Cache_control>\ntype: ephemeral\nttl: 1h\n</Cache_control>"
}

// 转化后（实际发出的消息，字符串 content 升格为 text block）
{
  "role": "system",
  "content": [
    {
      "type": "text",
      "text": "……大段角色设定……\n",
      "cache_control": { "type": "ephemeral", "ttl": "1h" }
    }
  ],
  "cache_control": { "type": "ephemeral", "ttl": "1h" }
}
```
PS: 开启任何酒馆的提示词预处理都会导致块内Cache_control字段被清空
