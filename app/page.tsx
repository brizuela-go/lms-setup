// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function Page() {
  const session = await auth();

  // If not authenticated, show loading screen with logo
  if (!session || !session.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Image
          alt="Logo"
          src={"/dark-logo.png"}
          width={300}
          height={300}
          className="animate-pulse"
        />
      </div>
    );
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
