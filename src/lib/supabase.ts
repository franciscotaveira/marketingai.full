import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Mock Brain Service for when Supabase is not configured
 * This allows the app to work even without the real backend
 */
export const brainService = {
  async saveMemory(memory: any) {
    if (!supabase) {
      console.warn("Supabase not configured. Saving memory locally.");
      const localMemories = JSON.parse(localStorage.getItem('brain_memories') || '[]');
      localMemories.push({ ...memory, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() });
      localStorage.setItem('brain_memories', JSON.stringify(localMemories));
      return { data: memory, error: null };
    }
    return await supabase.from('memories').insert(memory);
  },

  async getMemories(agentId?: string) {
    if (!supabase) {
      const localMemories = JSON.parse(localStorage.getItem('brain_memories') || '[]');
      return { 
        data: agentId ? localMemories.filter((m: any) => m.agentId === agentId) : localMemories, 
        error: null 
      };
    }
    let query = supabase.from('memories').select('*').order('createdAt', { ascending: false });
    if (agentId) query = query.eq('agentId', agentId);
    return await query;
  }
};
