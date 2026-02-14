import React from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  isSameMonth,
  isSameDay,
} from "date-fns";
import PostCard from "./PostCard";

type Props = {
  month: Date;
  postsByDay: Record<string, any[]>;
  onDateClick: (date: Date) => void;
  onPostClick: (post: any) => void;
};

const CalendarGrid: React.FC<Props> = ({ month, postsByDay, onDateClick, onPostClick }) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-7 text-xs text-slate-500">
        <div className="text-center">DOM</div>
        <div className="text-center">SEG</div>
        <div className="text-center">TER</div>
        <div className="text-center">QUA</div>
        <div className="text-center">QUI</div>
        <div className="text-center">SEX</div>
        <div className="text-center">SAB</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weeks.map((week) =>
          week.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDay[key] ?? [];
            const inMonth = isSameMonth(day, month);
            return (
              <div
                key={key}
                className={`min-h-[80px] md:min-h-[110px] p-2 rounded-md border ${inMonth ? "bg-white" : "bg-slate-50 text-slate-400"}`}
                onClick={() => onDateClick(day)}
              >
                <div className="flex items-start justify-between">
                  <div className={`font-medium ${isSameDay(day, new Date()) ? "text-indigo-600" : ""}`}>{format(day, "d")}</div>
                  <div className="text-xs text-slate-400">{dayPosts.length > 0 ? `${dayPosts.length}` : ""}</div>
                </div>

                <div className="mt-2 space-y-1">
                  {dayPosts.slice(0, 2).map((p: any) => (
                    <div key={p.id} onClick={(e) => { e.stopPropagation(); onPostClick(p); }}>
                      <PostCard post={p} compact />
                    </div>
                  ))}

                  {dayPosts.length > 2 && (
                    <div className="text-xs text-slate-500 mt-1">+{dayPosts.length - 2} posts</div>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

export default CalendarGrid;