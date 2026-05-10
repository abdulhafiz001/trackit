import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { calculateEndDate } from '@/lib/dateUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, organization, department, supervisorName, itDurationWeeks, startDate } = body;

    if (!email || !name || !organization || !department || !itDurationWeeks || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const start = new Date(startDate);
    const endDate = calculateEndDate(start, itDurationWeeks);

    const newUser = await User.create({
      email: email.toLowerCase(),
      name,
      organization,
      department,
      supervisorName,
      itDurationWeeks,
      startDate: start,
      endDate,
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
