import { deleteValue, setValue } from "@/utils/electronStoreService";
import apiClient from "./axios";

export interface IUser {
  id: string;
  username: string;
  email: string;
  userType: string;
  isVerified: string;
  createdAt: string;
}

export const login = async (data: any) => {
  const response = await apiClient.post("/auth/login", data);
  if (response.data.accessToken && response.data.refreshToken) {
    await setValue("user", response.data.user);
    await setValue("accessToken", response.data.accessToken);
    await setValue("refreshToken", response.data.refreshToken);
  }
  return response.data;
  return response.data;
};

export const register = async (data: any) => {
  try {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

export const logout = async () => {
  await deleteValue("user");
  await deleteValue("accessToken");
  await deleteValue("refreshToken");
  window.location.reload();
};
