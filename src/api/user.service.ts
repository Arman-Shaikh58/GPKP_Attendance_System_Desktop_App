import api from "./axios";

export const requestPasswordChangeOtp = async () => {
    try {
        const response = await api.post("/users/request-password-otp");
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const verifyPasswordChange = async (data: { otp: string; newPassword: string }) => {
    try {
        const response = await api.post("/users/change-password", data);
        return response.data;
    } catch (error) {
        throw error;
    }
};
