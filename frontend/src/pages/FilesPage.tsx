// src/pages/FilesPage.tsx
import React, { useState } from "react";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { Layout } from "../components/Layout";
import { FileUpload } from "../components/FileUpload";
import { FileList } from "../components/FileList";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { useFiles, useUploadFile, useDeleteFile } from "../hooks/useFiles";
import { downloadFile } from "../api/files";
import type { FileItem } from "../types";
import { ShareDialog } from "../components/ShareDialog";

export const Files = () => {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    severity: "success" | "error";
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);

  // Queries & Mutations
  const { data, isLoading, error: listError } = useFiles(page);
  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteFile();

  // Handlers
  const handleUpload = async (file: File) => {
    uploadMutation.mutate(
      { file },
      {
        onSuccess: () =>
          setToast({ msg: "File uploaded successfully", severity: "success" }),
        onError: () => setToast({ msg: "Upload failed", severity: "error" }),
      },
    );
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await downloadFile(file.id, file.original_name);
    } catch (error) {
      setToast({ msg: "Download failed", severity: "error" });
    }
  };

  const handleDeleteRequest = (file: FileItem) => {
    setDeleteTarget(file);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setToast({ msg: "File deleted", severity: "success" });
        setDeleteTarget(null);
      },
      onError: () => setToast({ msg: "Delete failed", severity: "error" }),
    });
  };

  return (
    <Layout>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          My Files
        </Typography>
        <FileUpload
          onUpload={handleUpload}
          isUploading={uploadMutation.isPending}
        />
      </Box>

      <FileList
        data={data}
        isLoading={isLoading}
        onDownload={handleDownload}
        onDelete={handleDeleteRequest}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onShare={(file) => setShareTarget(file)}
      />

      <ShareDialog
        open={!!shareTarget}
        fileId={shareTarget?.id || ""}
        fileName={shareTarget?.original_name || ""}
        onClose={() => setShareTarget(null)}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        fileName={deleteTarget?.original_name || ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity || "info"}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
};
