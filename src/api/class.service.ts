import { toast } from "sonner";
import apiClient from "./axios";
export interface IClassInfo {
  _id: string;
  division: string;
  year: number;
  branch: {
    _id: string;
    code: string;
    name: string;
    abbrivation: string;
  }
  studentCount: number;
}

export interface Student {
  _id: string;
  name: string;
  roll_num: string;
}

export interface Batch {
  _id: string;
  name: string;
  from: number;
  to: number;
  students: Student[];
}

export interface Branch {
  _id: string;
  code: string;
  abbrivation: string;
  name: string;
}

export interface ClassData {
  _id: string;
  division: string;
  year: number;
  branch: Branch;
  batches: Batch[];
}

export const getClassesinfo = async () => {
  try {
    const response = await apiClient.get('/class/classes-info');
    return response.data.classes;
  } catch (error) {
    console.log("Failed to Retrive classes Info");
    throw error;
  }
}

export const getClassInfo = async (classId: string) => {
  try {
    const response = await apiClient.get(`/class/class/${classId}/details`);
    console.log(response)
    return response.data.class

  } catch (error) {
    console.log("Failed to Retrive class Info");
    throw error;
  }
}


export const deleteClass = async (classId: string) => {
  try {
    await apiClient.delete(`/class/${classId}`);
    toast.success("Deleted Class Successfully");
  } catch (error) {
    toast.error("Failed to Delete Class");
    throw error;
  }
};

export interface SubjectStat {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  type: 'lecture' | 'practical';
  conducted: number;
  present: number;
  percentage: number;
  absentDates: string[]; // ISO date strings
}

export interface Defaulter {
  _id: string;
  name: string;
  roll_num: string;
  totalConducted: number;
  totalPresent: number;
  percentage: number;
  details: SubjectStat[];
}

export const getClassDefaulters = async (classId: string): Promise<Defaulter[]> => {
  try {
    const response = await apiClient.get(`/class/class/${classId}/defaulters`);
    return response.data;
  } catch (error) {
    console.error("Failed to retrieve class defaulters");
    throw error;
  }
};