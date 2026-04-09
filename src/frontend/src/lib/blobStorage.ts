import type { BackendActor } from "../config";
import { createActorWithConfig } from "../config";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_SIZE = 900 * 1024; // 900KB chunks (safely under 2MB ICP ingress limit)
const CHUNKS_PREFIX = "chunks:";

let actorCache: BackendActor | null = null;

async function getActor(): Promise<BackendActor> {
  if (actorCache) return actorCache;
  actorCache = await createActorWithConfig();
  return actorCache;
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB. Please compress the file and try again.`,
    );
  }

  const actor = await getActor();
  const bytes = new Uint8Array(await file.arrayBuffer());

  onProgress?.(5);

  // Split into chunks
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    chunks.push(bytes.slice(i, i + CHUNK_SIZE));
  }
  // Always at least one chunk (empty file)
  if (chunks.length === 0) chunks.push(new Uint8Array(0));

  const chunkIds: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const id = await actor.storeDocument(chunks[i], `${file.name}.chunk${i}`);
    chunkIds.push(id);
    onProgress?.(5 + Math.round(((i + 1) / chunks.length) * 90));
  }

  onProgress?.(100);

  // Single chunk: return plain ID for backward compatibility
  if (chunkIds.length === 1) {
    return chunkIds[0];
  }

  return CHUNKS_PREFIX + JSON.stringify(chunkIds);
}

const urlCache = new Map<string, string>();

export async function getFileURL(fileId: string): Promise<string> {
  if (urlCache.has(fileId)) return urlCache.get(fileId)!;

  const actor = await getActor();

  // New chunked multi-part files
  if (fileId.startsWith(CHUNKS_PREFIX)) {
    const chunkIds = JSON.parse(fileId.slice(CHUNKS_PREFIX.length)) as string[];
    const chunkBlobs = await Promise.all(
      chunkIds.map(async (id) => {
        const result = await actor.getDocumentBlob(id);
        // Candid optional returns [] or [value]
        if (!result || result.length === 0)
          throw new Error(`Chunk ${id} not found`);
        const bytes = result[0] as Uint8Array;
        const copy = new Uint8Array(bytes.length);
        copy.set(bytes);
        return copy;
      }),
    );
    // Concatenate all chunks
    const totalLength = chunkBlobs.reduce((sum, c) => sum + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunkBlobs) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    const blob = new Blob([combined.buffer]);
    const url = URL.createObjectURL(blob);
    urlCache.set(fileId, url);
    return url;
  }

  // Legacy: sha256 hashes from old blob storage (unlikely to be needed)
  if (fileId.startsWith("sha256:")) {
    throw new Error(
      "Legacy blob storage URLs are no longer supported. Please re-upload the file.",
    );
  }

  // Direct canister doc_X ID (single chunk or legacy)
  const result = await actor.getDocumentBlob(fileId);
  // Candid optional returns [] or [value]
  if (!result || result.length === 0) throw new Error("Document not found");
  const bytes = result[0] as Uint8Array;
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy.buffer]);
  const url = URL.createObjectURL(blob);
  urlCache.set(fileId, url);
  return url;
}

export async function uploadDataURL(
  dataUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], "signature.png", { type: "image/png" });
  return uploadFile(file, onProgress);
}
