import api from "./axios";

export interface StudentAnalytics {
    student_id: string;
    name: string;
    roll_num: string;
    batch_name: string;
    lectures: {
        total: number;
        present: number;
        absent: number;
        percentage: number;
    };
    practicals: {
        total: number;
        present: number;
        absent: number;
        percentage: number;
    };
    overall: {
        total: number;
        present: number;
        absent: number;
        percentage: number;
    };
}

export interface SubjectAnalyticsData {
    subject_name: string;
    subject_code: string;
    class_id: string;
    total_lectures: number;
    batch_wise_practicals: Record<string, number>;
    students: StudentAnalytics[];
}

export const getSubjectAnalytics = async (subjectId: string): Promise<SubjectAnalyticsData> => {
    try {
        const response = await api.get(`/analytics/${subjectId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching subject analytics:", error);
        throw error;
    }
};
