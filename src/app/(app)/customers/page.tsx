import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return (
    <SectionPlaceholder
      title="Customers"
      description="A simple customer directory that keeps contact details and service context easy to find."
      plannedItems={[
        "Store customer and site contact details",
        "Review recent and upcoming service work",
        "Keep concise operational notes",
      ]}
    />
  );
}
