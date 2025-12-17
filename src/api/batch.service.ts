import api from "./axios";

export interface Batch {
    _id: string;
    name: string;
    class_id: string;
    from: number;
    to: number;
}

const batchCache: Record<string, Batch[]> = {};

export const getBatchesByClass = async (class_id: string): Promise<Batch[]> => {
    if (batchCache[class_id]) {
        return batchCache[class_id];
    }

    try {
        const response = await api.get(`/batch/${class_id}`);
        batchCache[class_id] = response.data;
        return response.data;
    } catch (error) {
        console.error("Error fetching batches:", error);
        throw error;
    }
};
