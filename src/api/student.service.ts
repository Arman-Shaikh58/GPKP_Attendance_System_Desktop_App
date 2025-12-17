import api from "./axios";

export interface Student {
    _id: string;
    name: string;
    roll_num: string;
    class_id: string;
    batch_id: string;
}

export const getStudentsByClass = async (classId: string): Promise<Student[]> => {
    try {
        const response = await api.get(`/students/class/${classId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export const getStudentsByBatch = async (batchId: string): Promise<Student[]> => {
    try {
        const response = await api.get(`/students/batch/${batchId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching students by batch:", error);
        throw error;
    }
};
