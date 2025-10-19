import React from 'react';
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      navigate("/ticket");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/taj")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to view your ticket</p>
        </div>

        <GlassCard className="p-6">
          {error && <p className="text-sm text-destructive mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="glass"
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </GlassCard>

        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/signup")}>
            Don't have an account? Sign up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
