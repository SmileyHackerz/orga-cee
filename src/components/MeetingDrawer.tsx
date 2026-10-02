import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Video } from 'lucide-react'
import type { Meeting } from '../lib/types'
import { capitalize, fullDate, meetingDateTime, timeLabel } from '../lib/dates'
import { useAuth } from '../lib/auth'
import { usePublishedRows } from '../lib/store'
import { meetLink, meetingKind } from '../lib/derived'
import { Button, Countdown, Drawer, EmptyState, PoleTag } from './ui'
import { AttachmentList } from './Attachments'

export function MeetingDrawer({ meeting, open, onClose }: { meeting: Meeting | undefined; open: boolean; onClose: () => void }) {
  const { canEdit } = useAuth()
  const settings = usePublishedRows('settings')
  const files = usePublishedRows('attachments')
  const hasFiles = !!meeting && files.some((f) => f.parent_table === 'meetings' && f.parent_id === meeting.id)
  const link = meeting ? meetLink(settings, meeting.audience) : null
  const points = meeting?.agenda?.split('\n').filter(Boolean) ?? []
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <>
          <h2>{meeting ? capitalize(fullDate(meeting.date)) : 'Aucune réunion programmée'}</h2>
          <div className="drawer-kick"><PoleTag pole="secretariat" tone="gold" /><span>{meeting ? meetingKind(meeting) : 'Prochaine réunion'}</span></div>
        </>
      }
      footer={
        canEdit('secretariat') ? (
          <>
            <span className="dim" style={{ fontSize: 13 }}>Tu gères les réunions du conseil.</span>
            <Link to="/admin/secretariat?tab=meetings"><Button variant="solid" size="sm">Modifier</Button></Link>
          </>
        ) : undefined
      }
    >
      {!meeting ? (
        <EmptyState title="Pas de réunion à venir" text="Le Secrétariat général programme les réunions et publie l’ordre du jour ici." />
      ) : (
        <div className="sheet">
          <div className="meeting-hero">
            <div>
              <span className="label">Dans</span>
              <Countdown to={meetingDateTime(meeting.date, meeting.time)} />
            </div>
            {link && (
              <a className="join-btn" href={link} target="_blank" rel="noreferrer">
                <Video size={16} /> Rejoindre sur Meet
              </a>
            )}
          </div>
          <div className="facts facts--3">
            <div><CalendarDays size={16} /><span>Date</span><b>{capitalize(fullDate(meeting.date))}</b></div>
            <div><Clock size={16} /><span>Heure</span><b>{timeLabel(meeting.time) ?? '—'}</b></div>
            <div><MapPin size={16} /><span>Lieu</span><b>{meeting.place ?? '—'}</b></div>
          </div>
          <section className="sheet__sec">
            <h3>Ordre du jour</h3>
            {points.length === 0 ? (
              <p className="dim">L’ordre du jour n’est pas encore publié.</p>
            ) : (
              <ol className="steps steps--agenda">
                {points.map((p, i) => (
                  <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{p}</li>
                ))}
              </ol>
            )}
          </section>
          {hasFiles && (
            <section className="sheet__sec">
              <h3>Documents de la réunion</h3>
              <AttachmentList parent="meetings" parentId={meeting.id} />
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}
