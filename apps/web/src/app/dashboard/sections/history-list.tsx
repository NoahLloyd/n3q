import type { ContentInteraction } from "@/lib/supabase/types";

interface HistoryEntry {
  id: string;
  status: ContentInteraction["status"];
  rating: number | null;
  comment: string | null;
  created_at: string;
  item: {
    id: string;
    title: string;
    type: string;
    url: string | null;
    created_at: string;
  } | null;
}

interface HistoryListProps {
  history: HistoryEntry[];
  filter: "saved" | "done";
}

export function HistoryList({ history, filter }: HistoryListProps) {
  const filtered = (history ?? []).filter(
    (entry) => entry.status === filter && entry.item
  );

  if (filtered.length === 0) {
    return <p className="text-xs text-muted-foreground">Nothing here yet.</p>;
  }

  return (
    <div className="space-y-1 text-xs">
      {filtered.map((entry) => {
        if (!entry.item) return null;
        const url = entry.item.url;
        const label = url ?? entry.item.title;

        return (
          <div key={entry.id} className="truncate text-foreground">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline break-all"
              >
                {url}
              </a>
            ) : (
              <span className="break-all">{label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
