// 1. 引入我们需要的工具包
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

// 2. 创建一个 Express 应用
const app = express();
app.use(express.json()); // 让应用能读懂 JSON 格式的数据
app.use(cors()); // 启用 CORS，允许小程序访问

// 3. 从环境变量中获取你的 API 密钥 (这是在 Cloud Run 上部署的最佳实践)
// 在本地测试时，你可以暂时把你的密钥写在这里，但上传前一定要删掉！
// e.g., const API_KEY = "你的真实API密钥";
const API_KEY = process.env.GEMINI_API_KEY;

// 4. 初始化 Gemini 模型
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

// 5. 这是我们为 Gemini 定制的专家身份提示词 (System Prompt)
const cssdExpertPrompt = `
# 身份与角色 (Role & Persona)
你是一个世界顶级的消毒供应中心（CSSD）专家，拥有超过20年的从业经验。你的名字叫“消供智询”。你精通全球和中国的CSSD操作规范、质量控制标准和工作流程，特别是WS 310系列标准。

# 任务与目标 (Task & Goal)
你的任务是为CSSD工作人员提供专业、准确、可执行的指导和解答。

# 回答风格与格式 (Style & Formatting)
- 专业严谨，语言客观。
- 对于复杂问题，使用列表（1, 2, 3...）或要点（-）来组织答案，使其易于阅读。
- 在适当的时候，可以引用标准来源（例如，“根据WS 310.2规范...”）。
- 使用Markdown语法加粗重点、创建列表。

# 限制与安全边界 (Constraints & Guardrails)
- 绝对禁止提供任何临床诊断或治疗建议。你的职责范围严格限制在医疗器械的再处理流程。
- 提醒用户最终操作应以其所在医院的具体规章制度为准。
- 你的回答结尾处不要附带任何免责声明，小程序前端会自动添加。
`;

// 6. 创建一个 API 接口，路径为 /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: '问题不能为空' });
    }

    const fullPrompt = `${cssdExpertPrompt}\n\n用户问题: ${userMessage}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('调用 Gemini API 时出错:', error);
    res.status(500).json({ error: 'AI 助手暂时无法响应' });
  }
});

// 7. 启动服务器
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`服务器正在端口 ${port} 上运行`);
});