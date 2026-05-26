"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Mail, Lock, User, WalletCards, ShieldCheck, CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const { login, signup, loginWithGoogle, resetPassword, verifyOTPCode, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setErrorMsg(null);
    setSubmitLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Signed In Successfully",
        description: `Welcome back to IntelliSpend AI!`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    setErrorMsg(null);
    setSubmitLoading(true);
    try {
      await signup(email, password, name);
      toast({
        title: "Account Created",
        description: "An OTP verification code was sent to your email.",
      });
      setShowOTP(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Signup failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSubmitLoading(true);
    try {
      await loginWithGoogle();
      toast({
        title: "Google Sign In Success",
        description: "Welcome to IntelliSpend AI!",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Google Authentication failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    setErrorMsg(null);
    setSubmitLoading(true);
    try {
      await resetPassword(forgotEmail);
      toast({
        title: "Password Reset Sent",
        description: `Check your inbox at ${forgotEmail} for reset instructions.`,
      });
      setShowForgotPassword(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Password reset failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg("Please enter the verification code.");
      return;
    }
    setErrorMsg(null);
    setSubmitLoading(true);
    try {
      const isVerified = await verifyOTPCode(otp);
      if (isVerified) {
        toast({
          title: "Email Verified",
          description: "Your account is active and verified!",
        });
        router.push('/');
      } else {
        setErrorMsg("Invalid OTP code. Enter 123456 to test!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "OTP verification failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] w-full items-center justify-center bg-[#0A0E17] py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient glowing background circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#00F0FF]/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-[#A855F7]/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl logo-glow mb-3">
            <WalletCards className="h-6 w-6 text-[#0A0E17]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gradient">
            IntelliSpend AI
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground font-medium tracking-wide">
            “Smart Finance. Simplified.”
          </p>
        </div>

        <Card className="border-white/5 bg-card/45 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
          )}

          {/* FORGOT PASSWORD SCREEN */}
          {showForgotPassword ? (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setErrorMsg(null);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>Reset Password</CardTitle>
                </div>
                <CardDescription>
                  Enter your email address and we'll send you instructions to reset your password.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleForgotPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={submitLoading}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button type="submit" className="w-full btn-gradient" disabled={submitLoading}>
                    {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0A0E17]" /> : "Send Reset Link"}
                  </Button>
                </CardFooter>
              </form>
            </>
          ) : showOTP ? (
            /* OTP VERIFICATION SCREEN */
            <>
              <CardHeader className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-[#4285F4] mb-3">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle>Verify Your Account</CardTitle>
                <CardDescription>
                  We have simulated sending a verification code. Please enter the 6-digit OTP code below to verify your email.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleVerifyOTP}>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-center">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="mx-auto max-w-[200px] text-center text-xl font-bold tracking-widest"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={submitLoading}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Quick Sandbox Tip: Enter <span className="font-semibold text-primary">123456</span> to pass instantly.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button type="submit" className="w-full btn-gradient" disabled={submitLoading}>
                    {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0A0E17]" /> : "Verify Code"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      toast({
                        title: "OTP Code Re-sent",
                        description: "Verification code sent! (Use 123456)",
                      });
                    }}
                    type="button"
                    disabled={submitLoading}
                  >
                    Resend Code
                  </Button>
                </CardFooter>
              </form>
            </>
          ) : (
            /* REGULAR LOGIN / REGISTER TABS */
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setErrorMsg(null); }}>
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none h-12">
                <TabsTrigger value="login" className="h-full font-semibold">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="h-full font-semibold">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin}>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Sign in to access your dashboard, receipts, and AI assistant.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@company.com"
                          className="pl-10 focus-visible:ring-[#00F0FF] bg-black/20"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={submitLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs text-[#00F0FF] hover:text-[#00d8e6]"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setErrorMsg(null);
                          }}
                          type="button"
                          disabled={submitLoading}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 focus-visible:ring-[#00F0FF] bg-black/20"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={submitLoading}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-4">
                    <Button type="submit" className="w-full btn-gradient" disabled={submitLoading}>
                      {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0A0E17]" /> : "Sign In"}
                    </Button>

                    <div className="relative flex py-1 items-center justify-center w-full">
                      <div className="border-t border-muted w-full"></div>
                      <span className="absolute bg-card px-3 text-xs text-muted-foreground uppercase">
                        Or continue with
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      type="button"
                      className="w-full border-muted-foreground/20 hover:bg-muted"
                      onClick={handleGoogleLogin}
                      disabled={submitLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                          <path d="M21.35,11.1H12v2.7h5.38C16.88,16.5,14.81,18,12,18c-3.3,0-6-2.7-6-6s2.7-6,6-6c1.55,0,2.97,0.59,4.05,1.55l2-2C16.29,3.77,14.28,3,12,3C7,3,3,7,3,12s4,9,9,9c4.8,0,8-3.4,8-8.1A7.66,7.66,0,0,0,21.35,11.1Z" fill="#4285F4" />
                        </g>
                      </svg>
                      Google
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignup}>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Sign up for a new IntelliSpend AI account to start scanning receipts and tracking budgets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={submitLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={submitLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password (min. 6 chars)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={submitLoading}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-4">
                    <Button type="submit" className="w-full btn-gradient" disabled={submitLoading}>
                      {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0A0E17]" /> : "Sign Up"}
                    </Button>

                    <div className="relative flex py-1 items-center justify-center w-full">
                      <div className="border-t border-muted w-full"></div>
                      <span className="absolute bg-card px-3 text-xs text-muted-foreground uppercase">
                        Or continue with
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      type="button"
                      className="w-full border-muted-foreground/20 hover:bg-muted"
                      onClick={handleGoogleLogin}
                      disabled={submitLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                          <path d="M21.35,11.1H12v2.7h5.38C16.88,16.5,14.81,18,12,18c-3.3,0-6-2.7-6-6s2.7-6,6-6c1.55,0,2.97,0.59,4.05,1.55l2-2C16.29,3.77,14.28,3,12,3C7,3,3,7,3,12s4,9,9,9c4.8,0,8-3.4,8-8.1A7.66,7.66,0,0,0,21.35,11.1Z" fill="#4285F4" />
                        </g>
                      </svg>
                      Google
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
}
