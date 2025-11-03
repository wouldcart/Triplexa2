import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { StaffDocument } from '@/types/staff';

const BUCKET = 'staff_docs';

function toStaffDocument(row: any): StaffDocument {
  return {
    id: row.id,
    staffId: row.staff_id,
    docType: row.doc_type,
    fileName: row.file_name,
    fileExt: row.file_ext || undefined,
    mimeType: row.mime_type || undefined,
    sizeBytes: row.size_bytes || undefined,
    storagePath: row.storage_path,
    sha256: row.sha256 || undefined,
    status: row.status,
    verifiedBy: row.verified_by || undefined,
    verifiedAt: row.verified_at || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function slugify(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
}

export async function listDocuments(staffId: string): Promise<StaffDocument[]> {
  const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
  const { data, error } = await client
    .from('staff_documents' as any)
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(toStaffDocument);
}

export async function getSignedUrl(storagePath: string, expiresInSeconds: number = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl || null;
}

export async function uploadDocument(
  staffId: string,
  file: File,
  docType: string,
  notes?: string
): Promise<StaffDocument> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const base = slugify(file.name.replace(/\.[^.]+$/, ''));
  const unique = crypto.randomUUID();
  const storagePath = `staff/${staffId}/documents/${unique}_${base}${ext ? '.' + ext : ''}`;

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    upsert: true,
    cacheControl: '3600',
  });
  if (uploadErr) throw new Error(uploadErr.message);

  const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
  const { data, error } = await client
    .from('staff_documents' as any)
    .insert({
      staff_id: staffId,
      doc_type: docType,
      file_name: file.name,
      file_ext: ext || null,
      mime_type: file.type || null,
      size_bytes: (file as any).size || null,
      storage_path: storagePath,
      status: 'pending',
      notes: notes || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return toStaffDocument(data);
}

export async function approveDocument(documentId: string): Promise<void> {
  const { error } = await supabase
    .from('staff_documents' as any)
    .update({ status: 'approved' })
    .eq('id', documentId);
  if (error) throw new Error(error.message);
}

export async function rejectDocument(documentId: string, notes?: string): Promise<void> {
  const { error } = await supabase
    .from('staff_documents' as any)
    .update({ status: 'rejected', notes: notes || null })
    .eq('id', documentId);
  if (error) throw new Error(error.message);
}

export async function deleteDocument(doc: StaffDocument): Promise<void> {
  // Remove storage object first
  const { error: delErr } = await supabase.storage.from(BUCKET).remove([doc.storagePath]);
  if (delErr) throw new Error(delErr.message);

  const { error } = await supabase
    .from('staff_documents' as any)
    .delete()
    .eq('id', doc.id);
  if (error) throw new Error(error.message);
}