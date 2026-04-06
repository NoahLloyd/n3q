import { Cloud, ExternalLink, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const awsSteps = [
  {
    title: "Create an AWS Builder ID",
    description:
      'Before you begin, create an AWS Builder ID using your personal email address. Builder ID represents you as an individual and is independent from any existing AWS accounts. Select "Apply now" from the AWS Credits page to get started.',
  },
  {
    title: "Complete Your AWS Activate Profile",
    description:
      "Once you've created and verified your AWS Builder ID, you'll be directed to complete your AWS Activate profile. Fill out all required information about you and your startup.",
  },
  {
    title: "Choose Your Credits Package",
    description:
      "Select the Portfolio credit package and enter the Organization ID below.",
  },
  {
    title: "Provide Additional Startup Details",
    description:
      "Add details about your startup such as product information and funding details. This helps AWS determine your eligibility for credits.",
  },
  {
    title: "Link Your AWS Account",
    description:
      "Create a new AWS account or link your existing one to your AWS Builder ID. Only one Builder ID can be linked to an AWS account at a time — you may need to override an existing link.",
  },
  {
    title: "Verify Your AWS Account",
    description:
      "Complete account verification in the AWS Management Console to confirm your account is valid and properly linked to your Builder ID.",
  },
  {
    title: "Review and Submit",
    description:
      "Submit your application. Allow 7–10 business days for processing. You'll receive email updates and can monitor status on the Credit Application Status page.",
  },
];

export default function CreditsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
        <p className="text-sm text-muted-foreground">
          Perks and offers from our partners
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF9900]/10">
              <Cloud className="h-5 w-5 text-[#FF9900]" />
            </div>
            <div>
              <CardTitle>AWS Activate Credits</CardTitle>
              <CardDescription>
                Cloud credits for startups through the AWS Activate program
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              VC/Investor Organization ID
            </p>
            <p className="mt-1 font-mono text-sm font-semibold">W0VXd</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Case-sensitive and confidential — do not share outside N3Q
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">How to apply</h3>
            <ol className="space-y-4">
              {awsSteps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <a
            href="https://aws.amazon.com/activate/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Apply on AWS
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D97706]/10">
              <Sparkles className="h-5 w-5 text-[#D97706]" />
            </div>
            <div>
              <CardTitle>Anthropic API Credits</CardTitle>
              <CardDescription>
                $2,000 in API credits + higher rate limits + dedicated support
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              Dedicated Support Email
            </p>
            <p className="mt-1 font-mono text-sm font-semibold">
              portfolio+ninethreequarters@anthropic.com
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fast-tracked help for N3Q portfolio companies
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">How to redeem</h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-6">
                    Click the redeem link below
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    You&apos;ll be taken to the Anthropic credits redemption
                    page.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-6">
                    Fill out the form
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Provide your company details to verify your eligibility.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-6">
                    Credits applied within a few hours
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    If credits aren&apos;t applied promptly, reach out via the
                    support email above — Anthropic verification can sometimes
                    lag.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">
              What you can use credits for
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]" />
                <span>
                  <strong className="text-foreground">Claude API</strong> — Add
                  AI features to your products
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]" />
                <span>
                  <strong className="text-foreground">Claude Code</strong> —
                  Accelerate coding in terminal or IDEs like VS Code
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]" />
                <span>
                  <strong className="text-foreground">Claude Agent SDK</strong>{" "}
                  — Build agents on Anthropic&apos;s orchestration system
                </span>
              </li>
            </ul>
          </div>

          <a
            href="https://claude.com/offers?offer_code=7532ebdb-8285-4774-86b2-bc2528cbee9b"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Redeem Credits
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
