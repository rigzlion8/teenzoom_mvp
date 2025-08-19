import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MessageCircle, 
  Users, 
  Video, 
  Coins, 
  Shield, 
  Zap,
  ArrowRight
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 text-center text-white">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TeenZoom
          </h1>
        </div>
        
        <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-300 max-w-3xl mx-auto px-4">
          The next generation social platform. Livestream, Chat, share videos, make friends, 
          and earn rewards in a safe, modern environment built with cutting-edge tech.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
            <Link href="/auth/signin">
              Check In
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
            <Link href="/auth/signup">Create Account</Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12 sm:mb-16 px-4">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
          <Link href="/room/general" className="block">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mb-3 sm:mb-4" />
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Real-time Chat</CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Join the general chat room and start messaging and Go Live with friends
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/videos" className="block">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <Video className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 mb-3 sm:mb-4" />
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Video Sharing</CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Upload, watch, and share videos with your community
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/rooms" className="block">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-green-400 mb-3 sm:mb-4" />
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Community</CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Discover, create and join rooms to connect with your tribe
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <Coins className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Rewards System</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Earn coins, XP, subscribe and unlock the VIP shop and other cool features
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
                Built with Next.js 15 and modern tech leveraging on AI
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
            Experience the next generation of social platforms with TeenZoom v2.0
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
