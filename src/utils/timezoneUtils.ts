
export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5:30 hours in milliseconds

export function getISTTime(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET);
}

export function getNextISTSchedule(hour: number, minute: number = 0): Date {
  const now = getISTTime();
  const scheduled = new Date(now);
  
  scheduled.setHours(hour, minute, 0, 0);
  
  // If the scheduled time has already passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  
  return scheduled;
}

export function getMillisecondsUntilNextIST(hour: number, minute: number = 0): number {
  const nextScheduled = getNextISTSchedule(hour, minute);
  const now = getISTTime();
  return nextScheduled.getTime() - now.getTime();
}

export function formatISTTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
