import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export const ActiveSessionCard = ({ session, queueEntry }) => {
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="default">Active</Badge>
        <Clock className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold">#{queueEntry?.ticketNumber || 'N/A'}</p>
        <p className="text-sm text-muted-foreground">Session ID: {session?.id || 'Unknown'}</p>
      </div>
      <Button variant="outline" size="sm" className="w-full">
        View Details
      </Button>
    </div>
  );
};
