import { NextResponse } from 'next/server'
import { prisma } from '../../../backend/lib/prisma'

export async function POST() {
  try {
    // 테스트용 사용자 생성
    const user = await prisma.user.create({
      data: {
        snsId: `test-${Date.now()}`,
        provider: 'test',
        nickname: 'Test User',
      },
    })

    return NextResponse.json(
      { success: true, user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
