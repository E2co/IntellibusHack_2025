import { useState } from 'react';

// Mock hook for queue data - returns dummy data for dashboard
export const useQueueMock = () => {
  const [data] = useState({
    queueEntries: [],
    activeSessions: []
  });

  return data;
};
