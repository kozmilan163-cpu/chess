import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, Crown, Zap, Trophy, Users, TrendingUp, Search } from 'lucide-react';
import { Chess } from 'chess.js';
import { SkeletonFeed } from './Skeleton';

interface Post {
  id: string;
  pgn: string;
  fen?: string;
  author: string;
  authorAvatar?: string;
  comment: string;
  likes: number;
  timestamp: number;
  comments?: Array<{ id: string; author: string; text: string; timestamp: number }>;
  result?: 'win' | 'loss' | 'draw';
  opening?: string;
  tags?: string[];
  views?: number;
}

interface UserSuggestion {
  username: string;
  rating: number;
  isOnline?: boolean;
  isFollowing?: boolean;
}

function avatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ name, size = 'md', isOnline, showRing }: { name: string; size?: 'sm' | 'md' | 'lg'; isOnline?: boolean; showRing?: boolean }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-white font-bold ${showRing ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''}`}>
        {initials}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
      )}
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function StoryBubble({ name, isActive, isOnline }: { name: string; isActive?: boolean; isOnline?: boolean }) {
  return (
    <button className="flex flex-col items-center gap-1.5 min-w-[72px] group">
      <div className={`p-[2px] rounded-full ${isActive ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <div className="p-[2px] bg-white dark:bg-slate-900 rounded-full">
          <Avatar name={name} size="lg" isOnline={isOnline} />
        </div>
      </div>
      <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[72px] group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
        {name}
      </span>
    </button>
  );
}

