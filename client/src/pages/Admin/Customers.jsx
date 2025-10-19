import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerTable } from '@/components/admin/CustomerTable';
import { useCustomerSearch } from '@/hooks/useCustomerSearch';

export default function Customers() {
  // Align with existing hook API: returns { query, setQuery, results }
  const { query, setQuery, results } = useCustomerSearch();
  const [filterType, setFilterType] = useState('recent');
  const customers = results;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground mt-2">View and manage all customer records</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Last Visited (Recent)</SelectItem>
            <SelectItem value="oldest">Last Visited (Oldest)</SelectItem>
            <SelectItem value="a-z">Alphabetical (A-Z)</SelectItem>
            <SelectItem value="z-a">Alphabetical (Z-A)</SelectItem>
            <SelectItem value="most-visits">Most Visits</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">Export CSV</Button>
      </div>

      {/* Customer Table */}
      <div>
        <CustomerTable customers={customers} />
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {`Showing ${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}
