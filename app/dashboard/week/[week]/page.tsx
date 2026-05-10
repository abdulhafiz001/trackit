import WeekView from "@/components/dashboard/WeekView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getWeekNumber } from "@/lib/dateUtils";

export default async function HistoricalWeekPage({ params }: { params: Promise<{ week: string }> }) {
  const resolvedParams = await params;
  const weekNumber = parseInt(resolvedParams.week, 10);
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  let startDate = new Date();
  if (user?.startDate) {
    const parsed = new Date(user.startDate);
    if (!isNaN(parsed.getTime())) startDate = parsed;
  }
  
  const currentWeekNumber = Math.max(1, getWeekNumber(new Date(), startDate));
  
  return <WeekView weekNumber={weekNumber} isCurrentWeek={weekNumber === currentWeekNumber} />;
}
