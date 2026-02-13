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

  // Use any-cast at the query boundary to avoid incompatible generic typings across supabase versions
  const res = await (supabase.from("users") as any)
    .select("*")
    .eq("id", authUser.id)
    .single();

  const profile = (res?.data ?? null) as Partial<UsersRow> | null;
  const error = res?.error;

  if (error && (error as any).code !== "PGRST116") {
    throw error;
  }

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    ...(profile ?? {}),
  } as (UsersRow & { id: string; email: string }) | null;
}

export async function updateLastLogin(userId: string) {
  if (!userId) return null;
  const payload: Partial<UsersRow> = { last_login: new Date().toISOString() };

  const res = await (supabase.from("users") as any)
    .update(payload)
    .eq("id", userId)
    .select()
    .single();

  const data = res?.data;
  const error = res?.error;

  if (error) throw error;
  return data;
}