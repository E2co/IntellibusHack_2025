const _jsxFileName = "";import React from 'react';
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
    React.createElement('div', { className: "min-h-screen p-4 md:p-8 flex items-center justify-center"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 23}}
      , React.createElement('div', { className: "w-full max-w-md space-y-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 24}}
        , React.createElement(Button, {
          variant: "ghost",
          className: "mb-4",
          onClick: () => navigate("/taj"), __self: this, __source: {fileName: _jsxFileName, lineNumber: 25}}

          , React.createElement(ArrowLeft, { className: "mr-2 h-4 w-4"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 30}} ), "Back"

        )

        , React.createElement('div', { className: "text-center space-y-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 34}}
          , React.createElement('h1', { className: "text-3xl font-bold" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 35}}, "Welcome Back" )
          , React.createElement('p', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 36}}, "Sign in to view your ticket"     )
        )

        , React.createElement(GlassCard, { className: "p-6", __self: this, __source: {fileName: _jsxFileName, lineNumber: 39}}
          , error && React.createElement('p', { className: "text-sm text-destructive mb-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 40}}, error)
          , React.createElement('form', { onSubmit: handleSubmit, className: "space-y-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 40}}
            , React.createElement('div', { className: "space-y-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 41}}
              , React.createElement(Label, { htmlFor: "email", __self: this, __source: {fileName: _jsxFileName, lineNumber: 42}}, "Email")
              , React.createElement(Input, {
                id: "email",
                type: "email",
                required: true,
                value: formData.email,
                onChange: (e) =>
                  setFormData({ ...formData, email: e.target.value })
                ,
                className: "glass", __self: this, __source: {fileName: _jsxFileName, lineNumber: 43}}
              )
            )

            , React.createElement('div', { className: "space-y-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 55}}
              , React.createElement(Label, { htmlFor: "password", __self: this, __source: {fileName: _jsxFileName, lineNumber: 56}}, "Password")
              , React.createElement(Input, {
                id: "password",
                type: "password",
                required: true,
                value: formData.password,
                onChange: (e) =>
                  setFormData({ ...formData, password: e.target.value })
                ,
                className: "glass", __self: this, __source: {fileName: _jsxFileName, lineNumber: 57}}
              )
            )

            , React.createElement(Button, {
              type: "submit",
              className: "w-full bg-primary hover:bg-primary-dark"  ,
              size: "lg",
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 69}}
, loading ? "Signing in..." : "Sign In"

            )
          )
        )

        , React.createElement('div', { className: "text-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 79}}
          , React.createElement(Button, {
            variant: "link",
            onClick: () => navigate("/signup"), __self: this, __source: {fileName: _jsxFileName, lineNumber: 80}}
, "Don't have an account? Sign up"

          )
        )
      )
    )
  );
};

export default Login;
