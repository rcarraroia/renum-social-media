import React from "react";
import { useEffect, useState } from "react";
import { showSuccess } from "@/utils/toast";

const AIAssistantFAB: React.FC = () => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 30000); // pulse every 30s

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    // Temporary behaviour — show tooltip/message
    showSuccess("Em breve — Assistente IA");
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Assistente IA"
      className={`fixed right-4 bottom-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${pulse ? "animate-pulse" : ""
        }`}
      style={{
        // Respect safe-area inset for mobile
        marginBottom: "env(safe-area-inset-bottom, 1rem)",
      }}
    >
      <span className="text-xl">🤖</span>
    </button>
  );
};

export default AIAssistantFAB;