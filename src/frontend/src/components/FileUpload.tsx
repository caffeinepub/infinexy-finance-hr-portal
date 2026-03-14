import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { uploadFile } from "../lib/blobStorage";

interface FileUploadProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  fileId?: string;
  fileName?: string;
  onUploaded: (fileId: string, fileName: string) => void;
  accept?: string;
  "data-ocid"?: string;
}

export default function FileUpload({
  label,
  required,
  optional,
  fileId,
  fileName,
  onUploaded,
  accept = "image/*,.pdf,.doc,.docx",
  "data-ocid": dataOcid,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size check (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max size: 10 MB. Please compress and retry.`,
      );
      // Reset input so the same file can be re-selected after compression
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const id = await uploadFile(file, setProgress);
      onUploaded(id, file.name);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {optional && (
          <span className="text-muted-foreground ml-1 font-normal">
            (Optional)
          </span>
        )}
      </span>
      <div className="text-xs text-muted-foreground">Max file size: 10 MB</div>
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-ocid={dataOcid}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-1" />
          )}
          {uploading
            ? `Uploading ${progress}%`
            : fileId
              ? "Re-upload"
              : "Choose File"}
        </Button>
        {fileId && !uploading && (
          <span className="flex items-center gap-1 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            {fileName || "Uploaded"}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <XCircle className="w-4 h-4" />
            {error}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
