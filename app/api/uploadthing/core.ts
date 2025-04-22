import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();

// Middleware para verificar autenticación
const middleware = async () => {
  const session = await auth();

  if (!session || !session.user) {
    throw new UploadThingError("No autorizado");
  }

  // Return metadata para usar en onUploadComplete
  return { userId: session.user.id };
};

// FileRouter para nuestra aplicación
export const ourFileRouter = {
  // Para imágenes (fotos de perfil, etc.)
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(middleware)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Imagen subida por:", metadata.userId);
      console.log("URL del archivo:", file.url);

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Para documentos (tareas, recursos, etc.)
  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "2MB", maxFileCount: 1 },
    audio: { maxFileSize: "8MB", maxFileCount: 1 },
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(middleware)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Documento subido por:", metadata.userId);
      console.log("URL del archivo:", file.url);

      // Aquí podríamos guardar el archivo en la base de datos
      // await prisma.file.create({
      //   data: {
      //     name: file.name,
      //     url: file.url,
      //     size: file.size,
      //     mimeType: file.type,
      //     uploadedBy: metadata.userId,
      //   },
      // });

      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
