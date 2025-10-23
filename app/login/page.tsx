"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Car, Brain, Camera, Star, Zap, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Validation states
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [touched, setTouched] = useState({ email: false, password: false })

  // Mouse tracking for dynamic effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Email validation
  const validateEmail = (email: string) => {
    if (!email) {
      return "E-posta adresi gereklidir"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Geçerli bir e-posta adresi giriniz"
    }
    return ""
  }

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) {
      return "Şifre gereklidir"
    }
    if (password.length < 6) {
      return "Şifre en az 6 karakter olmalıdır"
    }
    return ""
  }

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (touched.email) {
      setEmailError(validateEmail(value))
    }
  }

  // Handle password change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (touched.password) {
      setPasswordError(validatePassword(value))
    }
  }

  // Handle email blur
  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }))
    setEmailError(validateEmail(email))
  }

  // Handle password blur
  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }))
    setPasswordError(validatePassword(password))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({ email: true, password: true })

    // Validate all fields
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)

    setEmailError(emailErr)
    setPasswordError(passwordErr)

    // If there are errors, don't submit
    if (emailErr || passwordErr) {
      return
    }

    setIsLoading(true)
    // Simulate login process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  // Floating animation elements
  const floatingElements = [
    { icon: Car, delay: 0, duration: 6 },
    { icon: Brain, delay: 1, duration: 8 },
    { icon: Camera, delay: 2, duration: 7 },
    { icon: Zap, delay: 3, duration: 5 },
    { icon: Shield, delay: 4, duration: 9 },
    { icon: Star, delay: 5, duration: 6 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-full blur-3xl transition-all duration-1000"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Floating Elements */}
      {floatingElements.map((element, index) => (
        <div
          key={index}
          className="absolute opacity-10 pointer-events-none"
          style={{
            left: `${10 + index * 15}%`,
            top: `${20 + index * 10}%`,
            animation: `float ${element.duration}s ease-in-out infinite`,
            animationDelay: `${element.delay}s`,
          }}
        >
          <element.icon className="w-8 h-8 text-orange-400" />
        </div>
      ))}

      <div className="relative z-10 min-h-screen flex">
        {/* Sol Taraf - Görsel Alan */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Arka Plan Gradyanı */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-blue-600/20 to-orange-500/20"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-blue-500/10"></div>

          {/* Ana İçerik */}
          <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
            {/* Logo ve Başlık */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto p-2">
                <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-2xl" />
              </div>
              <h1 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                  NesiVarUsta'ya
                </span>
                <br />
                <span className="text-white">Hoş Geldiniz</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-md">
                AI destekli otomotiv danışmanlığı ile araç sorunlarınıza profesyonel çözümler
              </p>
            </div>

            {/* Özellik Kartları */}
            <div className="grid grid-cols-2 gap-6 max-w-lg w-full">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Fotoğraf Analizi</h3>
                <p className="text-gray-300 text-sm">Saniyeler içinde teşhis</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Uzman Danışmanlık</h3>
                <p className="text-gray-300 text-sm">Profesyonel çözümler</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/30 to-teal-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">7/24 Destek</h3>
                <p className="text-gray-300 text-sm">Kesintisiz hizmet</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Güvenli Platform</h3>
                <p className="text-gray-300 text-sm">Verileriniz korunur</p>
              </div>
            </div>

            {/* İstatistikler */}
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full -ml-24 -mb-24"></div>
        </div>

        {/* Sağ Taraf - Login Formu */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          {/* Geri Dön Butonu */}
          <Link
            href="/"
            className="absolute top-12 lg:top-8 lg:left-8 left-1/2 transform lg:transform-none -translate-x-1/2 flex items-center space-x-2 text-gray-400 hover:text-orange-400 transition-colors duration-300 group z-50 my-4"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <Card className="w-full max-w-md bg-gray-800/50 border-gray-700/50 backdrop-blur-xl shadow-2xl mt-16 lg:mt-0">
            <CardContent className="p-8">
              {/* Form Başlığı */}
              <div className="text-center mb-8">
                {/* Logo - Sadece mobil görünümde */}
                <div className="block lg:hidden mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto p-1 border-4 border-white/20">
                    <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-2xl" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">Giriş Yap</h2>
                <p className="text-gray-400">AI destekli otomotiv danışmanlığına erişin</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className={`h-5 w-5 ${emailError ? "text-red-400" : "text-gray-400"}`} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                        emailError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-600 focus:ring-orange-500 focus:border-transparent"
                      }`}
                      placeholder="ornek@email.com"
                    />
                  </div>
                  {emailError && <p className="text-red-400 text-sm mt-1">{emailError}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 ${passwordError ? "text-red-400" : "text-gray-400"}`} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                        passwordError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-600 focus:ring-orange-500 focus:border-transparent"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-400 transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordError && <p className="text-red-400 text-sm mt-1">{passwordError}</p>}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-600 rounded bg-gray-700 accent-orange-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-300">
                      Beni hatırla
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-orange-400 hover:text-orange-300 transition-colors duration-300"
                  >
                    Şifremi unuttum
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Giriş yapılıyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Car className="w-5 h-5" />
                      <span>Giriş Yap</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-800/50 text-gray-400">veya</span>
                  </div>
                </div>
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 bg-transparent"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google ile Giriş Yap
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 bg-transparent"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook ile Giriş Yap
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Hesabınız yok mu?{" "}
                  <Link
                    href="/register"
                    className="text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-300"
                  >
                    Kayıt Ol
                  </Link>
                </p>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center space-x-2 text-gray-500 text-xs">
                <Shield className="w-4 h-4" />
                <span>SSL ile korumalı güvenli giriş</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-orange-500"></div>
    </div>
  )
}
