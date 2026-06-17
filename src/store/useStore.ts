import { create } from 'zustand';
import {
  currentUser,
  mockActivities,
  mockRoutes,
  mockChallenges,
  mockPosts,
} from '../data';
import type {
  User,
  Activity,
  Route,
  Challenge,
  Post
} from '../types';

interface StoreState {
  user: User;
  activities: Activity[];
  routes: Route[];
  challenges: Challenge[];
  posts: Post[];
  isLoading: boolean;
  error: string | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;

  addActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
  getActivityById: (id: string) => Activity | undefined;

  toggleFavoriteRoute: (routeId: string) => void;
  getFavoriteRoutes: () => Route[];

  addChallenge: (challenge: Challenge) => void;
  joinChallenge: (challengeId: string) => void;
  leaveChallenge: (challengeId: string) => void;

  toggleLikePost: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  addPost: (post: Post) => void;
  removePost: (id: string) => void;

  resetStore: () => void;
}

const initialState = {
  user: currentUser,
  activities: mockActivities,
  routes: mockRoutes,
  challenges: mockChallenges,
  posts: mockPosts,
  isLoading: false,
  error: null
};

const useStore = create<StoreState>((set, get) => ({
  ...initialState,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setUser: (user) => set({ user }),
  updateUser: (updates) =>
    set((state) => ({
      user: { ...state.user, ...updates }
    })),

  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities]
    })),

  removeActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id)
    })),

  getActivityById: (id) => get().activities.find((a) => a.id === id),

  toggleFavoriteRoute: (routeId) =>
    set((state) => ({
      routes: state.routes.map((route) =>
        route.id === routeId
          ? { ...route, isFavorite: !route.isFavorite }
          : route
      )
    })),

  getFavoriteRoutes: () => get().routes.filter((route) => route.isFavorite),

  addChallenge: (challenge) =>
    set((state) => ({
      challenges: [challenge, ...state.challenges]
    })),

  joinChallenge: (challengeId) =>
    set((state) => {
      const currentUserState = state.user;
      return {
        challenges: state.challenges.map((challenge) => {
          if (challenge.id !== challengeId) return challenge;
          const alreadyJoined = challenge.participants.some(
            (p) => p.userId === currentUserState.id
          );
          if (alreadyJoined) return challenge;
          return {
            ...challenge,
            participantCount: challenge.participantCount + 1,
            isJoined: true,
            participants: [
              ...challenge.participants,
              {
                userId: currentUserState.id,
                user: currentUserState,
                progress: 0,
                currentValue: 0,
                joinedAt: new Date().toISOString(),
                rank: challenge.participants.length + 1
              }
            ]
          };
        })
      };
    }),

  leaveChallenge: (challengeId) =>
    set((state) => {
      const currentUserId = state.user.id;
      return {
        challenges: state.challenges.map((challenge) => {
          if (challenge.id !== challengeId) return challenge;
          return {
            ...challenge,
            participantCount: Math.max(0, challenge.participantCount - 1),
            isJoined: false,
            participants: challenge.participants.filter(
              (p) => p.userId !== currentUserId
            )
          };
        })
      };
    }),

  toggleLikePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likes: isLiked ? post.likes + 1 : Math.max(0, post.likes - 1)
        };
      })
    })),

  toggleBookmarkPost: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, isBookmarked: !post.isBookmarked }
          : post
      )
    })),

  addComment: (postId, content) =>
    set((state) => {
      const currentUserState = state.user;
      return {
        posts: state.posts.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            comments: [
              ...post.comments,
              {
                id: `cmt-${Date.now()}`,
                userId: currentUserState.id,
                user: currentUserState,
                content,
                createdAt: new Date().toISOString(),
                likes: 0
              }
            ]
          };
        })
      };
    }),

  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts]
    })),

  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id)
    })),

  resetStore: () => set(initialState)
}));

export default useStore;
