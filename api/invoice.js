export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { invoiceData } = req.body;
  if (!invoiceData) return res.status(400).json({ error: 'Missing invoice data' });

  const { type, code, num, date, amount, tax, totalAmount, seller, sellerTax, goods, bizType, note } = invoiceData;

  const prompt = `请对以下发票信息进行专业的税务合规分析：

发票类型：${type}
发票代码：${code || '未提供'}
发票号码：${num || '未提供'}
开票日期：${date || '未提供'}
金额（不含税）：${amount || '0'} 元
税额：${tax || '0'} 元
合计金额：${totalAmount} 元
销售方名称：${seller || '未提供'}
销售方税号：${sellerTax || '未提供'}
货物或服务：${goods || '未提供'}
购买方企业类型：${bizType}
补充说明：${note || '无'}

请从以下几个维度分析：
1. 该发票是否可以用于抵扣增值税进项税额？说明原因
2. 该发票能否税前扣除？
3. 是否存在合规风险？（如：金额异常、税号格式、开票日期等）
4. 具体操作建议

最后给出总体评估：合规（ok）/ 需注意（warn）/ 存在风险（error），格式：【总体评估：合规/需注意/存在风险】`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: '你是 TaxMind，中国税务专家，专注于发票合规分析。请给出准确、专业、实用的分析。',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: '服务器错误，请稍后重试' } });
  }
}
