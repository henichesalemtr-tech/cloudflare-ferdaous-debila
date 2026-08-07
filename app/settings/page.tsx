'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

type Setting = { key: string; value: string | null }

const DEFAULT_SETTINGS: Record<string, string> = {
  // Landing page
  landing_enabled: 'false',
  landing_title: 'منصة الفردوس',
  landing_subtitle: 'منصة إدارة المدارس القرآنية',
  landing_description: 'نظام متكامل لإدارة الطلاب والمعلمين والحضور والغياب والمتابعة الأكاديمية في المدارس القرآنية',
  landing_show_stats: 'true',
  landing_stat1_label: 'طالب مسجّل', landing_stat1_value: '374+',
  landing_stat2_label: 'معلم متخصص', landing_stat2_value: '12',
  landing_stat3_label: 'فوج دراسي', landing_stat3_value: '14',
  landing_feature1_title: 'إدارة الطلاب', landing_feature1_desc: 'تسجيل وتتبع بيانات الطلاب وأولياء أمورهم بسهولة تامة', landing_feature1_icon: '👨‍🎓',
  landing_feature2_title: 'الحضور والغياب', landing_feature2_desc: 'تحضير يدوي، QR، وباركود مع إشعارات فورية لأولياء الأمور', landing_feature2_icon: '📋',
  landing_feature3_title: 'تقييم الحفظ', landing_feature3_desc: 'تسجيل ومتابعة تقدم الطالب في حفظ وتجويد القرآن الكريم', landing_feature3_icon: '📖',
  landing_feature4_title: 'إدارة مالية', landing_feature4_desc: 'متابعة الرسوم والرواتب والمصروفات بشفافية كاملة', landing_feature4_icon: '💰',
  landing_show_register_btn: 'true',
  landing_register_btn_text: 'طلب التسجيل',
  landing_login_btn_text: 'دخول المنصة',
  landing_footer_text: 'جميع الحقوق محفوظة',
  // School
  school_name: 'مؤسسة الفردوس للتعليم القرآني فرع الديبيلة',
  academic_year: '2025/2026',
  contact_email: 'admin@quran.com',
  contact_phone: '0555000000',
  country_code: '+213',
  default_student_fee: '1500',
  default_teacher_salary: '30000',
  default_admin_salary: '40000',
  msg_absent: 'السلام عليكم. نعلمكم أن الطالب(ة) {student_name} غائب(ة) عن الحصة اليوم {date}. يرجى التواصل معنا للتوضيح.',
  msg_late: 'السلام عليكم. نعلمكم أن الطالب(ة) {student_name} تأخر(ت) عن الحصة اليوم {date}.',
  primary_color: '#1a5c35',
  auto_attendance: 'true',
  teacher_late_threshold: '40',
  rating_excellent_points: '5',
  rating_very_good_points: '4',
  rating_good_points: '3',
  rating_acceptable_points: '2',
  rating_weak_points: '1',
  holiday_mode: 'false',
  online_registration: 'true',
  schedule_sync_enabled: 'false',
  schedule_sync_late_minutes: '15',
  schedule_sync_absent_minutes: '40',
  auto_withdraw_absences: '5',
}

function F({
  label, k, type = 'text', rows, settings, setSettings,
}: {
  label: string; k: string; type?: string; rows?: number;
  settings: Record<string, string>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {rows ? (
        <textarea value={settings[k] ?? ''} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))}
          rows={rows} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
      ) : (
        <input type={type} value={settings[k] ?? ''} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
      )}
    </div>
  )
}



