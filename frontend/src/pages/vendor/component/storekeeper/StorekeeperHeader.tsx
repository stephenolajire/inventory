// src/pages/vendor/storekeeper/components/StorekeeperHeader.tsx

import { Clock, Wifi, WifiOff } from "lucide-react";
import { formatTime } from "../../../../lib/utils";
import { useEffect, useState } from "react";

interface StorekeeperHeaderProps {
  vendorName: string;
  isOnline: boolean;
}

export function StorekeeperHeader({
  vendorName,
  isOnline,
}: StorekeeperHeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-bg-surface border-b border-border">
      {/* Left — title */}
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="font-heading font-bold text-sm text-text-primary">
          StockSense Counter
        </span>
        <span className="text-xs text-text-muted hidden sm:block">
          · {vendorName}
        </span>
      </div>

      {/* Right — clock + connection */}
      <div className="flex items-center gap-3">
        {/* Online status */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <Wifi size={13} className="text-success" />
              <span className="text-xs text-success font-medium hidden sm:block">
                Online
              </span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="text-error" />
              <span className="text-xs text-error font-medium hidden sm:block">
                Offline
              </span>
            </>
          )}
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock size={12} />
          <span className="font-mono">{formatTime(time, true)}</span>
        </div>
      </div>
    </div>
  );
}
