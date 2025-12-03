"use client";

import { Lock, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RestrictedFeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

export function RestrictedFeatureCard({
  title,
  description,
  icon,
  features,
}: RestrictedFeatureCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card className="rounded-none border-2 border-dashed border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center bg-muted/80 border border-border/60">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-500">
                  <Lock className="h-3 w-3" />
                  <span className="text-xs font-medium">Members Only</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* What this feature offers */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">
              What members get access to:
            </h2>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* CTA */}
          <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            N3Q is an invite-only builder space community. To get access to all
            features, you&apos;ll need to become a member.
          </p>
            <a
              href="https://ninethreequarters.com/apply"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                Apply to join N3Q
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

