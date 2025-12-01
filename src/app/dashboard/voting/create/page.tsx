"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { createPoll } from "@/lib/supabase/polls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PollType } from "@/lib/supabase/types";

export default function CreatePollPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PollType>("yes_no_abstain");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (type === "multiple_choice") {
      const validOptions = options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        alert("Please provide at least 2 options");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const validOptions = type === "multiple_choice" 
        ? options.filter((o) => o.trim()) 
        : undefined;

      const poll = await createPoll(
        address,
        title.trim(),
        description.trim() || null,
        type,
        validOptions
      );

      if (poll) {
        router.push("/dashboard/voting");
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      alert(error instanceof Error ? error.message : "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-2xl">
      <div className="space-y-1">
        <Link
          href="/dashboard/voting"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Voting
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Create New Poll</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Poll Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="What should we vote on?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-none"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Add more context or details (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none rounded-none"
                maxLength={1000}
              />
            </div>

            {/* Poll Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Poll Type</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setType("yes_no_abstain")}
                  className={`p-4 border text-left transition-colors ${
                    type === "yes_no_abstain"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="font-medium text-sm">Yes / No / Abstain</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Simple vote with three options
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setType("multiple_choice")}
                  className={`p-4 border text-left transition-colors ${
                    type === "multiple_choice"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="font-medium text-sm">Multiple Choice</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Custom options to choose from
                  </p>
                </button>
              </div>
            </div>

            {/* Options for multiple choice */}
            {type === "multiple_choice" && (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Options <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="rounded-none"
                        maxLength={100}
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  You can add up to 10 options
                </p>
              </div>
            )}

            {/* Info box */}
            <div className="p-3 bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p>
                <strong>How voting works:</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Each NFT holder gets one vote</li>
                <li>Votes are anonymous (only counts are shown)</li>
                <li>Results update in real-time</li>
                <li>Poll closes automatically when outcome is mathematically certain</li>
                <li>You can delete your poll at any time</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard/voting">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Poll"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
