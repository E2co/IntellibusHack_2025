import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Static constants outside component to avoid re-creation
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS_MIN = ["S", "M", "T", "W", "T", "F", "S"];

// Drop-in replacement Calendar with improved UI and memoization
// Props kept compatible with existing usage in SignUp.jsx
// - mode: only "single" is supported (ignored if provided)
// - selected: Date | undefined
// - onSelect: (date?: Date) => void
// - defaultMonth?: Date (initial month when no selected)
// - fromYear?: number, toYear?: number (year bounds for navigation)
// - captionLayout/initialFocus and other DayPicker props are ignored safely

export const Calendar = React.memo(function Calendar({
  className,
  selected,
  onSelect,
  defaultMonth,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  // ignored but accepted for compatibility
  mode, // eslint-disable-line no-unused-vars
  captionLayout, // eslint-disable-line no-unused-vars
  initialFocus // eslint-disable-line no-unused-vars
}) {
  const initialDate = selected || defaultMonth || new Date();
  const [view, setView] = useState("day");
  const [currentDate, setCurrentDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const clampYear = useCallback(
    (date) => {
      const y = Math.min(Math.max(date.getFullYear(), fromYear), toYear);
      return new Date(y, date.getMonth(), 1);
    },
    [fromYear, toYear]
  );

  const getDaysInMonth = useCallback((date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(), []);
  const getFirstDayOfMonth = useCallback((date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(), []);

  const handlePrevious = useCallback(() => {
    if (view === "day") {
      setCurrentDate((d) => clampYear(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
    } else if (view === "year") {
      setCurrentDate((d) => clampYear(new Date(d.getFullYear() - 12, d.getMonth(), 1)));
    } else if (view === "month") {
      setCurrentDate((d) => clampYear(new Date(d.getFullYear() - 1, d.getMonth(), 1)));
    }
  }, [view, clampYear]);

  const handleNext = useCallback(() => {
    if (view === "day") {
      setCurrentDate((d) => clampYear(new Date(d.getFullYear(), d.getMonth() + 1, 1)));
    } else if (view === "year") {
      setCurrentDate((d) => clampYear(new Date(d.getFullYear() + 12, d.getMonth(), 1)));
    } else if (view === "month") {
      setCurrentDate((d) => clampYear(new Date(d.getFullYear() + 1, d.getMonth(), 1)));
    }
  }, [view, clampYear]);

  const handleDateClick = useCallback(
    (day) => {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      onSelect?.(newDate);
    },
    [currentDate, onSelect]
  );

  const handleMonthClick = useCallback(
    (monthIndex) => {
      setCurrentDate((d) => new Date(d.getFullYear(), monthIndex, 1));
      setView("day");
    },
    []
  );

  const handleYearClick = useCallback(
    (year) => {
      setCurrentDate((d) => new Date(year, d.getMonth(), 1));
      setView("month");
    },
    []
  );

  const title = useMemo(() => {
    if (view === "day") return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === "month") return `${currentDate.getFullYear()}`;
    const startYear = Math.floor(currentDate.getFullYear() / 12) * 12;
    return `${startYear} - ${startYear + 11}`;
  }, [currentDate, view]);

  const weekdayHeader = useMemo(
    () => WEEKDAYS_MIN.map((w, i) => (
      <div key={i} className="p-2">
        {w}
      </div>
    )),
    []
  );

  const dayGrid = useMemo(() => {
    if (view !== "day") return null;
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
  const cells = [];

    // leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="p-2" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = !!selected &&
        selected.getDate() === day &&
        selected.getMonth() === currentDate.getMonth() &&
        selected.getFullYear() === currentDate.getFullYear();

      cells.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={cn(
            "p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary/20 hover:scale-110",
            isSelected && "bg-primary text-primary-foreground shadow-lg"
          )}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {weekdayHeader}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    );
  }, [view, currentDate, getDaysInMonth, getFirstDayOfMonth, selected, handleDateClick, weekdayHeader]);

  const monthGrid = useMemo(() => {
    if (view !== "month") return null;
    return (
      <div className="grid grid-cols-3 gap-3">
        {MONTHS.map((month, index) => (
          <button
            key={month}
            onClick={() => handleMonthClick(index)}
            className={cn(
              "p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary/20 hover:scale-105",
              currentDate.getMonth() === index && "bg-primary/10"
            )}
          >
            {month.substring(0, 3)}
          </button>
        ))}
      </div>
    );
  }, [view, currentDate, handleMonthClick]);

  const yearGrid = useMemo(() => {
    if (view !== "year") return null;
    const startYear = Math.floor(currentDate.getFullYear() / 12) * 12;
  const years = [];
    for (let i = 0; i < 12; i++) years.push(startYear + i);
    return (
      <div className="grid grid-cols-3 gap-3">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleYearClick(year)}
            className={cn(
              "p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary/20 hover:scale-105",
              currentDate.getFullYear() === year && "bg-primary/10",
              (year < fromYear || year > toYear) && "opacity-40 cursor-not-allowed"
            )}
            disabled={year < fromYear || year > toYear}
          >
            {year}
          </button>
        ))}
      </div>
    );
  }, [view, currentDate, handleYearClick, fromYear, toYear]);

  return (
    <div className={cn("glass p-4 rounded-xl space-y-4 pointer-events-auto", className)}>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="h-8 w-8 hover:bg-primary/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <button
          onClick={() => setView((v) => (v === "day" ? "month" : v === "month" ? "year" : "day"))}
          className="text-base font-semibold hover:text-primary transition-colors cursor-pointer"
          aria-label="Change calendar view"
        >
          {title}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8 hover:bg-primary/20"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div>
        {dayGrid}
        {monthGrid}
        {yearGrid}
      </div>
    </div>
  );
});

Calendar.displayName = "Calendar";
