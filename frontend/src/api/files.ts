// src/api/files.ts
import apiClient from "./client";
import type {
  FileItem,
  PaginatedResponse,
  SharedLink,
  ExpiresIn,
} from "../types";

export async function getFiles(
  page: number = 1,
): Promise<PaginatedResponse<FileItem>> {
  const response = await apiClient.get<PaginatedResponse<FileItem>>(
    "/api/files/",
    { params: { page } },
  );
  return response.data;
}

export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<FileItem> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<FileItem>(
    "/api/files/upload/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    },
  );
  return response.data;
}

export async function downloadFile(
  fileId: string,
  fileName: string,
): Promise<void> {
  const response = await apiClient.get(`/api/files/${fileId}/download/`, {
    responseType: "blob",
  });

  // Create download link and trigger click
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteFile(fileId: string): Promise<void> {
  await apiClient.delete(`/api/files/${fileId}/`);
}

export async function shareFile(
  fileId: string,
  expiresIn: ExpiresIn,
): Promise<SharedLink> {
  const response = await apiClient.post<SharedLink>(
    `/api/files/${fileId}/share/`,
    {
      expires_in: expiresIn,
    },
  );
  return response.data;
}
