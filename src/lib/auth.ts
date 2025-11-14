import { betterAuth } from "better-auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@/types"

export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/lms-platform",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    },
  },
  callbacks: {
    user: {
      created: async ({ user }: { user: any }) => {
        const role = (user.role as UserRole) || UserRole.STUDENT
        const isActive = user.isActive !== false

        try {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              role,
              isActive,
            },
            create: {
              email: user.email,
              name: user.name || user.email,
              role,
              isActive,
              password: user.password ?? "managed_by_better_auth",
            },
          })
        } catch (error) {
          console.error("Error syncing Prisma user record:", error)
        }
      },
      signIn: async ({ user }: { user: any }) => {
        if (!user.isActive) {
          throw new Error("Account is disabled")
        }

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        if (dbUser && !dbUser.isActive) {
          throw new Error("Account is disabled")
        }

        return user
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session