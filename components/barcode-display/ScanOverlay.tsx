'use client'

import { useEffect, useState, memo } from 'react'

interface ScanResult {
  studentNumber: string
  firstName: string
  lastName: string
  groupName?: string | null
  time: string
  status: 'success' | 'duplicate' | 'error'
  message?: string
}

interface ScanOverlayProps {
  scan: ScanResult | null
  visible: boolean
  onClose?: () => void
}

const ScanOverlay = memo(function ScanOverlay({ scan, visible, onClose }: ScanOverlayProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible && scan) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        onClose?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [visible, scan, onClose])

  if (!show || !scan) return null

  const statusConfig = {
    success: { icon: '✅', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' },
    duplicate: { icon: '⚠️', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' },
    error: { icon: '❌', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
  }

  const config = statusConfig[scan.status]

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-20px); opacity: 0; }
        }
        .scan-overlay-enter {
          animation: slideDown 0.3s ease-out;
        }
        .scan-overlay-exit {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      <div
        className={`scan-overlay-enter ${!show ? 'scan-overlay-exit' : ''} bg-gray-900 rounded-3xl border-2 shadow-2xl p-8 max-w-md w-full mx-4`}
        style={{
          borderColor: config.borderColor,
          background: `linear-gradient(135deg, ${config.bgColor}, rgba(15, 23, 42, 0.8))`,
        }}
      >
        {/* Icon */}
        <div className="text-7xl text-center mb-6">{config.icon}</div>

        {/* Content */}
        <div className="text-center space-y-4">
          {scan.status === 'success' ? (
            <>
              <h3 className="text-2xl font-bold text-white">{scan.firstName} {scan.lastName}</h3>
              {scan.groupName && (
                <p className="text-blue-400 font-semibold">📚 {scan.groupName}</p>
              )}
              <p className="text-sm font-mono text-gray-400">{scan.studentNumber}</p>
              <p className="text-xl font-bold mt-4" style={{ color: config.color }}>
                تم تسجيل الحضور ✓
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-gray-200">
                {scan.firstName !== '—' ? `${scan.firstName} ${scan.lastName}` : scan.studentNumber}
              </h3>
              {scan.groupName && (
                <p className="text-blue-400 font-semibold">📚 {scan.groupName}</p>
              )}
              <p className="text-sm font-semibold mt-4" style={{ color: config.color }}>
                {scan.message}
              </p>
            </>
          )}

          {/* Time */}
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-700">
            {scan.time}
          </p>
        </div>
      </div>
    </div>
  )
})

export default ScanOverlay
