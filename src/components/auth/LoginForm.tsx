import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { showLoading, dismissToast } from "@/utils/toast";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

const LoginForm: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Entrando...");
    const res = await signIn(data.email, data.password);
    dismissToast(toastId);
    // signIn handles navigation and toast
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-full md:max-w-md mx-auto space-y-4 bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-indigo-700">Entrar</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input {...register("email")} className="mt-1 block w-full rounded-md border p-2" />
        {formState.errors.email && <p className="text-sm text-red-500">{formState.errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Senha</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} {...register("password")} className="mt-1 block w-full rounded-md border p-2 pr-10" />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-2 text-sm text-slate-500 min-h-[44px] min-w-[44px] flex items-center justify-center">
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {formState.errors.password && <p className="text-sm text-red-500">{formState.errors.password.message}</p>}
      </div>

      <div className="flex justify-between items-center">
        <a href="#" className="text-sm text-indigo-600 underline">Esqueceu a senha?</a>
      </div>

      <div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md disabled:opacity-50" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>

      <div className="text-sm text-center text-slate-500">
        Não tem conta? <a href="/signup" className="text-indigo-600 underline">Criar conta</a>
      </div>
    </form>
  );
};

export default LoginForm;