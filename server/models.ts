import mongoose, { Schema } from 'mongoose'

// The sample data uses short string ids ('ernesto', 'u1', 'm1', ...), so they
// are kept as the document `_id` and references between collections stay valid.

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    handle: { type: String, required: true, unique: true },
    /** Login name, firstname.lastname in lowercase. */
    username: { type: String, required: true, unique: true },
    /** `salt:hash` from server/password.ts. Never the plain password. */
    passwordHash: { type: String, required: true, select: false },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    joined: { type: Date, required: true },
    interests: { type: [String], default: [] },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    hue: { type: Number, min: 0, max: 360, default: 0 },
  },
  { versionKey: false },
)

const uploadSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['photo', 'audio', 'video', 'writing'], required: true },
    title: { type: String, required: true },
    caption: { type: String, default: '' },
    createdAt: { type: Date, required: true, index: true },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    seed: { type: Number, required: true },
    duration: { type: String },
  },
  { versionKey: false },
)

const messageSchema = new Schema(
  {
    _id: { type: String, required: true },
    from: { type: String, ref: 'User', required: true },
    text: { type: String, required: true },
    sentAt: { type: Date, required: true },
  },
  { versionKey: false },
)

// One conversation per other participant, as seen by the signed-in user.
const conversationSchema = new Schema(
  {
    userId: { type: String, ref: 'User', required: true, unique: true },
    unread: { type: Number, default: 0 },
    messages: { type: [messageSchema], default: [] },
  },
  { versionKey: false },
)

const notificationSchema = new Schema(
  {
    _id: { type: String, required: true },
    type: { type: String, enum: ['like', 'comment', 'follow', 'message', 'upload'], required: true },
    actorId: { type: String, ref: 'User', required: true },
    uploadId: { type: String, ref: 'Upload' },
    text: { type: String },
    createdAt: { type: Date, required: true, index: true },
    read: { type: Boolean, default: false },
  },
  { versionKey: false },
)

export const UserModel = mongoose.model('User', userSchema)
export const UploadModel = mongoose.model('Upload', uploadSchema)
export const ConversationModel = mongoose.model('Conversation', conversationSchema)
export const NotificationModel = mongoose.model('Notification', notificationSchema)
