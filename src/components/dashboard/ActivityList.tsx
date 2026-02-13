import React from "react";
import { formatDistanceToNowStrict } from "date-fns";

type Activity = {
  id: string;
  type: "video_created" | "post_scheduled" | "post_published";
  title: string;
  timestamp: string;
  metadata?: any;
};

const ActivityItem: React.FC<{ a: Activity }> = ({ a }) => {
  const timeAgo = a.timestamp ? formatDistanceToNowStrict(new Date(a.timestamp), { addSuffix: true }) : "";
  const icon =
    a.type === "video_created" ? "📹" : a.type === "post_scheduled" ? "📅" : a.type === "post_published" ? "✅" : "•";

  return (
    <div className="flex items-start space-x-3 py-2">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{a.title}</div>
        <div className="text-xs text-slate-500">{a.type === "video_created" ? "Vídeo criado" : a.type === "post_scheduled" ? `Post agendado • ${a.metadata?.platform ?? ""}` : "Post publicado"} · {timeAgo}</div>
      </div>
    </div>
  );
};

const ActivityList: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  if (!activities?.length) {
    return <div className="text-sm text-slate-500">Nenhuma atividade ainda. Crie seu primeiro vídeo no ScriptAI ou no PostRápido!</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      {activities.map((a) => (
        <ActivityItem key={a.id} a={a} />
      ))}
    </div>
  );
};

export default ActivityList;