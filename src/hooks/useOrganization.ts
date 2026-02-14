import { useAuth } from "./useAuth";
import type { OrganizationsRow } from "@/types/database.types";

/**
 * Hook para acessar dados da organização do usuário atual
 */
export function useOrganization() {
  const { user } = useAuth();
  
  const organization = user?.organization;
  const plan = organization?.plan || "free";
  
  // Helpers para verificação de plano
  const isPro = plan === "pro";
  const isStarter = plan === "starter";
  const isFree = plan === "free";
  
  // Helper para verificar se tem acesso a recursos premium
  const hasProAccess = isPro;
  const hasStarterAccess = isPro || isStarter;
  
  return {
    organization,
    plan,
    isPro,
    isStarter,
    isFree,
    hasProAccess,
    hasStarterAccess,
  };
}