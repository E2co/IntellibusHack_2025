import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from "@/lib/utils";

export const ServiceStatBox = ({ count, label, icon, className }) => {
  const IconComponent = Icons[icon] || Icons.Circle;

  return (
    <div className={cn("glass rounded-xl p-6 flex flex-col items-center justify-center space-y-3 hover:scale-105 transition-transform", className)}>
      <IconComponent className="w-12 h-12 text-primary" />
      <div className="text-center">
        <p className="text-4xl font-bold text-foreground">{count}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
};
