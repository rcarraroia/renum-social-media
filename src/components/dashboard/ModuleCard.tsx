import React from "react";
import { cn } from "@/lib/utils";

const ModuleCard: React.FC<{
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  onSelect?: () => void;
}> = ({ title, description, badge, disabled = false, onSelect }) => {
  return (
    <div
      onClick={() => {
        if (!disabled && onSelect) onSelect();
      }}
      className={cn(
        "bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-1",
      )}
      role="button"
      aria-disabled={disabled}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-bold">{title}</div>
          <div className="text-sm text-slate-500 mt-1">{description}</div>
        </div>
        {badge && <div className="text-xs px-2 py-1 rounded bg-gray-100 ml-4">{badge}</div>}
      </div>
    </div>
  );
};

export default ModuleCard;