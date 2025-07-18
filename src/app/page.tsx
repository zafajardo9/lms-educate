import { redirect } from 'next/navigation'

export default function HomePage() {
  // For now, redirect to login page
  // Later we can add session checking here
  redirect('/auth/login')
}