import api from "./axios";

export interface AttendanceData {
    subject_id: string;
    a_type: 'lecture' | 'practical';
    batch_id?: string | { _id: string, name: string }; // Allow populated batch
    absentees: string[];
    date: Date;
    timeslot: {
        from: number;
        to: number;
    };
    class_id?: string; // Optional for posting, present in response
    _id?: string; // Present in response
}

export const markAttendance = async (data: AttendanceData) => {
    try {
        const response = await api.post("/attendance/mark", data);
        return response.data;
    } catch (error) {
        console.error("Error marking attendance:", error);
        throw error;
    }
};

export const getAttendanceLogs = async (subjectId: string, type?: 'lecture' | 'practical', batchId?: string) => {
    try {
        const response = await api.get(`/attendance/${subjectId}`, {
            params: {
                a_type: type,
                batch_id: batchId
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching attendance logs:", error);
        throw error;
    }
};

export const deleteAttendanceLog = async (id: string) => {
    try {
        const response = await api.delete(`/attendance/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting attendance log:", error);
        throw error;
    }
};

export const updateAttendanceLog = async (id: string, data: Partial<AttendanceData>) => {
    try {
        const response = await api.put(`/attendance/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating attendance log:", error);
        throw error;
    }
};

export interface ExportData {
    subject: {
        name: string;
        code: string;
        abbrivation: string;
        branchName:string;
    };
    dates: {
        date: string;
        _id: string;
    }[];
    students: {
        roll_num: string;
        name: string;
        attendance: { [key: string]: string };
        total_present: number;
        total_lectures: number;
        percentage: string;
    }[];
}

export const getAttendanceExportData = async (subjectId: string) => {
    try {
        const response = await api.get(`/attendance/export/${subjectId}`);
        return response.data as ExportData;
    } catch (error) {
        console.error("Error fetching export data:", error);
        throw error;
    }
};

export interface ExportPracticalData {
    subject: {
        name: string;
        code: string;
        abbrivation: string;
        class_id: string;
        branchName:string;
    };
    batches: {
        _id: string;
        name: string;
    }[];
    students: {
        roll_num: string;
        name: string;
        batch_id: string;
    }[];
    logs: {
        _id: string;
        date: string;
        batch_id: string;
        absentees: string[];
    }[];
}

export const getPracticalAttendanceExportData = async (subjectId: string) => {
    try {
        const response = await api.get(`/attendance/export/practical/${subjectId}`);
        return response.data as ExportPracticalData;
    } catch (error) {
        console.error("Error fetching practical export data:", error);
        throw error;
    }
};
