import { getItemCount } from "@/lib/db";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  const count = getItemCount();
  if (count === 0) redirect("/");

  return <Dashboard />;
}
