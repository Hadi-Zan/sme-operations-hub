import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      title="Settings"
      description="A future home for workspace details, team preferences, and operational defaults."
      plannedItems={[
        "Manage business profile information",
        "Configure team roles and preferences",
        "Set operational defaults and categories",
      ]}
    />
  );
}
