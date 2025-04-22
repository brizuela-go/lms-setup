"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EnrollmentActionProps {
  enrollmentId: string;
  children: React.ReactNode;
}

// Component for approving enrollments
export function ApproveEnrollmentForm({
  enrollmentId,
  children,
}: EnrollmentActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/enrollments/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enrollmentId,
          status: "APPROVED",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al aprobar la inscripción");
      }

      toast.success("Inscripción aprobada correctamente");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error al aprobar inscripción:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al aprobar la inscripción"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprobar Inscripción</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas aprobar esta solicitud de inscripción?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            Al aprobar esta solicitud, el estudiante será inscrito en tu materia
            y tendrá acceso a todos los contenidos, tareas y evaluaciones.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirmar Aprobación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component for rejecting enrollments
export function RejectEnrollmentForm({
  enrollmentId,
  children,
}: EnrollmentActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/enrollments/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enrollmentId,
          status: "REJECTED",
          reason: reason.trim() || "No se proporcionó una razón",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al rechazar la inscripción");
      }

      toast.success("Inscripción rechazada correctamente");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error al rechazar inscripción:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al rechazar la inscripción"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar Inscripción</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas rechazar esta solicitud de inscripción?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-sm">
            Proporciona una razón para el rechazo (opcional). Esta información
            podría ser utilizada para notificar al estudiante.
          </p>
          <Textarea
            placeholder="Razón del rechazo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirmar Rechazo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
