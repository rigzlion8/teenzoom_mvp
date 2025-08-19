import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { username, email, displayName, password } = await request.json()
    
    console.log("Signup attempt:", { username, email: email ? "provided" : "not provided", displayName })

    // Validation
    if (!username || !displayName || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { message: "Username must be at least 3 characters long" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      console.log("Username conflict:", username)
      return NextResponse.json(
        { message: `Username "${username}" is already taken. Please choose a different username.` },
        { status: 409 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })

      if (existingEmail) {
        console.log("Email conflict:", email)
        return NextResponse.json(
          { message: `Email "${email}" is already registered. Please use a different email or sign in instead.` },
          { status: 409 }
        )
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        displayName,
        passwordHash,
        role: "user",
        coins: 100,
        vipLifetime: false,
        xp: 0,
        level: 1,
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: new Date()
      }
    })

    console.log("User created successfully:", username)

                    // Remove password hash from response
        const { passwordHash: _, ...userWithoutPassword } = user

        // Send welcome email
        try {
          const { sendWelcomeEmail } = await import('@/lib/resend')
          await sendWelcomeEmail({
            username: user.username,
            displayName: user.displayName,
            email: user.email || ''
          })
        } catch (emailError) {
          console.error('Welcome email error:', emailError)
          // Don't fail signup if email fails
        }

        return NextResponse.json(
          {
            message: "User created successfully",
            user: userWithoutPassword
          },
          { status: 201 }
        )

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
