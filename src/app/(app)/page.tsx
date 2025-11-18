import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFeed, getHistory } from "@/lib/feed";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddItemForm } from "./sections/add-item-form";
import { FeedList } from "./sections/feed-list";
import { HistoryList } from "./sections/history-list";

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Layout should redirect but this keeps types happy.
    return null;
  }

  const [feed, history] = await Promise.all([
    getFeed(user.id),
    getHistory(user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">
        Shared knowledge
      </h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="space-y-4">
          <FeedList items={feed} currentUserId={user.id} />
        </div>
        <div className="space-y-4">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Add to the feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddItemForm />
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryList history={history} filter="saved" />
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryList history={history} filter="done" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


