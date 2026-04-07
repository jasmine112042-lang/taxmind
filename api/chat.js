export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  const SYSTEM_PROMPT = `你是 TaxMind，专为中国小微企业和个体工商户设计的专业税务 AI 顾问。

专业领域：
- 增值税（小规模/一般纳税人政策与申报流程）
- 企业所得税 / 个人所得税（经营所得）
- 印花税、城建税、教育附加等附加税费
- 发票管理（普票、专票、验真、认证、抵扣规则）
- 税收优惠政策（小微企业减免、个体户免税额度、各地优惠等）
- 季度/月度申报流程与截止日期
- 金税四期合规风险提示与规避建议

回答要求：
- 用清晰易懂的中文，遇到术语需简要解释
- 回答有条理，适当使用序号列出步骤或要点
- 数据和政策要准确，若有不确定请明确说明并建议核实
- 结尾适当提醒"具体以主管税务机关或官方政策为准"
- 语气专业、友好、简洁
- 回答长度适中，简单问题100-200字，复杂问题300-500字`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
      }),
    });
    const data = await response.json();
    if (data.error) {
      res.status(200).json({ error: data.error });
    } else {
      res.status(200).json({
        content: [{ type: 'text', text: data.choices?.[0]?.message?.content || '抱歉，未能获取回答。' }]
      });
    }
  } catch (err) {
    res.status(500).json({ error: { message: '服务器错误，请稍后重试' } });
  }
}
