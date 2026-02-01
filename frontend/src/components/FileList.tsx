// src/components/FileList.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Chip,
  Pagination,
  Skeleton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import type { FileItem, PaginatedResponse } from "../types";
import { formatFileSize, formatDate, getFileIconType } from "../utils/format";
import apiClient from "../api/client";

interface FileListProps {
  data: PaginatedResponse<FileItem> | undefined;
  isLoading: boolean;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onPreview?: (file: FileItem) => void;
  page: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

const getIcon = (mimeType: string) => {
  const type = getFileIconType(mimeType);
  switch (type) {
    case "image":
      return <ImageIcon color="primary" />;
    case "pdf":
      return <PictureAsPdfIcon color="error" />;
    case "text":
      return <DescriptionIcon color="info" />;
    default:
      return <InsertDriveFileIcon color="action" />;
  }
};

export const FileList: React.FC<FileListProps> = ({
  data,
  isLoading,
  onDownload,
  onDelete,
  onShare,
  onPreview,
  page,
  onPageChange,
}) => {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Create a Ref to track IDs we have already requested to prevent loops
  const fetchedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data?.results) return;

    const imageFiles = data.results.filter((f) =>
      f.mime_type.startsWith("image/"),
    );

    imageFiles.forEach(async (file) => {
      // Check if we already have it or are currently fetching it
      if (thumbnails[file.id] || fetchedIds.current.has(file.id)) return;

      fetchedIds.current.add(file.id);

      try {
        const response = await apiClient.get(`/api/files/${file.id}/preview/`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(response.data);
        setThumbnails((prev) => ({ ...prev, [file.id]: url }));
      } catch (err) {
        console.warn(`Failed to load thumbnail for ${file.id}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={60}
            sx={{ my: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  if (!data?.results?.length) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No files uploaded yet.</Typography>
      </Paper>
    );
  }

  const totalPages = Math.ceil(data.count / 10);

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.results.map((file) => (
              <TableRow key={file.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    {thumbnails[file.id] ? (
                      <Box
                        component="img"
                        src={thumbnails[file.id]}
                        alt={file.original_name}
                        sx={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 1,
                          cursor: "pointer",
                          border: "1px solid #eee",
                        }}
                        onClick={() => onPreview?.(file)}
                      />
                    ) : (
                      getIcon(file.mime_type)
                    )}

                    <Typography
                      variant="body2"
                      sx={{
                        cursor: thumbnails[file.id] ? "pointer" : "default",
                        fontWeight: 500,
                      }}
                      onClick={() => thumbnails[file.id] && onPreview?.(file)}
                    >
                      {file.original_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{formatFileSize(file.size_bytes)}</TableCell>
                <TableCell>
                  <Chip
                    label={file.mime_type.split("/")[1].toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDate(file.created_at)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => onShare(file)}
                    size="small"
                    color="info"
                    title="Share"
                  >
                    <ShareIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDownload(file)}
                    size="small"
                    color="primary"
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(file)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
