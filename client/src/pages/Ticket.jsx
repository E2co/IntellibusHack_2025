import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from "@/components/GlassCard";
import { TicketDisplay } from "@/components/TicketDisplay";
import { CircularProgress } from "@/components/CircularProgress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Users, Clock } from "lucide-react";
import api from "@/lib/api";

// Simple heuristic for ETA: 2 minutes per person ahead
const ETA_PER_PERSON_SECONDS = 2 * 60;

const Ticket = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ fullName: "Guest" });
  const [ticket, setTicket] = useState(null);
  const [trafficMap, setTrafficMap] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState("");
  const countdownStartedRef = useRef(false);

  useEffect(() => {
    // Get user data
    const stored = localStorage.getItem("userData");
    if (stored) {
      setUserData(JSON.parse(stored));
    }
  }, []);

  // Load ticket + traffic
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      try {
        setLoading(true);
        const t = await api.get('/api/tickets/me');
        const ticketData = t?.ticket || null;
        if (!ticketData) {
          if (!cancelled) {
            setTicket(null);
            setLoading(false);
          }
          return;
        }
        if (!cancelled) setTicket(ticketData);
        const traffic = await api.get('/api/traffic');
        const map = {};
        (traffic?.traffic || []).forEach(s => { map[s.serviceId] = s; });
        if (!cancelled) setTrafficMap(map);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load ticket');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInitial();
    return () => { cancelled = true; };
  }, []);

  // Poll ticket + traffic periodically to update position and ETA
  useEffect(() => {
    if (!ticket) return;
    let cancelled = false;
    async function poll() {
      try {
        const latest = await api.get('/api/tickets/me');
        if (!cancelled && latest?.ticket) {
          // If position or service changed, reset countdown based on new position
          const prevPos = ticket.position;
          const nextTicket = latest.ticket;
          setTicket(nextTicket);
          const newPos = nextTicket.position ?? Math.max((nextTicket.number || 0) - (nextTicket.currentNumber || 0), 0);
          if (newPos !== prevPos) {
            const eta = newPos * ETA_PER_PERSON_SECONDS;
            setCountdown(eta);
          }
        }
        const traffic = await api.get('/api/traffic');
        if (cancelled) return;
        const map = {};
        (traffic?.traffic || []).forEach(s => { map[s.serviceId] = s; });
        setTrafficMap(map);
      } catch {
        // ignore transient errors
      }
    }
    const id = setInterval(poll, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [ticket]);

  // Start/continue countdown
  useEffect(() => {
    const serverPosition = ticket?.position;
    const serviceInfo = ticket ? trafficMap[ticket.serviceId] : null;
    const current = ticket?.currentNumber ?? serviceInfo?.currentNumber ?? 0;
    const computedPosition = ticket && ticket.status === 'waiting' ? Math.max((ticket.number || 0) - current, 0) : 0;
    const position = typeof serverPosition === 'number' ? serverPosition : computedPosition;
    const nextEta = position * ETA_PER_PERSON_SECONDS;
    if (nextEta > 0 && !countdownStartedRef.current) {
      countdownStartedRef.current = true;
      setCountdown(nextEta);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [ticket, trafficMap]);

  const serviceInfo = ticket ? trafficMap[ticket.serviceId] : null;
  const serviceName = serviceInfo?.name || "";
  const serviceCode = serviceInfo?.code || "";
  const currentNumber = ticket?.currentNumber ?? serviceInfo?.currentNumber ?? 0;
  const totalInQueue = ticket?.totalInQueue ?? serviceInfo?.totalInQueue ?? 0;
  const position = typeof ticket?.position === 'number'
    ? ticket.position
    : (ticket && ticket.status === 'waiting' ? Math.max((ticket.number || 0) - currentNumber, 0) : 0);
  const ticketLabel = ticket ? (serviceCode ? `${serviceCode}-${ticket.number}` : `#${ticket.number}`) : "";

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to leave the queue?')) {
      return;
    }

    try {
      setCanceling(true);
      setError("");
      console.log('Canceling ticket...');
      const response = await api.patch('/api/tickets/me/cancel');
      console.log('Ticket canceled successfully:', response);
      
      // Clear ticket state before navigating
      setTicket(null);
      
      // Navigate to service select after successful cancellation
      navigate('/service-select');
    } catch (err) {
      console.error('Failed to cancel ticket:', err);
      setError(err.message || 'Failed to cancel ticket');
      // Don't navigate if cancellation failed
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <GlassCard className="p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">No active ticket</h2>
          <p className="text-muted-foreground">Join a queue to get started.</p>
          <Button onClick={() => navigate('/service-select')} className="mt-2">Choose a service</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Header */}
        <GlassCard className="p-6 text-center animate-slide-up">
          <h1 className="text-2xl font-bold">
            Welcome, {userData.fullName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {ticket.status === 'called' 
              ? "It's your turn! Please proceed to the counter." 
              : "Thank you for waiting. You'll be called soon."}
          </p>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </GlassCard>

        {/* Main Ticket Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Ticket */}
          <div className="space-y-6">
            <TicketDisplay
              ticketNumber={ticketLabel}
              service={serviceName}
            />

            <GlassCard className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Here's your position in the queue:
              </p>
              <div className="text-4xl font-bold text-primary">#{position}</div>
            </GlassCard>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Queue Position */}
            <GlassCard className="p-8 flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">People in Queue</span>
              </div>
              <CircularProgress
                value={Math.max((totalInQueue || 0) - position, 0)}
                max={Math.max(totalInQueue || 1, 1)}
                size={140}
                strokeWidth={12}
                color="primary"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">{position}</div>
                  <div className="text-sm text-muted-foreground">ahead</div>
                </div>
              </CircularProgress>
            </GlassCard>

            {/* Wait Time */}
            <GlassCard className="p-8 flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Estimated Wait Time</span>
              </div>
              <CircularProgress
                value={countdown}
                max={Math.max(countdown, 1)}
                size={140}
                strokeWidth={12}
                color="secondary"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {minutes}:{seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-muted-foreground">remaining</div>
                </div>
              </CircularProgress>
            </GlassCard>

            {/* FAQ Chat */}
            <GlassCard className="p-8 flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Need Help?</span>
              </div>
              <Button
                variant="outline"
                className="glass w-full"
                size="lg"
              >
                Open FAQ Chat
              </Button>
            </GlassCard>
          </div>
        </div>

        {/* Status Banner */}
        <GlassCard className="p-4 text-center">
          <p className="text-sm">
            🔴 <span className="font-semibold">Live</span> • You'll receive a notification when it's your turn
          </p>
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="glass"
          >
            Back to Home
          </Button>
          <Button
            variant="destructive"
            className="bg-destructive hover:bg-destructive/90"
            disabled={canceling}
            onClick={handleCancel}
          >
            {canceling ? "Leaving..." : "Leave Queue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
