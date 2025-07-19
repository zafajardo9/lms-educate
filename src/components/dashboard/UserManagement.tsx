'use client'

import { useState, useEffect } from 'react'
import { User, UserRole, UserFilters } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserTable } from './UserTable'
import { CreateUserDialog } from './CreateUserDialog'
import { EditUserDialog } from './EditUserDialog'
import { DeleteUserDialog } from './DeleteUserDialog'
import { UserFiltersComponent } from './UserFilters'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaginatedUsers {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function UserManagement() {
  const [users, setUsers] = useState<PaginatedUsers | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.role && { role: filters.role }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive.toString() }),
      })

      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
      } else {
        toast.error(data.error?.message || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, filters])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleUserCreated = () => {
    setShowCreateDialog(false)
    fetchUsers()
    toast.success('User created successfully')
  }

  const handleUserUpdated = () => {
    setShowEditDialog(false)
    setSelectedUser(null)
    fetchUsers()
    toast.success('User updated successfully')
  }

  const handleUserDeleted = () => {
    setShowDeleteDialog(false)
    setSelectedUser(null)
    fetchUsers()
    toast.success('User deleted successfully')
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground">
            {users ? `${users.pagination.total} total users` : 'Loading...'}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <UserFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : users ? (
            <UserTable
              users={users.users}
              pagination={users.pagination}
              onPageChange={handlePageChange}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onUserCreated={handleUserCreated}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            user={selectedUser}
            onUserUpdated={handleUserUpdated}
          />
          <DeleteUserDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            user={selectedUser}
            onUserDeleted={handleUserDeleted}
          />
        </>
      )}
    </div>
  )
}