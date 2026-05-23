import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  saveConversation,
  getRecentConversations,
  getActiveContext,
  buildContextPrompt,
  shouldExtract,
  extractFacts,
  dismissFact,
  updateFact,
} from '../utils/aiMemory';

const router = Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    taskCount?: number;
    inProgressCount?: number;
    overdueCount?: number;
    projectCount?: number;
    userCount?: number;
    recentTasks?: string[];
    recentProjects?: string[];
  };
}

function buildSystemPrompt(ctx: ChatRequest['context'], memoryPrompt: string): string {
  const c = ctx || {};
  let prompt = `你是「统御」团队管理系统的 AI 助手，同时也是「陈总」—— 一位拥有 15 年团队管理经验的综合性管理者。

你的背景：
- 从一线销售做起，历任销售经理、区域总监，最终担任 VP of Sales，横跨售前、交付、客户成功多个职能
- 带过从 5 人到 200 人的团队，深谙不同规模团队的管理痛点
- 精通项目管理全流程：目标拆解、里程碑规划、风险识别、资源调配、复盘总结
- 擅长用数据说话，也懂得关注人的状态——知道什么时候该推一把，什么时候该缓一缓
- 风格：直击要害、务实接地气，不说正确的废话，给出的建议能落地执行

当前团队数据：
- 总任务数：${c.taskCount ?? '未知'}
- 进行中任务：${c.inProgressCount ?? '未知'}
- 逾期任务：${c.overdueCount ?? '未知'}
- 项目数：${c.projectCount ?? '未知'}
- 团队成员：${c.userCount ?? '未知'} 人
`;

  if (c.recentTasks && c.recentTasks.length > 0) {
    prompt += '\n近期任务：\n' + c.recentTasks.map(t => `- ${t}`).join('\n');
  }
  if (c.recentProjects && c.recentProjects.length > 0) {
    prompt += '\n近期项目：\n' + c.recentProjects.map(p => `- ${p}`).join('\n');
  }

  // Inject team memory
  if (memoryPrompt) {
    prompt += memoryPrompt;
  }

  prompt += `
回复格式要求（严格执行）：
1. 如果「团队记忆」中有相关信息，必须在分析中明确引用
2. 涉及任务列表、项目状态、风险项、人员负载等需要对比或追踪的信息时，必须用结构化的方式呈现：
   - 用「## 标题」分模块（如：## 项目风险、## 本周重点关注、## 人员负载）
   - 任务/项目用「- **任务名**（负责人，进度X%）—— 状态说明」的格式逐条列出
   - 逾期或高风险项前面加 ⚠️ 标记
3. 每条任务/项目后面紧跟一句可执行的下一步动作，用引用块格式：> 💡 建议：xxx
4. 结构化部分写完后再用 1-2 句话总结
5. 如果是打招呼或闲聊，可以纯口语`;

  return prompt;
}

// ─── POST /chat ───

router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { message, context, sessionId: clientSessionId } = req.body as ChatRequest;

  if (!message) {
    res.status(400).json({ success: false, message: '请输入消息' });
    return;
  }

  const userId = req.user?.id || "";
  const sessionId = clientSessionId || `session-${userId}-${Date.now()}`;

  // 1. Save user message
  saveConversation(userId, 'user', message, sessionId);

  // 2. Get active context and build memory prompt
  const memoryPrompt = buildContextPrompt(userId);

  // 3. Check if extraction should be triggered by this message
  const triggerExtraction = shouldExtract(sessionId, message);

  // 4. Build system prompt with memory
  const systemPrompt = buildSystemPrompt(context, memoryPrompt);

  // 如果没有配置 API key，使用增强版规则引擎
  if (!OPENAI_API_KEY) {
    const reply = generateSmartResponse(message, context, memoryPrompt);
    saveConversation(userId, 'ai', reply, sessionId);
    res.json({
      success: true,
      data: {
        reply,
        model: 'rule-engine',
        sessionId,
        memoryFacts: getActiveContext(userId).length,
      },
    });
    return;
  }

  try {
    // 5. Get recent conversations for context
    const recentConvos = getRecentConversations(userId, sessionId, 8);
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];
    for (const c of recentConvos) {
      messages.push({ role: c.role === 'ai' ? 'assistant' : 'user', content: c.content });
    }

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', response.status, errText);
      const reply = generateSmartResponse(message, context, memoryPrompt);
      saveConversation(userId, 'ai', reply, sessionId);
      res.json({
        success: true,
        data: {
          reply,
          model: 'rule-engine (fallback)',
          sessionId,
          memoryFacts: getActiveContext(userId).length,
        },
      });
      return;
    }

    const result = await response.json() as any;
    const reply = result.choices?.[0]?.message?.content || '抱歉，AI 暂时无法回复，请稍后再试。';

    // 6. Save AI response
    saveConversation(userId, 'ai', reply, sessionId);

    // 7. Trigger fact extraction if needed (fire and forget)
    let extractedFacts = 0;
    if (triggerExtraction && OPENAI_API_KEY) {
      extractFacts(userId, sessionId, OPENAI_API_KEY, OPENAI_BASE_URL, AI_MODEL)
        .then((r) => {
          if (r.extracted > 0) {
            console.log(`Extracted ${r.extracted} new facts for user ${userId}`);
          }
        })
        .catch((e) => console.error('Extraction error:', e));
    }

    res.json({
      success: true,
      data: {
        reply,
        model: AI_MODEL,
        sessionId,
        memoryFacts: getActiveContext(userId).length,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    const reply = generateSmartResponse(message, context, memoryPrompt);
    saveConversation(userId, 'ai', reply, sessionId);
    res.json({
      success: true,
      data: {
        reply,
        model: 'rule-engine (fallback)',
        sessionId,
        memoryFacts: getActiveContext(userId).length,
      },
    });
  }
});

