import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  InputAdornment,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { ExpiresIn, SharedLink } from "../types";
import { shareFile } from "../api/files";
import { formatDate } from "../utils/format";

interface ShareDialogProps {
  open: boolean;
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  fileId,
  fileName,
  onClose,
}) => {
  const [expiry, setExpiry] = useState<ExpiresIn>("24h");
  const [result, setResult] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state when opening/closing
  React.useEffect(() => {
    if (open) {
      setResult(null);
      setError(null);
      setExpiry("24h");
      setCopied(false);
    }
  }, [open, fileId]);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const link = await shareFile(fileId, expiry);
      setResult(link);
    } catch (err) {
      setError("Failed to create link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      // If the backend returns a full URL, use it.
      // Otherwise, construct the frontend URL:
      // const url = `${window.location.origin}/shared/${result.token}`;

      // Since our Backend logic returns the API URL, let's use that for direct download:
      navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share "{fileName}"</DialogTitle>
      <DialogContent>
        {!result ? (
          <>
            <Typography gutterBottom>Link expires in:</Typography>
            <RadioGroup
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as ExpiresIn)}
            >
              <FormControlLabel value="1h" control={<Radio />} label="1 Hour" />
              <FormControlLabel
                value="24h"
                control={<Radio />}
                label="24 Hours"
              />
              <FormControlLabel value="7d" control={<Radio />} label="7 Days" />
            </RadioGroup>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Link created successfully!
            </Alert>
            <TextField
              fullWidth
              value={result.url}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? "Copied!" : "Copy URL"}>
                      <IconButton onClick={handleCopy} edge="end">
                        <ContentCopyIcon
                          color={copied ? "success" : "inherit"}
                        />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              Expires: {formatDate(result.expires_at)}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{result ? "Done" : "Cancel"}</Button>
        {!result && (
          <Button onClick={handleCreate} variant="contained" disabled={loading}>
            {loading ? "Creating..." : "Create Link"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
