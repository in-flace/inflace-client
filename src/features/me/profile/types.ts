import type { UserRole, Need } from '@/entities/user'

export type { UserRole, Need }

export interface MyProfileAccountDto {
  profileImageUrl: string
  name: string
  email: string
  enteredAt: string
}

export interface MyProfilePreferencesDto {
  roles: UserRole[]
  needs: Need[]
}

export interface MyProfileDto {
  account: MyProfileAccountDto
  preferences: MyProfilePreferencesDto
}

export interface ProfileImageUploadUrlRequest {
  contentType: string
  fileSize: number
}

export interface ProfileImageUploadUrlResponse {
  uploadUrl: string
  objectKey: string
  publicUrl: string
  expiresInSeconds: number
}

export interface ProfileImageUpdateRequest {
  objectKey: string
}
