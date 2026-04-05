import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ujvewxrrotkcsjigjkoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdmV3eHJyb3RrY3NqaWdqa29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzA0MTYsImV4cCI6MjA5MDg0NjQxNn0.wktPt5CVl5w_4LXBYZx-MEgR3I_BUFdL1tq1-__xNlI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth helpers ────────────────────────────────────────────
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ── Profile helpers ────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ── Lap helpers ────────────────────────────────────────────
export async function saveLap(lapData) {
  const { data, error } = await supabase
    .from('laps')
    .insert([lapData])
    .select()
    .single();
  return { data, error };
}

export async function getLapsByUser(userId) {
  const { data, error } = await supabase
    .from('laps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getLapsByTrack(track) {
  const { data, error } = await supabase
    .from('laps')
    .select('*, profiles(username, avatar_url, car)')
    .eq('track', track)
    .order('lap_time', { ascending: true });
  return { data, error };
}

// ── Leaderboard helpers ────────────────────────────────────
export async function getLeaderboard(track) {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*, profiles(username, avatar_url, car)')
    .eq('track', track)
    .order('best_time', { ascending: true });
  return { data, error };
}

export async function upsertLeaderboardEntry(entry) {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .upsert([entry], { onConflict: 'user_id,track,layout' })
    .select()
    .single();
  return { data, error };
}

// ── Posts helpers ──────────────────────────────────────────
export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url), laps(track, lap_time, top_speed)')
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
}

export async function createPost(userId, lapId, caption) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ user_id: userId, lap_id: lapId, caption }])
    .select()
    .single();
  return { data, error };
}
