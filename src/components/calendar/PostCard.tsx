import React from "react";
import PlatformBadge from "./PlatformBadge";
import { format } from "date-fns";

type Props = {
  post: any;
  onClick?: () => void;
  compact?: boolean;
};

const STATUS_BORDER: Record<string, string> = {
  scheduled: "border-blue-200",
  published: "border-green-200",
  failed: "border-red-200",
  cancelled: "border-gray-200",
  default: "border-slate-200",
};

const PostCard: React.FC<Props> = ({ post, onClick, compact = false }) => {
  const time = post?.scheduled_at ? format(new Date(post.scheduled_at), "HH:mm") : "";
  const title = post?.videos?.title ?? post?.description?.slice(0, 60) ?? "Post";

  const platforms = Array.isArray(post?.platform) ? post.platform : [post?.platform].filter(Boolean);

  const status = post?.status ?? "default";
  const borderClass = STATUS_BORDER[status] ?? STATUS_BORDER.default;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-2 rounded-md border ${borderClass} bg-white hover:shadow-sm ${compact ? "text-sm" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{time}</div>
          <div className="text-sm text-slate-700 truncate max-w-[10rem]">{title}</div>
        </div>
        <div className="flex items-center gap-1">
          {platforms.length === 0 ? (
            <PlatformBadge platform="general" size="sm" />
          ) : (
            platforms.slice(0, 3).map((p: string) => <PlatformBadge key={p} platform={p} size="sm" />)
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;