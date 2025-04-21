import { TeacherSidebar } from "@/components/layout/teacher-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <TeacherSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
