/**
 * Client-visible upload limit. Must match the backend's MAX_FILE_SIZE_MB so the
 * client rejects the same files the server would (multer config in backend).
 * NEXT_PUBLIC_ vars are inlined at build time, so set it in the frontend's env.
 */
export const MAX_FILE_SIZE_MB =
  Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB) || 15;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validate selected files against the max size. Returns a user-facing error
 * string if any file is too large, or '' when everything is within the limit.
 */
export function validateFileSizes(files: FileList | null): string {
  if (!files || files.length === 0) return '';

  const tooBig = Array.from(files).filter((f) => f.size > MAX_FILE_SIZE_BYTES);
  if (tooBig.length === 0) return '';

  const names = tooBig.map((f) => `"${f.name}"`).join(', ');
  const subject = tooBig.length > 1 ? `These files exceed` : `This file exceeds`;
  return `${subject} the maximum allowed size of ${MAX_FILE_SIZE_MB} MB (${names}). Please upload a smaller file.`;
}
