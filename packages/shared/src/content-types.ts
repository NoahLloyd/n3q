import type { ContentType } from "./types";

export const CONTENT_TYPE_OPTIONS: ContentType[] = [
  "article",
  "blog",
  "book",
  "podcast",
  "video",
  "paper",
  "newsletter",
  "report",
  "dataset",
  "tool",
  "course",
  "event",
  "community",
  "other",
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  article: "Article",
  blog: "Blog / Publication",
  book: "Book",
  podcast: "Podcast",
  video: "Video / Talk",
  paper: "Paper",
  newsletter: "Newsletter",
  report: "Report",
  dataset: "Dataset",
  tool: "Tool / Product",
  course: "Course",
  event: "Event",
  community: "Community",
  other: "Other",
};
