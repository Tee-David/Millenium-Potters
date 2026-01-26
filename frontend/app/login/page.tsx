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
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowRight,
  Banknote,
  Users,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
        setTimeout(checkBackendHealth, 5000);
      } else {
        setBackendStatus("offline");
      }
    }
  };

  useEffect(() => {
    checkBackendHealth();
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

      const { accessToken, refreshToken, user } = response.data.data;

      if (rememberMe) {
        // Store tokens and user in localStorage for persistent login
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("remember_me", "true");
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
        // Clear any session storage
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
      } else {
        // Store tokens in sessionStorage for session-only login
        sessionStorage.setItem("access_token", accessToken);
        sessionStorage.setItem("refresh_token", refreshToken);
        if (user) {
          sessionStorage.setItem("user", JSON.stringify(user));
        }
        // Clear localStorage
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("remember_me");
        localStorage.removeItem("user");
      }

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
    <div className="min-h-screen flex bg-background">
      {/* Left – Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <Image
              src="/logo-horizontal.png"
              alt="Millennium Potters"
              width={180}
              height={48}
              className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
              priority
              onError={(e) => {
                e.currentTarget.src = "/logo.png";
              }}
            />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.trim());
                    if (errors.email) setErrors((s) => ({ ...s, email: "" }));
                  }}
                  className={`pl-10 h-11 ${errors.email
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                    }`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.trim());
                    if (errors.password) setErrors((s) => ({ ...s, password: "" }));
                  }}
                  className={`pl-10 pr-10 h-11 ${errors.password
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                    }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(Boolean(c))}
              />
              <Label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Backend Status */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm">
            {backendStatus === "checking" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Checking connection...</span>
              </div>
            )}
            {backendStatus === "online" && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Server online</span>
              </div>
            )}
            {backendStatus === "waking" && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Server waking up...</span>
              </div>
            )}
            {backendStatus === "offline" && (
              <div className="flex items-center gap-2 text-destructive">
                <WifiOff className="h-3.5 w-3.5" />
                <span>Server offline</span>
                <button
                  onClick={() => {
                    setRetryCount(0);
                    setBackendStatus("checking");
                    checkBackendHealth();
                  }}
                  className="underline hover:no-underline font-medium"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Protected by enterprise-grade security</span>
          </div>

          {/* Footer Attribution */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Millennium Potters | powered by{" "}
              <a
                href="https://wedigcreativity.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                WDC Solutions
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right – Branding Section */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
          {/* Gradient orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* Top Section - Company Name */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-xl font-semibold text-white">Millennium Potters</span>
          </div>
        </div>

        {/* Center Section - Main Message */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Empowering
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Financial Growth
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-300 leading-relaxed">
            A complete loan management solution designed for union-based microfinance operations.
            Manage members, process loans, and track repayments with ease.
          </p>

          {/* Feature Cards */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
                <Users className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-medium text-white">Union Management</h3>
              <p className="mt-1 text-xs text-slate-400">Organize members by unions</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-medium text-white">Quick Processing</h3>
              <p className="mt-1 text-xs text-slate-400">Fast loan approvals</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
                <BarChart3 className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-medium text-white">Real-time Reports</h3>
              <p className="mt-1 text-xs text-slate-400">Track performance</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
                <Shield className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-medium text-white">Secure Access</h3>
              <p className="mt-1 text-xs text-slate-400">Role-based permissions</p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Trust Indicators */}
        <div className="relative z-10">
          <div className="flex items-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Bank-grade Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
