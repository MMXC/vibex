/**
 * Room Manager
 * 房间创建/销毁、成员管理、状态持久化
 */
// @ts-nocheck


import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RoomMember {
  id: string;
  name: string;
  joinedAt: number;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: { x: number; y: number };
}

export interface Room {
  id: string;
  name: string;
  createdAt: number;
  ownerId: string;
  members: RoomMember[];
  maxMembers: number;
  isActive: boolean;
  lastActivity: number;
}

interface RoomManagerState {
  // 状态
  currentRoom: Room | null;
  rooms: Map<string, Room>;
  
  // Actions
  createRoom: (name: string, ownerId: string, ownerName: string) => Room;
  destroyRoom: (roomId: string) => void;
  joinRoom: (roomId: string, member: RoomMember) => boolean;
  leaveRoom: (roomId: string, memberId: string) => void;
  updateMemberCursor: (roomId: string, memberId: string, cursor: { x: number; y: number }) => void;
  setCurrentRoom: (roomId: string | null) => void;
  getRoom: (roomId: string) => Room | undefined;
  getActiveRooms: () => Room[];
}

export const useRoomManager = create<RoomManagerState>()(
  persist(
    (set, get) => ({
      currentRoom: null,
      rooms: new Map(),

      createRoom: (name: string, ownerId: string, ownerName: string) => {
        const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        
        const ownerMember: RoomMember = {
          id: ownerId,
          name: ownerName,
          joinedAt: Date.now(),
          role: 'owner',
        };
        
        const newRoom: Room = {
          id: roomId,
          name,
          createdAt: Date.now(),
          ownerId,
          members: [ownerMember],
          maxMembers: 10,
          isActive: true,
          lastActivity: Date.now(),
        };
        
        set((state) => {
          const newRooms = new Map(state.rooms);
          newRooms.set(roomId, newRoom);
          return { rooms: newRooms, currentRoom: newRoom };
        });
        
        return newRoom;
      },

      destroyRoom: (roomId: string) => {
        set((state) => {
          const newRooms = new Map(state.rooms);
          newRooms.delete(roomId);
          
          return {
            rooms: newRooms,
            currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
          };
        });
      },

      joinRoom: (roomId: string, member: RoomMember) => {
        const room = get().rooms.get(roomId);
        if (!room) return false;
        if (room.members.length >= room.maxMembers) return false;
        if (room.members.some(m => m.id === member.id)) return false;
        
        set((state) => {
          const newRooms = new Map(state.rooms);
          const updatedRoom = {
            ...room,
            members: [...room.members, member],
            lastActivity: Date.now(),
          };
          newRooms.set(roomId, updatedRoom);
          
          return {
            rooms: newRooms,
            currentRoom: state.currentRoom?.id === roomId ? updatedRoom : state.currentRoom,
          };
        });
        
        return true;
      },

      leaveRoom: (roomId: string, memberId: string) => {
        const room = get().rooms.get(roomId);
        if (!room) return;
        
        set((state) => {
          const newRooms = new Map(state.rooms);
          
          // 如果是房主离开，解散房间
          const member = room.members.find(m => m.id === memberId);
          if (member?.role === 'owner') {
            newRooms.delete(roomId);
          } else {
            const updatedRoom = {
              ...room,
              members: room.members.filter(m => m.id !== memberId),
              lastActivity: Date.now(),
            };
            newRooms.set(roomId, updatedRoom);
          }
          
          return {
            rooms: newRooms,
            currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
          };
        });
      },

      updateMemberCursor: (roomId: string, memberId: string, cursor: { x: number; y: number }) => {
        const room = get().rooms.get(roomId);
        if (!room) return;
        
        set((state) => {
          const newRooms = new Map(state.rooms);
          const updatedRoom = {
            ...room,
            members: room.members.map(m =>
              m.id === memberId ? { ...m, cursor } : m
            ),
          };
          newRooms.set(roomId, updatedRoom);
          
          return { rooms: newRooms };
        });
      },

      setCurrentRoom: (roomId: string | null) => {
        if (roomId === null) {
          set({ currentRoom: null });
          return;
        }
        
        const room = get().rooms.get(roomId);
        set({ currentRoom: room || null });
      },

      getRoom: (roomId: string) => {
        return get().rooms.get(roomId);
      },

      getActiveRooms: () => {
        return Array.from(get().rooms.values()).filter(r => r.isActive);
      },
    }),
    {
      name: 'room-manager-storage',
      partialize: (state) => ({ rooms: Array.from(state.rooms.entries()) }),
    }
  )
);

// 序列化/反序列化处理
const stored = useRoomManager.getState();
if (stored.rooms instanceof Map === false && Array.isArray(stored.rooms)) {
  useRoomManager.setState({
    rooms: new Map(stored.rooms),
  });
}

export default useRoomManager;
