import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import LogEntry from '@/lib/models/LogEntry';
import { generateLogEntry } from '@/lib/ai';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentDate } = body;

    if (!currentDate) {
      return NextResponse.json({ error: 'Missing current date' }, { status: 400 });
    }

    await dbConnect();
    
    // Fetch the last 5 saved entries
    const recentEntries = await LogEntry.find({ 
      userId: (session.user as any).id,
      status: 'saved',
      date: { $lt: new Date(currentDate) }
    })
    .sort({ date: -1 })
    .limit(5);

    const tasksList = recentEntries.map(e => e.tasks);
    const dateObj = new Date(currentDate);
    const currentDayName = format(dateObj, 'EEEE');
    const formattedDate = format(dateObj, 'MMMM d, yyyy');

    const suggestedText = await generateLogEntry(tasksList, formattedDate, currentDayName);

    return NextResponse.json({ suggestion: suggestedText });
  } catch (error: any) {
    console.error('Error generating AI suggestion:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
