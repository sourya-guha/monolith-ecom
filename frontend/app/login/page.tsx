'use client';
import React, { useState } from 'react';
import GoogleButton from "../components/GoogleButton";
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

const login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  return (
     <div className=" flex justify-center items-center min-h-screen bg-gray-100">
     <div  className=" w-[600px] h-[600px]    p-6 ">
     <h2 className="text-4xl font-semibold text-center mb-8 text-gray-800">Login To Your Account</h2>
      <div className="flex items-center justify-center gap-2 mb-8">
    <span className="text-lg">Don't have an account?</span>
    <Link 
      href="/signin" 
      className="text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors"
    >
     Sign in
    </Link>
  </div>
      <form className="  space-y-4" onSubmit={handleSubmit}>
       
          <div className="w-full flex justify-center">
    <GoogleButton />
  </div>

  <div className="relative flex items-center w-full py-6">
  {/* The left line */}
  <div className="flex-grow border-t border-gray-300"></div>
  
  {/* The text in the middle */}
  <span className="flex-shrink mx-6 text-gray-500 text-lg font-medium uppercase tracking-wider">
    or sign in with email
  </span>
  
  {/* The right line */}
  <div className="flex-grow border-t border-gray-300"></div>
</div>
        {/* Name Input */}
        

        {/* Email Input */}
         <div className="relative w-full">
  <input 
    type="email" 
    id="email"
    name="email"
    value={formData.email}
    onChange={handleInputChange}
    placeholder=" " 
    className=" border-slate-400 border-1 peer w-full h-16 px-8 pt-4 text-lg border border-gray-300 rounded-2xl focus:border-blue-500 outline-none transition-all placeholder-transparent" 
  />
  <label 
    htmlFor="email"
    className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-all cursor-text
               peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-lg
               peer-focus:top-3 peer-focus:text-xs peer-focus:text-blue-500
               peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
  >
   name@example.com
  </label>
</div>

{/* Password Input Group */}
<div className="relative">
  <input 
    type="password" 
    id="password" 
    name="password"
    value={formData.password}
    onChange={handleInputChange}
    placeholder=" " 
    className=" border-slate-400
      peer w-full h-16 px-6 pt-5 text-lg 
     border-1 rounded-2xl 
     
      focus:border-blue-500 outline-none
      transition-all
    " 
  />
  <label 
    htmlFor="password" 
    className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-all cursor-text
               peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-lg
               peer-focus:top-3 peer-focus:text-xs peer-focus:text-blue-500
               peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
  
  >
    Password
  </label>
  
  {/* Optional: Password Visibility Toggle Icon */}
 
</div>

{error && (
  <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
    {error}
  </div>
)}
      
        {/* Submit Button (Notice how we use btn-primary here) */}
       <button
  type="submit"
  disabled={isLoading}
  className="
    group
    relative w-full h-10 mt-6
    bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb]
    disabled:bg-gray-400 disabled:cursor-not-allowed
    text-white text-xl font-small tracking-tight
    rounded-xl
    transition-all duration-300 ease-out
    shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)]
    active:scale-[0.98]
    overflow-hidden
    pb-1
  "
>
  <span className="relative z-10">
    {isLoading ? 'Signing In...' : 'Continue'}
  </span>
  
  {/* Optional: subtle sheen effect on hover */}
  <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"></div>
</button>
      </form>
    </div>
    </div>
  )
}

export default login