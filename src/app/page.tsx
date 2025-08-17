import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Users, 
  Video, 
  Coins, 
  Shield, 
  Zap,
  ArrowRight,
  Star
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 text-center text-white">
        <div className="mb-6 sm:mb-8">
          <Badge variant="secondary" className="mb-3 sm:mb-4 text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Version 2.0 - Now with Next.js 15!
          </Badge>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          TeenZoom
        </h1>
        
        <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-300 max-w-3xl mx-auto px-4">
          The next generation teen social platform. Chat, share videos, make friends, 
          and earn rewards in a safe, modern environment built with cutting-edge technology.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
            <Link href="/auth/signin">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
            <Link href="/auth/signup">Create Account</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12 sm:mb-16 px-4">
          Why Choose TeenZoom?
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Real-time Chat</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Instant messaging with friends in private or public rooms
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <Video className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Video Sharing</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Share and watch videos with your community
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-green-400 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Community</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Join rooms, make friends, and build connections
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <Coins className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Rewards System</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Earn coins, XP, and unlock VIP features
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Safe & Secure</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Built with security and moderation in mind
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-pink-400 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Lightning Fast</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Built with Next.js 15 and modern technologies
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 max-w-4xl mx-auto border border-white/20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 text-center">
            Ready to Join the Future?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 text-center">
            Experience the next generation of teen social platforms with TeenZoom v2.0
          </p>
          <div className="text-center">
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-base sm:text-lg lg:text-xl px-6 sm:px-8 py-3 sm:py-4">
              <Link href="/auth/signup">
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
