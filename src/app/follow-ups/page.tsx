import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Follow-ups",
};

export default function FollowUpsPage() {
  return (
    <SectionPlaceholder
      title="Follow-ups"
      description="A clear queue for quotations, service check-ins, renewals, and other customer promises."
      plannedItems={[
        "Schedule customer follow-up reminders",
        "Track reasons, owners, and outcomes",
        "See overdue and upcoming conversations",
      ]}
    />
  );
}
