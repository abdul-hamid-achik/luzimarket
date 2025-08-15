"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Globe, MapPin, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { getUserSessions, revokeSession, revokeAllSessions } from "@/lib/actions/session";
import { toast } from "sonner";

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}

export function SessionManager() {
  const t = useTranslations("Vendor.security.sessions");
  const locale = useLocale();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    const result = await getUserSessions();
    
    if (result.success && result.data) {
      setSessions(result.data.map(s => ({
        id: s.id,
        device: s.device || "Unknown Device",
        browser: s.browser || "Unknown Browser",
        location: s.location || "Unknown Location",
        ipAddress: s.ipAddress || "",
        lastActive: new Date(s.lastActive),
        isCurrent: s.isCurrent || false,
      })));
    } else {
      toast.error(t("loadError"));
    }
    
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    const result = await revokeSession(sessionId);
    
    if (result.success) {
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success(t("sessionRevoked"));
    } else {
      toast.error(result.error || t("revokeError"));
    }
  };

  const handleRevokeAll = async () => {
    const result = await revokeAllSessions();
    
    if (result.success) {
      setSessions(sessions.filter(s => s.isCurrent));
      toast.success(t("allSessionsRevoked"));
    } else {
      toast.error(result.error || t("revokeAllError"));
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("phone")) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="text-center py-4">{t("loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`border rounded-lg p-4 ${
              session.isCurrent ? "border-green-500 bg-green-50" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(session.device)}
                  <span className="font-medium">{session.device}</span>
                  {session.isCurrent && (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                      {t("currentSession")}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>{session.browser}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{session.location} • {session.ipAddress}</span>
                  </div>
                  <div>
                    {t("lastActive")}: {formatDistanceToNow(session.lastActive, {
                      addSuffix: true,
                      locale: locale === "es" ? es : enUS,
                    })}
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  {t("revoke")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessions.filter(s => !s.isCurrent).length > 0 && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleRevokeAll}
        >
          {t("revokeAll")}
        </Button>
      )}
    </div>
  );
}