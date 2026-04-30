"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCertByCode } from "@/lib/certifications";
import type { UserCertification } from "@prisma/client";

const levelIcons: Record<string, string> = {
  professional: "🥉",
  expert: "🥈",
  master: "🥇",
};

export function CertificationBadges({
  certifications,
}: {
  certifications: UserCertification[];
}) {
  const allCerts = certifications.map((uc) => ({
    userCert: uc,
    def: getCertByCode(uc.certCode),
  }));

  const passed = allCerts.filter((c) => c.userCert.status === "PASSED");
  const preparing = allCerts.filter((c) => c.userCert.status === "PREPARING");

  if (passed.length === 0 && preparing.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Certifications</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {passed.map(({ userCert, def }) => (
          <Card
            key={userCert.certCode}
            className="text-center border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 shadow-sm"
          >
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <span className="text-3xl">{def ? levelIcons[def.level] : "🏅"}</span>
              <p className="text-sm font-medium">{def?.name ?? userCert.certCode}</p>
              <p className="text-xs text-muted-foreground font-mono">{userCert.certCode}</p>
              {userCert.passedAt && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Passed {new Date(String(userCert.passedAt).slice(0, 10) + "T00:00:00").toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {preparing.map(({ userCert, def }) => (
          <Card
            key={userCert.certCode}
            className={cn(
              "text-center border-primary/30 opacity-60"
            )}
          >
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <span className="text-3xl">🎯</span>
              <p className="text-sm font-medium">{def?.name ?? userCert.certCode}</p>
              <p className="text-xs text-muted-foreground font-mono">{userCert.certCode}</p>
              {userCert.examDate ? (
                <p className="text-xs text-primary">
                  Exam {new Date(String(userCert.examDate).slice(0, 10) + "T00:00:00").toLocaleDateString()}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Preparing</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
