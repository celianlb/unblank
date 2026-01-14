import BugReportButton from "@/components/BugReportButton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BugReportButton />
    </>
  );
}
