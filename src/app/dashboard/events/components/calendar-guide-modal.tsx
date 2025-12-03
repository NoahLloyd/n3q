"use client";

import { useState } from "react";
import { Calendar, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarUrl: string;
}

export function CalendarGuideModal({
  isOpen,
  onClose,
  calendarUrl,
}: CalendarGuideModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 rounded-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Subscribe to Calendar
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Calendar URL</label>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-muted text-xs font-mono break-all border border-border">
                {calendarUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">How to subscribe:</h4>

            {/* Google Calendar */}
            <div className="space-y-2 p-3 bg-muted/50 border border-border">
              <p className="text-sm font-medium">Google Calendar</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Google Calendar on your computer</li>
                <li>Click the + next to &quot;Other calendars&quot;</li>
                <li>Select &quot;From URL&quot;</li>
                <li>Paste the calendar URL above</li>
                <li>Click &quot;Add calendar&quot;</li>
              </ol>
            </div>

            {/* Apple Calendar */}
            <div className="space-y-2 p-3 bg-muted/50 border border-border">
              <p className="text-sm font-medium">Apple Calendar</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Calendar app on your Mac</li>
                <li>Go to File → New Calendar Subscription</li>
                <li>Paste the calendar URL above</li>
                <li>Click &quot;Subscribe&quot;</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                On iPhone: Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar
              </p>
            </div>

            {/* Outlook */}
            <div className="space-y-2 p-3 bg-muted/50 border border-border">
              <p className="text-sm font-medium">Outlook</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Outlook Calendar</li>
                <li>Click &quot;Add calendar&quot; → &quot;Subscribe from web&quot;</li>
                <li>Paste the calendar URL above</li>
                <li>Click &quot;Import&quot;</li>
              </ol>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your calendar will automatically update when new events are added.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

