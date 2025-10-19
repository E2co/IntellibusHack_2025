import { useState, useEffect } from 'react';
import { getCustomers } from '@/lib/mockDataUtils';

export const useCustomerSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const customers = getCustomers();
    if (!query.trim()) {
      setResults(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.fullName?.toLowerCase().includes(query.toLowerCase()) ||
      customer.email?.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone?.includes(query)
    );
    setResults(filtered);
  }, [query]);

  return { query, setQuery, results };
};
