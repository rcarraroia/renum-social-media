import React from "react";

const TopPosts: React.FC<{ posts: any[]; loading?: boolean }> = ({ posts = [], loading = false }) => {
  if (loading) {
    return <div className="bg-white rounded-lg shadow p-4 animate-pulse h-64" />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="text-sm text-slate-600 mb-2">🏆 Top Posts</div>
      {posts.map((p, i) => (
        <div key={p.id ?? i} className="flex gap-3 items-start">
          <img src={p.thumbnailUrl ?? "https://via.placeholder.com/120x68.png?text=Thumb"} alt="thumb" className="w-28 h-16 object-cover rounded" />
          <div className="flex-1">
            <div className="text-sm font-medium">{`${i + 1}. ${p.platform?.toUpperCase() ?? ""} • ${new Date(p.publishedAt).toLocaleDateString()}`}</div>
            <div className="text-sm text-slate-700 truncate">{p.description}</div>
            <div className="mt-1 text-xs text-slate-500">{`👁️ ${p.metrics?.views ?? 0} • 💬 ${p.metrics?.comments ?? 0} • 📈 ${(p.metrics?.engagementRate ?? 0) * 100}%`}</div>
          </div>
          <div>
            <a href={p.postUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">Ver Post →</a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopPosts;