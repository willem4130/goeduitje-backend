import { NextResponse } from 'next/server'
import { db } from '@/db'
import { recipe } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const items = await db.select().from(recipe).orderBy(desc(recipe.createdAt))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newItem = await db.insert(recipe).values({
      id: randomUUID(),
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-'),
      description: body.description,
      imageUrl: body.imageUrl,
      prepTime: body.prepTime,
      cookTime: body.cookTime,
      servings: body.servings,
      difficulty: body.difficulty,
      category: body.category,
      ingredients: body.ingredients || [],
      steps: body.steps || [],
      tips: body.tips,
      isPublished: body.isPublished ?? true,
      updatedAt: new Date(),
    }).returning()
    return NextResponse.json({ item: newItem[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create recipe:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = await db.update(recipe)
      .set({
        title: body.title,
        slug: body.slug,
        description: body.description,
        imageUrl: body.imageUrl,
        prepTime: body.prepTime,
        cookTime: body.cookTime,
        servings: body.servings,
        difficulty: body.difficulty,
        category: body.category,
        ingredients: body.ingredients,
        steps: body.steps,
        tips: body.tips,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(recipe.id, body.id))
      .returning()
    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update recipe:', error)
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(recipe).where(eq(recipe.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete recipe:', error)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}
