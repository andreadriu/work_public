import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface CountdownTimerProps {
  eventDate: Date;
}

export function CountdownTimer({ eventDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = eventDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/50 rounded-lg p-6 shadow-2xl shadow-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg text-white">Event Countdown</h2>
        </div>
        <div className="flex items-center gap-2 text-purple-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>30 January 2026 • 10:00 PM</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Minutes', value: timeLeft.minutes },
          { label: 'Seconds', value: timeLeft.seconds },
        ].map((item, index) => (
          <div key={index} className="text-center">
            <div className="bg-gray-800/80 rounded-lg p-4 mb-2 border border-purple-500/30">
              <p className="text-3xl text-white tabular-nums">{String(item.value).padStart(2, '0')}</p>
            </div>
            <p className="text-sm text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}