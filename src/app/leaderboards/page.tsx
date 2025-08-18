"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Heart, 
  Video,
  Crown,
  Zap,
  Flame,
  Target
} from 'lucide-react'

interface LeaderboardEntry {
  id: string
  username: string
  displayName: string
  avatar?: string
  rank: number
  score: number
  level: number
  xp: number
  coins: number
  achievements: number
  stats: {
    messagesSent: number
    videosShared: number
    friendsCount: number
    daysActive: number
  }
}

const leaderboardCategories = [
  { 
    id: 'overall', 
    name: 'Overall', 
    icon: Trophy, 
    description: 'Best overall performers',
    color: 'bg-yellow-500'
  },
  { 
    id: 'xp', 
    name: 'Experience', 
    icon: Star, 
    description: 'Highest XP earners',
    color: 'bg-blue-500'
  },
  { 
    id: 'coins', 
    name: 'Wealth', 
    icon: Zap, 
    description: 'Richest users',
    color: 'bg-green-500'
  },
  { 
    id: 'social', 
    name: 'Social', 
    icon: Users, 
    description: 'Most social users',
    color: 'bg-purple-500'
  },
  { 
    id: 'content', 
    name: 'Content', 
    icon: Video, 
    description: 'Top content creators',
    color: 'bg-pink-500'
  },
  { 
    id: 'activity', 
    name: 'Activity', 
    icon: Flame, 
    description: 'Most active users',
    color: 'bg-orange-500'
  }
]

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
  return <span className="text-lg font-bold text-muted-foreground">{rank}</span>
}

const getRankColor = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
  if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
  if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700'
  return 'bg-card'
}

export default function LeaderboardsPage() {
  const { data: session } = useSession()
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({})
  const [selectedCategory, setSelectedCategory] = useState('overall')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    try {
      const response = await fetch('/api/leaderboards')
      if (response.ok) {
        const data = await response.json()
        setLeaderboards(data.leaderboards)
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatScore = (score: number, category: string) => {
    switch (category) {
      case 'xp':
        return `${score.toLocaleString()} XP`
      case 'coins':
        return `${score.toLocaleString()} coins`
      case 'social':
        return `${score} friends`
      case 'content':
        return `${score} videos`
      case 'activity':
        return `${score} days`
      default:
        return score.toLocaleString()
    }
  }

  const getCurrentUserRank = (category: string) => {
    if (!session?.user) return null
    
    const leaderboard = leaderboards[category] || []
    return leaderboard.find(entry => entry.username === session.user.username)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading leaderboards...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Leaderboards</h1>
        <p className="text-muted-foreground text-center">Compete with other teens and climb the ranks!</p>
      </div>

      {/* Current User Stats */}
      {session?.user && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{session.user.level || 1}</p>
                <p className="text-sm text-muted-foreground">Level</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{session.user.xp || 0}</p>
                <p className="text-sm text-muted-foreground">XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{session.user.coins || 0}</p>
                <p className="text-sm text-muted-foreground">Coins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {getCurrentUserRank(selectedCategory)?.rank || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {leaderboardCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden md:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Leaderboard Content */}
      {leaderboardCategories.map((category) => (
        <TabsContent key={category.id} value={category.id}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                {category.name} Leaderboard
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboards[category.id] && leaderboards[category.id].length > 0 ? (
                <div className="space-y-3">
                  {leaderboards[category.id].slice(0, 50).map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                        getRankColor(entry.rank)
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(entry.rank)}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                            {entry.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{entry.displayName}</p>
                            <p className="text-sm text-muted-foreground">@{entry.username}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatScore(entry.score, category.id)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">Level {entry.level}</Badge>
                            {category.id === 'xp' && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {entry.xp.toLocaleString()}
                              </span>
                            )}
                            {category.id === 'coins' && (
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {entry.coins.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No data available for this category</p>
                  <p className="text-sm">Start participating to climb the ranks!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}

      {/* Achievement System Preview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Achievement System
          </CardTitle>
          <CardDescription>
            Unlock achievements and earn rewards as you progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <h3 className="font-semibold">First Steps</h3>
              <p className="text-sm text-muted-foreground">Join your first room</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Chat Master</h3>
              <p className="text-sm text-muted-foreground">Send 100 messages</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Video className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Content Creator</h3>
              <p className="text-sm text-muted-foreground">Share your first video</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
