
export interface OfflineRequest {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'GET'; // Although we mainly care about POST
    data: any;
    timestamp: number;
}

const STORAGE_KEY = 'offline_attendance_queue';

export const getOfflineRequests = (): OfflineRequest[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error reading offline queue:", error);
        return [];
    }
};

export const saveOfflineRequest = (request: Omit<OfflineRequest, 'id' | 'timestamp'>) => {
    const queue = getOfflineRequests();
    const newRequest: OfflineRequest = {
        ...request,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };
    queue.push(newRequest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return newRequest;
};

export const removeOfflineRequest = (id: string) => {
    const queue = getOfflineRequests();
    const updatedQueue = queue.filter(req => req.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
};

export const clearOfflineQueue = () => {
    localStorage.removeItem(STORAGE_KEY);
}
