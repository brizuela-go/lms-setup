// app/admin/layout.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Footer from "@/components/layout/footer";
import type { AdminUser } from "@/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verificar que el usuario sea un administrador
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    redirect("/login");
  }

  // Type assertion is safe after we've checked the role
  const adminUser = session.user as AdminUser;

  return (
    <div className="dark min-h-svh flex flex-col">
      <SidebarProvider>
        <div className="flex-1 flex">
          <AdminSidebar user={adminUser as any} />
          <div className="flex-1 flex flex-col">
            <div className="flex-grow flex flex-col">
              <main className="flex-1 pt-14 md:pt-0">
                <div className="hidden md:block p-4">
                  <SidebarTrigger />
                </div>
                <div className="md:pl-6">
                  {" "}
                  {/* Added padding for better spacing */}
                  <Suspense
                    fallback={
                      <div className="p-10 text-center">Cargando...</div>
                    }
                  >
                    {children}
                  </Suspense>
                </div>
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
