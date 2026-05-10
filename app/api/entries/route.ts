import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import LogEntry from '@/lib/models/LogEntry';
import { parseISO, startOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber');

    await dbConnect();
    
    let query: any = { userId: (session.user as any).id };
    
    if (weekNumber) {
      query.weekNumber = parseInt(weekNumber, 10);
    }
    
    const entries = await LogEntry.find(query).sort({ date: 1 });
    
    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, weekNumber, dayOfWeek, tasks, challenges, learnings, aiGenerated, status } = body;

    if (!date || !weekNumber || !dayOfWeek || !tasks) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const targetDate = startOfDay(parseISO(date));
    
    // Create or Update (upsert)
    const entry = await LogEntry.findOneAndUpdate(
      { userId: (session.user as any).id, date: targetDate },
      {
        weekNumber,
        dayOfWeek,
        tasks,
        challenges,
        learnings,
        aiGenerated,
        status: status || 'saved',
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
