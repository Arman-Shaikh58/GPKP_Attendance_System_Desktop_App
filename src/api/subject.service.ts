import api from "./axios";

export interface Subject {
    _id: string;
    name: string;
    code: string;
    abbrivation: string;
    class_id: string;
    teacher_id: string;
    branch?: string;
    year?: number;
    division?: string;
    branch_abbrivation?: string;
}

let subjectsCache: Subject[] | null = null;

export const getTeacherSubjects = async (forceRefresh = false): Promise<Subject[]> => {
    if (subjectsCache && !forceRefresh) {
        return subjectsCache;
    }
    try {
        const response = await api.get("/subject/subjects");
        subjectsCache = response.data;
        return response.data;
    } catch (error) {
        console.error("Error fetching subjects:", error);
        throw error;
    }
};

export const createSubject = async (data: { name: string; class_id: string; code: string; abbrivation: string }) => {
    try {
        const response = await api.post("/subject/create-subject", data);
        return response.data;
    } catch (error) {
        console.error("Error creating subject:", error);
        throw error;
    }
};

export const deleteSubject = async (id: string) => {
    try {
        const response = await api.delete(`/subject/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting subject:", error);
        throw error;
    }
};
