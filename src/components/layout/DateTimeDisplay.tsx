
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

const DateTimeDisplay = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const { timezone, language } = useApp();
  
  useEffect(() => {
    // Update every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    // Clean up on unmount
    return () => clearInterval(timer);
  }, []);
  
  // Format current time according to selected timezone and language
  const locale = language || 'en';
  const formattedDate = currentDateTime.toLocaleDateString(locale, {
    timeZone: timezone,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  });
  const formattedTime = currentDateTime.toLocaleTimeString(locale, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  return (
    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
      <span>{formattedDate}</span>
      <span className="mx-1">|</span>
      <span>{formattedTime}</span>
    </div>
  );
};

export default DateTimeDisplay;
