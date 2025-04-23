// auth.ts
import NextAuth, { User, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "./prisma"; // Using centralized Prisma client
import { saltAndHashPassword, verifyPassword } from "./utils/password";
import { z } from "zod";

// Extend types for NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    role?: "STUDENT" | "TEACHER" | "ADMIN" | "SUPERADMIN";
    name: string; // Must be string, not string | null
    email: string;
    isOnboarded?: boolean;
  }

  interface Session extends DefaultSession {
    user: User & {
      id: string;
      role?: "STUDENT" | "TEACHER" | "ADMIN" | "SUPERADMIN";
      isOnboarded?: boolean;
    };
  }
}

// Validation schemas
const emailCredentialsSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().optional(),
  action: z.enum(["login", "register"]).optional(),
  source: z.string().optional(),
});

// Student ID credentials validation schema
const studentIdCredentialsSchema = z.object({
  studentId: z.string().length(6, "El ID de estudiante debe tener 6 dígitos"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Student activation validation schema
const studentActivationSchema = z
  .object({
    studentId: z.string().length(6, "El ID de estudiante debe tener 6 dígitos"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme su contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Handle regular user login
async function handleLogin(
  credentials: z.infer<typeof emailCredentialsSchema>
): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  // if (!user || !user.salt || !user.hash) {
  //   throw new Error("Invalid email or password");
  // }

  // if (!verifyPassword(credentials.password, user.salt, user.hash)) {
  //   throw new Error("Invalid email or password");
  // }

  // Convert to User type compatible with NextAuth
  return {
    id: user!.id,
    name: user!.name || "", // Ensure name is string, not null
    email: user!.email,
    role: user!.role,
    isOnboarded: user!.isOnboarded,
  };
}

// Handle regular user registration
async function handleRegistration(
  credentials: z.infer<typeof emailCredentialsSchema>
): Promise<User> {
  if (!credentials.name) {
    throw new Error("Name is required for registration");
  }

  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Create new user with hashed password
  const { salt, hash } = saltAndHashPassword(credentials.password);
  const newUser = await prisma.user.create({
    data: {
      email: credentials.email,
      name: credentials.name,
      salt: salt,
      hash: hash,
      role: "STUDENT", // Default role
      isOnboarded: false,
    },
  });

  // Convert to User type compatible with NextAuth
  return {
    id: newUser.id,
    name: newUser.name || "", // Ensure name is string, not null
    email: newUser.email,
    role: newUser.role,
    isOnboarded: newUser.isOnboarded,
  };
}

// Handle student login
async function handleStudentLogin(
  credentials: z.infer<typeof studentIdCredentialsSchema>
): Promise<User> {
  // Find student by ID
  const student = await prisma.student.findUnique({
    where: { studentId: credentials.studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error("Estudiante no encontrado");
  }

  // Check if student is activated
  if (!student.isActivated) {
    throw new Error(
      "Esta cuenta no está activada. Por favor, crea una contraseña."
    );
  }

  // Verify password - we check if user has salt/hash for regular auth or direct password for simple auth
  if (student.user.salt && student.user.hash) {
    if (
      !verifyPassword(
        credentials.password,
        student.user.salt,
        student.user.hash
      )
    ) {
      throw new Error("Contraseña incorrecta");
    }
  } else if (student.user.password !== credentials.password) {
    throw new Error("Contraseña incorrecta");
  }

  // Convert to User type compatible with NextAuth
  return {
    id: student.user.id,
    name: student.user.name || "", // Ensure name is string, not null
    email: student.user.email,
    role: student.user.role,
  };
}

// Handle student activation
async function handleStudentActivation(
  credentials: z.infer<typeof studentActivationSchema>
): Promise<User> {
  // Find student by ID
  const student = await prisma.student.findUnique({
    where: { studentId: credentials.studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error("Estudiante no encontrado");
  }

  // Check if student is already activated
  if (student.isActivated) {
    throw new Error("Esta cuenta ya está activada");
  }

  try {
    // Determine if we're using hash/salt or direct password storage
    if (student.user.hash !== null && student.user.salt !== null) {
      // Update with hashed password
      const { salt, hash } = saltAndHashPassword(credentials.password);

      await prisma.user.update({
        where: { id: student.userId },
        data: { salt, hash },
      });
    } else {
      // Update with direct password
      await prisma.user.update({
        where: { id: student.userId },
        data: { password: credentials.password },
      });
    }

    // Activate the account
    await prisma.student.update({
      where: { id: student.id },
      data: { isActivated: true },
    });

    // Convert to User type compatible with NextAuth
    return {
      id: student.user.id,
      name: student.user.name || "", // Ensure name is string, not null
      email: student.user.email,
      role: student.user.role,
    };
  } catch (error) {
    console.error("Error updating student:", error);
    throw new Error("Error al activar la cuenta");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      id: "credentials-email",
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
        name: { label: "Nombre", type: "text" },
        action: { label: "Acción", type: "text" },
        source: { label: "Fuente", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        try {
          // Validate credentials
          const parsedCredentials =
            emailCredentialsSchema.safeParse(credentials);

          if (!parsedCredentials.success) {
            console.error("Validation error:", parsedCredentials.error.errors);
            return null;
          }

          const { action, source } = parsedCredentials.data;

          // Handle special source like ClickFunnels
          if (source === "clickfunnels") {
            // Add special handling for ClickFunnels if needed
            return handleRegistration(parsedCredentials.data);
          }

          // Regular flow
          if (action === "register") {
            return handleRegistration(parsedCredentials.data);
          } else {
            return handleLogin(parsedCredentials.data);
          }
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
    Credentials({
      id: "credentials-student",
      name: "ID de Estudiante",
      credentials: {
        studentId: { label: "ID de Estudiante", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        try {
          // Validate credentials
          const parsedCredentials =
            studentIdCredentialsSchema.safeParse(credentials);

          if (!parsedCredentials.success) {
            console.error("Validation error:", parsedCredentials.error.errors);
            return null;
          }

          return handleStudentLogin(parsedCredentials.data);
        } catch (error) {
          console.error("Student login error:", error);
          throw error;
        }
      },
    }),
    Credentials({
      id: "student-activation",
      name: "Activación de Estudiante",
      credentials: {
        studentId: { label: "ID de Estudiante", type: "text" },
        password: { label: "Contraseña", type: "password" },
        confirmPassword: { label: "Confirmar Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          // Validate credentials
          const parsedCredentials =
            studentActivationSchema.safeParse(credentials);

          if (!parsedCredentials.success) {
            console.error("Validation error:", parsedCredentials.error.errors);
            return null;
          }

          return handleStudentActivation(parsedCredentials.data);
        } catch (error) {
          console.error("Student activation error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Optional: Add mailer integration or other third-party service sync
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isOnboarded = user.isOnboarded;
      }

      if (trigger === "update" && session?.user) {
        // Handle user data updates
        if (session.user.name) token.name = session.user.name;
        if (session.user.role) token.role = session.user.role;
        if (session.user.isOnboarded !== undefined)
          token.isOnboarded = session.user.isOnboarded;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as
          | "STUDENT"
          | "TEACHER"
          | "ADMIN"
          | "SUPERADMIN";
        session.user.isOnboarded = token.isOnboarded as boolean;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      // Always allow NextAuth routes
      if (pathname.startsWith("/api/auth")) return true;

      // Allow static files, images, and favicon
      const isStatic =
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/assets") ||
        pathname.endsWith(".css") ||
        pathname.endsWith(".js") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".svg");

      if (isStatic) return true;

      // Allow login page without session and student check API
      if (
        !auth?.user &&
        (pathname === "/login" || pathname.startsWith("/api/students/check"))
      )
        return true;

      // Redirect if there's no session and it's not an API route
      if (!auth?.user && !pathname.startsWith("/api/")) {
        // Redirect to login page
        return false;
      }

      // Control access based on roles
      if (
        pathname.startsWith("/admin") &&
        auth?.user.role !== "ADMIN" &&
        auth?.user.role !== "SUPERADMIN"
      ) {
        return false;
      }

      if (pathname.startsWith("/teacher") && auth?.user.role !== "TEACHER") {
        return false;
      }

      if (pathname.startsWith("/student") && auth?.user.role !== "STUDENT") {
        return false;
      }

      return true;
    },
  },
  debug: process.env.NODE_ENV === "development", // Enable debug mode in development
});

// Helper function for registration
export async function register(
  email: string,
  password: string,
  name: string,
  source?: string
) {
  return signIn("credentials-email", {
    email,
    password,
    name,
    source,
    action: "register",
    redirect: false,
  });
}
