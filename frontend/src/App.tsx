// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

// Pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Files } from "./pages/Files";

// Initialize Query Client
const queryClient = new QueryClient();

// Initialize Theme
const theme = createTheme({
  palette: {
    mode: "light", // or 'dark'
    primary: { main: "#1976d2" },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Normalizes CSS */}
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Route Placeholder */}
            <Route path="/files" element={<Files />} />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/files" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