// ─── GET /context — 获取活跃的团队记忆 ───

router.get('/context', authMiddleware, async (req: AuthRequest, res: Response) => {
  const facts = getActiveContext(req.user?.id || "");
  res.json({ success: true, data: facts });
});

// ─── DELETE /context/:id — 忽略某个记忆 ───

router.delete('/context/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const factId = parseInt(req.params.id, 10);
  if (isNaN(factId)) {
    res.status(400).json({ success: false, message: '无效的 ID' });
    return;
  }
  dismissFact(factId);
  res.json({ success: true, message: '已忽略' });
});

// ─── PATCH /context/:id — 更新某个记忆 ───

router.patch('/context/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const factId = parseInt(req.params.id, 10);
  if (isNaN(factId)) {
    res.status(400).json({ success: false, message: '无效的 ID' });
    return;
  }
  updateFact(factId, req.body);
  res.json({ success: true, message: '已更新' });
});

// ─── Rule Engine (fallback) ───

function generateSmartResponse(message: string, context?: ChatRequest['context'], memoryPrompt?: string): string {
  const text = message.toLowerCase();
  const ctx = context || {};

  // 如果用户说"记住"类指令，在规则引擎中也给反馈
  if (text.includes('记住') || text.includes('记一下') || text.includes('记着')) {
    const info = message.replace(/记住|记一下|记着|别忘了/gi, '').trim();
    return `✅ 已记录：**${info || '你提到的信息'}**\n\n这条信息会在后续的分析中被考虑进去。你可以随时在「团队记忆」面板中查看和管理。\n\n> 💡 有了这份上下文，未来关于任务分配、资源调配的建议会更加精准。`;
  }

  // 项目进度/风险
  if (text.includes('进度') || text.includes('风险') || text.includes('滞后') || text.includes('延期')) {
    const pc = ctx.projectCount ?? 0;
    if (pc === 0) return '📊 当前系统暂无项目数据。请先在飞书或项目管理中创建项目。\n\n> 💡 建议：先建立项目框架，明确里程碑和负责人。';
    const overdueStr = ctx.overdueCount && ctx.overdueCount > 0
      ? `\n\n⚠️ 有 ${ctx.overdueCount} 项任务已逾期，需要重点关注。`
      : '\n\n✅ 当前无逾期任务，项目进度总体健康。';
    return `## 📊 项目状态\n\n- **总项目** ${pc} 个 | **任务** ${ctx.taskCount ?? 0} 项 | **进行中** ${ctx.inProgressCount ?? 0} 项${overdueStr}\n\n### 行动建议\n> 💡 识别关键路径瓶颈，优先疏通卡点\n> 💡 高风险项目每日同步一次进展\n> 💡 检查跨项目资源是否存在冲突\n${memoryPrompt ? '\n> 💡 已参考团队记忆中的信息进行分析' : ''}`;
  }

  // 人员/效率
  if (text.includes('谁') || text.includes('人员') || text.includes('效率') || text.includes('忙') || text.includes('负载')) {
    const uc = ctx.userCount ?? 0;
    const tc = ctx.taskCount ?? 0;
    if (uc === 0) return '👥 当前团队暂无成员数据。请在员工管理中添加团队成员。';
    const avg = (tc / uc).toFixed(1);
    return `## 👥 团队负载\n\n- **团队规模** ${uc} 人 | **总任务** ${tc} 项 | **人均** ${avg} 项\n- **进行中** ${ctx.inProgressCount ?? 0} 项（占比 ${tc > 0 ? ((ctx.inProgressCount ?? 0) / tc * 100).toFixed(0) : 0}%）\n- ⚠️ **逾期** ${ctx.overdueCount ?? 0} 项\n\n### 行动建议\n> 💡 负载超人均 1.5 倍的成员需要重点关注\n> 💡 逾期任务立即指定责任人和截止时间\n> 💡 考虑将低负载成员调配到瓶颈项目\n${memoryPrompt ? '\n> 💡 已参考团队记忆中的信息进行分析' : ''}`;
  }

  // 任务 / 今日
  if (text.includes('任务') || text.includes('今日') || text.includes('待办') || text.includes('todo')) {
    const tc = ctx.taskCount ?? 0;
    if (tc === 0) return '📋 当前系统暂无任务。请在任务中心创建任务。';
    return `## 📋 任务概览\n\n- **总计** ${tc} 项 | **进行中** ${ctx.inProgressCount ?? 0} | ⚠️ **逾期** ${ctx.overdueCount ?? 0}\n\n### 优先级排序\n1. 逾期任务 —— 今天必须出方案\n2. 高优进行中 —— 确认无阻滞\n3. 待启动 —— 排期是否合理？\n\n### 行动建议\n> 💡 每日站会过一遍进行中任务的阻滞点\n> 💡 逾期超过 3 天的升级给上级\n${memoryPrompt ? '\n> 💡 已参考团队记忆中的信息进行分析' : ''}`;
  }

  // 周报/日报
  if (text.includes('周报') || text.includes('日报') || text.includes('报告') || text.includes('总结')) {
    return `## 📊 本周总结\n\n| 指标 | 数据 |\n|------|------|\n| 任务 | ${ctx.taskCount ?? 0} 项（进行中 ${ctx.inProgressCount ?? 0}） |\n| 项目 | ${ctx.projectCount ?? 0} 个 |\n| 团队 | ${ctx.userCount ?? 0} 人 |\n| 逾期 | ${ctx.overdueCount ?? 0} 项 |\n\n${ctx.overdueCount && ctx.overdueCount > 0 ? '⚠️ ' + ctx.overdueCount + ' 项逾期，需本周内闭环' : '✅ 节奏正常'}\n\n> 💡 完整周报前往报表页面查看`;
  }

  // 建议/优化
  if (text.includes('建议') || text.includes('优化') || text.includes('怎么做') || text.includes('如何')) {
    const parts: string[] = [];
    if ((ctx.overdueCount ?? 0) > 0) parts.push(`> 💡 立即处理 ${ctx.overdueCount} 项逾期任务，防止影响扩大`);
    if ((ctx.inProgressCount ?? 0) > (ctx.userCount ?? 0) * 3) parts.push('> 💡 团队负载偏高，建议评估任务优先级');
    if ((ctx.projectCount ?? 0) === 0) parts.push('> 💡 建议启动新的季度目标规划');
    if (parts.length === 0) parts.push('> 💡 团队当前运行良好，继续保持节奏');
    return `## 💡 管理建议\n\n> 基于 ${ctx.taskCount ?? 0} 任务 / ${ctx.projectCount ?? 0} 项目 / ${ctx.userCount ?? 0} 人\n\n${parts.join('\n')}\n${memoryPrompt ? '\n> 💡 已参考团队记忆中的信息进行分析' : ''}`;
  }

  // 默认
  let defaultReply = `👋 你好，我是陈总，在这个团队里待了些年头了。\n\n先看下咱们的家底：${ctx.taskCount ?? 0} 项任务、${ctx.projectCount ?? 0} 个项目、${ctx.userCount ?? 0} 个兄弟。`;
  if (memoryPrompt) {
    defaultReply += '\n\n我记着你之前说过的一些事，都在心里。有啥想聊的？项目上的困难、人手安排、还是想听听我的判断？直接说。';
  } else {
    defaultReply += '\n\n有啥想聊的？项目上的困难、人手安排、还是想听听我的判断？直接说。';
  }
  return defaultReply;
}

export default router;
