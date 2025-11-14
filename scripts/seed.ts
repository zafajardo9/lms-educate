import dotenv from 'dotenv'
import { auth } from '../src/lib/auth'
import prisma from '../src/lib/prisma'
import { UserRole } from '../src/types'

// Load environment variables
dotenv.config({ path: '.env.local' })

const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seeding with Better Auth and Prisma...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Connected to PostgreSQL')

    // Create seed users using Better Auth
    const users = [
      {
        email: 'admin@lms.com',
        password: 'admin123',
        name: 'System Administrator',
        role: UserRole.BUSINESS_OWNER,
      },
      {
        email: 'lecturer@lms.com',
        password: 'lecturer123',
        name: 'John Lecturer',
        role: UserRole.LECTURER,
      },
      {
        email: 'student@lms.com',
        password: 'student123',
        name: 'Jane Student',
        role: UserRole.STUDENT,
      },
      {
        email: 'lecturer2@lms.com',
        password: 'lecturer123',
        name: 'Sarah Teacher',
        role: UserRole.LECTURER,
      },
      {
        email: 'student2@lms.com',
        password: 'student123',
        name: 'Mike Student',
        role: UserRole.STUDENT,
      },
    ]

    // Create users through Better Auth
    for (const userData of users) {
      try {
        const user = await auth.api.signUpEmail({
          body: {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role,
            isActive: true,
          },
        })
        console.log(`✅ Created user: ${userData.email} (${userData.role})`)
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  User already exists: ${userData.email}`)
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message)
        }
      }
    }

    console.log('🎉 User seeding completed successfully!')
    console.log('\n📋 Test Accounts Created:')
    console.log('👑 Business Owner: admin@lms.com / admin123')
    console.log('👨‍🏫 Lecturer: lecturer@lms.com / lecturer123')
    console.log('👨‍🏫 Lecturer 2: lecturer2@lms.com / lecturer123')
    console.log('👨‍🎓 Student: student@lms.com / student123')
    console.log('👨‍🎓 Student 2: student2@lms.com / student123')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the seed function
seedUsers()