import * as z from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter ao menos 8 caracteres")
  .regex(/[A-Z]/, "Deve conter 1 letra maiúscula")
  .regex(/[0-9]/, "Deve conter 1 número");