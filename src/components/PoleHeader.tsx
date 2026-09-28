import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { SlidersHorizontal } from 'lucide-react'
import type { PoleId } from '../lib/types'
import { COUNCIL, poleById } from '../lib/poles'
import { useAuth } from '../lib/auth'
import { Avatar, Button, PoleTag, rise } from './ui'

export function PoleHeader({ pole }: { pole: PoleId }) {
  const p = poleById(pole)
  const lead = COUNCIL.find((c) => c.pole === pole)
  const { canEdit, isSupervisor } = useAuth()
  return (
    <motion.header variants={rise} className="pole-head">
      <div>
        <h1 className="pole-title">{p.name}</h1>
        <p className="page-head__sub">{p.mission}</p>
        {lead && (
          <div className="pole-head__lead">
            <Avatar name={lead.full_name} size={36} tone="ink" />
            <div>
              <b>{lead.full_name}</b>
              <small>{lead.title}</small>
            </div>
            <PoleTag pole={pole} />
          </div>
        )}
      </div>
      {(canEdit(pole) || isSupervisor) && (
        <Link to={`/admin/${pole}`}>
          <Button variant={canEdit(pole) ? 'solid' : 'line'} icon={<SlidersHorizontal size={16} />}>
            {canEdit(pole) ? 'Gérer mon pôle' : 'Voir l’espace admin'}
          </Button>
        </Link>
      )}
    </motion.header>
  )
}
