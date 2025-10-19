import React, { useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { ServiceStatBox } from '@/components/admin/ServiceStatBox';
import { StatsCard } from '@/components/admin/StatsCard';
import { QueueTable } from '@/components/admin/QueueTable';
import { QueueListItem } from '@/components/admin/QueueListItem';
import { ActiveSessionCard } from '@/components/admin/ActiveSessionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueueMock } from '@/hooks/useQueueMock';
import { getServices, getStats, getCustomerById, getServiceById } from '@/lib/mockDataUtils';

export default function Dashboard() {
  const [serviceFilter, setServiceFilter] = useState('all');
  const { queueEntries, activeSessions } = useQueueMock();
  const services = getServices();
  const stats = getStats();

  const waitingQueue = queueEntries.filter((entry) => entry.status === 'waiting');
  const servingQueue = queueEntries.filter((entry) => entry.status === 'serving');

  const filteredQueue = serviceFilter === 'all' ? waitingQueue : waitingQueue.filter((entry) => entry.serviceId === serviceFilter);
  const nextInQueue = waitingQueue.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Real-time queue management overview</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Export Report</Button>
          <Button>Call Next</Button>
        </div>
      </div>

      {/* Currently Serving Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Currently Serving</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{activeSessions.length} active sessions</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSessions.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center col-span-full">
              <p className="text-muted-foreground">No active service sessions</p>
            </div>
          ) : (
            activeSessions.map((session) => {
              const queueEntry = servingQueue.find((q) => q.id === session.queueEntryId);
              return queueEntry ? <ActiveSessionCard key={session.id} session={session} queueEntry={queueEntry} /> : null;
            })
          )}
        </div>
      </div>

      {/* Top Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {services.map((service) => (
          <ServiceStatBox key={service.id} count={stats.serviceStats[service.id]?.waiting || 0} label={service.name} icon={service.icon} />
        ))}

        <StatsCard title="Average Wait Time" value={`${stats.averageWaitTime}m`} subtitle="Across all services" icon={Clock} gradient />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Next in Queue Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Next in Queue</h2>
            <Input placeholder="Search..." className="w-64" />
          </div>
          <QueueTable entries={nextInQueue} />
        </div>

        {/* Right Column - Live Queue Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Live Queue</h2>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="glass rounded-xl p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {filteredQueue.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No customers in queue</p>
            ) : (
              filteredQueue.slice(0, 10).map((entry) => {
                const customer = getCustomerById(entry.customerId);
                const service = getServiceById(entry.serviceId);
                return customer && service ? (
                  <QueueListItem
                    key={entry.id}
                    customer={customer}
                    service={service}
                    ticketNumber={entry.ticketNumber}
                    position={entry.position}
                  />
                ) : null;
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
