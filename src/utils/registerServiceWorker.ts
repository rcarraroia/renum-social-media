export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker registrado com sucesso:", registration.scope);

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New service worker available
            console.log("Nova versão disponível! Recarregue a página.");
            
            // Optionally show a notification to the user
            if (window.confirm("Nova versão disponível! Deseja atualizar?")) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.error("Erro ao registrar Service Worker:", error);
    }
  }
};

export const unregisterServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
};
