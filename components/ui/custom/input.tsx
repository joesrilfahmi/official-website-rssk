// app/components/ui/custom/input.tsx
import { LucideIcon } from "lucide-react";
import { forwardRef, InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  inputSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = "left",
      rounded = "xl",
      inputSize = "md",
      fullWidth = true,
      required = false,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const roundedClasses = {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    };

    const sizeClasses = {
      sm: "py-2 text-sm",
      md: "py-3 text-base",
      lg: "py-4 text-lg",
    };

    const getPaddingClass = () => {
      if (!Icon) return "px-4";
      return iconPosition === "left" ? "pl-12 pr-4" : "pl-4 pr-12";
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            disabled={disabled}
            className={`
              ${fullWidth ? "w-full" : ""}
              ${getPaddingClass()}
              ${sizeClasses[inputSize]}
              ${roundedClasses[rounded]}
              border
              ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-mariner-500"}
              ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white"}
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              placeholder:text-gray-400
              text-gray-900
              ${className}
            `}
            style={{ color: disabled ? undefined : "#111827" }}
            {...props}
          />

          {Icon && (
            <Icon
              className={`absolute ${
                iconPosition === "left" ? "left-4" : "right-4"
              } top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none`}
            />
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

Input.displayName = "Input";

export default Input;
