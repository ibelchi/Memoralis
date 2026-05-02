import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MEDIA_PATH = process.env.MEDIA_PATH || './media';

/**
 * Saves a file to the local filesystem in the specified subfolder.
 * @param file The file object to save.
 * @param subfolder The subfolder within MEDIA_PATH ('images' or 'audios').
 * @returns The relative path of the saved file (e.g., "images/uuid.jpg").
 */
export async function saveFile(file: File, subfolder: 'images' | 'audios' | 'avatars' | 'pdfs'): Promise<string> {
  try {
    const extension = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${extension}`;
    const relativePath = path.join(subfolder, filename);
    const fullPath = path.join(MEDIA_PATH, relativePath);

    // Ensure the subfolder exists
    await fs.mkdir(path.join(MEDIA_PATH, subfolder), { recursive: true });

    // Convert File to Buffer and write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(fullPath, buffer);

    // Return normalized path with forward slashes for database storage
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    console.error('Error in saveFile:', error);
    throw new Error('Could not save file to storage');
  }
}

/**
 * Deletes a file from the local filesystem.
 * @param filePath The relative path of the file to delete.
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(MEDIA_PATH, filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    // Only log error if it's not a "file not found" error
    if ((error as any).code !== 'ENOENT') {
      console.error('Error in deleteFile:', error);
      throw new Error('Could not delete file from storage');
    }
  }
}
