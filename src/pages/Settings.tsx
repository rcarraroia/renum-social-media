import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";

const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-xl font-semibold">Settings</h2>

        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Perfil</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600">Nome</label>
              <input defaultValue={user?.full_name ?? ""} className="mt-1 w-full rounded-md border p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-600">Email</label>
              <input defaultValue={user?.email ?? ""} disabled className="mt-1 w-full rounded-md border p-2 bg-slate-50" />
            </div>
          </div>
          <div className="mt-4">
            <button disabled className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Salvar</button>
          </div>
        </section>

        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Integrações</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded">Metricool <div className="text-xs text-slate-500">Não conectado</div></div>
            <div className="p-4 border rounded">HeyGen <div className="text-xs text-slate-500">Não conectado</div></div>
            <div className="p-4 border rounded">OpusClip <div className="text-xs text-slate-500">Não conectado</div></div>
          </div>
        </section>

        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Plano</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded">Plano atual: Free</div>
            <div className="p-4 border rounded">Vídeos restantes: 3/3</div>
            <div className="p-4 border rounded"><button disabled className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50">Ver planos</button></div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Settings;