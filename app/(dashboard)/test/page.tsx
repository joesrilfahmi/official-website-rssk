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

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<View>("hour");
  const [hour, setHour] = React.useState<number>(0);
  const [minute, setMinute] = React.useState<number>(0);

  const radius = 90;
  const radiusInner = 60;
  const center = 110;

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const handleHourClick = (h: number) => {
    setHour(h);
    setView("minute");
  };

  const handleMinuteClick = (m: number) => {
    setMinute(m);
    onChange?.(formatTime(hour, m));
    setView("hour");
    setOpen(false);
  };

  const getSelectedPosition = () => {
    if (view === "minute") {
      const index = minute / 5;
      const angle = (index * 30 - 90) * (Math.PI / 180);
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y };
    } else {
      // Untuk jam
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const index = displayHour - 1;
      const angle = (index * 30 - 90) * (Math.PI / 180);
      const r = hour === 0 || hour > 12 ? radiusInner : radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y };
    }
  };

  const renderNumbers = () => {
    if (view === "minute") {
      const items = Array.from({ length: 12 }, (_, i) => i * 5);
      return items.map((num, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
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
      // Render jam 1-12 (lingkaran luar) dan 13-24/00 (lingkaran dalam)
      const outerHours = Array.from({ length: 12 }, (_, i) => i + 1);
      const innerHours = Array.from({ length: 12 }, (_, i) => i + 13);

      return (
        <>
          {outerHours.map((num, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
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
            const angle = (i * 30 - 90) * (Math.PI / 180);
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
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[140px] justify-start gap-2 font-normal"
        >
          <Clock className="h-4 w-4" />
          {value ?? formatTime(hour, minute)}
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
            Jam
          </Button>
          <Button
            size="sm"
            variant={view === "minute" ? "default" : "ghost"}
            onClick={() => setView("minute")}
          >
            Menit
          </Button>
        </div>

        {/* Clock */}
        <div className="relative mx-auto h-[220px] w-[220px] rounded-full border bg-background">
          {/* Garis dari angka terpilih ke titik tengah */}
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

          {/* Titik tengah */}
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary z-10" />

          {renderNumbers()}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default TimePicker;
