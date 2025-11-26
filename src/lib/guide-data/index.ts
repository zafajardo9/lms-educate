import courseGuide from './course-guide.json'

export type GuideSection = {
  id: string
  title: string
  icon: string
  content: string
  tips: string[]
  roles?: { name: string; description: string }[]
  groupTypes?: { name: string; description: string }[]
}

export type QuickAction = {
  label: string
  description: string
  path: string
}

export type FAQ = {
  question: string
  answer: string
}

export type CourseGuide = {
  title: string
  description: string
  sections: GuideSection[]
  quickActions: QuickAction[]
  faq: FAQ[]
}

export function getCourseGuide(): CourseGuide {
  return courseGuide as CourseGuide
}

export { courseGuide }
