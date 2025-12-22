import { useEffect, useState } from "react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useOfflineSync } from "../../hooks/useOfflineSync";

export function OnlineStatusBar() {
  const isOnline = useOnlineStatus();
  useOfflineSync();
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    setShow(true);

    if (isOnline) {
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div
      className={`
    fixed top-0 left-0 w-full
    px-4 py
    text-center text-white font-semibold
    z-[9999]
    ${isOnline ? "bg-green-600" : "bg-red-600"}
  `}
    >
      {isOnline ? "You are back online" : "You are offline"}
    </div>
  );
}