const TAG_COLORS: Record<string, string> = {
  tactic: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  endgame: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  opening: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  brilliant: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  mate: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [filter, setFilter] = useState<'explore' | 'following' | 'mine'>('explore');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions([
      { username: 'MagnusFan', rating: 2450, isOnline: true },
      { username: 'TacticMaster', rating: 1890, isOnline: true },
      { username: 'EndgamePro', rating: 2100, isOnline: false },
      { username: 'BlitzKing', rating: 1750, isOnline: true },
      { username: 'PuzzleQueen', rating: 1920, isOnline: false },
    ]);
  }, []);

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      // Load from localStorage (static build)
      const stored = JSON.parse(localStorage.getItem("chess_social_feed") || "[]");
      const perPage = 10;
      const start = (pageNum - 1) * perPage;
      const slice = stored.slice(start, start + perPage);
      if (pageNum === 1) setPosts(slice.length ? slice : []);
      else setPosts(prev => [...prev, ...slice]);
      setHasMore(slice.length >= perPage);
      if (slice.length === 0 && pageNum === 1) throw new Error("no posts");
      setLoading(false); return;
    } catch {
      const demoPosts: Post[] = Array.from({ length: 5 }, (_, i) => ({
        id: `demo-${pageNum}-${i}`,
        pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7',
        author: ['MagnusFan', 'TacticMaster', 'EndgamePro', 'BlitzKing', 'PuzzleQueen'][i],
        comment: ['Brilliant sacrifice in the middlegame!', 'Found this beautiful mate in 3', 'Endgame technique that wins', 'Fastest blitz win ever', 'Daily puzzle streak day 45'][i],
        likes: Math.floor(Math.random() * 200) + 10,
        timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 7),
        result: ['win', 'win', 'draw', 'win', 'loss'][i] as any,
        opening: ['Ruy Lopez', 'Sicilian', 'Queen\'s Gambit', 'King\'s Indian', 'Caro-Kann'][i],
        tags: [['tactic', 'brilliant'], ['mate', 'tactic'], ['endgame'], ['brilliant'], ['opening']][i],
        views: Math.floor(Math.random() * 1000) + 50,
      }));
      if (pageNum === 1) setPosts(demoPosts);
      else setPosts(prev => [...prev, ...demoPosts]);
      setHasMore(pageNum < 3);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchPosts(1);
  }, [filter, fetchPosts]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => p + 1);
        fetchPosts(page + 1);
      }
    });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, page, fetchPosts]);

  const handleLike = (postId: string) => {
    setLikedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + (likedPosts.includes(postId) ? -1 : 1) } : p));
  };

  const handleSave = (postId: string) => {
    setSavedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  };

  const handleComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: [...(p.comments || []), { id: Date.now().toString(), author: 'You', text, timestamp: Date.now() }]
    } : p));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = searchQuery
    ? posts.filter(p => p.author.toLowerCase().includes(searchQuery.toLowerCase()) || p.comment.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts;

  const resultBadge = (result?: string) => {
    if (result === 'win') return <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">WIN</span>;
    if (result === 'loss') return <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">LOSS</span>;
    if (result === 'draw') return <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">DRAW</span>;
    return null;
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="text-indigo-500" size={22} />
            Social Feed
          </h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Search size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {showSearch && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search posts, players, openings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
        )}

        {/* Stories / Active Players */}
        <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          <StoryBubble name="Your Story" isActive />
          {suggestions.slice(0, 5).map(u => (
            <StoryBubble key={u.username} name={u.username} isOnline={u.isOnline} />
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {(['explore', 'following', 'mine'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'explore' && <TrendingUp size={14} className="inline mr-1" />}
              {f === 'following' && <Users size={14} className="inline mr-1" />}
              {f === 'mine' && <Crown size={14} className="inline mr-1" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Players (when explore) */}
      {filter === 'explore' && !searchQuery && (
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
            <Zap size={14} /> Suggested Players
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {suggestions.map(u => (
              <div key={u.username} className="flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 w-40">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={u.username} size="sm" isOnline={u.isOnline} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.username}</p>
                    <p className="text-xs text-slate-500">{u.rating} Elo</p>
                  </div>
                </div>
                <button className="w-full py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="px-4 space-y-4 pb-4">
        {loading && page === 1 ? (
          <SkeletonFeed count={3} />
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <Share2 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No posts yet. Share your first game!</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <SocialPostItem
              key={post.id}
              post={post}
              likedPosts={likedPosts}
              savedPosts={savedPosts}
              handleLike={handleLike}
              handleSave={handleSave}
              handleComment={handleComment}
              commentInputs={commentInputs}
              setCommentInputs={setCommentInputs}
              currentUsername="You"
            />
          ))
        )}

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {loading && page > 1 && <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />}
        </div>
      </div>
    </div>
  );
}

function SocialPostItem({ post, likedPosts, savedPosts, handleLike, handleSave, handleComment, commentInputs, setCommentInputs, currentUsername }: any) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const game = new Chess();
    const moves = post.pgn.split(' ').filter((m: string) => !m.includes('.') && m.length > 1);
    const hist: any[] = [];
    hist.push({ fen: game.fen(), move: '' });
    for (const move of moves) {
      try { game.move(move); hist.push({ fen: game.fen(), move }); } catch { break; }
    }
    setHistory(hist);
  }, [post.pgn]);

  const currentFen = history[moveIndex]?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const onDoubleTap = () => {
    setHeartAnim(true);
    handleLike(post.id);
    setTimeout(() => setHeartAnim(false), 800);
  };

  const shareOptions = [
    { label: 'Copy Link', icon: '🔗', action: () => navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`) },
    { label: 'Share to Feed', icon: '↗️', action: () => { /* repost */ } },
    { label: 'Challenge Rematch', icon: '⚔️', action: () => { /* navigate to game setup with opponent */ } },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar name={post.author} isOnline />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{post.author}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{timeAgo(post.timestamp)}</span>
              {post.opening && <span>· {post.opening}</span>}
              {post.views && <span>· {post.views} views</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {resultBadge(post.result)}
          <button
            onClick={() => setShowShareModal(!showShareModal)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
          >
            <MoreHorizontal size={18} className="text-slate-500 dark:text-slate-400" />
            {showShareModal && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 min-w-[160px] py-1">
                {shareOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => { opt.action(); setShowShareModal(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <span>{opt.icon}</span> {opt.label}
                  </button>
                ))}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {post.tags.map((tag: string) => (
            <span key={tag} className={`text-xs font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Caption */}
      <p className="px-4 pb-3 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
        {post.comment}
      </p>

      {/* Board */}
      <div className="relative bg-slate-50 dark:bg-slate-900/50" onDoubleClick={onDoubleTap}>
        <div className="max-w-[400px] mx-auto p-4">
          <Chessboard position={currentFen} boardWidth={360} areArrowsAllowed={false} />
        </div>

        {/* Heart animation */}
        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart size={80} className="text-rose-500 fill-rose-500 animate-bounce" />
          </div>
        )}

        {/* Move Navigator */}
        {history.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full px-3 py-1.5 shadow-sm border border-slate-200 dark:border-slate-700">
            <button onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" disabled={moveIndex === 0}>
              <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
            </button>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 min-w-[60px] text-center">
              {moveIndex} / {history.length - 1}
            </span>
            <button onClick={() => setMoveIndex(Math.min(history.length - 1, moveIndex + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" disabled={moveIndex >= history.length - 1}>
              <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-5">
          <button
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-1.5 transition-all ${likedPosts.includes(post.id) ? 'text-rose-500 scale-110' : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'}`}
          >
            <Heart size={22} className={likedPosts.includes(post.id) ? 'fill-rose-500' : ''} />
            <span className="text-sm font-semibold">{post.likes}</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-colors">
            <MessageSquare size={22} />
            <span className="text-sm font-semibold">{post.comments?.length || 0}</span>
          </button>
          <button
            onClick={() => handleSave(post.id)}
            className={`transition-colors ${savedPosts.includes(post.id) ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'}`}
          >
            <Bookmark size={22} className={savedPosts.includes(post.id) ? 'fill-amber-500' : ''} />
          </button>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      {/* Comments */}
      {(post.comments?.length || 0) > 0 && (
        <div className="px-4 pb-3 space-y-2">
          {(showAllComments ? post.comments : post.comments?.slice(0, 2)).map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <Avatar name={c.author} size="sm" />
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.author}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{c.text}</p>
              </div>
            </div>
          ))}
          {(post.comments?.length || 0) > 2 && !showAllComments && (
            <button onClick={() => setShowAllComments(true)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
              View all {post.comments.length} comments
            </button>
          )}
        </div>
      )}

      {/* Comment Input */}
      <div className="px-4 pb-4 flex gap-2">
        <Avatar name={currentUsername} size="sm" />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={commentInputs[post.id] || ''}
            onChange={e => setCommentInputs((prev: any) => ({ ...prev, [post.id]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {commentInputs[post.id] && (
            <button
              onClick={() => handleComment(post.id)}
              className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Post
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


