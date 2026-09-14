import Dexie, { type EntityTable } from 'dexie'
import type { Note, Folder, Checkpoint, Branch } from '@/types'

const db = new Dexie('orrery') as Dexie & {
  notes: EntityTable<Note, 'id'>
  folders: EntityTable<Folder, 'id'>
  checkpoints: EntityTable<Checkpoint, 'id'>
  branches: EntityTable<Branch, 'id'>
}

db.version(1).stores({
  notes: 'id, user_id, folder_id, updated_at, is_deleted',
  folders: 'id, user_id, parent_id',
  checkpoints: 'id, note_id, user_id, parent_checkpoint_id, position',
  branches: 'id, note_id, user_id, from_checkpoint_id, status',
})

export { db }
