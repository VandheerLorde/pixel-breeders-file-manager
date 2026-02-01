import apiClient, { setTokens, clearTokens } from "./client";
import type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
} from "../types";

interface RegisterResponse {
  user: User;
  access: string;
  refresh: string;
}

export async function register(
  data: RegisterCredentials,
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(
    "/api/auth/register/",
    data,
  );
  const { access, refresh } = response.data;
  setTokens(access, refresh);
  return response.data;
}

export async function login(data: LoginCredentials): Promise<AuthTokens> {
  const response = await apiClient.post<AuthTokens>("/api/auth/token/", data);
  const { access, refresh } = response.data;
  setTokens(access, refresh);
  return response.data;
}

export async function logout(): Promise<void> {
  clearTokens();
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/api/auth/me/");
  return response.data;
}
