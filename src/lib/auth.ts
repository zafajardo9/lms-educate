import { betterAuth } from "better-auth"
import { User } from "@/lib/models/User"
import connectDB from "@/lib/mongodb"

export const auth = betterAuth({
  database: {
    provider: "mongodb",
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/lms-platform",
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
        // Ensure database connection
        await connectDB()
        
        // Create user in our User model as well for compatibility
        try {
          await User.create({
            email: user.email,
            name: user.name,
            role: user.role || "STUDENT",
            isActive: user.isActive !== false,
            // Better Auth will handle password hashing
            password: "managed_by_better_auth",
          })
        } catch (error) {
          console.error("Error creating user in User model:", error)
        }
      },
      signIn: async ({ user }: { user: any }) => {
        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is disabled")
        }
        return user
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session