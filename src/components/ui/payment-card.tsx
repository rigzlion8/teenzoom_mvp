"use client"

import React, { useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Crown, Coins, Zap, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PaymentPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  coins: number
  features: string[]
  popular?: boolean
  icon: React.ReactNode
}

interface PaymentCardProps {
  plan: PaymentPlan
  onPaymentInitiated?: (planId: string, amount: number) => void
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ plan, onPaymentInitiated }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          plan: plan.id,
          metadata: {
            planName: plan.name,
            coins: plan.coins
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Payment initialization failed')
      }

      const result = await response.json()

      // Redirect to Paystack payment page
      window.location.href = result.authorization_url

      // Notify parent component
      onPaymentInitiated?.(plan.id, plan.price)

      toast({
        title: "Payment Initiated",
        description: `Redirecting to payment gateway for ${plan.name} plan...`,
      })

    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`relative ${plan.popular ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {plan.icon}
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        <div className="mb-6">
          <div className="text-3xl font-bold text-purple-600">
            {plan.currency} {plan.price.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            {plan.coins} coins included
          </div>
        </div>

        <ul className="space-y-2 mb-6 text-left">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? 'Processing...' : `Get ${plan.name}`}
        </Button>
      </CardContent>
    </Card>
  )
}

// Predefined payment plans
export const paymentPlans: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started',
    price: 500,
    currency: 'KSh',
    coins: 50,
    features: [
      '50 coins',
      'Basic chat access',
      'Standard support'
    ],
    icon: <Coins className="w-8 h-8 text-blue-500" />
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Enhanced features and benefits',
    price: 1500,
    currency: 'KSh',
    coins: 150,
    features: [
      '150 coins',
      'VIP badge',
      'Priority support',
      'Custom themes',
      'Advanced features'
      ],
    popular: true,
    icon: <Crown className="w-8 h-8 text-yellow-500" />
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Ultimate TeenZoom experience',
    price: 3000,
    currency: 'KSh',
    coins: 300,
    features: [
      '300 coins',
      'Premium badge',
      'All VIP features',
      'Exclusive content',
      '24/7 support',
      'Early access to features'
    ],
    icon: <Zap className="w-8 h-8 text-purple-500" />
  }
]
