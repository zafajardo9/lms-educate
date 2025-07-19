'use client'

import { useState, useEffect } from 'react'
import { User, UserProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface UserProfileManagementProps {
  user: User
  onProfileUpdated?: () => void
}

export function UserProfileManagement({ user, onProfileUpdated }: UserProfileManagementProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    bio: '',
    avatar: '',
    phone: '',
    dateOfBirth: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [user.id])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${user.id}/profile`)
      const data = await response.json()

      if (data.success && data.data.profile) {
        const profileData = data.data.profile
        setProfile(profileData)
        setFormData({
          bio: profileData.bio || '',
          avatar: profileData.avatar || '',
          phone: profileData.phone || '',
          dateOfBirth: profileData.dateOfBirth 
            ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] 
            : '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth 
          ? new Date(formData.dateOfBirth).toISOString() 
          : undefined,
      }

      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.data.profile)
        toast.success('Profile updated successfully')
        onProfileUpdated?.()
      } else {
        toast.error(data.error?.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage profile information for {user.name}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                type="text"
                value={user.name}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Avatar URL</label>
              <Input
                type="url"
                value={formData.avatar}
                onChange={(e) => handleChange('avatar', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>

        {profile && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Profile Preview</h3>
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              {profile.avatar && (
                <div>
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              {profile.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
              {profile.dateOfBirth && (
                <p><strong>Date of Birth:</strong> {new Date(profile.dateOfBirth).toLocaleDateString()}</p>
              )}
              {profile.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}