import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Tasks",
};

export default function TasksPage() {
  return (
    <SectionPlaceholder
      title="Tasks"
      description="A focused home for planning, assigning, and completing the work that keeps daily operations moving."
      plannedItems={[
        "Create and assign operational tasks",
        "Track priorities, owners, and due dates",
        "Filter work by status and team member",
      ]}
    />
  );
}
