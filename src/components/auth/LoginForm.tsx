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
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-full md:max-w-md mx-auto space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-indigo-700">Entrar</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
        <input 
          {...register("email")} 
          type="email"
          autoComplete="email"
          className="block w-full rounded-lg border-2 border-gray-200 px-4 py-4 text-base focus:border-indigo-600 focus:ring-0 transition-colors"
          placeholder="seu@email.com"
        />
        {formState.errors.email && <p className="text-sm text-red-500 mt-1">{formState.errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            {...register("password")} 
            autoComplete="current-password"
            className="block w-full rounded-lg border-2 border-gray-200 px-4 py-4 pr-14 text-base focus:border-indigo-600 focus:ring-0 transition-colors"
            placeholder="••••••••"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword((s) => !s)} 
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {formState.errors.password && <p className="text-sm text-red-500 mt-1">{formState.errors.password.message}</p>}
      </div>

      <div className="flex justify-between items-center">
        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 underline min-h-[44px] flex items-center">
          Esqueceu a senha?
        </a>
      </div>

      <div>
        <button 
          type="submit" 
          className="w-full bg-indigo-600 text-white py-4 rounded-lg text-lg font-semibold disabled:opacity-50 hover:bg-indigo-700 active:scale-98 transition-all"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>

      <div className="text-sm text-center text-slate-500">
        Não tem conta? <a href="/signup" className="text-indigo-600 hover:text-indigo-700 underline font-medium">Criar conta</a>
      </div>
    </form>
  );
};

export default LoginForm;