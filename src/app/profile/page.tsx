"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Monitor, Smartphone, ShieldCheck, Mail, LogOut, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';

const PRESET_AVATARS = [
  { name: 'Sujitha', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sujitha' },
  { name: 'IntelliSpend Admin', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin' },
  { name: 'Saver', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=saver' },
  { name: 'Investor', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=investor' },
  { name: 'Analyst', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=analyst' },
  { name: 'Innovator', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=innovator' },
];

export default function ProfilePage() {
  const { user, updateUserProfile, terminateSession, sendVerificationEmail, isMock } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [role, setRole] = useState(user?.role || 'User');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  if (!user) return null;

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await updateUserProfile({
        displayName,
        photoURL,
        role: role as 'User' | 'Admin'
      });
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Failed to update profile info.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Verify Email
  const handleVerifyEmail = async () => {
    setVerifyLoading(true);
    try {
      await sendVerificationEmail();
      toast({
        title: "Verification Sent",
        description: `We sent a link to ${user.email} (simulated link sent if in mock mode).`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sending Failed",
        description: err.message || "Failed to send verification link.",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle Terminate Session
  const handleTerminateSession = async (sessionId: string) => {
    try {
      await terminateSession(sessionId);
      toast({
        title: "Session Terminated",
        description: "The selected device session has been closed.",
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Terminate All Other Sessions
  const handleTerminateOthers = async () => {
    const otherSessions = user.sessions.filter(s => !s.isCurrent);
    for (const session of otherSessions) {
      await terminateSession(session.id);
    }
    toast({
      title: "Sessions Cleaned",
      description: "Logged out from all other devices successfully.",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information, security options, active sessions, and access level.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* PROFILE OVERVIEW CARD */}
        <Card className="md:col-span-1 border-muted-foreground/10 bg-card">
          <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-2 border-primary/25 shadow-md">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
              <AvatarFallback className="text-2xl font-bold">
                {user.displayName?.substring(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="mt-3 space-y-1">
              <h2 className="text-xl font-bold">{user.displayName || 'Valued User'}</h2>
              <p className="text-xs text-muted-foreground break-all">{user.email}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Badge className={user.role === 'Admin' ? "bg-gradient-to-r from-red-500 to-amber-500 border-none" : "bg-[#4285F4] border-none"}>
                {user.role}
              </Badge>
              <Badge variant={user.emailVerified ? "outline" : "destructive"} className="gap-1">
                {user.emailVerified ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-[#34A853]" />
                    Verified
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3 w-3" />
                    Unverified
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground border-t border-muted pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Account Type:</span>
              <span className="font-semibold text-foreground">{isMock ? 'Demo Sandbox Account' : 'Firebase Cloud Account'}</span>
            </div>
            <div className="flex justify-between">
              <span>UID:</span>
              <span className="font-mono text-[10px] text-foreground">{user.uid.substring(0, 16)}...</span>
            </div>
          </CardContent>
        </Card>

        {/* PROFILE EDIT FORM */}
        <Card className="md:col-span-2 border-muted-foreground/10 bg-card">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Update your account details, change display avatar, and configure system role.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-6">
              {/* DISPLAY NAME */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={submitLoading}
                  required
                />
              </div>

              {/* AVATAR SELECTOR */}
              <div className="space-y-2">
                <Label>Choose Avatar Profile</Label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      key={avatar.name}
                      type="button"
                      className={`relative flex items-center justify-center rounded-xl p-1 border transition-all ${
                        photoURL === avatar.url 
                          ? 'border-[#00F0FF] bg-[#00F0FF]/10 scale-105 shadow-sm shadow-[#00F0FF]/20' 
                          : 'border-muted-foreground/10 hover:border-muted-foreground/30 hover:scale-102'
                      }`}
                      onClick={() => setPhotoURL(avatar.url)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatar.url} alt={avatar.name} />
                        <AvatarFallback>{avatar.name.substring(0,2)}</AvatarFallback>
                      </Avatar>
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <Label htmlFor="customAvatar" className="text-xs text-muted-foreground">Or paste a custom avatar URL</Label>
                  <Input
                    id="customAvatar"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="text-xs mt-1"
                    disabled={submitLoading}
                  />
                </div>
              </div>

              {/* ROLE PICKER (FOR DEMO/TESTING CONVENIENCE) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="role">User Role</Label>
                  <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded font-medium border border-amber-200/50">
                    Demo Mode Toggle
                  </span>
                </div>
                <Select value={role} onValueChange={(val: any) => setRole(val)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">Standard User (Standard Access)</SelectItem>
                    <SelectItem value="Admin">Administrator (Unrestricted Admin Access)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjusting this role modifies your view and permissions immediately across the IntelliSpend AI system.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-muted pt-4">
              <Button type="submit" className="btn-gradient" disabled={submitLoading}>
                {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0A0E17]" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SECURITY CARD */}
        <Card className="border-muted-foreground/10 bg-card">
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Check account validation status and perform verification actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm">Email Status</h3>
                <p className="text-xs text-muted-foreground">
                  {user.emailVerified ? 'Your email is validated and verified.' : 'Your email is pending verification.'}
                </p>
              </div>
              <div>
                {user.emailVerified ? (
                  <CheckCircle className="h-6 w-6 text-[#34A853]" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleVerifyEmail}
                    disabled={verifyLoading}
                  >
                    {verifyLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Verify Now
                  </Button>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-4 text-xs text-muted-foreground">
              <h4 className="font-semibold text-[#00F0FF] mb-1">Two-Factor Auth (OTP)</h4>
              IntelliSpend AI prompts you to verify your email identity via a secure 6-digit OTP code when creating new accounts. This protects device profiles from fraud.
            </div>
          </CardContent>
        </Card>

        {/* SESSIONS & DEVICES (MULTI-DEVICE LOGIN) */}
        <Card className="border-muted-foreground/10 bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle>Active Devices</CardTitle>
              <CardDescription>
                View and manage your active sessions across multiple devices.
              </CardDescription>
            </div>
            {user.sessions.filter(s => !s.isCurrent).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleTerminateOthers}
              >
                Logout Others
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-muted">
              {user.sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {session.deviceName.toLowerCase().includes('iphone') || session.deviceName.toLowerCase().includes('ios') ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Monitor className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        {session.deviceName}
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-[10px] h-4 bg-green-100 text-green-800 border-none px-1.5 hover:bg-green-100">
                            Current
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground">{session.lastActive}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 rounded-full"
                    onClick={() => handleTerminateSession(session.id)}
                    title={session.isCurrent ? "Log out of current device" : "Terminate session"}
                  >
                    {session.isCurrent ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
