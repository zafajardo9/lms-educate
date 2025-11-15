import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import prisma from "@/lib/prisma"
import { UserRole } from "@/types"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
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
          await prisma.$transaction(async (tx) => {
            const dbUser = await tx.user.upsert({
              where: { email: user.email },
              update: {
                name: user.name || user.email,
                role,
                isActive,
              },
              create: {
                id: user.id,
                email: user.email,
                name: user.name || user.email,
                role,
                isActive,
              },
            })

            await tx.userProfile.upsert({
              where: { userId: dbUser.id },
              create: { userId: dbUser.id },
              update: {},
            })
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