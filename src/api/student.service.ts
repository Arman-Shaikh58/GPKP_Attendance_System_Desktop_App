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

export const addStudentToClass = async (classId: string, studentName: string, studentRollNo: string) => {
    try {
        const response = await api.post('/students/add-student', { classId, studentName, studentRollNo });
        return response.data;
    } catch (error) {
        console.log("Failed to add student to class");
        throw error;
    }
}

export const removeStudentFromClass = async (studentId: string) => {
    try {
        const response = await api.delete(`/students/delete-student/${studentId}`);
        return response.data;
    } catch (error) {
        console.log("Failed to remove student from class");
        throw error;
    }
}
export const editStudent = async (studentId: string, studentName: string, studentRollNo: string) => {
    try {
        const response = await api.put(`/students/edit-student/${studentId}`, { name: studentName, roll_num: studentRollNo });
        return response.data;
    } catch (error) {
        console.log("Failed to edit student");
        throw error;
    }
}