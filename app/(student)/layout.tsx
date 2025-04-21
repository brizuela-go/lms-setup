import { StudentNavbar } from "@/components/layout/student-navbar";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="dark">
      <StudentNavbar />
      {children}
    </main>
  );
}
