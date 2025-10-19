import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import api from '@/lib/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && admin) {
      navigate('/admin');
    }
  }, [admin, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/admin/login', {
        email,
        password,
        idNumber: idNumber || undefined
      });

      if (response.success) {
        toast({
          title: "Welcome!",
          description: "Successfully logged in to admin dashboard"
        });
        
        // The JWT cookie is set automatically by the server
        // Reload to trigger useAdminAuth to fetch the admin data
        window.location.href = '/admin';
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to login. Please check your credentials.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Show welcome back screen if already logged in
  if (admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-white">
                {admin.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
            <CardDescription className="text-lg">
              Hello, <span className="font-semibold text-foreground">{admin.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              You're already logged in to the admin dashboard.
            </p>
            <Button 
              onClick={() => navigate('/admin')} 
              className="w-full"
              size="lg"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login form if not logged in
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">TAJ Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number (Optional)</Label>
              <Input
                id="idNumber"
                type="text"
                placeholder="Admin ID Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
