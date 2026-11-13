import { ME_ID } from './config.ts'
import { ConversationModel, NotificationModel } from './models.ts'

/**
 * Brings a database made before accounts existed up to date. Safe to run on every start: once
 * there is nothing left to change, it does nothing.
 *
 * Before accounts there was one inbox, which belonged to the sample user. It keeps belonging to
 * them, and the old rule "one conversation per contact" becomes "one per contact, per inbox".
 */
export async function migrateToAccounts() {
  const [conversations, notifications] = await Promise.all([
    ConversationModel.updateMany({ ownerId: { $exists: false } }, { $set: { ownerId: ME_ID } }),
    NotificationModel.updateMany({ recipientId: { $exists: false } }, { $set: { recipientId: ME_ID } }),
  ])
  if (conversations.modifiedCount || notifications.modifiedCount) {
    console.log(
      `Migrated to accounts: ${conversations.modifiedCount} conversations and ` +
        `${notifications.modifiedCount} notifications now belong to ${ME_ID}.`,
    )
  }

  // The old unique index on `userId` alone would stop two people from both talking to the same
  // contact. The model declares the replacement (ownerId + userId), which Mongoose creates itself.
  try {
    await ConversationModel.collection.dropIndex('userId_1')
    console.log('Dropped the old unique index conversations.userId_1.')
  } catch (err) {
    // 26: the collection does not exist yet. 27: the index is already gone. Both mean nothing to do.
    const code = (err as { code?: number } | null)?.code
    if (code !== 26 && code !== 27) throw err
  }
}
