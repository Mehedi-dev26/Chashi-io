import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SubNodesNetwork } from "@/components/dashboard/SubNodesNetwork";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "ডিভাইস নেটওয়ার্ক · BMDA" }] }),
  component: DevicesPage,
});

function DevicesPage() {
  return (
    <DashboardLayout
      title="ডিভাইস · নেটওয়ার্ক"
      subtitle="রিয়েল-টাইম sub-node নিয়ন্ত্রণ · YL-69 SM · SG90 Servo"
    >
      <SubNodesNetwork showAddButton showSummary showHelp />
    </DashboardLayout>
  );
}
