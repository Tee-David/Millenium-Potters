"use client";

import type { FC, FormEvent } from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://millenium-potters.onrender.com/api";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type LoginErrorCode = "INVALID_CREDENTIALS" | "NETWORK" | "UNKNOWN";

type LoginError = { code: LoginErrorCode; message: string };

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const isAxiosError = (
  err: unknown
): err is { response?: { status?: number; data?: { message?: string } } } =>
  typeof err === "object" && err !== null && "response" in err;

const toLoginError = (err: unknown): LoginError => {
  if (isAxiosError(err)) {
    const message = err.response?.data?.message || "";

    if (message.includes("Account is inactive")) {
      return {
        code: "INVALID_CREDENTIALS",
        message:
          "Your account has been deactivated. Please contact an administrator.",
      };
    }
    if (message.includes("Branch is inactive")) {
      return {
        code: "INVALID_CREDENTIALS",
        message:
          "Your branch is currently inactive. Please contact an administrator.",
      };
    }
    if (
      message.includes("Invalid credentials") ||
      err.response?.status === 401
    ) {
      return {
        code: "INVALID_CREDENTIALS",
        message:
          "Invalid email or password. Please check your credentials and try again.",
      };
    }
  }

  if (err instanceof Error && err.name === "TypeError")
    return {
      code: "NETWORK",
      message:
        "Unable to connect to the server. Please check your internet connection.",
    };
  return {
    code: "UNKNOWN",
    message: "An unexpected error occurred. Please try again.",
  };
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
const LoginPage: FC = () => {
  const router = useRouter();
  const { logo } = useCompany();

  /* ---------- local state ---------------------------------------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ---------- backend status state ------------------------------- */
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline" | "waking">("checking");
  const [retryCount, setRetryCount] = useState(0);

  /* ---------- backend health check ------------------------------- */
  const checkBackendHealth = async () => {
    const baseUrl = API_URL.replace(/\/api\/?$/, "");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        setBackendStatus("online");
        setRetryCount(0);
      } else {
        setBackendStatus("offline");
      }
    } catch (error) {
      if (retryCount < 3) {
        setBackendStatus("waking");
        setRetryCount((prev) => prev + 1);
        // Retry after delay (Render cold start can take 30-60 seconds)
        setTimeout(checkBackendHealth, 5000);
      } else {
        setBackendStatus("offline");
      }
    }
  };

  useEffect(() => {
    checkBackendHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---------- validation ----------------------------------------- */
  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* ---------- submission ----------------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await auth.login({
        email: email.trim(),
        password: password.trim(),
      });

      /* ---- persist token based on rememberMe ---- */
      const token = response.data.data.accessToken;

      if (rememberMe) {
        // Store in localStorage for persistent session
        localStorage.setItem("access_token", token);
        localStorage.setItem("remember_me", "true");
        // Remove from sessionStorage if exists
        sessionStorage.removeItem("access_token");
      } else {
        // Store in sessionStorage for session-only (clears when browser closes)
        sessionStorage.setItem("access_token", token);
        // Remove from localStorage if exists
        localStorage.removeItem("access_token");
        localStorage.removeItem("remember_me");
      }

      /* ---- success feedback ---- */
      toast.success("Login successful! Redirecting…");
      router.replace("/dashboard");
    } catch (raw) {
      const { message } = toLoginError(raw);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- UI ------------------------------------------------- */
  return (
    <div className="min-h-screen flex">
      {/* Left – Enhanced Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo only — no container/padding */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Image
                src="/logo-horizontal.png"
                alt="Company Logo"
                width={200}
                height={60}
                className="h-14 sm:h-16 w-auto object-contain"
                priority
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-lg">
                Sign in to your account to continue
              </p>
            </div>
          </div>

          {/* Enhanced Form Card */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value.trim());
                        if (errors.email)
                          setErrors((s) => ({ ...s, email: "" }));
                      }}
                      className={`pl-12 h-12 border-2 transition-all duration-200 ${
                        errors.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value.trim());
                        if (errors.password)
                          setErrors((s) => ({ ...s, password: "" }));
                      }}
                      className={`pl-12 pr-12 h-12 border-2 transition-all duration-200 ${
                        errors.password
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(Boolean(c))}
                      className="border-2 border-gray-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  {/* <Link
                    href="/auth/forgot-password"
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link> */}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Backend Status Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {backendStatus === "checking" && (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Checking server status...</span>
              </div>
            )}
            {backendStatus === "online" && (
              <div className="flex items-center gap-2 text-emerald-600">
                <Wifi className="h-4 w-4" />
                <span>Server online</span>
              </div>
            )}
            {backendStatus === "waking" && (
              <div className="flex items-center gap-2 text-amber-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Server waking up... Please wait</span>
              </div>
            )}
            {backendStatus === "offline" && (
              <div className="flex items-center gap-2 text-red-500">
                <WifiOff className="h-4 w-4" />
                <span>Server offline</span>
                <button
                  onClick={() => {
                    setRetryCount(0);
                    setBackendStatus("checking");
                    checkBackendHealth();
                  }}
                  className="underline hover:no-underline ml-1"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Your data is protected with enterprise-grade security</span>
          </div>
        </div>
      </div>

      {/* Right – Enhanced Illustration Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-36 -translate-y-36"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        </div>

        <div className="max-w-lg text-center space-y-8 relative z-10">
          {/* Enhanced Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
              <h2 className="text-5xl font-bold text-white">
                Millennium Potters
              </h2>
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-xl text-emerald-100 font-medium">
              Loan Management System
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Zap className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Lightning Fast
                </h3>
                <p className="text-emerald-100">
                  Instant loan processing and approvals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Secure & Reliable
                </h3>
                <p className="text-emerald-100">
                  Bank-level security for your data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Smart Analytics
                </h3>
                <p className="text-emerald-100">
                  Real-time insights and reporting
                </p>
              </div>
            </div>

            {/* <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Team Collaboration
                </h3>
                <p className="text-emerald-100">
                  Seamless workflow across branches
                </p>
              </div>
            </div> */}
          </div>

          {/* Enhanced Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Image
                src="/flyer.jpg"
                alt="Loan management illustration"
                width={400}
                height={300}
                className="max-w-full h-auto rounded-xl shadow-2xl"
                priority // Add priority for LCP optimization
                style={{
                  width: "auto",
                  height: "auto",
                }}
              />
            </div>
          </div>

          {/* Stats */}
          {/* <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-sm text-emerald-100">Loans Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-sm text-emerald-100">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-emerald-100">Support</div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
