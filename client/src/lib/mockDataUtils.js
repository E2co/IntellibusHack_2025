// Mock data utility functions
export const getServices = () => {
  return [
    { id: '1', name: 'Tax Payment', code: 'TP', icon: 'Banknote' },
    { id: '2', name: 'Document Processing', code: 'DP', icon: 'FileText' },
    { id: '3', name: 'Consultation', code: 'CS', icon: 'MessageCircle' },
    { id: '4', name: 'Registration', code: 'RG', icon: 'UserPlus' }
  ];
};

export const getStats = () => {
  return {
    averageWaitTime: 15,
    serviceStats: {
      '1': { waiting: 5, serving: 2 },
      '2': { waiting: 3, serving: 1 },
      '3': { waiting: 2, serving: 1 },
      '4': { waiting: 4, serving: 2 }
    }
  };
};

export const getCustomerById = (id) => {
  return {
    id,
    fullName: 'Sample Customer',
    email: 'customer@example.com',
    phone: '+1234567890'
  };
};

export const getServiceById = (id) => {
  const services = getServices();
  return services.find(s => s.id === id) || { id, name: 'Unknown Service', code: 'UK' };
};

export const formatWaitTime = (minutes) => {
  if (!minutes || minutes === 0) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const getInitials = (name) => {
  if (!name) return 'NA';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAllActiveQueue = () => {
  return [];
};

export const getCustomers = () => {
  return [];
};
