import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GradeSubmissionForm } from "@/components/homeworks/grade-submission-form";

const prisma = new PrismaClient();

// Obtener la tarea enviada por el estudiante
async function getSubmission(submissionId: string, userId: string) {
  try {
    // Obtener el profesor
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return null;
    }

    // Obtener la tarea enviada
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        homework: {
          include: {
            subject: true,
            questions: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        grade: true,
      },
    });

    if (!submission) {
      return null;
    }

    // Verificar que la tarea pertenece a una materia del profesor
    if (submission.homework.subject.teacherId !== teacher.id) {
      return null;
    }

    return { submission, teacher };
  } catch (error) {
    console.error("Error al obtener la tarea enviada:", error);
    return null;
  }
}

export default async function GradeSubmissionPage({
  params,
}: {
  params: { id: string; homeworkId: string; submissionId: string };
}) {
  const session = await auth();

  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const data = await getSubmission(params.submissionId, session.user.id);

  if (!data) {
    notFound();
  }

  const { submission, teacher } = data;

  return (
    <div className="container py-10">
      <div className="mb-8">
        <Link
          href={`/teacher/subjects/${submission.homework.subject.id}/homeworks/${submission.homework.id}`}
          className="text-sm flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 size-4" />
          Volver a la tarea
        </Link>

        <h1 className="text-3xl font-bold mb-2">Calificar Tarea</h1>
        <p className="text-muted-foreground">
          Revisa las respuestas del estudiante y asigna una calificación
        </p>
      </div>

      <GradeSubmissionForm
        submission={submission as any}
        teacherId={teacher.id}
      />
    </div>
  );
}
