// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  // If not authenticated, redirect to login
  if (!session || !session.user) {
    redirect("/login");
  }

  // Redirect based on user role
  switch (session.user.role) {
    case "STUDENT":
      redirect("/dashboard");
    case "TEACHER":
      redirect("/teacher");
    case "ADMIN":
    case "SUPERADMIN":
      redirect("/admin");
    default:
      redirect("/login");
  }

  // This should never be reached due to redirects
  return null;
}
