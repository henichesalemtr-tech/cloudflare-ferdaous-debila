/**
 * POST /api/attendance/sync-status
 * يحسب حالة كل طالب بناءً على وقت الحصة الحالية وإعدادات المزامنة.
 * يُستدعى من صفحة التحضير التلقائي كل دقيقة.
 *
 * المنطق:
 *   - إذا قام بالمسح  → حاضر
 *   - تجاوز late_threshold دقيقة دون مسح → متأخر + إشعار
 *   - تجاوز absent_threshold دقيقة دون مسح → غائب + إشعار
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import {
  settings as settingsTable, students, attendances,
  groupStudents, schedules, teacherGroups, notifications,
} from '@/db/schemas/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

function parseTime(t: string): number {
  // "HH:MM" → minutes since midnight
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    groupId?: number
    scannedStudentIds: number[]
    date: string
  }
  const { groupId, scannedStudentIds = [], date } = body

  // ── load settings ──────────────────────────────────────────────────────────
  const rows = await db.select().from(settingsTable)
  const s: Record<string, string> = {}
  rows.forEach(r => { if (r.key && r.value) s[r.key] = r.value })

  const syncEnabled       = s['schedule_sync_enabled'] === 'true'
  const lateThreshold     = parseInt(s['schedule_sync_late_minutes']   ?? '15')
  const absentThreshold   = parseInt(s['schedule_sync_absent_minutes'] ?? '40')
  const holidayMode       = s['holiday_mode'] === 'true'

  if (!syncEnabled || holidayMode) {
    return NextResponse.json({ skipped: true, reason: syncEnabled ? 'holiday_mode' : 'sync_disabled' })
  }

  if (!groupId) return NextResponse.json({ skipped: true, reason: 'no_group' })

  // ── find the active schedule for this group today ──────────────────────────
  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
  const todayName = dayNames[new Date().getDay()]

  const groupSchedules = await db.select({
    id: schedules.id,
    startTime: schedules.startTime,
    endTime: schedules.endTime,
  }).from(schedules).where(
    and(
      eq(schedules.groupId, groupId),
      eq(schedules.dayOfWeek, todayName),
    )
  ).limit(1)

  if (groupSchedules.length === 0) {
    return NextResponse.json({ skipped: true, reason: 'no_schedule_today' })
  }

  const schedule = groupSchedules[0]
  const startMin = parseTime(schedule.startTime ?? '00:00')
  const now = nowMinutes()
  const elapsed = now - startMin  // minutes since class started

  if (elapsed < 0) {
    return NextResponse.json({ skipped: true, reason: 'class_not_started', startsIn: Math.abs(elapsed) })
  }

  // ── get all students in this group ────────────────────────────────────────
  const gsRows = await db.select({ studentId: groupStudents.studentId })
    .from(groupStudents).where(eq(groupStudents.groupId, groupId))
  const allStudentIds = gsRows.map(r => r.studentId)
  if (allStudentIds.length === 0) return NextResponse.json({ updated: 0 })

  // ── get existing attendance records ───────────────────────────────────────
  const existing = await db.select({
    studentId: attendances.studentId,
    status: attendances.status,
  }).from(attendances).where(
    and(
      eq(attendances.attendanceDate, date),
      inArray(attendances.studentId, allStudentIds),
    )
  )
  const existingMap = new Map(existing.map(r => [r.studentId, r.status]))

  // ── determine new status for unscanned students ───────────────────────────
  const toUpdate: Array<{ studentId: number; newStatus: 'late' | 'absent'; prevStatus: string | null }> = []

  for (const sid of allStudentIds) {
    if (scannedStudentIds.includes(sid)) continue  // already scanned → keep present
    const prev = existingMap.get(sid) ?? null
    if (prev === 'present' && scannedStudentIds.includes(sid)) continue
    // Only downgrade, never upgrade
    if (elapsed >= absentThreshold) {
      if (prev !== 'absent') toUpdate.push({ studentId: sid, newStatus: 'absent', prevStatus: prev })
    } else if (elapsed >= lateThreshold) {
      if (prev !== 'absent' && prev !== 'late') {
        toUpdate.push({ studentId: sid, newStatus: 'late', prevStatus: prev })
      }
    }
  }

  if (toUpdate.length === 0) {
    return NextResponse.json({ updated: 0, elapsed, lateThreshold, absentThreshold })
  }

  // ── upsert attendance + send notifications ────────────────────────────────
  const msgAbsent = s['msg_absent'] ?? 'الطالب {student_name} غائب اليوم {date}'
  const msgLate   = s['msg_late']   ?? 'الطالب {student_name} متأخر اليوم {date}'

  // fetch student details for notifications
  const studentDetails = await db.select({
    id: students.id,
    firstName: students.firstName,
    lastName: students.lastName,
    guardianUserId: students.guardianUserId,
  }).from(students).where(inArray(students.id, toUpdate.map(t => t.studentId)))
  const studentMap = new Map(studentDetails.map(s => [s.id, s]))

  for (const { studentId, newStatus } of toUpdate) {
    // upsert attendance
    const rec = existingMap.get(studentId)
    const autoNote = newStatus === 'absent' ? 'غياب تلقائي (مزامنة الجدول)' : 'تأخر تلقائي (مزامنة الجدول)'
    if (rec) {
      await db.update(attendances)
        .set({ status: newStatus, notes: autoNote })
        .where(and(
          eq(attendances.studentId, studentId),
          eq(attendances.attendanceDate, date),
        ))
    } else {
      await db.insert(attendances).values({
        studentId,
        attendanceDate: date,
        status: newStatus,
        notes: autoNote,
        scheduleId: schedule.id,
      })
    }

    // send notification only if not already notified today
    const st = studentMap.get(studentId)
    if (!st) continue

    const targetIds = st.guardianUserId ? JSON.stringify([st.guardianUserId]) : null
    const fullName = `${st.firstName} ${st.lastName}`
    const isAbsent = newStatus === 'absent'
    const template = isAbsent ? msgAbsent : msgLate
    const body = template.replace('{student_name}', fullName).replace('{date}', date)

    // check if already sent today
    const existing_notif = await db.select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          sql`DATE(${notifications.createdAt}) = ${date}::date`,
          eq(notifications.notificationType, isAbsent ? 'auto_absence' : 'auto_late'),
          sql`${notifications.targetIds}::text = ${targetIds ?? '[]'}`,
        )
      ).limit(1)

    if (existing_notif.length === 0 && targetIds) {
      await db.insert(notifications).values({
        title: isAbsent ? `إشعار غياب – ${fullName}` : `إشعار تأخر – ${fullName}`,
        body,
        senderId: session.id,
        targetType: 'specific',
        targetIds,
        notificationType: isAbsent ? 'auto_absence' : 'auto_late',
        isReadBy: '[]',
      })
    }
  }

  return NextResponse.json({
    updated: toUpdate.length,
    absent: toUpdate.filter(t => t.newStatus === 'absent').length,
    late: toUpdate.filter(t => t.newStatus === 'late').length,
    elapsed,
    lateThreshold,
    absentThreshold,
  })
}
