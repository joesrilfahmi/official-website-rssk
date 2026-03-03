// app/components/ui/custom/textarea.tsx
import { forwardRef, TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  textareaSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      rounded = "xl",
      textareaSize = "md",
      fullWidth = true,
      required = false,
      showCharCount = false,
      maxLength,
      resize = "none",
      className = "",
      disabled,
      value,
      ...props
    },
    ref,
  ) => {
    const roundedClasses = {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-3xl",
    };

    const sizeClasses = {
      sm: "py-2 px-3 text-sm",
      md: "py-3 px-4 text-base",
      lg: "py-4 px-5 text-lg",
    };

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            disabled={disabled}
            value={value}
            maxLength={maxLength}
            className={`
              ${fullWidth ? "w-full" : ""}
              ${sizeClasses[textareaSize]}
              ${roundedClasses[rounded]}
              ${resizeClasses[resize]}
              border
              ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-mariner-500"}
              ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white"}
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              placeholder:text-gray-400
              text-gray-900
              ${showCharCount && maxLength ? "pb-8" : ""}
              ${className}
            `}
            style={{ color: disabled ? undefined : "#111827" }}
            {...props}
          />

          {showCharCount && maxLength && (
            <div className="absolute bottom-3 right-4 text-xs text-gray-500 pointer-events-none">
              <span
                className={
                  currentLength >= maxLength ? "text-red-500 font-medium" : ""
                }
              >
                {currentLength}
              </span>
              <span className="text-gray-400">/{maxLength}</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-gray-500 text-xs mt-1">{helperText}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
