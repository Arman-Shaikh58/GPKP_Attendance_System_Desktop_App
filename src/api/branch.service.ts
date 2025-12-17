import api from "./axios";

export interface Branch {
    _id: string;
    name: string;
    code: string;
    hod_id: string;
    total_years: number;
    abbrivation: string;
}

export const getAllBranches = async () => {
    try {
        const response = await api.get("/branch/get-branches");
        return response.data.branches;
    } catch (error) {
        console.error("Error fetching branches:", error);
        throw error;
    }
};

export const createBranch = async (data: any) => {
    try {
        const response = await api.post("/branch/create-branch", data);
        return response.data;
    } catch (error) {
        console.error("Error creating branch:", error);
        throw error;
    }
}

export const deleteBranch = async (id: string) => {
    try {
        const response = await api.delete("/branch/delete-branch", { data: { id } });
        return response.data;
    } catch (error) {
        console.error("Error deleting branch:", error);
        throw error;
    }
};
