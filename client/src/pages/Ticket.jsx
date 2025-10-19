const _jsxFileName = "";import React from 'react';
import { GlassCard } from "@/components/GlassCard";
import { TicketDisplay } from "@/components/TicketDisplay";
import { CircularProgress } from "@/components/CircularProgress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Users, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

  // Poll traffic periodically to update position
  useEffect(() => {
    if (!ticket) return;
    let cancelled = false;
    async function poll() {
      try {
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
    const serviceInfo = ticket ? trafficMap[ticket.serviceId] : null;
    const current = serviceInfo?.currentNumber || 0;
    const position = ticket && ticket.status === 'waiting' ? Math.max((ticket.number || 0) - current, 0) : 0;
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
  const currentNumber = serviceInfo?.currentNumber || 0;
  const totalInQueue = serviceInfo?.totalInQueue ?? 0;
  const position = ticket && ticket.status === 'waiting' ? Math.max((ticket.number || 0) - currentNumber, 0) : 0;
  const ticketLabel = ticket ? (serviceCode ? `${serviceCode}-${ticket.number}` : `#${ticket.number}`) : "";

  const handleCancel = async () => {
    try {
      setCanceling(true);
      await api.patch('/api/tickets/me/cancel');
      navigate('/service-select');
    } catch (err) {
      setError(err.message || 'Failed to cancel');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      React.createElement('div', { className: "min-h-screen p-4 md:p-8 flex items-center justify-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 64}}
        , React.createElement('div', { className: "text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 65}}, "Loading ticket...")
      )
    );
  }

  if (!ticket) {
    return (
      React.createElement('div', { className: "min-h-screen p-4 md:p-8 flex items-center justify-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}
        , React.createElement(GlassCard, { className: "p-8 text-center space-y-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 72}}
          , React.createElement('h2', { className: "text-2xl font-bold", __self: this, __source: {fileName: _jsxFileName, lineNumber: 73}}, "No active ticket")
          , React.createElement('p', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}}, "Join a queue to get started.")
          , React.createElement(Button, { onClick: () => navigate('/service-select'), className: "mt-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 75}}, "Choose a service")
        )
      )
    );
  }

  // derive mm:ss inline where needed

  return (
    React.createElement('div', { className: "min-h-screen p-4 md:p-8"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}
      , React.createElement('div', { className: "max-w-6xl mx-auto space-y-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 87}}
        /* Welcome Header */
        , React.createElement(GlassCard, { className: "p-6 text-center animate-slide-up"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 89}}
          , React.createElement('h1', { className: "text-2xl font-bold" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}}, "Welcome, "
             , userData.fullName.split(" ")[0], "!"
          )
          , React.createElement('p', { className: "text-muted-foreground mt-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 93}}, ticket.status === 'called' ? "It's your turn! Please proceed to the counter." : "Thank you for waiting. You'll be called soon."

          )
          , error && React.createElement('p', { className: "text-destructive mt-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}, error)
        )

        /* Main Ticket Display */
        , React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 99}}
          /* Left Column - Ticket */
          , React.createElement('div', { className: "space-y-6", __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}
            , React.createElement(TicketDisplay, {
              ticketNumber: ticketLabel,
              service: serviceName, __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}
            )

            , React.createElement(GlassCard, { className: "p-6 text-center" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 107}}
              , React.createElement('p', { className: "text-sm text-muted-foreground mb-2"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 108}}, "Here's your position in the queue:"

              )
              , React.createElement('div', { className: "text-4xl font-bold text-primary"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 111}}, "#", position)
            )
          )

          /* Right Column - Stats */
          , React.createElement('div', { className: "space-y-6", __self: this, __source: {fileName: _jsxFileName, lineNumber: 116}}
            /* Queue Position */
            , React.createElement(GlassCard, { className: "p-8 flex flex-col items-center justify-center space-y-4"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 118}}
              , React.createElement('div', { className: "flex items-center gap-2 text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 119}}
                , React.createElement(Users, { className: "w-5 h-5" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 79}} )
                , React.createElement('span', { className: "text-sm font-medium" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 80}}, "People in Queue"  )
              )
              , React.createElement(CircularProgress, {
                value: Math.max((totalInQueue || 0) - position, 0),
                max: Math.max(totalInQueue || 1, 1),
                size: 140,
                strokeWidth: 12,
                color: "primary", __self: this, __source: {fileName: _jsxFileName, lineNumber: 82}}

                , React.createElement('div', { className: "text-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 129}}
                  , React.createElement('div', { className: "text-3xl font-bold" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 130}}, position)
                  , React.createElement('div', { className: "text-sm text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 91}}, "ahead")
                )
              )
            )

            /* Wait Time */
            , React.createElement(GlassCard, { className: "p-8 flex flex-col items-center justify-center space-y-4"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 136}}
              , React.createElement('div', { className: "flex items-center gap-2 text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 137}}
                , React.createElement(Clock, { className: "w-5 h-5" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 99}} )
                , React.createElement('span', { className: "text-sm font-medium" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}, "Estimated Wait Time"  )
              )
              , React.createElement(CircularProgress, {
                value: countdown,
                max: Math.max(countdown, 1),
                size: 140,
                strokeWidth: 12,
                color: "secondary", __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}

                , React.createElement('div', { className: "text-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 149}}
                  , React.createElement('div', { className: "text-3xl font-bold" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 150}}
                    , Math.floor(countdown / 60), ":", (countdown % 60).toString().padStart(2, "0")
                  )
                  , React.createElement('div', { className: "text-sm text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 113}}, "remaining")
                )
              )
            )

            /* FAQ Chat */
            , React.createElement(GlassCard, { className: "p-8 flex flex-col items-center justify-center space-y-4"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 156}}
              , React.createElement('div', { className: "flex items-center gap-2 text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 157}}
                , React.createElement(MessageCircle, { className: "w-5 h-5" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 121}} )
                , React.createElement('span', { className: "text-sm font-medium" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 122}}, "Need Help?" )
              )
              , React.createElement(Button, {
                variant: "outline",
                className: "glass w-full" ,
                size: "lg", __self: this, __source: {fileName: _jsxFileName, lineNumber: 124}}
, "Open FAQ Chat"

              )
            )
          )
        )

        /* Status Banner */
        , React.createElement(GlassCard, { className: "p-4 text-center" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 173}}
          , React.createElement('p', { className: "text-sm", __self: this, __source: {fileName: _jsxFileName, lineNumber: 174}}, "🔴 "
             , React.createElement('span', { className: "font-semibold", __self: this, __source: {fileName: _jsxFileName, lineNumber: 175}}, "Live"), " • You'll receive a notification when it's your turn"
          )
        )

        /* Action Buttons */
        , React.createElement('div', { className: "flex gap-4 justify-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 180}}
          , React.createElement(Button, {
            variant: "outline",
            onClick: () => navigate("/"),
            className: "glass", __self: this, __source: {fileName: _jsxFileName, lineNumber: 144}}
, "Back to Home"

          )
          , React.createElement(Button, {
            variant: "destructive",
            className: "bg-destructive hover:bg-destructive/90" ,
            disabled: canceling,
            onClick: handleCancel, __self: this, __source: {fileName: _jsxFileName, lineNumber: 188}}
, canceling ? "Leaving..." : "Leave Queue"

          )
        )
      )
    )
  );
};

export default Ticket;
