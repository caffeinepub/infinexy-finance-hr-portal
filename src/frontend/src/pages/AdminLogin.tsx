import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { login } from "../lib/adminAuth";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 300));
    const ok = login(username, password);
    setLoading(false);
    if (ok) {
      router.navigate({ to: "/admin/dashboard" });
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #1a2c6b 0%, #0f1a45 50%, #080e2a 100%)",
      }}
    >
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <img
            src="/assets/uploads/WhatsApp-Image-2026-02-27-at-11.18.04-AM-1-1.jpeg"
            alt="Infinexy Finance"
            className="h-16 mx-auto mb-4 object-contain"
          />
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            INFINEXY FINANCE
          </h1>
          <p className="text-amber-200 text-sm mt-1">HR Management Portal</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="pb-4">
            <CardTitle
              className="text-center text-xl"
              style={{
                color: "#1a2c6b",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  data-ocid="login.input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="pr-10"
                    data-ocid="login.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 text-sm text-destructive"
                  data-ocid="login.error_state"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full text-white font-bold"
                style={{ background: "#1a2c6b" }}
                disabled={loading}
                data-ocid="login.primary_button"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-white/50 text-xs mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
