import React from "react";

type Props = {
  used: number;
  total: number;
  onClick?: () => void;
};

const CreditsBadge: React.FC<Props> = ({ used, total, onClick }) => {
  const remaining = Math.max(0, total - used);
  const color =
    remaining <= 5 ? "bg-red-600 text-white" : remaining <= 10 ? "bg-yellow-500 text-black" : "bg-green-600 text-white";

  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-md ${color} text-sm shadow-sm`}>
      💳 {remaining}/{total} créditos
    </button>
  );
};

export default CreditsBadge;