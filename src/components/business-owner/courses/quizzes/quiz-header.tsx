"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, FileText } from "lucide-react"

interface QuizHeaderProps {
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPreview: () => void
  questionCount: number
}

export function QuizHeader({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onPreview,
  questionCount,
}: QuizHeaderProps) {
  return (
    <Card className="border-t-4 border-t-primary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">
              {questionCount} {questionCount === 1 ? "Question" : "Questions"}
            </span>
          </div>
          <Button onClick={onPreview} variant="outline" size="sm" className="gap-2 bg-transparent">
            <Eye className="h-4 w-4" />
            Preview Quiz
          </Button>
        </div>

        <Input
          placeholder="Untitled Quiz"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-2xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />

        <Textarea
          placeholder="Add a description for your quiz..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="mt-4 min-h-[60px] border-0 border-b rounded-none px-0 resize-none focus-visible:ring-0 focus-visible:border-primary"
        />
      </CardContent>
    </Card>
  )
}
