export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  customStatus: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SafeUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
}

export interface Server {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  ownerId: string;
  isPublic: boolean;
  inviteCode: string | null;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  serverId: string;
  categoryId: string | null;
  name: string;
  type: "text" | "voice" | "announcement";
  topic: string | null;
  position: number;
  isNsfw: boolean;
  slowModeSeconds: number;
  lastMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  serverId: string;
  name: string;
  position: number;
}

export interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface Embed {
  type: "link" | "image" | "video";
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  color?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string | null;
  editedAt: string | null;
  isDeleted: boolean;
  replyToId: string | null;
  attachments: Attachment[];
  embeds: Embed[];
  reactions: Reaction[];
  createdAt: string;
}

export interface MessageWithAuthor extends Message {
  author: SafeUser;
}

export interface ServerMember {
  id: string;
  serverId: string;
  userId: string;
  nickname: string | null;
  joinedAt: string;
  user?: SafeUser;
}

export interface Role {
  id: string;
  serverId: string;
  name: string;
  color: string;
  position: number;
  permissions: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ServerWithDetails extends Server {
  channels: Channel[];
  categories: Category[];
  members: ServerMember[];
  roles: Role[];
}