export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('school')
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupReport, setCleanupReport] = useState<{ deletedFiles: number; freedMB: string } | null>(null)
  const [showCleanupModal, setShowCleanupModal] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then((data: Setting[]) => {
      const map = { ...DEFAULT_SETTINGS }
      data.forEach(s => { if (s.key && s.value) map[s.key] = s.value })
      setSettings(map)
      setLoading(false)
    })
  }, [])

  async function save(key: string, value: string) {
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await Promise.all(Object.entries(settings).map(([key, value]) => save(key, value)))
    toast.success('تم حفظ الإعدادات بنجاح')
    setSaving(false)
  }

  async function handleCleanup() {
    setCleanupLoading(true)
    try {
      const res = await fetch('/api/admin/cleanup-temp', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setCleanupReport(data)
        setShowCleanupModal(true)
      } else {
        toast.error(data.error ?? 'فشل التنظيف')
      }
    } catch {
      toast.error('حدث خطأ أثناء التنظيف')
    } finally {
      setCleanupLoading(false)
    }
  }




  const sections = [
    { key: 'school', label: '🏫 بيانات المدرسة', icon: '🏫' },
    { key: 'financial', label: '💰 الإعدادات المالية', icon: '💰' },
    { key: 'messages', label: '📱 رسائل التواصل', icon: '📱' },
    { key: 'evaluation', label: '⭐ نقاط التقييم', icon: '⭐' },
    { key: 'system', label: '⚙️ إعدادات النظام', icon: '⚙️' },
    { key: 'landing', label: '🌐 صفحة الهبوط', icon: '🌐' },
  ]

  // Quick-links to dedicated settings sub-pages
  const subPages = [
    { href: '/settings/notifications', icon: '🔔', label: 'إعدادات الإشعارات التلقائية', desc: 'قوالب الغياب والتأخر، قنوات الإرسال' },
    { href: '/settings/barcode-attendance', icon: '📟', label: 'إعدادات تحضير الباركود', desc: 'واجهة، ألوان، ماسح، Excel' },
    { href: '/', icon: '🌐', label: 'معاينة صفحة الهبوط', desc: 'عرض الصفحة كما تظهر للزوار' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>⚙️</span> إعدادات النظام
      </h1>

      <div className="flex gap-6">
        {/* Section nav */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sections.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-right transition-colors border-b border-gray-100 last:border-0 ${
                  activeSection === s.key ? 'bg-green-50 text-green-700 font-bold border-r-4 border-r-green-600' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <span>{s.icon}</span> {s.label.replace(/^[^\s]+\s/, '')}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1">
          <form onSubmit={handleSave}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {activeSection === 'school' && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-3">🏫 بيانات المدرسة</h2>
                  <F label="اسم المدرسة / المؤسسة" k="school_name" settings={settings} setSettings={setSettings} />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="البريد الإلكتروني للتواصل" k="contact_email" type="email" settings={settings} setSettings={setSettings} />
                    <F label="رقم الهاتف للتواصل" k="contact_phone" settings={settings} setSettings={setSettings} />
                  </div>
                  <F label="السنة الدراسية الحالية" k="academic_year" settings={settings} setSettings={setSettings} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اللون الرئيسي للنظام</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={settings.primary_color ?? '#1a5c35'} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input value={settings.primary_color ?? '#1a5c35'} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono w-32 focus:outline-none" placeholder="#1a5c35" />
                      <div className="flex gap-2">
                        {['#1a5c35', '#0d6efd', '#6f42c1', '#dc3545', '#fd7e14'].map(c => (
                          <button key={c} type="button" onClick={() => setSettings(s => ({ ...s, primary_color: c }))}
                            className="w-7 h-7 rounded-full border-2 border-white shadow" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'financial' && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-3">💰 الإعدادات المالية الافتراضية</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <F label="رسوم الطالب الافتراضية (دج)" k="default_student_fee" type="number" settings={settings} setSettings={setSettings} />
                    <F label="راتب المعلم الافتراضي (دج)" k="default_teacher_salary" type="number" settings={settings} setSettings={setSettings} />
                    <F label="راتب الإداري الافتراضي (دج)" k="default_admin_salary" type="number" settings={settings} setSettings={setSettings} />
                  </div>
                </>
              )}

              {activeSection === 'messages' && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-3">📱 إعدادات رسائل التواصل</h2>
                  <F label="رمز الدولة (لمنسق الهاتف)" k="country_code" settings={settings} setSettings={setSettings} />
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                    المتغيرات المتاحة: <code className="bg-blue-100 px-1 rounded">&#123;student_name&#125;</code> اسم الطالب، <code className="bg-blue-100 px-1 rounded">&#123;date&#125;</code> التاريخ، <code className="bg-blue-100 px-1 rounded">&#123;time&#125;</code> الوقت
                  </div>
                  <F label="رسالة الغياب (واتساب/SMS)" k="msg_absent" rows={3} settings={settings} setSettings={setSettings} />
                  <F label="رسالة التأخر (واتساب/SMS)" k="msg_late" rows={3} settings={settings} setSettings={setSettings} />
                  <div className="pt-2 border-t border-gray-100">
                    <Link href="/settings/notifications"
                      className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors group">
                      <span className="text-2xl">🔔</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">إعدادات الإشعارات التلقائية</p>
                        <p className="text-xs text-green-600">تخصيص قوالب إشعارات الغياب والتأخر وقنوات الإرسال</p>
                      </div>
                      <svg className="text-green-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </Link>
                  </div>
                </>
              )}

              {activeSection === 'evaluation' && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-3">⭐ نقاط التقييم والإعدادات المرتبطة</h2>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 mb-2">
                    تُستخدم هذه النقاط في حساب أفضل الطلاب بالصفحة الرئيسية للوحة التحكم.
                    الدرجة الكلية = مجموع نقاط التقييمات − (عدد الغيابات × 2)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <F label="نقاط تقييم: ممتاز" k="rating_excellent_points" type="number" settings={settings} setSettings={setSettings} />
                    <F label="نقاط تقييم: جيد جداً" k="rating_very_good_points" type="number" settings={settings} setSettings={setSettings} />
                    <F label="نقاط تقييم: جيد" k="rating_good_points" type="number" settings={settings} setSettings={setSettings} />
                    <F label="نقاط تقييم: مقبول" k="rating_acceptable_points" type="number" settings={settings} setSettings={setSettings} />
                    <F label="نقاط تقييم: ضعيف" k="rating_weak_points" type="number" settings={settings} setSettings={setSettings} />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-3">🕐 إعدادات حضور المعلمين</h3>
                    <F label="الفارق الزمني لتسجيل المعلم غائباً (بالدقائق)" k="teacher_late_threshold" type="number" settings={settings} setSettings={setSettings} />
                    <p className="text-xs text-gray-400 mt-1">
                      إذا لم يسجّل المعلم حضوره خلال هذه المدة من بداية حصته المجدولة، يُسجَّل غائباً تلقائياً.
                    </p>
                  </div>
                </>
              )}

              {activeSection === 'system' && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-3">⚙️ إعدادات النظام</h2>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <F label="الشطب التلقائي بعد عدد الغيابات" k="auto_withdraw_absences" type="number" settings={settings} setSettings={setSettings} />
                    <p className="text-xs text-amber-700">
                      عند وصول الطالب إلى هذا العدد من الغيابات يتم تحويل حالته تلقائياً من &quot;نشط&quot; إلى &quot;مشطوب&quot;. القيمة الافتراضية 5.
                    </p>
                  </div>

                  {/* وضع العطلة */}
                  <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${settings.holiday_mode === 'true' ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                    <div>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        <span>🏖️</span> وضع العطلة
                        {settings.holiday_mode === 'true' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">مفعّل</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">عند التفعيل يتوقف النظام عن إرسال أي إشعارات تلقائية (غياب/تأخر)</p>
                    </div>
                    <button type="button"
                      onClick={() => setSettings(s => ({ ...s, holiday_mode: s.holiday_mode === 'true' ? 'false' : 'true' }))}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.holiday_mode === 'true' ? 'bg-orange-400' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.holiday_mode === 'true' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* التحضير التلقائي */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 flex items-center gap-2"><span>📷</span> التحضير التلقائي بالـ QR</p>
                      <p className="text-xs text-gray-500">تفعيل/تعطيل خاصية مسح بطاقة الطالب لتسجيل الحضور</p>
                    </div>
                    <button type="button"
                      onClick={() => setSettings(s => ({ ...s, auto_attendance: s.auto_attendance === 'true' ? 'false' : 'true' }))}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.auto_attendance === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.auto_attendance === 'true' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* التسجيل عبر الإنترنت */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        <span>📝</span> التسجيل عبر الإنترنت
                      </p>
                      <p className="text-xs text-gray-500">
                        السماح للعائلات بإرسال طلبات تسجيل من صفحة{' '}
                        <a href="/register" target="_blank" className="text-green-700 underline hover:text-green-900">/register</a>
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => setSettings(s => ({ ...s, online_registration: s.online_registration === 'true' ? 'false' : 'true' }))}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.online_registration === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.online_registration === 'true' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* ───── مزامنة التحضير مع الجدول ───── */}
                  <div className={`border rounded-xl p-4 transition-colors ${settings.schedule_sync_enabled === 'true' ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                          <span>🔄</span> مزامنة التحضير مع الجدول الدراسي
                          {settings.schedule_sync_enabled === 'true' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">مفعّلة</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          عند تفعيلها: كل طالب لم يُسجَّل حضوره بالمسح خلال مدة محددة من بدء الحصة
                          يُعدّ <strong>متأخراً</strong> ثم <strong>غائباً</strong> تلقائياً مع إرسال إشعار لوليّ أمره.
                        </p>
                      </div>
                      <button type="button"
                        onClick={() => setSettings(s => ({ ...s, schedule_sync_enabled: s.schedule_sync_enabled === 'true' ? 'false' : 'true' }))}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${settings.schedule_sync_enabled === 'true' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.schedule_sync_enabled === 'true' ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    {settings.schedule_sync_enabled === 'true' && (
                      <div className="mt-3 grid grid-cols-2 gap-4 pt-3 border-t border-blue-200">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            ⏱️ مدة التأخر (بالدقائق)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min="1" max="120"
                              value={settings.schedule_sync_late_minutes}
                              onChange={e => setSettings(s => ({ ...s, schedule_sync_late_minutes: e.target.value }))}
                              className="w-full border border-yellow-300 bg-yellow-50 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                            />
                            <span className="text-xs text-gray-500 whitespace-nowrap">دقيقة</span>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">بعد هذه المدة من بدء الحصة يُعتبر الطالب <strong>متأخراً</strong></p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            🚫 مدة الغياب (بالدقائق)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min="1" max="240"
                              value={settings.schedule_sync_absent_minutes}
                              onChange={e => setSettings(s => ({ ...s, schedule_sync_absent_minutes: e.target.value }))}
                              className="w-full border border-red-300 bg-red-50 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-red-300"
                            />
                            <span className="text-xs text-gray-500 whitespace-nowrap">دقيقة</span>
                          </div>
                          <p className="text-xs text-red-700 mt-1">بعد هذه المدة يُعتبر الطالب <strong>غائباً</strong> ويُرسل إشعار</p>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                            <span>ℹ️</span>
                            <span>يجب أن يكون للفوج جدول حصص محدد ليوم الأسبوع الحالي حتى تعمل المزامنة. يتم التحقق تلقائياً كل دقيقة أثناء جلسة المسح.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* تنظيف الملفات المؤقتة */}
                  <div className="mt-2 p-4 border border-dashed border-red-200 rounded-lg bg-red-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800 flex items-center gap-2"><span>🗑️</span> تنظيف الملفات المؤقتة</p>
                        <p className="text-xs text-gray-500 mt-0.5">حذف ملفات /tmp و .next/cache لتحرير مساحة التخزين على الخادم</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCleanup}
                        disabled={cleanupLoading}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
                      >
                        {cleanupLoading ? (
                          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري التنظيف...</>
                        ) : (
                          <><span>🧹</span> تنظيف الآن</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* رابط طلبات التسجيل */}
                  <div className="pt-2 border-t border-gray-100">
                    <Link href="/dashboard/registration-requests"
                      className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group">
                      <span className="text-2xl">📋</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-800">إدارة طلبات التسجيل الإلكتروني</p>
                        <p className="text-xs text-blue-600">مراجعة وقبول أو رفض طلبات التسجيل الواردة</p>
                      </div>
                      <svg className="text-blue-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </Link>
                  </div>
                </>
              )}
              {activeSection === 'landing' && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-3 flex items-center justify-between">
                    <span>🌐 صفحة الهبوط العامة</span>
                    <a href="/" target="_blank" rel="noreferrer"
                      className="text-xs font-normal text-green-700 underline hover:text-green-900 flex items-center gap-1">
                      معاينة الصفحة ↗
                    </a>
                  </h2>

                  {/* Enable toggle */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${settings.landing_enabled === 'true' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    <div>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        <span>🌐</span> تفعيل صفحة الهبوط
                        {settings.landing_enabled === 'true' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">مفعّلة</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        عند التفعيل تظهر صفحة ترحيبية عند زيارة الرابط الرئيسي بدلاً من صفحة تسجيل الدخول المباشرة
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => setSettings(s => ({ ...s, landing_enabled: s.landing_enabled === 'true' ? 'false' : 'true' }))}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.landing_enabled === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.landing_enabled === 'true' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Hero text */}
                  <div className="pt-2">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm">📝 نصوص القسم الرئيسي</h3>
                    <div className="space-y-3">
                      <F label="عنوان المنصة (الرئيسي)" k="landing_title" settings={settings} setSettings={setSettings} />
                      <F label="العنوان الفرعي" k="landing_subtitle" settings={settings} setSettings={setSettings} />
                      <F label="وصف المنصة" k="landing_description" rows={3} settings={settings} setSettings={setSettings} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700 text-sm">📊 الإحصائيات</h3>
                      <button type="button"
                        onClick={() => setSettings(s => ({ ...s, landing_show_stats: s.landing_show_stats === 'true' ? 'false' : 'true' }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${settings.landing_show_stats === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.landing_show_stats === 'true' ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {settings.landing_show_stats === 'true' && (
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(n => (
                          <div key={n} className="space-y-2 bg-gray-50 rounded-lg p-3">
                            <input value={settings[`landing_stat${n}_value`] ?? ''} onChange={e => setSettings(s => ({ ...s, [`landing_stat${n}_value`]: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                              placeholder="374+" />
                            <input value={settings[`landing_stat${n}_label`] ?? ''} onChange={e => setSettings(s => ({ ...s, [`landing_stat${n}_label`]: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                              placeholder="تسمية" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="pt-2 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-700 text-sm mb-3">✨ بطاقات المميزات (4 بطاقات)</h3>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                          <div className="flex items-center gap-2 mb-2">
                            <input value={settings[`landing_feature${n}_icon`] ?? ''} onChange={e => setSettings(s => ({ ...s, [`landing_feature${n}_icon`]: e.target.value }))}
                              className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-center text-xl focus:outline-none" placeholder="🎓" />
                            <input value={settings[`landing_feature${n}_title`] ?? ''} onChange={e => setSettings(s => ({ ...s, [`landing_feature${n}_title`]: e.target.value }))}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                              placeholder={`عنوان الميزة ${n}`} />
                          </div>
                          <input value={settings[`landing_feature${n}_desc`] ?? ''} onChange={e => setSettings(s => ({ ...s, [`landing_feature${n}_desc`]: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder={`وصف الميزة ${n}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buttons & footer */}
                  <div className="pt-2 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-700 text-sm mb-3">🔘 نصوص الأزرار والتذييل</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="نص زر الدخول" k="landing_login_btn_text" settings={settings} setSettings={setSettings} />
                      <F label="نص زر التسجيل" k="landing_register_btn_text" settings={settings} setSettings={setSettings} />
                      <div className="col-span-2">
                        <F label="نص التذييل" k="landing_footer_text" settings={settings} setSettings={setSettings} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">إظهار زر طلب التسجيل</p>
                        <p className="text-xs text-gray-400">يظهر في شريط التنقل وقسم CTA</p>
                      </div>
                      <button type="button"
                        onClick={() => setSettings(s => ({ ...s, landing_show_register_btn: s.landing_show_register_btn === 'true' ? 'false' : 'true' }))}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${settings.landing_show_register_btn === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.landing_show_register_btn === 'true' ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button type="submit" disabled={saving}
              className="w-full mt-4 bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60">
              {saving ? 'جاري الحفظ...' : '💾 حفظ وتطبيق الإعدادات'}
            </button>
          </form>
        </div>
      </div>

      {/* Sub-pages quick links */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">إعدادات متخصصة</h2>
        <div className="flex flex-wrap gap-3">
          {subPages.map(p => (
            <Link key={p.href} href={p.href}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700">{p.label}</p>
                <p className="text-xs text-gray-400">{p.desc}</p>
              </div>
              <svg className="mr-1 text-gray-300 group-hover:text-green-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Cleanup report modal */}
      {showCleanupModal && cleanupReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">تم التنظيف بنجاح</h3>
            <p className="text-gray-500 text-sm mb-5">تقرير عملية تنظيف الملفات المؤقتة</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-700">{cleanupReport.deletedFiles}</p>
                <p className="text-xs text-green-600 mt-0.5">ملف محذوف</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-700">{cleanupReport.freedMB} MB</p>
                <p className="text-xs text-blue-600 mt-0.5">مساحة محررة</p>
              </div>
            </div>
            <button
              onClick={() => setShowCleanupModal(false)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded-xl text-sm">
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
