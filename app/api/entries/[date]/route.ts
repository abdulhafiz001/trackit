import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import LogEntry from '@/lib/models/LogEntry';
import { parseISO, startOfDay } from 'date-fns';

export async function GET(request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetDate = startOfDay(parseISO(resolvedParams.date));

    await dbConnect();
    
    const entry = await LogEntry.findOne({ 
      userId: (session.user as any).id,
      date: targetDate 
    });
    
    if (!entry) {
      return NextResponse.json({ entry: null }); // It's okay if not found
    }
    
    return NextResponse.json({ entry });
  } catch (error: any) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
