// src/components/ImagePreviewDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import type { FileItem } from "../types";
import apiClient from "../api/client";
import { downloadFile } from "../api/files";

interface ImagePreviewDialogProps {
  open: boolean;
  file: FileItem | null;
  onClose: () => void;
}

export function ImagePreviewDialog({
  open,
  file,
  onClose,
}: ImagePreviewDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open && file) {
      setLoading(true);
      setError(false);

      apiClient
        .get(`/api/files/${file.id}/view/`, { responseType: "blob" })
        .then((response) => {
          const url = URL.createObjectURL(response.data);
          setImageUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file]);

  const handleDownload = () => {
    if (file) {
      downloadFile(file.id, file.original_name);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "black", color: "white", overflow: "hidden" },
      }}
    >
      <Box position="absolute" right={8} top={8} zIndex={10}>
        <IconButton
          onClick={onClose}
          sx={{ color: "white", bgcolor: "rgba(0,0,0,0.5)" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
          bgcolor: "#000",
        }}
      >
        {loading ? (
          <CircularProgress sx={{ color: "white" }} />
        ) : error ? (
          <Typography color="error">Failed to load image.</Typography>
        ) : (
          imageUrl && (
            <img
              src={imageUrl}
              alt={file?.original_name}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          )
        )}
      </DialogContent>

      <DialogActions
        sx={{ bgcolor: "#111", justifyContent: "space-between", px: 3 }}
      >
        <Typography variant="body2" sx={{ color: "#aaa" }}>
          {file?.original_name}
        </Typography>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
          variant="outlined"
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
