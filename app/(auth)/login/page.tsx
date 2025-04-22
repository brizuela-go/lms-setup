// app/login/page.tsx
import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <Image
              alt="Saber Pro Logo"
              src={"/dark-logo.png"}
              className="object-contain"
              height={200}
              width={200}
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-bold">Bienvenido a SaberPro</h1>
              <p className="text-muted-foreground text-sm text-balance">
                La nueva forma de aprender. Inicia sesión para continuar.
              </p>
            </div>
            <LoginForm className="mt-8" />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        {/* Fixed Next.js Image component warning */}
        <Image
          src="/login-background.jpg"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
          fill // Use fill instead of layout
          priority // Add priority for above-the-fold images
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-8">
          <blockquote className="text-white/90 space-y-2">
            <p className="text-lg font-medium">
              "La educación es el arma más poderosa que puedes usar para cambiar
              el mundo."
            </p>
            <footer className="text-sm text-white/70">— Nelson Mandela</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
