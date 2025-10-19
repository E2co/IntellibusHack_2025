const _jsxFileName = "";import React, { useEffect, useState } from 'react';
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
    try {
      await api.post('/api/tickets', { serviceId })
      navigate('/ticket')
    } catch (err) {
      setError(err.message || 'Failed to create ticket')
    }
  };

  return (
    React.createElement('div', { className: "min-h-screen p-4 md:p-8"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 72}}
      , React.createElement('div', { className: "max-w-6xl mx-auto space-y-8"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 73}}
        , React.createElement(Button, {
          variant: "ghost",
          className: "mb-4",
          onClick: () => navigate(-1), __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}}

          , React.createElement(ArrowLeft, { className: "mr-2 h-4 w-4"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 79}} ), "Back"

        )

        , React.createElement('div', { className: "text-center space-y-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 83}}
          , React.createElement('h1', { className: "text-3xl md:text-4xl font-bold"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 84}}, "Select Your Service"  )
          , React.createElement('p', { className: "text-muted-foreground text-lg" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}, "Choose the service you need assistance with"

          )
        )

        , error && React.createElement('div', { className: "p-4 text-destructive text-center" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}}, error)

        , React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}}
          , (loading ? [] : services).map((service, index) => (
            React.createElement('div', {
              key: service.id,
              className: "animate-slide-up",
              style: { animationDelay: `${index * 0.1}s` }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 92}}

              , React.createElement(ServiceTile, {
                ...service,
                onClick: () => handleServiceSelect(service.id), __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}}
              )
            )
          ))
        )

        , React.createElement(GlassCard, { className: "p-6 text-center" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 105}}
          , React.createElement('p', { className: "text-sm text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 106}}, "Select a service to receive your queue ticket"

          )
        )
      )
    )
  );
};

export default ServiceSelect;
