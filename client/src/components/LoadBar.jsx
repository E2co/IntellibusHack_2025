const _jsxFileName = "";import { cn } from "@/lib/utils";
import React from 'react';


const colorClasses = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
};

export const LoadBar = ({ percentage, className, color = "primary" }) => {
  return (
    React.createElement('div', { className: cn("h-2 bg-muted rounded-full overflow-hidden", className), __self: this, __source: {fileName: _jsxFileName, lineNumber: 17}}
      , React.createElement('div', {
        className: cn(
          "h-full rounded-full transition-all duration-1000 ease-out",
          colorClasses[color]
        ),
        style: { width: `${Math.min(100, Math.max(0, percentage))}%` }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 18}}
      )
    )
  );
};
