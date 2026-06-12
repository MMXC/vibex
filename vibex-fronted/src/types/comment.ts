/**
 * S92-E3: Canvas comment thread types
 */

export interface CanvasComment {
  id: string;
  canvas_id: string;
  node_id: string | null;
  parent_id: string | null;  // null = root comment, set = reply
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  x: number;       // canvas pixel position
  y: number;
  resolved: boolean;
  mentions: string[];  // user IDs
  replies: CanvasComment[];
  created_at: number;
  updated_at: number;
}

export interface CanvasCommentBubble {
  id: string;
  x: number;
  y: number;
  node_id: string | null;
  comment_count: number;
  unresolved_count: number;
  last_activity: number;
}

export interface CreateCommentBody {
  canvas_id: string;
  node_id?: string | null;
  parent_id?: string | null;
  author_id: string;
  author_name: string;
  author_avatar?: string | null;
  content: string;
  x: number;
  y: number;
  mentions?: string[];
}

export interface UpdateCommentBody {
  content?: string;
  resolved?: boolean;
  x?: number;
  y?: number;
}
