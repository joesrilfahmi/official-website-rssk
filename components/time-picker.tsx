"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import * as React from "react";

type View = "hour" | "minute";
type TimeFormat = "12" | "24";

export interface TimeValue {
  hour: number;
  minute: number;
}

export interface TimePickerProps {
  /** Nilai waktu dalam format "HH:mm" (24-jam) */
  value?: string;
  /** Callback ketika waktu berubah */
  onChange?: (value: string) => void;
  /** Format waktu: 12-jam atau 24-jam (default: 24) */
  format?: TimeFormat;
  /** Interval menit yang ditampilkan (default: 5) */
  minuteStep?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class untuk button trigger */
  className?: string;
  /** Lebar button trigger */
  buttonWidth?: string;
  /** Label untuk tab jam */
  hourLabel?: string;
  /** Label untuk tab menit */
  minuteLabel?: string;
}

export function TimePicker({
  value,
  onChange,
  format = "24",
  minuteStep = 5,
  placeholder = "Pilih waktu",
  disabled = false,
  className,
  buttonWidth = "w-[140px]",
  hourLabel = "Jam",
  minuteLabel = "Menit",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<View>("hour");
  const [hour, setHour] = React.useState<number>(0);
  const [minute, setMinute] = React.useState<number>(0);

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        setHour(h);
        setMinute(m);
      }
    }
  }, [value]);

  const radius = 90;
  const radiusInner = 60;
  const center = 110;

  const formatTime = (h: number, m: number): string => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const formatDisplayTime = (h: number, m: number): string => {
    if (format === "12") {
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(displayHour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    }
    return formatTime(h, m);
  };

  const handleHourClick = (h: number) => {
    setHour(h);
    setView("minute");
  };

  const handleMinuteClick = (m: number) => {
    setMinute(m);
    const newTime = formatTime(hour, m);
    onChange?.(newTime);
    setView("hour");
    setOpen(false);
  };

  const getSelectedPosition = () => {
    if (view === "minute") {
      const index = minute / minuteStep;
      const totalSteps = 60 / minuteStep;
      const angle = ((index * 360) / totalSteps - 90) * (Math.PI / 180);
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y };
    } else {
      let displayHour = hour;

      if (format === "12") {
        displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      }

      const index = format === "12" ? displayHour - 1 : displayHour;
      const angle =
        ((index * 360) / (format === "12" ? 12 : 24) - 90) * (Math.PI / 180);

      let r = radius;
      if (format === "24") {
        r = hour === 0 || hour > 12 ? radiusInner : radius;
      }

      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y };
    }
  };

  const renderNumbers = () => {
    if (view === "minute") {
      const totalSteps = 60 / minuteStep;
      const items = Array.from(
        { length: totalSteps },
        (_, i) => i * minuteStep,
      );

      return items.map((num, i) => {
        const angle = ((i * 360) / totalSteps - 90) * (Math.PI / 180);
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const selected = num === minute;

        return (
          <button
            key={num}
            onClick={() => handleMinuteClick(num)}
            className={cn(
              "absolute flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
              selected
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
            style={{
              left: x - 18,
              top: y - 18,
            }}
          >
            {num.toString().padStart(2, "0")}
          </button>
        );
      });
    } else {
      if (format === "12") {
        // Format 12-jam: hanya 1-12
        const hours = Array.from({ length: 12 }, (_, i) => i + 1);

        return hours.map((num, i) => {
          const angle = ((i * 360) / 12 - 90) * (Math.PI / 180);
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);

          const currentHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const selected = num === currentHour;

          return (
            <button
              key={num}
              onClick={() =>
                handleHourClick(hour >= 12 && hour < 24 ? num + 12 : num)
              }
              className={cn(
                "absolute flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
              style={{
                left: x - 18,
                top: y - 18,
              }}
            >
              {num}
            </button>
          );
        });
      } else {
        // Format 24-jam: 1-12 (luar) dan 13-24/00 (dalam)
        const outerHours = Array.from({ length: 12 }, (_, i) => i + 1);
        const innerHours = Array.from({ length: 12 }, (_, i) => i + 13);

        return (
          <>
            {outerHours.map((num, i) => {
              const angle = ((i * 360) / 12 - 90) * (Math.PI / 180);
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              const selected = num === hour;

              return (
                <button
                  key={num}
                  onClick={() => handleHourClick(num)}
                  className={cn(
                    "absolute flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                  style={{
                    left: x - 18,
                    top: y - 18,
                  }}
                >
                  {num.toString().padStart(2, "0")}
                </button>
              );
            })}
            {innerHours.map((num, i) => {
              const angle = ((i * 360) / 12 - 90) * (Math.PI / 180);
              const x = center + radiusInner * Math.cos(angle);
              const y = center + radiusInner * Math.sin(angle);
              const displayNum = num === 24 ? 0 : num;
              const selected = displayNum === hour;

              return (
                <button
                  key={num}
                  onClick={() => handleHourClick(displayNum)}
                  className={cn(
                    "absolute flex h-8 w-8 items-center justify-center rounded-full text-xs transition",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                  style={{
                    left: x - 16,
                    top: y - 16,
                  }}
                >
                  {displayNum.toString().padStart(2, "0")}
                </button>
              );
            })}
          </>
        );
      }
    }
  };

  const displayValue = value ? formatDisplayTime(hour, minute) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            buttonWidth,
            "justify-start gap-2 font-normal",
            !displayValue && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="h-4 w-4" />
          {displayValue ?? placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-4">
        {/* Header */}
        <div className="mb-3 flex justify-center gap-2">
          <Button
            size="sm"
            variant={view === "hour" ? "default" : "ghost"}
            onClick={() => setView("hour")}
          >
            {hourLabel}
          </Button>
          <Button
            size="sm"
            variant={view === "minute" ? "default" : "ghost"}
            onClick={() => setView("minute")}
          >
            {minuteLabel}
          </Button>
        </div>

        {/* Clock */}
        <div className="relative mx-auto h-[220px] w-[220px] rounded-full border bg-background">
          {/* Line from selected to center */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="220"
            height="220"
          >
            <line
              x1={getSelectedPosition().x}
              y1={getSelectedPosition().y}
              x2={center}
              y2={center}
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary transition-all duration-300"
            />
          </svg>

          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary z-10" />

          {renderNumbers()}
        </div>

        {/* Format 12-jam: tambahkan toggle AM/PM */}
        {format === "12" && (
          <div className="mt-3 flex justify-center gap-2">
            <Button
              size="sm"
              variant={hour < 12 ? "default" : "outline"}
              onClick={() => {
                if (hour >= 12) {
                  setHour(hour - 12);
                  onChange?.(formatTime(hour - 12, minute));
                }
              }}
            >
              AM
            </Button>
            <Button
              size="sm"
              variant={hour >= 12 ? "default" : "outline"}
              onClick={() => {
                if (hour < 12) {
                  setHour(hour + 12);
                  onChange?.(formatTime(hour + 12, minute));
                }
              }}
            >
              PM
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default TimePicker;
