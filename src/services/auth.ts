import { supabase } from "@/integrations/supabase/client";
import type { UsersRow } from "@/types/database.types";

export async function signUp(email: string, password: string, fullName: string) {
  // Pass full_name via user_metadata so the DB trigger can use it
  const res = await supabase.auth.signUp(
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
  const { data: profile, error } = await supabase
    .from<UsersRow>("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // Let caller handle errors (don't swallow)
    throw error;
  }

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    ...profile,
  };
}

export async function updateLastLogin(userId: string) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}