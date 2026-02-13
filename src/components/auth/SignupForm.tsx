import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { showError, showLoading, dismissToast } from "@/utils/toast";

const schema = z
  .object({
    fullName: z.string().min(2, "Nome completo é obrigatório"),
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "Senha deve ter ao menos 8 caracteres")
      .regex(/[A-Z]/, "Deve conter 1 letra maiúscula")
      .regex(/[0-9]/, "Deve conter 1 número"),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "Você deve aceitar os Termos de Uso" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas precisam ser iguais",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const SignupForm: React.FC = () => {
  const { signUp, loading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Criando conta...");
    const res = await signUp(data.email, data.password, data.fullName);

    // Log completo para debugging (inspecione no console do browser)
    // eslint-disable-next-line no-console
    console.log("signup result:", res);

    dismissToast(toastId);
    if ((res as any)?.error) {
      showError((res as any).error.message ?? "Erro ao criar conta");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-indigo-700">Criar conta</h2>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Nome completo</label>
        <input id="fullName" autoComplete="name" {...register("fullName")} className="mt-1 block w-full rounded-md border p-2" />
        {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
        <input id="email" autoComplete="email" {...register("email")} className="mt-1 block w-full rounded-md border p-2" />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Senha</label>
        <input id="password" type="password" autoComplete="new-password" {...register("password")} className="mt-1 block w-full rounded-md border p-2" />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirmar senha</label>
        <input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} className="mt-1 block w-full rounded-md border p-2" />
        {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <input id="terms" type="checkbox" {...register("acceptedTerms")} />
        <label htmlFor="terms" className="text-sm text-slate-700">Aceito os Termos de Uso</label>
      </div>
      {errors.acceptedTerms && <p className="text-sm text-red-500">{errors.acceptedTerms.message}</p>}

      <div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md disabled:opacity-50" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </div>

      <div className="text-sm text-center text-slate-500">
        Já tem conta? <a href="/login" className="text-indigo-600 underline">Entrar</a>
      </div>
    </form>
  );
};

export default SignupForm;