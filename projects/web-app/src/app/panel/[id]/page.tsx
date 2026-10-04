import { ReportDetailView } from "@/app/_panel/ReportDetailView";

// /panel/[id]: one report. ReportDetailView owns the <main> and checks the id before any request.
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportDetailView id={id} />;
}
