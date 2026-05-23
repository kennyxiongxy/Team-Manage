import { queryAll, queryOne, run } from './db';

// ─── Types ───

export interface TeamContext {
  id: number;
  user_id: string;
  category: 'personnel' | 'project' | 'constraint' | 'preference' | 'decision';
  target_type: 'user' | 'project' | 'task' | 'team';
  target_id?: string;
  content: string;
  impact: string;
  confidence: number;
  status: 'active' | 'expired' | 'dismissed' | 'applied';
  expires_at?: string;
  source_session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AiConversation {
  id: number;
  user_id: string;
  role: 'system' | 'user' | 'ai';
  content: string;
  session_id: string;
  created_at: string;
}

// ─── Extraction Keyword Scoring ───

interface KeywordRule {
  keywords: string[];
  score: number;
  category: TeamContext['category'];
}

const EXTRACTION_RULES: KeywordRule[] = [
  // Personnel changes — highest importance
  {
    keywords: ['怀孕', '产假', '陪产假', '病假', '住院', '手术'],
    score: 4,
    category: 'personnel',
  },
  {
    keywords: ['离职', '辞职', '走人了', '不干了', 'last day'],
    score: 4,
    category: 'personnel',
  },
  {
    keywords: ['入职', '新人', '刚来', '报到', 'onboard'],
    score: 3,
    category: 'personnel',
  },
  {
    keywords: ['调岗', '换岗', '转到', '转岗', '换部门'],
    score: 3,
    category: 'personnel',
  },
  // Personnel soft signals
  {
    keywords: ['家里有事', '身体不好', '状态不好', '请假', '休假', '不在', '请假了'],
    score: 2,
    category: 'personnel',
  },
  // Project changes
  {
    keywords: ['延期', '推迟', 'delay', '交不了了', '来不及'],
    score: 2,
    category: 'project',
  },
  {
    keywords: ['搁置', '暂停', '停掉', '先不做'],
    score: 2,
    category: 'project',
  },
  {
    keywords: ['重启', '重新启动', '恢复'],
    score: 2,
    category: 'project',
  },
  // Constraints
  {
    keywords: ['不能做', '没办法', '做不了', '暂时不要', '先不碰'],
    score: 2,
    category: 'constraint',
  },
  {
    keywords: ['预算不够', '资源不够', '人手不够', '缺人'],
    score: 2,
    category: 'constraint',
  },
  // Explicit memory commands
  {
    keywords: ['记住', '记一下', '记着', '别忘了'],
    score: 6,
    category: 'decision',
  },
  {
    keywords: ['以后都', '未来都', '接下来都', '后面都'],
    score: 5,
    category: 'decision',
  },
  // Key decisions
  {
    keywords: ['决定了', '定下来', '拍板', '确认方案', '就按这个'],
    score: 3,
    category: 'decision',
  },
];

const EXTRACTION_THRESHOLD = 4; // Cumulative score needed to trigger extraction
const BATCH_EXTRACTION_INTERVAL = 6; // Every N exchanges, force a batch extraction

// ─── Session Tracking (in-memory) ───

interface SessionState {
  cumulativeScore: number;
  exchangeCount: number;
  lastExtractionExchange: number;
}

const sessions = new Map<string, SessionState>();

function getSession(sessionId: string): SessionState {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { cumulativeScore: 0, exchangeCount: 0, lastExtractionExchange: 0 });
  }
  return sessions.get(sessionId)!;
}

// ─── Save Conversation ───

export function saveConversation(userId: string, role: string, content: string, sessionId: string): void {
  run(
    'INSERT INTO ai_conversations (user_id, role, content, session_id) VALUES (?, ?, ?, ?)',
    [userId, role, content, sessionId]
  );
}

export function getRecentConversations(userId: string, sessionId: string, limit: number = 10): AiConversation[] {
  return queryAll<AiConversation>(
    'SELECT * FROM ai_conversations WHERE user_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, sessionId, limit]
  ).reverse();
}

// ─── Score User Message ───

export function scoreUserMessage(message: string): { score: number; matchedCategories: Set<TeamContext['category']> } {
  let totalScore = 0;
  const categories = new Set<TeamContext['category']>();

  for (const rule of EXTRACTION_RULES) {
    for (const kw of rule.keywords) {
      if (message.includes(kw)) {
        totalScore += rule.score;
        categories.add(rule.category);
        break; // Only count each rule once
      }
    }
  }

  return { score: totalScore, matchedCategories: categories };
}

// ─── Check if extraction should run ───

export function shouldExtract(sessionId: string, message: string): boolean {
  const session = getSession(sessionId);
  session.exchangeCount++;

  const { score } = scoreUserMessage(message);
  session.cumulativeScore += score;

  // Trigger 1: explicit memory command (score >= 5)
  if (score >= 5) {
    session.cumulativeScore = 0;
    session.lastExtractionExchange = session.exchangeCount;
    return true;
  }

  // Trigger 2: cumulative score threshold
  if (session.cumulativeScore >= EXTRACTION_THRESHOLD) {
    session.cumulativeScore = 0;
    session.lastExtractionExchange = session.exchangeCount;
    return true;
  }

  // Trigger 3: batch extraction every N exchanges
  if (session.exchangeCount - session.lastExtractionExchange >= BATCH_EXTRACTION_INTERVAL) {
    session.lastExtractionExchange = session.exchangeCount;
    return true;
  }

  return false;
}

