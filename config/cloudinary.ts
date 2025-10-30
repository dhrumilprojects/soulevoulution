import Constants from 'expo-constants';

type CloudinaryConfig = {
  cloudName: string;
  uploadPreset: string;
  apiBaseUrl: string;
};

const extra = (Constants.expoConfig as any)?.extra || {};

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: extra.CLOUDINARY_CLOUD_NAME || 'dpomxki5z',
  uploadPreset: extra.CLOUDINARY_UPLOAD_PRESET || 'soulevolution',
  apiBaseUrl: 'https://api.cloudinary.com/v1_1',
};

export function getCloudinaryUploadUrl(): string {
  if (!cloudinaryConfig.cloudName) return '';
  return `${cloudinaryConfig.apiBaseUrl}/${cloudinaryConfig.cloudName}/upload`;
}


