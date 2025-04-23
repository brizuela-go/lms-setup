// app/(student)/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { StudentNavbar } from "@/components/layout/student-navbar";
import Footer from "@/components/layout/footer";
import type { StudentUser } from "@/types";

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

  // Type assertion is safe after we've checked the role
  const studentUser = session.user as StudentUser;

  return (
    <main className="dark min-h-svh flex flex-col mx-14">
      <StudentNavbar user={studentUser as any} />
      <div className="flex-1 justify-center">{children}</div>
      <Footer />
      <Toaster richColors position="top-right" />
    </main>
  );
}
