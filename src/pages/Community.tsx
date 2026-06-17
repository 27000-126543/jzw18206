import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Feather,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Clock,
  Flame,
  Trophy,
  Medal,
  Plus,
  Check,
  X,
  Image as ImageIcon,
  Tag,
  Navigation,
  Route,
  Timer,
  Gauge,
  Send,
  ChevronDown,
  TrendingUp,
  Users,
  Star,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import useStore from '../store/useStore';
import type { Post, User, Comment, Activity } from '../types';
import { MiniTrackMap } from '../components/maps/MiniTrackMap';
import {
  formatDistance,
  formatDuration,
  formatPace,
} from '../utils/formatters';
import { mockUsers } from '../data/mockUser';

type TabType = 'recommend' | 'follow' | 'nearby';

const HOT_TAGS = [
  '晨跑打卡',
  '周末骑行',
  '半马训练',
  '夜跑',
  '公路车',
  '越野跑',
];

const WEEK_STAR_MOCK = mockUsers
  .slice(0, 5)
  .map((u, i) => ({
    ...u,
    weeklyDistance: 120 - i * 18 + Math.random() * 10,
  }))
  .sort((a, b) => b.weeklyDistance - a.weeklyDistance);

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch {
    return dateStr;
  }
}

function highlightContent(
  content: string,
  onTagClick: (tag: string) => void
): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /#([^#\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const tag = match[1];
    parts.push(
      <span
        key={`tag-${keyIdx++}`}
        className="text-brand-500 cursor-pointer hover:underline font-medium"
        onClick={() => onTagClick(tag)}
      >
        #{tag}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

function ImageGrid({ images }: { images: string[] }) {
  const count = images.length;
  if (count === 0) return null;

  const gridClass =
    count === 1
      ? 'grid-cols-1'
      : count === 2
      ? 'grid-cols-2'
      : count === 3
      ? 'grid-cols-3'
      : count === 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  const aspectClass = count === 1 ? 'aspect-[4/3]' : 'aspect-square';

  return (
    <div className={cn('grid gap-1.5', gridClass)}>
      {images.map((img, i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-xl overflow-hidden bg-ink-100',
            aspectClass,
            count === 4 && i === 0 && 'col-span-2 row-span-2',
            count === 1 && 'max-h-80'
          )}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <img
            src={img}
            alt={`post-img-${i}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
      ))}
    </div>
  );
}

interface PostCardProps {
  post: Post;
  index: number;
  onTagClick: (tag: string) => void;
  activity?: Activity;
}

function PostCard({ post, index, onTagClick, activity }: PostCardProps) {
  const { toggleLikePost, toggleBookmarkPost, addComment } = useStore();
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const handleLike = () => {
    toggleLikePost(post.id);
    if (!post.isLiked) {
      setBurstKey((k) => k + 1);
    }
  };

  const handleSubmitComment = () => {
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  const isLongContent = post.content.length > 120;
  const displayContent =
    isLongContent && !showMore
      ? post.content.slice(0, 120) + '...'
      : post.content;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 24,
        delay: index * 0.05,
      }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-ink-100 hover:shadow-card-hover transition-shadow"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <img
            src={post.user.avatar}
            alt={post.user.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-ink-100 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-ink-800 truncate">
                {post.user.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-100 to-teal-100 text-brand-700 font-medium">
                Lv.{post.user.level}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-ink-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(post.createdAt)}
              </span>
              {post.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {post.location.name}
                </span>
              )}
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-ink-100 text-ink-400 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3">
          <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
            {highlightContent(displayContent, onTagClick)}
          </p>
          {isLongContent && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-xs text-brand-500 mt-1 hover:underline"
            >
              {showMore ? '收起' : '展开全文'}
            </button>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="text-xs px-2.5 py-1 rounded-full bg-ink-50 text-ink-600 hover:bg-brand-50 hover:text-brand-600 border border-ink-100 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {post.images && post.images.length > 0 && (
          <div className="mb-3">
            <ImageGrid images={post.images} />
          </div>
        )}

        {activity && (
          <div className="mb-3 p-3 rounded-2xl bg-gradient-to-br from-teal-50 to-brand-50 border border-teal-100/50">
            <MiniTrackMap
              trackPoints={activity.trackPoints}
              width={480}
              height={200}
              className="w-full h-auto"
            />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/70">
                <Route className="w-4 h-4 text-brand-500 mb-1" />
                <span className="text-xs text-ink-400">距离</span>
                <span className="text-sm font-bold text-ink-800">
                  {formatDistance(activity.distance, 1)}
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/70">
                <Timer className="w-4 h-4 text-teal-500 mb-1" />
                <span className="text-xs text-ink-400">时长</span>
                <span className="text-sm font-bold text-ink-800">
                  {formatDuration(activity.duration, false)}
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/70">
                <Gauge className="w-4 h-4 text-orange-500 mb-1" />
                <span className="text-xs text-ink-400">配速</span>
                <span className="text-sm font-bold text-ink-800">
                  {formatPace(activity.avgPace)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-ink-50">
          <div className="flex items-center gap-1">
            <motion.button
              onClick={handleLike}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors',
                post.isLiked
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-ink-500 hover:bg-ink-50'
              )}
            >
              <motion.div
                key={`like-${burstKey}`}
                animate={
                  post.isLiked
                    ? {
                        scale: [1, 1.4, 1],
                        transition: { duration: 0.35 },
                      }
                    : {}
                }
              >
                <Heart
                  className={cn('w-5 h-5', post.isLiked && 'fill-current')}
                />
              </motion.div>
              {post.isLiked && (
                <motion.span
                  key={`burst-${burstKey}`}
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-red-400"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos((i / 6) * Math.PI * 2) * 28,
                        y:
                          Math.sin((i / 6) * Math.PI * 2) * 28 -
                          8,
                        opacity: 0,
                        scale: 0.2,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{ marginLeft: -3, marginTop: -3 }}
                    />
                  ))}
                </motion.span>
              )}
              <span className="text-xs font-medium">{post.likes}</span>
            </motion.button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors',
                showComments
                  ? 'text-teal-500 bg-teal-50'
                  : 'text-ink-500 hover:bg-ink-50'
              )}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-medium">
                {post.comments.length}
              </span>
            </button>

            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-ink-500 hover:bg-ink-50 transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="text-xs font-medium">{post.shareCount}</span>
            </button>
          </div>

          <motion.button
            onClick={() => toggleBookmarkPost(post.id)}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors',
              post.isBookmarked
                ? 'text-yellow-500 hover:bg-yellow-50'
                : 'text-ink-500 hover:bg-ink-50'
            )}
          >
            <Bookmark
              className={cn('w-5 h-5', post.isBookmarked && 'fill-current')}
            />
          </motion.button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-ink-100 space-y-3">
                {post.comments.length === 0 ? (
                  <p className="text-xs text-ink-400 text-center py-4">
                    还没有评论，快来抢沙发吧～
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {post.comments.map((c: Comment) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2.5"
                      >
                        <img
                          src={c.user.avatar}
                          alt={c.user.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="bg-ink-50 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-ink-700 truncate">
                                {c.user.name}
                              </span>
                              <span className="text-xs text-ink-400 flex-shrink-0">
                                {timeAgo(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-ink-600 leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-3">
                            <button className="text-xs text-ink-400 hover:text-red-500 transition-colors flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {c.likes}
                            </button>
                            <button className="text-xs text-ink-400 hover:text-brand-500 transition-colors">
                              回复
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <img
                    src={useStore.getState().user.avatar}
                    alt="me"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-200">
                    <input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleSubmitComment()
                      }
                      placeholder="写下你的评论..."
                      className="flex-1 bg-transparent outline-none text-sm text-ink-700 placeholder:text-ink-400"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSubmitComment}
                      disabled={!commentInput.trim()}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        commentInput.trim()
                          ? 'bg-brand-gradient text-white shadow-sm'
                          : 'text-ink-300'
                      )}
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-ink-100 p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-ink-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-ink-100 rounded animate-pulse w-1/3" />
          <div className="h-2.5 bg-ink-100 rounded animate-pulse w-1/4" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-ink-100 rounded animate-pulse w-full" />
        <div className="h-3 bg-ink-100 rounded animate-pulse w-5/6" />
        <div className="h-3 bg-ink-100 rounded animate-pulse w-4/6" />
      </div>
      <div className="aspect-[4/3] bg-ink-100 rounded-xl animate-pulse mb-4" />
      <div className="flex gap-3">
        <div className="h-4 bg-ink-100 rounded-full animate-pulse w-12" />
        <div className="h-4 bg-ink-100 rounded-full animate-pulse w-12" />
        <div className="h-4 bg-ink-100 rounded-full animate-pulse w-12" />
      </div>
    </div>
  );
}

interface LeftSidebarProps {
  user: User;
  activeTag: string | null;
  onTagClick: (tag: string | null) => void;
  onOpenPostModal: () => void;
}

function LeftSidebar({
  user,
  activeTag,
  onTagClick,
  onOpenPostModal,
}: LeftSidebarProps) {
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const recommendedUsers = useMemo(
    () =>
      mockUsers
        .filter((u) => u.id !== user.id)
        .slice(1, 6)
        .map((u) => ({
          ...u,
          sportType: ['跑步', '骑行', '越野跑', '铁人三项', '登山'][
            Math.floor(Math.random() * 5)
          ],
        })),
    [user.id]
  );

  const toggleFollow = (uid: string) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 250 }}
        className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden"
      >
        <div className="h-20 bg-gradient-to-br from-brand-400 via-orange-400 to-teal-400" />
        <div className="px-4 pb-4 -mt-10">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md"
          />
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink-800">{user.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-500 text-white font-medium">
                Lv.{user.level}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-1 line-clamp-2">
              {user.bio}
            </p>
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <div className="font-bold text-ink-800 text-sm">
                  {user.followers}
                </div>
                <div className="text-xs text-ink-400">粉丝</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-ink-800 text-sm">
                  {user.following}
                </div>
                <div className="text-xs text-ink-400">关注</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-ink-800 text-sm">
                  {user.streakDays}
                </div>
                <div className="text-xs text-ink-400">连续</div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenPostModal}
              className="w-full mt-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-brand-glow hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Feather className="w-4 h-4" />
              发布动态
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 250, delay: 0.1 }}
        className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-sm text-ink-800">热门话题</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onTagClick(null)}
            className={cn(
              'text-xs px-2.5 py-1.5 rounded-full border transition-all',
              activeTag === null
                ? 'bg-brand-gradient text-white border-transparent shadow-sm'
                : 'bg-white text-ink-600 border-ink-200 hover:border-brand-300 hover:text-brand-500'
            )}
          >
            全部
          </button>
          {HOT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-full border transition-all',
                activeTag === tag
                  ? 'bg-brand-gradient text-white border-transparent shadow-sm'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-brand-300 hover:text-brand-500'
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 250, delay: 0.2 }}
        className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-500" />
            <h3 className="font-semibold text-sm text-ink-800">推荐关注</h3>
          </div>
          <button className="text-xs text-brand-500 hover:underline">
            更多
          </button>
        </div>
        <div className="space-y-3">
          {recommendedUsers.map((u, i) => {
            const isFollowed = followedUsers.has(u.id);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink-800 truncate">
                    {u.name}
                  </div>
                  <div className="text-xs text-ink-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {u.sportType}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleFollow(u.id)}
                  className={cn(
                    'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
                    isFollowed
                      ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white'
                      : 'border-2 border-transparent bg-gradient-to-r from-brand-500 to-orange-500 text-transparent bg-clip-text border-origin-padding relative overflow-hidden',
                    !isFollowed &&
                      'before:absolute before:inset-0 before:rounded-full before:border-2 before:border-transparent before:bg-gradient-to-r before:from-brand-500 before:to-orange-500 before:bg-clip-padding before:bg-ink-50 before:mask before:[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] before:[mask-composite:exclude] before:-z-0',
                    !isFollowed && 'hover:bg-brand-gradient hover:text-white'
                  )}
                >
                  {isFollowed ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> 已关注
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 relative z-10 px-2 py-0.5 rounded-full border border-brand-400 text-brand-500 hover:text-white hover:border-transparent transition-all">
                      <Plus className="w-3 h-3" /> 关注
                    </span>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

interface RightSidebarProps {
  user: User;
  posts: Post[];
  challenges: ReturnType<typeof useStore.getState>['challenges'];
  onJoinChallenge: (id: string) => void;
}

function RightSidebar({
  posts,
  challenges,
  onJoinChallenge,
}: RightSidebarProps) {
  const topPosts = useMemo(
    () =>
      [...posts]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    [posts]
  );

  const ongoingChallenge = challenges.find((c) => !c.isJoined) || challenges[0];

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 250 }}
        className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-sm text-ink-800">本周之星</h3>
        </div>
        <div className="space-y-2.5">
          {WEEK_STAR_MOCK.map((u, i) => {
            const rank = i + 1;
            const gradientClass =
              rank === 1
                ? 'bg-gold-gradient'
                : rank === 2
                ? 'bg-silver-gradient'
                : rank === 3
                ? 'bg-bronze-gradient'
                : 'bg-ink-100';
            const textClass =
              rank <= 3 ? 'text-white' : 'text-ink-600';
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-ink-50 transition-colors"
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm',
                    gradientClass,
                    textClass
                  )}
                >
                  {rank <= 3 ? (
                    <Medal className="w-3.5 h-3.5" />
                  ) : (
                    rank
                  )}
                </div>
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink-800 truncate">
                    {u.name}
                  </div>
                  <div className="text-xs text-ink-400 flex items-center gap-1">
                    <Route className="w-3 h-3" />
                    {u.weeklyDistance.toFixed(1)} km
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 250, delay: 0.1 }}
        className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-sm text-ink-800">热门动态</h3>
        </div>
        <div className="space-y-3">
          {topPosts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex gap-3 p-2 -mx-2 rounded-xl hover:bg-ink-50 transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0
                    ? 'bg-red-500 text-white'
                    : i === 1
                    ? 'bg-orange-500 text-white'
                    : 'bg-yellow-500 text-white'
                )}
              >
                {p.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-700 line-clamp-2 leading-relaxed">
                  {p.content.replace(/#[^\s#]+/g, '').trim()}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-red-500 flex items-center gap-0.5">
                    <Heart className="w-3 h-3 fill-current" /> {p.likes}
                  </span>
                  <span className="text-xs text-ink-400">
                    {p.user.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {ongoingChallenge && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 250, delay: 0.2 }}
          className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden"
        >
          <div
            className="h-28 bg-cover bg-center relative"
            style={
              ongoingChallenge.banner
                ? { backgroundImage: `url(${ongoingChallenge.banner})` }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <h3 className="text-white font-bold text-sm">今日挑战</h3>
              </div>
              <p className="text-white/90 text-xs mt-0.5 line-clamp-1">
                {ongoingChallenge.title}
              </p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-ink-500">
                目标 {ongoingChallenge.target} {ongoingChallenge.unit}
              </span>
              <span className="text-brand-500 font-medium">
                {ongoingChallenge.participantCount.toLocaleString()} 人参与
              </span>
            </div>
            <div className="h-2 bg-ink-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-brand-gradient rounded-full transition-all"
                style={{
                  width: `${ongoingChallenge.myProgress || 12}%`,
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoinChallenge(ongoingChallenge.id)}
              disabled={ongoingChallenge.isJoined}
              className={cn(
                'w-full py-2 rounded-xl text-sm font-medium transition-all',
                ongoingChallenge.isJoined
                  ? 'bg-teal-50 text-teal-600 cursor-default'
                  : 'bg-brand-gradient text-white shadow-sm hover:shadow-md'
              )}
            >
              {ongoingChallenge.isJoined ? '✓ 已参与' : '立即参与挑战'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    images: string[];
    tags: string[];
    activityId?: string;
    location?: { name: string };
  }) => void;
  activities: Activity[];
  user: User;
}

function PostModal({ open, onClose, onSubmit, activities, user }: PostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<
    string | undefined
  >();
  const [location, setLocation] = useState('');
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    const remainingSlots = 9 - images.length;
    if (remainingSlots <= 0) return;

    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/')
    );
    const limitedFiles = fileArray.slice(0, remainingSlots);

    const promises = limitedFiles.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    try {
      const dataUrls = await Promise.all(promises);
      setImages((prev) => [...prev, ...dataUrls]);
    } catch (err) {
      console.error('Failed to read files:', err);
    }
  };

  const handleAddImages = (
    e?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent
  ) => {
    if (e && 'target' in e && e.target instanceof HTMLInputElement) {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles);
      }
      e.target.value = '';
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return;
    onSubmit({
      content: content.trim(),
      images,
      tags,
      activityId: selectedActivityId,
      location: location ? { name: location } : undefined,
    });
    setContent('');
    setImages([]);
    setTags([]);
    setSelectedActivityId(undefined);
    setLocation('');
    onClose();
  };

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-[8%] -translate-x-1/2 z-50 w-[95%] max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <h2 className="font-bold text-lg text-ink-800">发布动态</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink-100 text-ink-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="font-semibold text-ink-800">{user.name}</div>
                  <div className="text-xs text-ink-400">
                    Lv.{user.level} · 所有人可见
                  </div>
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你今天的运动故事..."
                rows={5}
                className="w-full resize-none outline-none text-sm text-ink-800 placeholder:text-ink-400 leading-relaxed bg-transparent"
                maxLength={1000}
              />
              <div className="text-right text-xs text-ink-400 -mt-2">
                {content.length}/1000
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square rounded-xl overflow-hidden bg-ink-100"
                    >
                      <img
                        src={img}
                        alt={`upload-${i}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  {images.length < 9 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={handleAddImages}
                      className="aspect-square rounded-xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-ink-400 hover:text-brand-500"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-xs">添加图片</span>
                    </motion.button>
                  )}
                </div>
              )}

              {images.length === 0 && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const dropFiles = e.dataTransfer.files;
                    if (dropFiles && dropFiles.length > 0) {
                      processFiles(dropFiles);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center',
                    isDragging
                      ? 'border-brand-400 bg-brand-50/70'
                      : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50'
                  )}
                >
                  <ImageIcon
                    className={cn(
                      'w-10 h-10 mx-auto mb-2 transition-colors',
                      isDragging ? 'text-brand-500' : 'text-ink-300'
                    )}
                  />
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isDragging ? 'text-brand-600' : 'text-ink-600'
                    )}
                  >
                    拖拽图片到此处或点击上传
                  </p>
                  <p className="text-xs text-ink-400 mt-1">
                    支持 JPG/PNG，最多 9 张
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddImages}
              />

              <div className="relative">
                <button
                  onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:border-brand-300 transition-colors text-left"
                >
                  <Route className="w-5 h-5 text-teal-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-ink-400">关联运动</div>
                    <div
                      className={cn(
                        'text-sm truncate',
                        selectedActivity ? 'text-ink-800' : 'text-ink-500'
                      )}
                    >
                      {selectedActivity
                        ? `${selectedActivity.name} · ${formatDistance(selectedActivity.distance, 1)}`
                        : '选择最近的一次运动记录'}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-ink-400 transition-transform',
                      showActivityDropdown && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {showActivityDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-10 left-0 right-0 mt-2 bg-white rounded-xl border border-ink-100 shadow-lg max-h-60 overflow-y-auto"
                    >
                      {activities.length === 0 ? (
                        <div className="p-4 text-center text-sm text-ink-400">
                          暂无运动记录
                        </div>
                      ) : (
                        activities.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              setSelectedActivityId(a.id);
                              setShowActivityDropdown(false);
                            }}
                            className={cn(
                              'w-full p-3 text-left hover:bg-ink-50 transition-colors flex items-center gap-3 border-b border-ink-50 last:border-0',
                              selectedActivityId === a.id && 'bg-brand-50/50'
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                a.type === 'running'
                                  ? 'bg-brand-100 text-brand-600'
                                  : 'bg-teal-100 text-teal-600'
                              )}
                            >
                              {a.type === 'running' ? (
                                <Flame className="w-4 h-4" />
                              ) : (
                                <Route className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-ink-800 truncate font-medium">
                                {a.name}
                              </div>
                              <div className="text-xs text-ink-400 flex items-center gap-2 mt-0.5">
                                <span>
                                  {format(a.startTime, 'MM-dd HH:mm')}
                                </span>
                                <span>
                                  {formatDistance(a.distance, 1)}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-ink-700">
                    话题标签
                  </span>
                  <span className="text-xs text-ink-400">
                    ({tags.length}/5)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <motion.span
                      key={t}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 border border-brand-100"
                    >
                      #{t}
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-brand-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                  <div className="flex items-center gap-1 bg-ink-50 rounded-full px-2 py-1">
                    <span className="text-xs text-brand-500">#</span>
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      onBlur={handleAddTag}
                      placeholder="添加标签"
                      maxLength={12}
                      className="w-20 bg-transparent outline-none text-xs text-ink-700 placeholder:text-ink-400"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {HOT_TAGS.filter((t) => !tags.includes(t))
                    .slice(0, 4)
                    .map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          if (tags.length < 5) setTags((p) => [...p, t]);
                        }}
                        disabled={tags.length >= 5}
                        className="text-xs px-2 py-1 rounded-full bg-ink-100 text-ink-500 hover:bg-brand-100 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        + {t}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="添加位置（选填）"
                  className="flex-1 bg-ink-50 rounded-xl px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-ink-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAddImages}
                  disabled={images.length >= 9}
                  className="p-2.5 rounded-xl hover:bg-ink-100 text-ink-500 hover:text-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="添加图片"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!content.trim() && images.length === 0}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                  !content.trim() && images.length === 0
                    ? 'bg-ink-100 text-ink-400 cursor-not-allowed'
                    : 'bg-brand-gradient text-white shadow-brand-glow hover:shadow-lg'
                )}
              >
                发布动态
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Community() {
  const {
    posts,
    user,
    activities,
    challenges,
    addPost,
    joinChallenge,
    leaveChallenge,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const tabs: { key: TabType; label: string; icon: typeof Flame }[] = [
    { key: 'recommend', label: '推荐', icon: Star },
    { key: 'follow', label: '关注', icon: Users },
    { key: 'nearby', label: '附近', icon: MapPin },
  ];

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (activeTag) {
      result = result.filter(
        (p) =>
          p.tags.some((t) => t.includes(activeTag!)) ||
          p.content.includes(`#${activeTag}`)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.user.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (activeTab === 'follow') {
      const followIds = new Set(['user-002', 'user-003', 'user-004', 'user-007']);
      result = result.filter((p) => followIds.has(p.userId));
    } else if (activeTab === 'nearby') {
      result = result.filter((p) => p.location);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts, activeTag, searchQuery, activeTab]);

  const displayedPosts = useMemo(
    () => filteredPosts.slice(0, visibleCount),
    [filteredPosts, visibleCount]
  );

  const getActivityForPost = useCallback(
    (post: Post): Activity | undefined => {
      if (post.activityId) {
        return activities.find((a) => a.id === post.activityId);
      }
      return undefined;
    },
    [activities]
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (
            visibleCount < filteredPosts.length &&
            !isLoadingMore
          ) {
            setIsLoadingMore(true);
            setTimeout(() => {
              setVisibleCount((prev) =>
                Math.min(prev + 4, filteredPosts.length)
              );
              setIsLoadingMore(false);
            }, 900);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredPosts.length, visibleCount, isLoadingMore]);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTag, activeTab, searchQuery]);

  const handleSubmitPost = (data: {
    content: string;
    images: string[];
    tags: string[];
    activityId?: string;
    location?: { name: string };
  }) => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: user.id,
      user,
      activityId: data.activityId,
      content: [
        data.content,
        ...data.tags.map((t) => `#${t}`),
      ]
        .filter(Boolean)
        .join(' '),
      images: data.images,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      isLiked: false,
      isBookmarked: false,
      shareCount: 0,
      tags: data.tags,
      location: data.location
        ? { ...data.location, latitude: 39.9, longitude: 116.4 }
        : undefined,
    };
    addPost(newPost);
  };

  const handleTagClick = (tag: string | null) => {
    setActiveTag(tag);
  };

  const handleJoinChallenge = (id: string) => {
    const challenge = challenges.find((c) => c.id === id);
    if (challenge?.isJoined) {
      leaveChallenge(id);
    } else {
      joinChallenge(id);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-ink-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-ink-800">
                社区广场
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-0.5 hidden sm:block">
                与运动爱好者分享你的精彩瞬间
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPostModalOpen(true)}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-brand-gradient shadow-brand-glow hover:shadow-lg flex items-center justify-center text-white flex-shrink-0 group"
              title="发布动态"
            >
              <Feather className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="hidden lg:block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-ink-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                发布动态
              </span>
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户、话题、动态..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-800 placeholder:text-ink-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-200 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0',
                    isActive
                      ? 'text-white'
                      : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeTabBg"
                      className="absolute inset-0 rounded-xl bg-brand-gradient shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="mt-5 grid grid-cols-1 gap-5"
        style={{
          gridTemplateColumns: 'minmax(0, 1fr)',
        }}
      >
        <div
          className="hidden xl:grid gap-5"
          style={{
            gridTemplateColumns: '20% minmax(0, 1fr) 25%',
          }}
        >
          <aside className="space-y-4">
            <div className="sticky top-[340px]">
              <LeftSidebar
                user={user}
                activeTag={activeTag}
                onTagClick={handleTagClick}
                onOpenPostModal={() => setIsPostModalOpen(true)}
              />
            </div>
          </aside>

          <main className="">
          <AnimatePresence mode="popLayout">
            {displayedPosts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl border border-ink-100 p-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ink-50 flex items-center justify-center">
                  <Users className="w-10 h-10 text-ink-300" />
                </div>
                <h3 className="text-lg font-semibold text-ink-700 mb-1">
                  暂无相关动态
                </h3>
                <p className="text-sm text-ink-400 mb-4">
                  {activeTag
                    ? `#${activeTag} 话题还没有动态，换个话题看看吧`
                    : searchQuery
                    ? '没有找到匹配的结果，试试其他关键词'
                    : '快来发布第一条动态吧！'}
                </p>
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
                >
                  <Feather className="w-4 h-4" />
                  发布动态
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="posts"
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
              >
                {displayedPosts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={i}
                    onTagClick={handleTagClick}
                    activity={getActivityForPost(post)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={loadMoreRef} className="h-20 mt-4">
            <AnimatePresence>
              {isLoadingMore && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
                >
                  <SkeletonCard />
                  <SkeletonCard />
                </motion.div>
              )}
            </AnimatePresence>
            {!isLoadingMore && visibleCount >= filteredPosts.length && filteredPosts.length > 0 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 text-xs text-ink-400">
                  <div className="w-12 h-px bg-ink-200" />
                  <span>已加载全部 {filteredPosts.length} 条动态</span>
                  <div className="w-12 h-px bg-ink-200" />
                </div>
              </div>
            )}
          </div>
        </main>

          <aside className="space-y-4">
            <div className="sticky top-[340px]">
              <RightSidebar
                user={user}
                posts={posts}
                challenges={challenges}
                onJoinChallenge={handleJoinChallenge}
              />
            </div>
          </aside>
        </div>
      </div>

      <div className="xl:hidden fixed bottom-5 right-5 z-20">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsPostModalOpen(true)}
          className="w-14 h-14 rounded-full bg-brand-gradient shadow-brand-glow flex items-center justify-center text-white"
        >
          <Feather className="w-6 h-6" />
        </motion.button>
      </div>

      <div className="md:hidden mt-5 space-y-4">
        <LeftSidebar
          user={user}
          activeTag={activeTag}
          onTagClick={handleTagClick}
          onOpenPostModal={() => setIsPostModalOpen(true)}
        />
      </div>

      <div className="xl:hidden lg:hidden mt-5">
        <RightSidebar
          user={user}
          posts={posts}
          challenges={challenges}
          onJoinChallenge={handleJoinChallenge}
        />
      </div>

      <PostModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={handleSubmitPost}
        activities={activities}
        user={user}
      />

      <AnimatePresence>
        {activeTab !== 'recommend' && !activeTag && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500"
          >
            {activeTab === 'follow' && (
              <>
                <Users className="w-3.5 h-3.5 text-teal-500" />
                <span>仅显示已关注用户的动态</span>
              </>
            )}
            {activeTab === 'nearby' && (
              <>
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>仅显示带位置信息的动态</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
