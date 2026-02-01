// src/hooks/useFiles.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFiles, uploadFile, deleteFile } from "../api/files";

export function useFiles(page: number = 1) {
  return useQuery({
    queryKey: ["files", page],
    queryFn: () => getFiles(page),
    // Keep previous data while fetching new page for smooth transition
    placeholderData: (previousData) => previousData,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (p: number) => void;
    }) => uploadFile(file, onProgress),
    onSuccess: () => {
      // Invalidate files query to refetch list
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
