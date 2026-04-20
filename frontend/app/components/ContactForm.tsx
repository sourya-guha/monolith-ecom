'use client';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import GoogleButton from "./GoogleButton";
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { UserPlus } from 'lucide-react';

export default function ContactForm() {
  const [accountType, setAccountType] = useState<'user' | 'seller'>('user');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { register, verifyOtp } = useAuth();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      if (step === 'register') {
        await register({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
          role: accountType,
        });
        setStep('otp');
        setMessage('OTP sent to your email. Please verify to complete registration.');
      } else {
        await verifyOtp(formData.email, otp);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      <div className="glass-card p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <UserPlus size={22} className="text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Create Account</h2>
          <p className="text-sm text-[#64748b] mt-2">Join PROJECT-X today</p>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#64748b]">Have an account?</span>
            <Link href="/login" className="text-[#c084fc] font-medium hover:underline">Login</Link>
          </div>

          {step === 'register' && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium transition-colors ${accountType === 'user' ? 'text-white' : 'text-[#64748b]'}`}>
                User
              </span>
              <button
                type="button"
                onClick={() => setAccountType(accountType === 'user' ? 'seller' : 'user')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  accountType === 'seller'
                    ? 'bg-gradient-to-r from-[#7c3aed] to-[#4f46e5]'
                    : 'bg-white/[0.1]'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  accountType === 'seller' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-xs font-medium transition-colors ${accountType === 'seller' ? 'text-white' : 'text-[#64748b]'}`}>
                Seller
              </span>
            </div>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {step === 'register' && (
            <>
              <div className="w-full flex justify-center">
                <GoogleButton />
              </div>

              <div className="relative flex items-center w-full py-4">
                <div className="flex-grow border-t border-white/[0.06]" />
                <span className="flex-shrink mx-4 text-[#64748b] text-xs font-medium uppercase tracking-wider">
                  or sign up with email
                </span>
                <div className="flex-grow border-t border-white/[0.06]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstname" className="block text-xs font-medium text-[#94a3b8] mb-1.5">First name</label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-dark"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastname" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Last name</label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-dark"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-dark"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-dark"
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center mb-2">
                <p className="text-sm text-[#94a3b8]">
                  We sent a code to <strong className="text-white">{formData.email}</strong>
                </p>
              </div>
              <div>
                <label htmlFor="otp" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Verification code</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-dark text-center text-lg tracking-[0.3em]"
                  placeholder="000000"
                  required
                />
              </div>
            </>
          )}

          {message && (
            <div className="text-sm text-center p-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {message}
            </div>
          )}
          {error && (
            <div className="text-sm text-center p-3 rounded-xl bg-[#f43f5e]/10 text-[#fb7185] border border-[#f43f5e]/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-gradient w-full py-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? (step === 'register' ? 'Creating Account...' : 'Verifying...')
              : (step === 'register' ? 'Continue' : 'Verify OTP')}
          </button>
        </form>
      </div>
    </motion.div>
  );
}