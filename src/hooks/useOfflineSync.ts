
import { useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { syncOfflineRequests } from "../api/attendance.service";

export const useOfflineSync = () => {
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (isOnline) {
            syncOfflineRequests();
        }
    }, [isOnline]);
};
