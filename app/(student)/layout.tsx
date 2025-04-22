import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { StudentNavbar } from "@/components/layout/student-navbar";
import Footer from "@/components/layout/footer";

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Verificar que el usuario sea un estudiante
  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <main className="dark min-h-svh flex flex-col">
      <StudentNavbar user={session.user as any} />
      <div className="flex-1">
        <Suspense
          fallback={<div className="p-10 text-center">Cargando...</div>}
        >
          {children}
        </Suspense>
      </div>
      <Footer />
      <Toaster richColors position="top-right" />
    </main>
  );
}
