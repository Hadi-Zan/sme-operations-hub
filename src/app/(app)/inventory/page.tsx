import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryPage() {
  return (
    <SectionPlaceholder
      title="Inventory"
      description="A practical stock view for the supplies and parts needed to deliver customer work without delays."
      plannedItems={[
        "Maintain a list of parts and supplies",
        "Record stock movements and reorder levels",
        "Surface low-stock items before visits",
      ]}
    />
  );
}
