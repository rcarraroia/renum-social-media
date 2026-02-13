import React from "react";
import PlatformBadge from "./PlatformBadge";
import { format } from "date-fns";

type Props = {
  post: any;
  onClick?: () => void;
  compact?: boolean;
};

const PostCard: React.FC<Props> = ({ post, onClick, compact = false }) => {
  const time = post?.scheduled_at ? format(new Date(post.scheduled_at), "HH:mm") : "";
  const title = post?.videos?.title ?? post?.description?.slice(0, 60) ?? "Post";
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-2 rounded-md border bg-white hover:shadow-sm ${
        compact ? "text-sm" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{time}</div>
          <div className="text-sm text-slate-700 truncate max-w-[10rem]">{title}</div>
        </div>
        <div>
          <PlatformBadge platform={post.platform} />
        </div>
      </div>
    </div>
  );
};

export default PostCard;