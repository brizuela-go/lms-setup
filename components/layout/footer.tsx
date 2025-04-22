import { Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black py-6 text-white mt-auto">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm opacity-90">
              © {currentYear} SaberPro. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex items-center text-sm opacity-90">
            <p className="flex items-center">
              Creado con <Heart className="mx-1 size-3.5 text-red-500" /> por
            </p>
            <p className="ml-1">
              Manuel Adolfo Dario Escobedo y Ricardo Carrera Morales
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
