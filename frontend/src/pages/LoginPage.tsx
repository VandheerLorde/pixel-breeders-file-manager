import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../hooks/useAuth";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Paper,
} from "@mui/material";

interface ApiErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: string | string[] | undefined;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/files");
    } catch (err: unknown) {
      console.error("Login failed:", err);

      if (isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const data = err.response.data;

        if (data.detail) {
          setError(data.detail);
        } else if (
          data.non_field_errors &&
          Array.isArray(data.non_field_errors)
        ) {
          setError(data.non_field_errors[0]);
        } else {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const firstError = data[firstKey];
            if (Array.isArray(firstError)) {
              setError(`${firstKey}: ${firstError[0]}`);
            } else if (typeof firstError === "string") {
              setError(firstError);
            } else {
              setError("Invalid credentials.");
            }
          } else {
            setError("Invalid credentials.");
          }
        }
      } else {
        // Network error or server crashed (returning HTML/500)
        setError(
          "Unable to connect to the server. Please check your connection.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Pixel Breeders
        </Typography>

        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography component="h2" variant="h5" align="center" mb={2}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
