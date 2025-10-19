import { useEffect, useState } from 'react';
import api from '@/lib/api';

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        // Try to get admin from backend using JWT cookie
        const response = await api.get('/api/auth/me');
        if (response.success && response.user.role === 'admin') {
          setAdmin(response.user);
        } else {
          setAdmin(null);
        }
      } catch (err) {
        console.error('Admin auth check failed:', err);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  const logout = async () => {
    try {
  await api.post('/api/auth/logout');
      setAdmin(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return { admin, loading, logout };
};

export default useAdminAuth;
