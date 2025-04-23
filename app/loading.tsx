import Image from "next/image";

export default function Loading() {
  <div className="flex justify-center items-center min-h-screen">
    <Image
      alt="Logo"
      src={"/dark-logo.png"}
      width={300}
      height={300}
      className="animate-pulse"
    />
  </div>;
}