// ─── Fact Extraction (calls AI) ───

export async function extractFacts(
  userId: string,
  sessionId: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<{ extracted: number; facts: Partial<TeamContext>[] }> {
  const recentMsgs = getRecentConversations(userId, sessionId, 12);
  if (recentMsgs.length === 0) return { extracted: 0, facts: [] };

  // Build conversation context for extraction
  const convoText = recentMsgs
    .map((m) => `${m.role === 'user' ? '管理者' : 'AI'}: ${m.content}`)
    .join('\n');

  const extractionPrompt = `你是一个团队管理信息提取器。从下面的对话中提取需要长期记住的关键事实。

提取规则：
1. 只提取会影响未来决策的持久性信息（如：人员状态变化、资源约束、重要决策）
2. 不要提取一次性任务安排或日常询问
3. 如果对话中没有值得长期记住的信息，返回空数组
4. 每条事实必须包含：
   - category: "personnel"（人事） / "project"（项目） / "constraint"（约束） / "decision"（决策）
   - content: 一句话描述事实，格式为"[对象]：[事实描述]"
   - impact: "reduce_workload" / "increase_priority" / "block" / "note" / "resource_constraint"
   - confidence: 0.0-1.0，根据管理者措辞的明确程度判断（明确说"记住"=0.9，暗示=0.5）

对话内容：
${convoText}

请以 JSON 数组格式返回，如果没有要记住的信息返回 []。只返回 JSON，不要其他内容。
示例：[{"category":"personnel","content":"李娜：怀孕 4 个月，建议工作量减半","impact":"reduce_workload","confidence":0.9}]`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: '你是一个严格的信息提取器。只返回 JSON 数组。' },
          { role: 'user', content: extractionPrompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Fact extraction API error:', response.status);
      return { extracted: 0, facts: [] };
    }

    const result = await response.json() as any;
    const raw = result.choices?.[0]?.message?.content || '[]';

    // Parse JSON from response (handle possible markdown wrapping)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { extracted: 0, facts: [] };

    const facts = JSON.parse(jsonMatch[0]) as Partial<TeamContext>[];

    // Save extracted facts with deduplication
    let extracted = 0;
    for (const fact of facts) {
      if (!fact.content || !fact.category) continue;

      // Deduplicate: check if similar fact exists
      const existing = queryOne<TeamContext>(
        'SELECT * FROM team_context WHERE user_id = ? AND category = ? AND content LIKE ? AND status = ?',
        [userId, fact.category, `%${fact.content?.substring(0, 20)}%`, 'active']
      );

      if (existing) {
        // Update existing fact
        run(
          'UPDATE team_context SET content = ?, confidence = ?, impact = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [fact.content, fact.confidence || 0.5, fact.impact || 'note', existing.id]
        );
      } else {
        // Insert new fact
        run(
          `INSERT INTO team_context (user_id, category, target_type, content, impact, confidence, status, source_session_id)
           VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
          [
            userId,
            fact.category,
            fact.target_type || 'team',
            fact.content,
            fact.impact || 'note',
            fact.confidence || 0.5,
            sessionId,
          ]
        );
        extracted++;
      }
    }

    return { extracted, facts };
  } catch (error) {
    console.error('Fact extraction error:', error);
    return { extracted: 0, facts: [] };
  }
}

// ─── Get Active Context for AI Injection ───

export function getActiveContext(userId: string): TeamContext[] {
  return queryAll<TeamContext>(
    "SELECT * FROM team_context WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY confidence DESC",
    [userId]
  );
}

export function buildContextPrompt(userId: string): string {
  const facts = getActiveContext(userId);
  if (facts.length === 0) return '';

  const lines: string[] = ['\n## 团队记忆（管理者之前提到的重要信息）\n'];

  const byCategory: Record<string, TeamContext[]> = {};
  for (const f of facts) {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
  }

  const labels: Record<string, string> = {
    personnel: '👤 人事信息',
    project: '📁 项目信息',
    constraint: '🚫 约束条件',
    preference: '⭐ 偏好设定',
    decision: '✅ 已做决策',
  };

  for (const [cat, items] of Object.entries(byCategory)) {
    lines.push(`### ${labels[cat] || cat}`);
    for (const item of items) {
      const confidenceLabel = item.confidence >= 0.8 ? '（确认）' : item.confidence >= 0.5 ? '（待确认）' : '（推测）';
      lines.push(`- ${item.content} ${confidenceLabel}`);
    }
  }

  lines.push('\n请在分析时综合考虑以上信息。\n');
  return lines.join('\n');
}

// ─── Dismiss / Update Facts ───

export function dismissFact(factId: number): void {
  run("UPDATE team_context SET status = 'dismissed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [factId]);
}

export function updateFact(factId: number, updates: Partial<TeamContext>): void {
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.confidence !== undefined) { fields.push('confidence = ?'); values.push(updates.confidence); }
  if (updates.impact !== undefined) { fields.push('impact = ?'); values.push(updates.impact); }

  if (fields.length > 0) {
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(factId);
    run(`UPDATE team_context SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

