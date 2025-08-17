"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  User, 
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SignupData {
  email: string
  username: string
  displayName: string
  password: string
  confirmPassword: string
}

const steps = [
  { id: 1, title: "Email", field: "email", icon: Mail },
  { id: 2, title: "Username", field: "username", icon: User },
  { id: 3, title: "Display Name", field: "displayName", icon: User },
  { id: 4, title: "Password", field: "password", icon: Lock },
  { id: 5, title: "Confirm Password", field: "confirmPassword", icon: Lock }
]

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<SignupData>({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (field: keyof SignupData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Email
        if (!formData.email) return "Email is required"
        if (!/\S+@\S+\.\S+/.test(formData.email)) return "Please enter a valid email"
        break
      case 2: // Username
        if (!formData.username) return "Username is required"
        if (formData.username.length < 3) return "Username must be at least 3 characters"
        break
      case 3: // Display Name
        if (!formData.displayName) return "Display name is required"
        if (formData.displayName.length < 2) return "Display name must be at least 2 characters"
        break
      case 4: // Password
        if (!formData.password) return "Password is required"
        if (formData.password.length < 6) return "Password must be at least 6 characters"
        break
      case 5: // Confirm Password
        if (!formData.confirmPassword) return "Please confirm your password"
        if (formData.password !== formData.confirmPassword) return "Passwords don't match"
        break
    }
    return null
  }

  const handleNext = () => {
    const error = validateCurrentStep()
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      })
      return
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // First, create the account
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          displayName: formData.displayName,
          password: formData.password,
        }),
      })

      if (signupResponse.ok) {
        toast({
          title: "Account created successfully! 🎉",
          description: "Welcome to TeenZoom! Signing you in...",
        })
        
        // Now sign in the user using NextAuth.js
        const signInResult = await signIn("credentials", {
          username: formData.username,
          password: formData.password,
          redirect: false,
        })

        if (signInResult?.ok) {
          router.push("/dashboard")
        } else {
          const error = await signupResponse.json()
          toast({
            title: "Registration failed",
            description: error.message || "Something went wrong",
            variant: "destructive",
          })
        }
      } else {
        const error = await signupResponse.json()
        toast({
          title: "Registration failed",
          description: error.message || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentStep < steps.length) {
        handleNext()
      } else {
        handleSubmit()
      }
    }
  }

  const getCurrentField = () => {
    return steps.find(step => step.id === currentStep)
  }

  const getFieldValue = (field: string) => {
    return formData[field as keyof SignupData] || ""
  }

  const renderCurrentStep = () => {
    const currentField = getCurrentField()
    if (!currentField) return null

    const { field, icon: Icon } = currentField
    const value = getFieldValue(field)

    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4 sm:space-y-6"
      >
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {currentField.title}
          </h2>
          <p className="text-gray-300 text-sm sm:text-base">
            {currentStep === 1 && "Enter your email address"}
            {currentStep === 2 && "Choose a unique username"}
            {currentStep === 3 && "How should we call you?"}
            {currentStep === 4 && "Create a strong password"}
            {currentStep === 5 && "Confirm your password"}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {field === "email" && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm sm:text-base">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={value}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="your.email@example.com"
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 text-center text-base sm:text-lg py-3 sm:py-4"
                autoFocus
              />
            </div>
          )}

          {field === "username" && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white text-sm sm:text-base">Username</Label>
              <Input
                id="username"
                type="text"
                value={value}
                onChange={(e) => handleInputChange("username", e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Choose a unique username"
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 text-center text-base sm:text-lg py-3 sm:py-4"
                autoFocus
              />
            </div>
          )}

          {field === "displayName" && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-white text-sm sm:text-base">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={value}
                onChange={(e) => handleInputChange("displayName", e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="How should we call you?"
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 text-center text-base sm:text-lg py-3 sm:py-4"
                autoFocus
              />
            </div>
          )}

          {field === "password" && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm sm:text-base">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Create a strong password"
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 text-center text-base sm:text-lg py-3 sm:py-4 pr-12"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {field === "confirmPassword" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white text-sm sm:text-base">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={value}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm your password"
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 text-center text-base sm:text-lg py-3 sm:py-4 pr-12"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
            >
              Next
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Create Account
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm sm:max-w-md bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Join TeenZoom
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm sm:text-base">
            Create your account step by step
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          {/* Progress Steps */}
          <div className="flex justify-between mb-6 sm:mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                  step.id <= currentStep 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white/20 text-gray-400'
                }`}>
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mt-2 ${
                    step.id < currentStep ? 'bg-purple-600' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
          
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-300 text-sm sm:text-base">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300 underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
