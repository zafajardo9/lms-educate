import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import { User as IUser, UserRole, UserProfile as IUserProfile } from '@/types'

// User Profile Schema
const userProfileSchema = new Schema<IUserProfile>({
  userId: { type: String, required: true, unique: true },
  bio: { type: String },
  avatar: { type: String },
  phone: { type: String },
  dateOfBirth: { type: Date },
}, {
  timestamps: true,
})

// User Schema - Extended for Better Auth compatibility
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

// Virtual for profile
userSchema.virtual('profile', {
  ref: 'UserProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
})

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

// Hash password before saving (only if password is provided)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

// Indexes
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })

export const User = mongoose.models.User || mongoose.model('User', userSchema)
export const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema)