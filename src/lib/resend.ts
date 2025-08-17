import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export interface WelcomeEmailData {
  username: string
  displayName: string
  email: string
}

export interface PasswordResetEmailData {
  username: string
  displayName: string
  email: string
  resetToken: string
  resetUrl: string
}

export interface PaymentConfirmationEmailData {
  username: string
  displayName: string
  email: string
  amount: number
  currency: string
  plan: string
  transactionId: string
  paymentDate: string
}

export interface FriendRequestEmailData {
  username: string
  displayName: string
  email: string
  friendUsername: string
  friendDisplayName: string
}

export interface FriendAcceptedEmailData {
  username: string
  displayName: string
  email: string
  friendUsername: string
  friendDisplayName: string
}

export interface RoomInvitationEmailData {
  username: string
  displayName: string
  email: string
  roomName: string
  roomDescription: string
  inviterUsername: string
  inviterDisplayName: string
  roomUrl: string
}

export interface SecurityAlertEmailData {
  username: string
  displayName: string
  email: string
  alertType: 'login' | 'password_change' | 'suspicious_activity'
  location?: string
  device?: string
  timestamp: string
}

export interface WeeklyDigestEmailData {
  username: string
  displayName: string
  email: string
  stats: {
    messagesSent: number
    friendsAdded: number
    coinsEarned: number
    level: number
    xp: number
  }
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

// Send generic email
export const sendEmail = async (emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const result = await resend.emails.send({
      from: emailData.from || 'TeenZoom <noreply@teenzoom.com>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    })

    if (result.error) {
      console.error('Resend email error:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Welcome email template
export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to TeenZoom!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to TeenZoom!</h1>
          <p>Your journey to amazing teen social experiences starts now!</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p>Welcome to TeenZoom, the next-generation social platform built specifically for teens like you!</p>
          
          <h3>🚀 What you can do:</h3>
          <ul>
            <li>💬 Chat with friends in real-time</li>
            <li>📱 Share photos, videos, and files</li>
            <li>👥 Join exciting chat rooms</li>
            <li>🎮 Earn coins and level up</li>
            <li>⭐ Unlock VIP features</li>
          </ul>
          
          <p>Your account is all set up and ready to go!</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
          
          <h3>🔐 Account Details:</h3>
          <p><strong>Username:</strong> ${data.username}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Happy chatting! 🎊</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '🎉 Welcome to TeenZoom - Your Account is Ready!',
    html
  })
}

// Password reset email template
export const sendPasswordResetEmail = async (data: PasswordResetEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
          <p>We received a request to reset your password</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p>We received a request to reset the password for your TeenZoom account.</p>
          
          <a href="${data.resetUrl}" class="button">Reset Password</a>
          
          <div class="warning">
            <p><strong>⚠️ Important:</strong></p>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password will remain unchanged until you click the link above</li>
            </ul>
          </div>
          
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
          
          <p>If you have any questions, contact our support team immediately.</p>
          
          <p>Stay safe! 🛡️</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '🔐 Reset Your TeenZoom Password',
    html
  })
}

// Payment confirmation email template
export const sendPaymentConfirmationEmail = async (data: PaymentConfirmationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .receipt { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Payment Confirmed!</h1>
          <p>Thank you for your purchase</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p>Your payment has been successfully processed. Here's your receipt:</p>
          
          <div class="receipt">
            <h3>📋 Payment Receipt</h3>
            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p><strong>Plan:</strong> ${data.plan}</p>
            <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
            <p><strong>Date:</strong> ${data.paymentDate}</p>
            <p><strong>Status:</strong> ✅ Confirmed</p>
          </div>
          
          <p>Your account has been updated with the new benefits. Enjoy your enhanced TeenZoom experience!</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
          
          <p>If you have any questions about your purchase, please contact our support team.</p>
          
          <p>Thank you for choosing TeenZoom! 🎉</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '💳 Payment Confirmed - Thank You!',
    html
  })
}

// Friend request email template
export const sendFriendRequestEmail = async (data: FriendRequestEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Friend Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👥 New Friend Request!</h1>
          <p>Someone wants to be your friend on TeenZoom</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p><strong>${data.friendDisplayName}</strong> (${data.friendUsername}) has sent you a friend request!</p>
          
          <p>This is a great opportunity to expand your TeenZoom network and make new friends!</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Friend Request</a>
          
          <p>You can accept or decline the request from your dashboard.</p>
          
          <p>Happy connecting! 🤝</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '👥 New Friend Request on TeenZoom',
    html
  })
}

// Friend accepted email template
export const sendFriendAcceptedEmail = async (data: FriendAcceptedEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Friend Request Accepted!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Friend Request Accepted!</h1>
          <p>You're now friends on TeenZoom</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p>Great news! <strong>${data.friendDisplayName}</strong> (${data.friendUsername}) has accepted your friend request!</p>
          
          <p>You can now:</p>
          <ul>
            <li>💬 Chat privately with your new friend</li>
            <li>📱 See their online status</li>
            <li>🎮 Play games together</li>
            <li>📸 Share photos and memories</li>
          </ul>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Start Chatting</a>
          
          <p>Welcome to your new friendship on TeenZoom! 🎊</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '🎉 Friend Request Accepted on TeenZoom',
    html
  })
}

// Room invitation email template
export const sendRoomInvitationEmail = async (data: RoomInvitationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Room Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .room-info { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #fdcb6e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚪 Room Invitation!</h1>
          <p>You've been invited to join a chat room</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p><strong>${data.inviterDisplayName}</strong> (${data.inviterUsername}) has invited you to join a chat room!</p>
          
          <div class="room-info">
            <h3>🏠 Room Details:</h3>
            <p><strong>Name:</strong> ${data.roomName}</p>
            <p><strong>Description:</strong> ${data.roomDescription}</p>
          </div>
          
          <a href="${data.roomUrl}" class="button">Join Room</a>
          
          <p>This could be the start of amazing conversations and new friendships!</p>
          
          <p>See you in the room! 🎭</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '🚪 Room Invitation on TeenZoom',
    html
  })
}

// Security alert email template
export const sendSecurityAlertEmail = async (data: SecurityAlertEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const alertMessages = {
    login: 'New login detected on your account',
    password_change: 'Your password was recently changed',
    suspicious_activity: 'Suspicious activity detected on your account'
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Security Alert</h1>
          <p>${alertMessages[data.alertType]}</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p>We detected ${alertMessages[data.alertType].toLowerCase()} on your TeenZoom account.</p>
          
          <div class="alert">
            <h3>⚠️ Alert Details:</h3>
            <p><strong>Type:</strong> ${data.alertType.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Time:</strong> ${data.timestamp}</p>
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
            ${data.device ? `<p><strong>Device:</strong> ${data.device}</p>` : ''}
          </div>
          
          <p>If this was you, no action is needed. If you don't recognize this activity:</p>
          <ol>
            <li>Change your password immediately</li>
            <li>Enable two-factor authentication</li>
            <li>Contact our support team</li>
          </ol>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Secure My Account</a>
          
          <p>Your security is our top priority! 🛡️</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '🚨 Security Alert - TeenZoom Account',
    html
  })
}

// Weekly digest email template
export const sendWeeklyDigestEmail = async (data: WeeklyDigestEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Weekly TeenZoom Digest</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .stats { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .activity { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Weekly TeenZoom Digest</h1>
          <p>Here's what happened this week</p>
        </div>
        <div class="content">
          <h2>Hi ${data.displayName}!</h2>
          <p>Here's a summary of your TeenZoom activity this week:</p>
          
          <div class="stats">
            <h3>📈 Your Stats:</h3>
            <p><strong>Messages Sent:</strong> ${data.stats.messagesSent}</p>
            <p><strong>Friends Added:</strong> ${data.stats.friendsAdded}</p>
            <p><strong>Coins Earned:</strong> ${data.stats.coinsEarned}</p>
            <p><strong>Current Level:</strong> ${data.stats.level}</p>
            <p><strong>Total XP:</strong> ${data.stats.xp}</p>
          </div>
          
          <div class="activity">
            <h3>🎯 Recent Activity:</h3>
            ${data.recentActivity.map(activity => `
              <p><strong>${activity.type}:</strong> ${activity.description} - ${activity.timestamp}</p>
            `).join('')}
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Full Dashboard</a>
          
          <p>Keep up the great work! 🚀</p>
          <p><strong>The TeenZoom Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to ${data.email}</p>
          <p>© 2024 TeenZoom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: '📊 Your Weekly TeenZoom Digest',
    html
  })
}

export default resend
