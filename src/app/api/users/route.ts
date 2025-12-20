import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, type NewUser } from '@/db/schema'
import { desc, eq, like, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    let query = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      bandAccess: users.bandAccess,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users)

    // Search by email or name
    if (search) {
      query = query.where(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`)
        )
      ) as any
    }

    const allUsers = await query.orderBy(desc(users.createdAt))

    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, body.email))
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10)

    const newUser: NewUser = {
      email: body.email,
      name: body.name,
      passwordHash,
      role: body.role || 'admin',
      bandAccess: body.bandAccess || null,
    }

    const [user] = await db.insert(users).values(newUser).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      bandAccess: users.bandAccess,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
