import { Vote } from "lucide-react";
import { RestrictedFeatureCard } from "@/components/restricted-feature-card";

export default function PublicVotingPage() {
  return (
    <RestrictedFeatureCard
      title="Voting"
      description="Polls and governance decisions for the N3Q community"
      icon={<Vote className="h-6 w-6" />}
      features={[
        "Create and participate in community polls",
        "Vote on governance decisions affecting the house",
        "Discuss proposals with other members before voting",
        "Track voting history and outcomes",
        "Anonymous voting with transparent results",
      ]}
    />
  );
}

