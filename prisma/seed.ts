import { prisma } from "../prisma";
import { add } from "date-fns";

async function main() {
  console.log("🌱 Iniciando proceso de sembrado de datos...");

  // Limpiar base de datos existente (solo en entorno de desarrollo)
  if (process.env.NODE_ENV !== "production") {
    console.log("🧹 Limpiando base de datos...");

    await prisma.grade.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.question.deleteMany();
    await prisma.homework.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ Base de datos limpiada correctamente");
  }

  console.log("👤 Creando usuarios...");

  // Crear SuperAdmin
  const superAdminUser = await prisma.user.create({
    data: {
      name: "Administrador Principal",
      email: "superadmin@saberpro.com",
      password: "password123", // En producción, hashear la contraseña
      role: "SUPERADMIN",
    },
  });

  const superAdmin = await prisma.admin.create({
    data: {
      userId: superAdminUser.id,
      isSuperAdmin: true,
    },
  });

  // Crear Admin regular
  const adminUser = await prisma.user.create({
    data: {
      name: "Coordinador Académico",
      email: "admin@saberpro.com",
      password: "password123",
      role: "ADMIN",
    },
  });

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      isSuperAdmin: false,
    },
  });

  // Crear profesores
  const teachers = [
    {
      name: "Miguel Ángel Rodríguez",
      email: "mrodriguez@saberpro.com",
      password: "password123",
      department: "Matemáticas",
      bio: "Doctor en Matemáticas Aplicadas con 15 años de experiencia docente.",
    },
    {
      name: "Laura Sánchez Vega",
      email: "lsanchez@saberpro.com",
      password: "password123",
      department: "Literatura",
      bio: "Licenciada en Letras con especialidad en Literatura Latinoamericana.",
    },
    {
      name: "Carlos Mendoza Fuentes",
      email: "cmendoza@saberpro.com",
      password: "password123",
      department: "Ciencias",
      bio: "Investigador y docente en Física Cuántica con publicaciones internacionales.",
    },
    {
      name: "Gabriela Torres López",
      email: "gtorres@saberpro.com",
      password: "password123",
      department: "Historia",
      bio: "Historiadora especializada en Historia de México y Latinoamérica.",
    },
  ];

  const createdTeachers = [];

  for (const teacher of teachers) {
    const teacherUser = await prisma.user.create({
      data: {
        name: teacher.name,
        email: teacher.email,
        password: teacher.password,
        role: "TEACHER",
      },
    });

    const createdTeacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        department: teacher.department,
        bio: teacher.bio,
      },
    });

    createdTeachers.push(createdTeacher);
  }

  console.log(`✅ Creados ${createdTeachers.length} profesores`);

  // Crear estudiantes
  const students = [
    {
      name: "Ana María González",
      email: "agonzalez@estudiante.saberpro.com",
      password: "password123",
      studentId: "123456",
      isActivated: true,
    },
    {
      name: "José Luis Ramírez",
      email: "jramirez@estudiante.saberpro.com",
      password: "password123",
      studentId: "234567",
      isActivated: true,
    },
    {
      name: "Daniela Morales Ortiz",
      email: "dmorales@estudiante.saberpro.com",
      password: "password123",
      studentId: "345678",
      isActivated: true,
    },
    {
      name: "Eduardo Vargas Castro",
      email: "evargas@estudiante.saberpro.com",
      password: "password123",
      studentId: "456789",
      isActivated: true,
    },
    {
      name: "Sofía Pérez Ríos",
      email: "sperez@estudiante.saberpro.com",
      password: "password123",
      studentId: "567890",
      isActivated: true,
    },
    {
      name: "Alejandro Torres Mendoza",
      email: "atorres@estudiante.saberpro.com",
      password: "password123",
      studentId: "678901",
      isActivated: false,
    },
    {
      name: "Valeria Flores López",
      email: "vflores@estudiante.saberpro.com",
      password: "password123",
      studentId: "789012",
      isActivated: false,
    },
  ];

  const createdStudents = [];

  for (const student of students) {
    const studentUser = await prisma.user.create({
      data: {
        name: student.name,
        email: student.email,
        password: student.password,
        role: "STUDENT",
      },
    });

    const createdStudent = await prisma.student.create({
      data: {
        userId: studentUser.id,
        studentId: student.studentId,
        isActivated: student.isActivated,
      },
    });

    createdStudents.push(createdStudent);
  }

  console.log(`✅ Creados ${createdStudents.length} estudiantes`);

  // Crear materias
  console.log("📚 Creando materias...");

  const now = new Date();

  const subjects = [
    {
      name: "Cálculo Diferencial",
      description:
        "Introducción a los conceptos básicos del cálculo diferencial y sus aplicaciones.",
      code: "MAT101",
      startDate: add(now, { days: -30 }),
      endDate: add(now, { days: 60 }),
      teacherId: createdTeachers[0].id,
    },
    {
      name: "Literatura Contemporánea",
      description:
        "Análisis de obras literarias del siglo XX y XXI con enfoque en autores latinoamericanos.",
      code: "LIT202",
      startDate: add(now, { days: -45 }),
      endDate: add(now, { days: 45 }),
      teacherId: createdTeachers[1].id,
    },
    {
      name: "Física Moderna",
      description:
        "Estudio de los fundamentos de la física moderna y la teoría cuántica.",
      code: "FIS301",
      startDate: add(now, { days: -15 }),
      endDate: add(now, { days: 75 }),
      teacherId: createdTeachers[2].id,
    },
    {
      name: "Historia de México",
      description:
        "Recorrido por los principales acontecimientos históricos de México desde la época prehispánica hasta la actualidad.",
      code: "HIS201",
      startDate: add(now, { days: -60 }),
      endDate: add(now, { days: 30 }),
      teacherId: createdTeachers[3].id,
    },
    {
      name: "Álgebra Lineal",
      description:
        "Estudio de vectores, matrices y sistemas de ecuaciones lineales.",
      code: "MAT202",
      startDate: add(now, { days: 15 }),
      endDate: add(now, { days: 105 }),
      teacherId: createdTeachers[0].id,
    },
  ];

  const createdSubjects = [];

  for (const subject of subjects) {
    const createdSubject = await prisma.subject.create({
      data: subject,
    });

    createdSubjects.push(createdSubject);
  }

  console.log(`✅ Creadas ${createdSubjects.length} materias`);

  // Crear inscripciones
  console.log("📝 Creando inscripciones de estudiantes...");

  const enrollments = [
    // Ana está inscrita en Cálculo y Literatura
    {
      studentId: createdStudents[0].id,
      subjectId: createdSubjects[0].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[0].id,
      subjectId: createdSubjects[1].id,
      status: "APPROVED",
    },

    // José está inscrito en Física y Historia
    {
      studentId: createdStudents[1].id,
      subjectId: createdSubjects[2].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[1].id,
      subjectId: createdSubjects[3].id,
      status: "APPROVED",
    },

    // Daniela está inscrita en Cálculo, Literatura y Física
    {
      studentId: createdStudents[2].id,
      subjectId: createdSubjects[0].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[2].id,
      subjectId: createdSubjects[1].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[2].id,
      subjectId: createdSubjects[2].id,
      status: "APPROVED",
    },

    // Eduardo está inscrito en Historia y Álgebra
    {
      studentId: createdStudents[3].id,
      subjectId: createdSubjects[3].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[3].id,
      subjectId: createdSubjects[4].id,
      status: "PENDING",
    },

    // Sofía está inscrita en todas las materias
    {
      studentId: createdStudents[4].id,
      subjectId: createdSubjects[0].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[4].id,
      subjectId: createdSubjects[1].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[4].id,
      subjectId: createdSubjects[2].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[4].id,
      subjectId: createdSubjects[3].id,
      status: "APPROVED",
    },
    {
      studentId: createdStudents[4].id,
      subjectId: createdSubjects[4].id,
      status: "PENDING",
    },

    // Alejandro tiene algunas pendientes
    {
      studentId: createdStudents[5].id,
      subjectId: createdSubjects[0].id,
      status: "PENDING",
    },
    {
      studentId: createdStudents[5].id,
      subjectId: createdSubjects[2].id,
      status: "PENDING",
    },
  ];

  for (const enrollment of enrollments) {
    await prisma.enrollment.create({
      data: enrollment as any,
    });
  }

  console.log(`✅ Creadas ${enrollments.length} inscripciones`);

  // Crear tareas
  console.log("📝 Creando tareas...");

  // Tarea para Cálculo
  const calculoHomework = await prisma.homework.create({
    data: {
      title: "Límites y Continuidad",
      description:
        "Resolver los siguientes problemas de límites y continuidad. Mostrar todos los pasos.",
      dueDate: add(now, { days: 7 }),
      totalPoints: 100,
      allowFileUpload: true,
      subjectId: createdSubjects[0].id,
      teacherId: createdTeachers[0].id,
      questions: {
        create: [
          {
            order: 1,
            text: "¿Cuál es la definición formal de límite?",
            type: "OPEN_TEXT",
            points: 20,
          },
          {
            order: 2,
            text: "Calcular el límite: lim(x→2) (x²-4)/(x-2)",
            type: "OPEN_TEXT",
            points: 25,
          },
          {
            order: 3,
            text: "¿Es continua la función f(x) = |x| en x = 0?",
            type: "TRUE_FALSE",
            points: 15,
            correctAnswer: "true",
          },
          {
            order: 4,
            text: "¿Cuál de las siguientes afirmaciones es correcta sobre las funciones continuas?",
            type: "MULTIPLE_CHOICE",
            points: 20,
            options: JSON.stringify([
              {
                id: "0",
                text: "Todas las funciones polinomiales son discontinuas",
              },
              {
                id: "1",
                text: "Una función continua puede tener un número finito de puntos de discontinuidad",
              },
              {
                id: "2",
                text: "Si una función es continua en un intervalo cerrado, entonces está acotada en ese intervalo",
              },
              {
                id: "3",
                text: "Las funciones racionales son siempre continuas en todo su dominio",
              },
            ]),
            correctAnswer: "2",
          },
          {
            order: 5,
            text: "Explique el teorema del valor intermedio y dé un ejemplo de su aplicación.",
            type: "OPEN_TEXT",
            points: 20,
          },
        ],
      },
    },
    include: {
      questions: true,
    },
  });

  // Tarea para Literatura
  const literaturaHomework = await prisma.homework.create({
    data: {
      title: "Análisis de 'Cien años de soledad'",
      description:
        "Realizar un análisis literario de la obra 'Cien años de soledad' de Gabriel García Márquez.",
      dueDate: add(now, { days: -3 }), // Ya venció
      totalPoints: 100,
      allowFileUpload: true,
      subjectId: createdSubjects[1].id,
      teacherId: createdTeachers[1].id,
      questions: {
        create: [
          {
            order: 1,
            text: "¿Cuáles son los temas principales que se abordan en la obra?",
            type: "OPEN_TEXT",
            points: 20,
          },
          {
            order: 2,
            text: "¿Qué es el realismo mágico?",
            type: "OPEN_TEXT",
            points: 20,
          },
          {
            order: 3,
            text: "¿Macondo es un lugar real?",
            type: "TRUE_FALSE",
            points: 10,
            correctAnswer: "false",
          },
          {
            order: 4,
            text: "¿Quién fundó Macondo en la novela?",
            type: "MULTIPLE_CHOICE",
            points: 15,
            options: JSON.stringify([
              { id: "0", text: "Aureliano Buendía" },
              { id: "1", text: "José Arcadio Buendía" },
              { id: "2", text: "Úrsula Iguarán" },
              { id: "3", text: "Melquíades" },
            ]),
            correctAnswer: "1",
          },
          {
            order: 5,
            text: "Analice el personaje de Úrsula Iguarán y su importancia en la narrativa.",
            type: "OPEN_TEXT",
            points: 35,
          },
        ],
      },
    },
    include: {
      questions: true,
    },
  });

  // Crear algunas entregas y calificaciones
  console.log("📝 Creando entregas y calificaciones...");

  // Ana entrega la tarea de Cálculo
  const anaCalculoSubmission = await prisma.submission.create({
    data: {
      studentId: createdStudents[0].id,
      homeworkId: calculoHomework.id,
      status: "SUBMITTED",
      answers: {
        create: [
          {
            questionId: calculoHomework.questions[0].id,
            answerText:
              "Un límite es el valor al que se aproxima una función cuando la variable independiente se acerca a cierto valor. Formalmente, el límite de f(x) cuando x tiende a 'a' es L, si para todo ε > 0, existe un δ > 0 tal que si 0 < |x - a| < δ, entonces |f(x) - L| < ε.",
          },
          {
            questionId: calculoHomework.questions[1].id,
            answerText:
              "Al factorizar el numerador: (x²-4)/(x-2) = ((x-2)(x+2))/(x-2) = x+2, para x≠2. El límite cuando x→2 es 4.",
          },
          {
            questionId: calculoHomework.questions[2].id,
            answerOption: "true",
          },
          {
            questionId: calculoHomework.questions[3].id,
            answerOption: "2",
          },
          {
            questionId: calculoHomework.questions[4].id,
            answerText:
              "El teorema del valor intermedio establece que si f es una función continua en un intervalo cerrado [a,b], y si M es cualquier valor entre f(a) y f(b), entonces existe al menos un punto c en [a,b] tal que f(c) = M. Un ejemplo es encontrar que existe un momento del día donde la temperatura es exactamente 20°C, sabiendo que la temperatura varió continuamente de 15°C a 25°C durante el día.",
          },
        ],
      },
    },
  });

  // Calificar la tarea de Ana
  await prisma.grade.create({
    data: {
      score: 92,
      feedback:
        "Excelente trabajo. La explicación del teorema del valor intermedio podría ser más detallada.",
      studentId: createdStudents[0].id,
      teacherId: createdTeachers[0].id,
      submissionId: anaCalculoSubmission.id,
    },
  });

  // Daniela entrega la tarea de Literatura
  const danielaLiteraturaSubmission = await prisma.submission.create({
    data: {
      studentId: createdStudents[2].id,
      homeworkId: literaturaHomework.id,
      status: "SUBMITTED",
      answers: {
        create: [
          {
            questionId: literaturaHomework.questions[0].id,
            answerText:
              "Los temas principales incluyen la soledad, el paso del tiempo, la repetición de la historia familiar, el amor, la guerra, y la lucha entre tradición y progreso.",
          },
          {
            questionId: literaturaHomework.questions[1].id,
            answerText:
              "El realismo mágico es un estilo literario que incorpora elementos fantásticos o mágicos en una narrativa realista, tratando estos elementos como parte normal de la realidad cotidiana.",
          },
          {
            questionId: literaturaHomework.questions[2].id,
            answerOption: "false",
          },
          {
            questionId: literaturaHomework.questions[3].id,
            answerOption: "1",
          },
          {
            questionId: literaturaHomework.questions[4].id,
            answerText:
              "Úrsula Iguarán es el personaje femenino más importante de la novela, representando la estabilidad y continuidad de la familia Buendía. Es ella quien mantiene unida a la familia a través de generaciones, siendo testigo de la repetición de patrones y nombres. Su longevidad le permite ver la historia completa de Macondo, desde su fundación hasta su declive, simbolizando la memoria histórica y la sabiduría.",
          },
        ],
      },
    },
  });

  // Calificar la tarea de Daniela
  await prisma.grade.create({
    data: {
      score: 88,
      feedback:
        "Buen análisis de los temas y personajes. Tu comprensión del realismo mágico es acertada, pero podrías profundizar más en ejemplos específicos de la obra.",
      studentId: createdStudents[2].id,
      teacherId: createdTeachers[1].id,
      submissionId: danielaLiteraturaSubmission.id,
    },
  });

  // Crear algunas notificaciones
  console.log("🔔 Creando notificaciones...");

  await prisma.notification.create({
    data: {
      title: "Nueva tarea asignada",
      message: `Se ha asignado una nueva tarea "${calculoHomework.title}" en la materia "${createdSubjects[0].name}".`,
      userId: createdStudents[0].userId,
    },
  });

  await prisma.notification.create({
    data: {
      title: "Tarea calificada",
      message: `Tu tarea "${calculoHomework.title}" ha sido calificada con 92 puntos.`,
      userId: createdStudents[0].userId,
    },
  });

  await prisma.notification.create({
    data: {
      title: "Solicitud de inscripción pendiente",
      message: `Tienes una solicitud de inscripción pendiente para la materia "${createdSubjects[4].name}".`,
      userId: createdTeachers[0].userId,
    },
  });

  console.log("✅ Datos sembrados exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el proceso de sembrado:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
