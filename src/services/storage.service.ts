import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'bug-attachments';

export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
  path: string;
}

class StorageService {
  // Initialiser le bucket si nécessaire
  async initBucket(): Promise<boolean> {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }
    }
    
    return true;
  }

  // Uploader un fichier pour un bug
  async uploadFile(bugId: string, file: File): Promise<Attachment | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `bugs/${bugId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
      path: filePath
    };
  }

  // Supprimer un fichier
  async deleteFile(filePath: string): Promise<boolean> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    return true;
  }

  // Télécharger un fichier (obtenir l'URL signée pour les fichiers privés)
  async getSignedUrl(filePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 heure

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  }
}

export const storageService = new StorageService();