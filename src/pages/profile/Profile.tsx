import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Smartphone } from 'lucide-react';
import { getValue } from '@/utils/electronStoreService';

interface UserInfo {
  username: string;
  email: string;
  userType: string;
  // Add other fields as needed based on your auth payload
}

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordChangeOtp, verifyPasswordChange } from '@/api/user.service';
import { toast } from 'sonner';

function Profile() {
  const [user, setUser] = useState<UserInfo | null>(null);

  // Password Change State
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getValue('user');
      if (storedUser) {
        setUser(storedUser);
      }
    };
    loadUser();
  }, []);

  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      await requestPasswordChangeOtp();
      toast.success("OTP sent to your email");
      setStep('verify');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordChange({ otp, newPassword });
      toast.success("Password changed successfully");
      setIsPasswordOpen(false);
      // Reset state
      setStep('request');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences.</p>
          </div>
        </div>

        <Dialog open={isPasswordOpen} onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) {
            setStep('request');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline">Change Password</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                {step === 'request'
                  ? "We will send an OTP to your registered email to verify your identity."
                  : "Enter the OTP sent to your email and your new password."}
              </DialogDescription>
            </DialogHeader>

            {step === 'request' ? (
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">Click below to send OTP.</p>
                <Button onClick={handleRequestOtp} disabled={loading} className="w-full">
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Enter OTP</Label>
                  <Input value={otp} onChange={(e) => setOtp(e.target.value.toUpperCase())} placeholder="Enter 6-digit OTP" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
                </div>
                <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                  {loading ? "Verifying..." : "Change Password"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} />
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{user.username}</h2>
                <Badge variant="secondary" className="mt-1 capitalize">{user.userType}</Badge>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Role</p>
                  <p className="text-sm font-medium capitalize">{user.userType}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Profile