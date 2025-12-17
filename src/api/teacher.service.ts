import api from "./axios";

export interface Teacher {
    _id: string;
    username: string;
    email: string;
    userType: string;
    isVerified: boolean;
    createdAt: string;
    lastDevice?: {
        deviceId: string;
        brand: string;
        model: string;
        systemName: string;
        systemVersion: string;
        lastSeenAt: string;
    };
}

export const getAllTeachers = async (): Promise<Teacher[]> => {
    try {
        const response = await api.get("/users/teachers");
        return response.data;
    } catch (error) {
        console.error("Error fetching teachers:", error);
        throw error;
    }
};

export const deleteTeacher = async (id: string) => {
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting teacher:", error);
        throw error;
    }
};
