import { supabase } from "@/integrations/supabase/client";
import type { UsersRow } from "@/types/database.types";

export async function signUp(email: string, password: string, fullName: string) {
  // supabase-js typing may vary across versions; cast to any to satisfy TS while keeping runtime behavior
  const res = await (supabase.auth as any).signUp(
    { email, password },
    {
      data: { full_name: fullName },
    },
  );
  return res;
}

export async function signIn(email: string, password: string) {
  const res = await supabase.auth.signInWithPassword({ email, password });
  return res;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  // Get auth user
  const { data: userData } = await supabase.auth.getUser();
  const authUser = userData?.user;
  if (!authUser) return null;

  // Fetch row from public.users to get organization_id and role
  // Avoid using a problematic generic form signature; rely on runtime table name and handle possibly-null profile
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error && (error as any).code !== "PGRST116") {
    // Let caller handle errors (don't swallow)
    throw error;
  }

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    ...(profile ?? {}),
  };
}

export async function updateLastLogin(userId: string) {
  if (!userId) return null;
  const payload: Partial<UsersRow> = { last_login: new Date().toISOString() };
  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}