'use client'

import { UserFilters, UserRole } from '@/types'
import { Button } from '@/components/ui/button'

interface UserFiltersComponentProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
}

export function UserFiltersComponent({ filters, onFiltersChange }: UserFiltersComponentProps) {
  const handleRoleFilter = (role: UserRole | undefined) => {
    onFiltersChange({ ...filters, role })
  }

  const handleStatusFilter = (isActive: boolean | undefined) => {
    onFiltersChange({ ...filters, isActive })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = filters.role || filters.isActive !== undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Role:</span>
          <Button
            variant={filters.role === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilter(undefined)}
          >
            All
          </Button>
          <Button
            variant={filters.role === UserRole.BUSINESS_OWNER ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilter(UserRole.BUSINESS_OWNER)}
          >
            Business Owner
          </Button>
          <Button
            variant={filters.role === UserRole.LECTURER ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilter(UserRole.LECTURER)}
          >
            Lecturer
          </Button>
          <Button
            variant={filters.role === UserRole.STUDENT ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilter(UserRole.STUDENT)}
          >
            Student
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Button
            variant={filters.isActive === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(undefined)}
          >
            All
          </Button>
          <Button
            variant={filters.isActive === true ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(true)}
          >
            Active
          </Button>
          <Button
            variant={filters.isActive === false ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(false)}
          >
            Inactive
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}