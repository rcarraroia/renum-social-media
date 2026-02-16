import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Data de lançamento: 06/03/2026
    const launchDate = new Date('2026-03-06T00:00:00');

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

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
  }, []);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8" />
            <span className="text-xl md:text-2xl font-bold">
              Lançamento em:
            </span>
          </div>

          <div className="flex gap-4">
            {[
              { value: timeLeft.days, label: 'Dias' },
              { value: timeLeft.hours, label: 'Horas' },
              { value: timeLeft.minutes, label: 'Min' },
              { value: timeLeft.seconds, label: 'Seg' },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[70px] text-center"
              >
                <div className="text-3xl md:text-4xl font-bold">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs md:text-sm font-medium opacity-90">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
