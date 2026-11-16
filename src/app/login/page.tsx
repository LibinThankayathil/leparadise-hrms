'use client';

import { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Briefcase, Eye, EyeOff } from 'lucide-react';
import { BrandBirdEmblem } from '@/components/LoadingScreen';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to sign in');
        setLoading(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const fillAndLogin = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    handleLogin(undefined, e, p);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* LEFT PANEL — Branding / Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#1a1a1a] flex-col items-center justify-center overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Gradient accent at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#2D7A58]/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/le-Logo.svg"
              alt="Le Paradise"
              className="w-64 h-auto invert"
            />
          </div>

          {/* Divider */}
          <div className="w-16 h-[2px] bg-[#2D7A58] rounded-full mb-8" />

          {/* Tagline */}
          <h1 className="text-white text-2xl font-light tracking-wide leading-relaxed">
            Human Resources
            <br />
            <span className="font-semibold text-[#5CB88A]">Management System</span>
          </h1>

          <p className="mt-5 text-white/50 text-sm leading-relaxed max-w-sm">
            Streamlined staff operations, attendance tracking, and payroll management for your hospitality team.
          </p>
        </div>

        {/* Bottom decorative text */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/20 text-[11px] tracking-[0.3em] uppercase font-light">
            Empowering Hospitality Excellence
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#FAFBFB] px-6 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo (shown on < lg) */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/le-Logo.svg"
              alt="Le Paradise"
              className="w-48 h-auto"
            />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#181D27] tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-[#717680]">
              Sign in to your HR portal to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-center font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9BA1AB]">
                  <Mail className="h-[16px] w-[16px]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAECF0] hover:border-slate-300 rounded-xl text-[#181D27] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2D7A58]/20 focus:border-[#2D7A58] transition-all placeholder:text-[#B0B5BD]"
                  placeholder="name@leparadise.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9BA1AB]">
                  <Lock className="h-[16px] w-[16px]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-[#EAECF0] hover:border-slate-300 rounded-xl text-[#181D27] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2D7A58]/20 focus:border-[#2D7A58] transition-all placeholder:text-[#B0B5BD]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9BA1AB] hover:text-[#535862] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-[16px] w-[16px]" />
                  ) : (
                    <Eye className="h-[16px] w-[16px]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-semibold text-white bg-[#2D7A58] hover:bg-[#256549] active:bg-[#1E5339] shadow-sm transition-all disabled:opacity-50 cursor-pointer mt-2 overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="w-6 h-4 flex items-center justify-center text-white">
                    <BrandBirdEmblem size={28} className="text-white" />
                  </span>
                  <span>Authenticating...</span>
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="mt-8 pt-6 border-t border-[#EAECF0]">
            <p className="text-[11px] text-center font-semibold text-[#9BA1AB] uppercase tracking-widest mb-3">
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillAndLogin('manager@leparadise.com', 'Manager@123')}
                className="group flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-[#EAF6ED] border border-[#EAECF0] hover:border-[#C3E5D0] text-[#344054] transition-all text-xs font-medium cursor-pointer shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF6ED] group-hover:bg-[#2D7A58] flex items-center justify-center mb-1.5 transition-colors">
                  <Briefcase className="w-4 h-4 text-[#2D7A58] group-hover:text-white transition-colors" />
                </div>
                <span className="text-[12px] font-semibold text-[#181D27]">Manager</span>
                <span className="text-[10px] text-[#717680] mt-0.5">Full Management</span>
              </button>
              <button
                type="button"
                onClick={() => fillAndLogin('employee@leparadise.com', 'Employee@123')}
                className="group flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-[#EAECF0] hover:border-slate-300 text-[#344054] transition-all text-xs font-medium cursor-pointer shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-700 flex items-center justify-center mb-1.5 transition-colors">
                  <UserCheck className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-[12px] font-semibold text-[#181D27]">Staff</span>
                <span className="text-[10px] text-[#717680] mt-0.5">Self-Service</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-[11px] text-[#B0B5BD]">
            &copy; {new Date().getFullYear()} Le Paradise Resort. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
