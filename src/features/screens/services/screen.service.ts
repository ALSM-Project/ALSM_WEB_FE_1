import { mockScreens, mockUploadedFiles } from '@/mocks/screens.mock';
import type { LegacyScreen, SourceFile } from '../types/screen';

export class ScreenService {
  private screens: LegacyScreen[] = [...mockScreens];
  private uploadedFiles: SourceFile[] = [...mockUploadedFiles];

  async getScreens(projectId: string): Promise<LegacyScreen[]> {
    console.log('[ScreenService] Getting screens for project:', projectId);
    return [...this.screens];
  }

  async getScreenById(screenId: string): Promise<LegacyScreen | null> {
    return this.screens.find((s) => s.id === screenId) || this.screens[0] || null;
  }

  async uploadFile(file: File): Promise<SourceFile> {
    const newFile: SourceFile = {
      id: `file-${Date.now()}`,
      fileName: file.name,
      sizeKb: Math.round(file.size / 1024),
      uploadedAt: 'Just now',
      status: 'Ready',
    };
    this.uploadedFiles.unshift(newFile);
    return newFile;
  }

  async getUploadedFiles(): Promise<SourceFile[]> {
    return [...this.uploadedFiles];
  }
}

export const screenService = new ScreenService();
