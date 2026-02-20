import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName);
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-base font-medium">
          Nome Completo
        </Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Seu nome completo"
          className="h-14 text-base px-4 border-2 transition-all focus:border-indigo-500"
          {...register("fullName")}
          aria-invalid={errors.fullName ? "true" : "false"}
        />
        {errors.fullName && (
          <p className="text-sm text-red-600" role="alert">
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          className="h-14 text-base px-4 border-2 transition-all focus:border-indigo-500"
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && (
          <p className="text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-medium">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            className="h-14 text-base px-4 pr-12 border-2 transition-all focus:border-indigo-500"
            {...register("password")}
            aria-invalid={errors.password ? "true" : "false"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-100"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-base font-medium">
          Confirmar Senha
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Digite a senha novamente"
            className="h-14 text-base px-4 pr-12 border-2 transition-all focus:border-indigo-500"
            {...register("confirmPassword")}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-100"
            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors"
      >
        {isLoading ? "Criando conta..." : "Criar Conta"}
      </Button>

      {/* Login Link */}
      <div className="text-center pt-2">
        <p className="text-sm text-slate-600">
          Já tem uma conta?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:text-indigo-700 font-medium underline min-h-[44px] inline-flex items-center"
          >
            Fazer login
          </button>
        </p>
      </div>
    </form>
  );
};
