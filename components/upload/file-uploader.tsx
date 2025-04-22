"use client";

import { UploadDropzone } from "@/utils/uploadthing";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { File, FileCheck, FileX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  endpoint: "imageUploader" | "documentUploader";
  onChange?: (url: string | null) => void;
  value?: string | null;
  maxFiles?: number;
  onSubmit?: () => Promise<void>;
  className?: string;
  title?: string;
  description?: string;
}

export function FileUploader({
  endpoint,
  onChange,
  value,
  maxFiles = 1,
  onSubmit,
  className,
  title = "Subir archivo",
  description = "Arrastra y suelta o haz clic para subir",
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(value || null);

  const handleSubmit = async () => {
    if (!onSubmit || !uploadedUrl) return;

    try {
      setIsSubmitting(true);
      toast.promise(onSubmit(), {
        loading: "Entregando tarea...",
        success: "¡Tarea entregada correctamente!",
        error: "Error al entregar la tarea",
      });
    } catch (error) {
      console.error("Error al entregar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileName = (url: string) => {
    try {
      const fileName = url.split("/").pop() || "archivo";
      // Si el nombre es muy largo, truncarlo
      return fileName.length > 20
        ? fileName.substring(0, 17) + "..."
        : fileName;
    } catch {
      return "archivo";
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {uploadedUrl ? (
        <div className="flex flex-col gap-4">
          <div className="bg-card border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <FileCheck className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getFileName(uploadedUrl)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Archivo subido correctamente
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0"
                onClick={() => {
                  setUploadedUrl(null);
                  onChange?.(null);
                }}
              >
                <FileX className="size-4 mr-2" />
                Eliminar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-shrink-0 ml-2"
                asChild
              >
                <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                  <File className="size-4 mr-2" />
                  Ver
                </a>
              </Button>
            </div>
          </div>
          {onSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="w-full sm:w-auto"
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Entregar Tarea
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-md shadow-sm">
          <UploadDropzone
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
              setIsUploading(false);
              toast.success("Archivo subido correctamente");
              if (res?.[0]) {
                setUploadedUrl(res[0].url);
                onChange?.(res[0].url);
              }
            }}
            onUploadError={(error) => {
              setIsUploading(false);
              toast.error(`Error: ${error.message}`);
            }}
            onUploadBegin={() => {
              setIsUploading(true);
              toast.info("Subiendo archivo...");
            }}
            className="ut-label:text-sm ut-allowed-content:text-xs ut-upload-icon:text-primary"
          />
        </div>
      )}
    </div>
  );
}
