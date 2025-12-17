import React, { useEffect, useState } from "react";
import { login } from "../../api/auth.service";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo-invert.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface IDeviceInfo {
  deviceId: string;
  brand: string;
  model: string;
  systemName: string;
  systemVersion: string;
}

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [deviceInfo, setDeviceInfo] = useState<IDeviceInfo>();

  useEffect(() => {
    const loadInfo = async () => {
      const info = await window.deviceAPI.getDeviceInfo();
      setDeviceInfo(info);
    };
    loadInfo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log(deviceInfo);
      await login({ username, password, deviceInfo });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
      
      {/* Wrapper Box */}
      <div className="w-full max-w-lg rounded-xl shadow-lg border bg-card">

        {/* Header */}
        <div className="bg-primary text-primary-foreground rounded-t-xl p-6 pb-10 flex flex-col items-center">
          <img src={logo} alt="GPKP Attendance System" className="h-28 w-fit mb-4" />
          <h1 className="text-2xl font-semibold text-background">Admin Login</h1>
          <p className="text-background/80">Sign in to access the admin panel</p>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-6">
              {loading ? "Logging in..." : "Login"}
            </Button>

          </form>
        </div>
      </div>

    </div>
  );
};

export default Login;
