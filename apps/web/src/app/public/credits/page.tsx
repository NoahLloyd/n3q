import { Ticket } from "lucide-react";
import { RestrictedFeatureCard } from "@/components/restricted-feature-card";

export default function PublicCreditsPage() {
  return (
    <RestrictedFeatureCard
      title="Credits"
      description="Perks and offers from N3Q partners"
      icon={<Ticket className="h-6 w-6" />}
      features={[
        "$2,000 in Anthropic API credits + dedicated support",
        "AWS Activate cloud credits for startups",
        "Step-by-step application guides",
        "Access exclusive member perks and offers",
      ]}
    />
  );
}
