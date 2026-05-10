import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    return NextResponse.json({ exists: !!user });
  } catch (error: any) {
    console.error('Error checking user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
