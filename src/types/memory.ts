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
