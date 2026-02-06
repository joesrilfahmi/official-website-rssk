// ============================================
// FILE: src/components/ui/password-strength-indicator.tsx
// Komponen untuk menampilkan kekuatan password dan kebutuhan
// ============================================

"use client";

import { PasswordValidationResult } from "@/lib/validasi/validasiPassword";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  validationResult?: PasswordValidationResult;
  showRequirements?: boolean;
  showStrengthBar?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  validationResult,
  showRequirements = true,
  showStrengthBar = true,
  className = "",
}: PasswordStrengthIndicatorProps) {
  // Hanya tampilkan jika password sudah diisi
  if (!password) {
    return null;
  }

  const strengthLevel = validationResult?.strength || "weak";
  const requirements = validationResult?.requirements || {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    noSpaces: false,
  };

  const getStrengthBarColor = (level: string): string => {
    switch (level) {
      case "weak":
        return "bg-destructive dark:bg-destructive";
      case "fair":
        return "bg-yellow-600 dark:bg-yellow-500";
      case "good":
        return "bg-blue-600 dark:bg-blue-500";
      case "strong":
        return "bg-green-600 dark:bg-green-500";
      default:
        return "bg-destructive dark:bg-destructive";
    }
  };

  const getStrengthTextColor = (level: string): string => {
    switch (level) {
      case "weak":
        return "text-destructive dark:text-destructive";
      case "fair":
        return "text-yellow-600 dark:text-yellow-500";
      case "good":
        return "text-blue-600 dark:text-blue-500";
      case "strong":
        return "text-green-600 dark:text-green-500";
      default:
        return "text-destructive dark:text-destructive";
    }
  };

  const getRequirementIconColor = (isMet: boolean): string => {
    return isMet
      ? "text-green-600 dark:text-green-500"
      : "text-muted-foreground dark:text-muted-foreground";
  };

  const getRequirementTextColor = (isMet: boolean): string => {
    return isMet
      ? "text-green-700 dark:text-green-400 font-medium"
      : "text-muted-foreground dark:text-muted-foreground";
  };

  const getStrengthText = (level: string): string => {
    switch (level) {
      case "weak":
        return "Lemah";
      case "fair":
        return "Sedang";
      case "good":
        return "Baik";
      case "strong":
        return "Kuat";
      default:
        return "Lemah";
    }
  };

  const requirementLabels: Record<keyof typeof requirements, string> = {
    minLength: "Minimal 8 karakter",
    hasUpperCase: "Huruf besar (A-Z)",
    hasLowerCase: "Huruf kecil (a-z)",
    hasNumber: "Angka (0-9)",
    hasSpecialChar: "Simbol khusus (!@#$%^&*...)",
    noSpaces: "Tanpa spasi",
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      {showStrengthBar && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground/70">
              Kekuatan Password
            </span>
            <span
              className={`text-xs font-semibold ${getStrengthTextColor(strengthLevel)}`}
            >
              {getStrengthText(strengthLevel)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getStrengthBarColor(strengthLevel)}`}
              style={{
                width:
                  strengthLevel === "weak"
                    ? "25%"
                    : strengthLevel === "fair"
                      ? "50%"
                      : strengthLevel === "good"
                        ? "75%"
                        : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground/70">
            Kebutuhan Password:
          </p>
          <div className="space-y-1.5 rounded-md bg-secondary/50 p-3 border border-input">
            {(
              Object.keys(requirements) as Array<keyof typeof requirements>
            ).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className={`shrink-0 transition-colors ${getRequirementIconColor(requirements[key])}`}
                >
                  {requirements[key] ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-xs transition-colors ${getRequirementTextColor(requirements[key])}`}
                >
                  {requirementLabels[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
