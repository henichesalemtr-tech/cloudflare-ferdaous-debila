'use client'

import { useEffect, useState } from 'react'
import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan'
import HadithDisplay from './HadithDisplay'

type PrayerData = {
  name: string
  arabicName: string
  time: string
  iqamaMinutes: number
  icon: string
  isCurrent: boolean
}

interface PrayerDisplayProps {
  latitude?: number
  longitude?: number
  timezone?: string
  iqamaMinutes?: Record<string, number>
}

const PRAYER_NAMES: Record<string, { ar: string; icon: string }> = {
  fajr: { ar: 'الفجر', icon: '🌙' },
  dhuhr: { ar: 'الظهر', icon: '☀️' },
  asr: { ar: 'العصر', icon: '⛅' },
  maghrib: { ar: 'المغرب', icon: '🌅' },
  isha: { ar: 'العشاء', icon: '⭐' },
}

const DEFAULT_IQAMA_TIMES: Record<string, number> = {
  fajr: 10,
  dhuhr: 10,
  asr: 10,
  maghrib: 5,
  isha: 10,
}

export default function PrayerDisplay({ 
  latitude = 33.5056745, 
  longitude = 6.9379105, 
  timezone = 'Africa/Algiers',
  iqamaMinutes = DEFAULT_IQAMA_TIMES,
}: PrayerDisplayProps) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerData[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{
    name: string
    countdown: string
    icon: string
  } | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    try {
      const coords = new Coordinates(latitude, longitude)
      const params = CalculationMethod.Egyptian()
      const today = new Date()
      
      const times = new PrayerTimes(coords, today, params)
      
      const prayerList = [
        { name: 'fajr', adhanTime: times.fajr, iqamaMinutes: iqamaMinutes.fajr || 10 },
        { name: 'dhuhr', adhanTime: times.dhuhr, iqamaMinutes: iqamaMinutes.dhuhr || 10 },
        { name: 'asr', adhanTime: times.asr, iqamaMinutes: iqamaMinutes.asr || 10 },
        { name: 'maghrib', adhanTime: times.maghrib, iqamaMinutes: iqamaMinutes.maghrib || 5 },
        { name: 'isha', adhanTime: times.isha, iqamaMinutes: iqamaMinutes.isha || 10 },
      ]

      const now = currentTime.getTime()
      let nextPrayer: any = null
      let currentPrayerName = ''

      // تحديد الصلاة الحالية والقادمة
      for (let i = 0; i < prayerList.length; i++) {
        const prayer = prayerList[i]
        const iqamaTime = new Date(prayer.adhanTime.getTime() + prayer.iqamaMinutes * 60000).getTime()
        
        if (now < iqamaTime) {
          currentPrayerName = prayer.name
          if (!nextPrayer) {
            nextPrayer = prayer
          }
          break
        }
      }

      if (!nextPrayer && prayerList.length > 0) {
        nextPrayer = prayerList[0]
      }

      // حساب البيانات
      const prayers: PrayerData[] = prayerList.map(prayer => ({
        name: prayer.name,
        arabicName: PRAYER_NAMES[prayer.name].ar,
        time: formatTime(prayer.adhanTime),
        iqamaMinutes: prayer.iqamaMinutes,
        icon: PRAYER_NAMES[prayer.name].icon,
        isCurrent: prayer.name === currentPrayerName,
      }))

      setPrayerTimes(prayers)

      // حساب العد التنازلي للصلاة القادمة
      if (nextPrayer) {
        const iqamaTime = new Date(nextPrayer.adhanTime.getTime() + nextPrayer.iqamaMinutes * 60000).getTime()
        const diff = iqamaTime - now
        
        if (diff > 0) {
          const hours = Math.floor(diff / 3600000)
          const minutes = Math.floor((diff % 3600000) / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          
          const countdown = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          
          setNextPrayerInfo({
            name: PRAYER_NAMES[nextPrayer.name].ar,
            countdown: countdown,
            icon: '🤲',
          })
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('خطأ في حساب أوقات الصلاة:', error)
      setLoading(false)
    }
  }, [currentTime, latitude, longitude, iqamaMinutes])

  if (loading) {
    return <div className="text-gray-400 text-center p-8">جاري التحميل...</div>
  }

  return (
    <div className="w-full">
      {/* رسالة الصلاة القادمة في الأعلى */}
      {nextPrayerInfo && (
        <div className="text-center mb-8 pb-6 border-b border-gray-600/30">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wider">
            <span className="ml-3">{nextPrayerInfo.icon}</span>
            صلاة {nextPrayerInfo.name} بعد {nextPrayerInfo.countdown}
          </h1>
        </div>
      )}

      {/* شبكة الصلوات الأفقية */}
      <div className="grid grid-cols-5 gap-4 md:gap-6 lg:gap-8 w-full">
        {prayerTimes.map((prayer) => (
          <div
            key={prayer.name}
            className={`flex flex-col items-center justify-center rounded-3xl p-6 md:p-8 transition-all duration-300 ${
              prayer.isCurrent
                ? 'bg-gradient-to-b from-purple-600 to-purple-800 ring-4 ring-purple-400 shadow-2xl'
                : 'bg-gray-900/50 border border-gray-700/50 hover:border-gray-600/50'
            }`}
          >
            {/* اسم الصلاة */}
            <p className={`text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 ${
              prayer.isCurrent ? 'text-white' : 'text-gray-300'
            }`}>
              {prayer.arabicName}
            </p>

            {/* الوقت - كبير جداً */}
            <p className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${
              prayer.isCurrent ? 'text-white' : 'text-white'
            }`}>
              {prayer.time}
            </p>

            {/* الإقامة في صندوق صغير */}
            <div className={`rounded-2xl px-4 md:px-5 py-2 md:py-3 text-center ${
              prayer.isCurrent 
                ? 'bg-purple-900/60 border border-purple-300/30' 
                : 'bg-gray-800/60 border border-gray-600/30'
            }`}>
              <p className={`text-lg md:text-xl lg:text-2xl font-bold ${
                prayer.isCurrent ? 'text-purple-100' : 'text-gray-300'
              }`}>
                {prayer.iqamaMinutes}+
              </p>
            </div>
          </div>
        ))}
      </div>
    <div className="mt-10">
      <HadithDisplay/>
    </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
