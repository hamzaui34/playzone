"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Gamepad2, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to login");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 glass-panel animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Log in to resume your progress</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              required
              placeholder="Email address"
              className="w-full bg-[#0B0C10]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full bg-[#0B0C10]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end">
            <Link href="#" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Let&apos;s Play <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          New to PlayZone?{" "}
          <Link href="/register" className="font-bold text-cyan-400 hover:text-cyan-300">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
