"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { BookOpen, Rocket, CalendarDays, Vote, Clock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchProjects } from "@/lib/supabase/projects";
import { fetchEvents } from "@/lib/supabase/events";
import { fetchPolls } from "@/lib/supabase/polls";
import type { Project, Event, Poll, Profile } from "@/lib/supabase/types";

const supabase = createSupabaseBrowserClient();

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

interface ContentItem {
  id: string;
  title: string;
  url: string | null;
  type: string;
  created_at: string;
  creator?: Profile;
}

async function fetchLatestKnowledge(): Promise<ContentItem[]> {
  const { data: items, error } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !items) return [];
  return items;
}

const projectStatusColors: Record<string, string> = {
  idea: "text-amber-400",
  in_progress: "text-blue-400",
  looking_for_help: "text-emerald-400",
  completed: "text-zinc-400",
};

const projectStatusLabels: Record<string, string> = {
  idea: "Idea",
  in_progress: "In Progress",
  looking_for_help: "Help Wanted",
  completed: "Done",
};

export default function DisplayPage() {
  const { address } = useAccount();
  const [knowledge, setKnowledge] = useState<ContentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    if (!address) return;

    try {
      const [knowledgeData, projectsData, eventsData, pollsData] =
        await Promise.all([
          fetchLatestKnowledge(),
          fetchProjects(address),
          fetchEvents(address, "upcoming"),
          fetchPolls(address),
        ]);

      setKnowledge(knowledgeData);
      setProjects(projectsData.slice(0, 8));
      setEvents(eventsData.slice(0, 8));
      setPolls(pollsData.filter((p) => p.status === "active").slice(0, 6));
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading display data:", error);
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const interval = setInterval(loadAllData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadAllData]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background grid grid-cols-2 grid-rows-2 gap-px bg-border">
      {/* Knowledge - Top Left */}
      <div className="bg-background p-6 overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-2.5 bg-muted border border-border">
            <BookOpen className="h-5 w-5" />
          </div>
          <h2 className="font-semibold uppercase tracking-wider text-sm">
            Knowledge
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-2">
            {knowledge.map((item) => (
              <div
                key={item.id}
                className="p-3 border border-border/50 bg-card/30"
              >
                <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                <span className="text-xs text-muted-foreground uppercase">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events - Top Right */}
      <div className="bg-background p-6 overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-2.5 bg-muted border border-border">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h2 className="font-semibold uppercase tracking-wider text-sm">
            Upcoming Events
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-2">
            {events.length > 0 ? (
              events.map((event) => {
                const eventDate = new Date(event.event_date + "T00:00:00");
                const formattedDate = eventDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = event.event_time
                  ? (() => {
                      const [hours, minutes] = event.event_time.split(":");
                      const hour = parseInt(hours, 10);
                      const ampm = hour >= 12 ? "PM" : "AM";
                      const hour12 = hour % 12 || 12;
                      return `${hour12}:${minutes} ${ampm}`;
                    })()
                  : null;

                return (
                  <div
                    key={event.id}
                    className="p-3 border border-border/50 bg-card/30"
                  >
                    <p className="text-sm font-medium line-clamp-1">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formattedDate}</span>
                      {formattedTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formattedTime}
                        </span>
                      )}
                      <span className="text-emerald-500">
                        {event.rsvp_count || 0} going
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Projects - Bottom Left */}
      <div className="bg-background p-6 overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-2.5 bg-muted border border-border">
            <Rocket className="h-5 w-5" />
          </div>
          <h2 className="font-semibold uppercase tracking-wider text-sm">
            Projects
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-2">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 border border-border/50 bg-card/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-1">
                      {project.title}
                    </p>
                    <span
                      className={`text-xs shrink-0 ${
                        projectStatusColors[project.status]
                      }`}
                    >
                      {projectStatusLabels[project.status]}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {project.member_count || 0} member
                    {(project.member_count || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Polls - Bottom Right */}
      <div className="bg-background p-6 overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-2.5 bg-muted border border-border">
            <Vote className="h-5 w-5" />
          </div>
          <h2 className="font-semibold uppercase tracking-wider text-sm">
            Active Polls
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-3">
            {polls.length > 0 ? (
              polls.map((poll) => {
                const totalVotes =
                  poll.type === "yes_no_abstain"
                    ? poll.yes_count + poll.no_count + poll.abstain_count
                    : poll.options?.reduce((sum, o) => sum + o.vote_count, 0) ||
                      0;

                return (
                  <div
                    key={poll.id}
                    className="p-3 border border-border/50 bg-card/30"
                  >
                    <p className="text-sm font-medium line-clamp-1 mb-2">
                      {poll.title}
                    </p>
                    <div className="space-y-1">
                      {poll.type === "yes_no_abstain" ? (
                        <>
                          <PollBar
                            label="Yes"
                            count={poll.yes_count}
                            total={totalVotes}
                            color="bg-emerald-500"
                          />
                          <PollBar
                            label="No"
                            count={poll.no_count}
                            total={totalVotes}
                            color="bg-red-500"
                          />
                        </>
                      ) : (
                        poll.options?.slice(0, 3).map((opt, i) => (
                          <PollBar
                            key={opt.id}
                            label={opt.label}
                            count={opt.vote_count}
                            total={totalVotes}
                            color={
                              ["bg-emerald-500", "bg-blue-500", "bg-amber-500"][i]
                            }
                          />
                        ))
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No active polls</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PollBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate max-w-[60%]">
          {label}
        </span>
        <span className="font-medium tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 bg-muted overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
