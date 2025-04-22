import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { TeacherSidebar } from "@/components/layout/teacher-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Footer from "@/components/layout/footer";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verificar que el usuario sea un profesor
  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="dark min-h-svh flex flex-col">
      <SidebarProvider>
        <div className="flex-1 flex">
          <TeacherSidebar user={session.user as any} />
          <div className="flex-1 flex flex-col">
            <div className="flex-grow flex flex-col">
              <main className="flex-1 pt-14 md:pt-0">
                <div className="hidden md:block p-4">
                  <SidebarTrigger />
                </div>
                <Suspense
                  fallback={<div className="p-10 text-center">Cargando...</div>}
                >
                  {children}
                </Suspense>
              </main>
              <Footer />
            </div>
          </div>
        </div>
      </SidebarProvider>
      <Toaster richColors position="top-right" />
    </div>
  );
}
