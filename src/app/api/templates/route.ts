import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const PROMPTS_DIR = path.join(process.cwd(), 'src', 'prompts')

export async function GET() {
  try {
    const files = await fs.readdir(PROMPTS_DIR)
    const templates = await Promise.all(
      files
        .filter(f => f.endsWith('.txt'))
        .map(async (filename) => {
          const content = await fs.readFile(path.join(PROMPTS_DIR, filename), 'utf-8')
          return {
            id: filename,
            name: filename.replace('.txt', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            filename,
            content,
            updatedAt: (await fs.stat(path.join(PROMPTS_DIR, filename))).mtime.toISOString()
          }
        })
    )
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { filename, content } = body

    if (!filename || typeof content !== 'string') {
      return NextResponse.json({ error: 'Filename and content required' }, { status: 400 })
    }

    // Security: only allow .txt files in prompts directory
    if (!filename.endsWith('.txt') || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = path.join(PROMPTS_DIR, filename)
    await fs.writeFile(filePath, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}
