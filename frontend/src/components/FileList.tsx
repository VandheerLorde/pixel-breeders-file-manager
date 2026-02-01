// src/components/FileList.tsx
import React from "react";
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
  CircularProgress,
  Skeleton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ShareIcon from "@mui/icons-material/Share";

import type { FileItem, PaginatedResponse } from "../types";
import { formatFileSize, formatDate, getFileIconType } from "../utils/format";

interface FileListProps {
  data: PaginatedResponse<FileItem> | undefined;
  isLoading: boolean;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  page: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  onShare: (file: FileItem) => void;
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
  page,
  onPageChange,
  onShare,
}) => {
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

  const totalPages = Math.ceil(data.count / 10); // Assuming page size 10 from backend

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
                    {getIcon(file.mime_type)}
                    <Typography variant="body2">
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
