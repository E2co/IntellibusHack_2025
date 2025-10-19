import React, { useEffect, useState } from 'react';
import { GlassCard } from "@/components/GlassCard";
import { ServiceTile } from "@/components/ServiceTile";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { iconForService } from "@/lib/icons";

const toTile = (s) => ({
  id: s.id,
  title: s.name || s.code,
  icon: iconForService(s.code),
  queueLength: 0,
  eta: "~",
  activeCounters: 0,
  loadPercentage: 0,
})

const ServiceSelect = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await api.get('/api/services')
        if (!cancelled) setServices((data.services || []).map(toTile))
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load services')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleServiceSelect = async (serviceId) => {
    if (creating) return; // Prevent double-clicks
    
    try {
      setCreating(true)
      setError("")
      console.log('Creating ticket for service:', serviceId)
      const response = await api.post('/api/tickets', { serviceId })
      console.log('Ticket created:', response)
      navigate('/ticket')
    } catch (err) {
      console.error('Failed to create ticket:', err)
      const errorMessage = err.message || 'Failed to create ticket'
      
      // Check if it's an authentication error
      if (errorMessage.includes('Not Authorized') || errorMessage.includes('401')) {
        setError('Please log in to join a queue')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(errorMessage)
      }
    } finally {
      setCreating(false)
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            Select Your Service
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose the service you need assistance with
          </p>
        </div>

        {error && (
          <div className="p-4 text-destructive text-center bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-muted-foreground">
            Loading services...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ServiceTile
                {...service}
                onClick={() => handleServiceSelect(service.id)}
                disabled={creating}
              />
            </div>
          ))}
        </div>

        <GlassCard className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {creating 
              ? "Creating your ticket..." 
              : "Select a service to receive your queue ticket"}
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default ServiceSelect;
