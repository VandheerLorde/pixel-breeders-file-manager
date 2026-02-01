// src/components/FileUpload.tsx
import React, { useState, useRef } from "react";
import { Box, Typography, Paper, LinearProgress, Alert } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  isUploading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return "File too large (Max 10MB)";
    if (!ALLOWED_TYPES.includes(file.type)) return "Invalid file type";
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <Box mb={4}>
      <Paper
        variant="outlined"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          p: 4,
          textAlign: "center",
          cursor: isUploading ? "default" : "pointer",
          borderStyle: "dashed",
          borderColor: dragActive ? "primary.main" : "grey.400",
          backgroundColor: dragActive ? "action.hover" : "background.paper",
          transition: "all 0.2s ease",
          opacity: isUploading ? 0.6 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleChange}
          disabled={isUploading}
          accept={ALLOWED_TYPES.join(",")}
        />

        <CloudUploadIcon
          sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
        />
        <Typography variant="h6" color="text.primary" gutterBottom>
          {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Images, PDF, Text (Max 10MB)
        </Typography>
      </Paper>

      {isUploading && <LinearProgress sx={{ mt: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
