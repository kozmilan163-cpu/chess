import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, Crown, Zap, Trophy } from 'lucide-react';
import { Chess } from 'chess.js';

interface Post {
  id: string;
  pgn: string;
  fen?: string;
  author: string;
  comment: string;
  likes: number;
  timestamp: number;
  comments?: Array<{ id: string; author: string; text: string; timestamp: number }>;
  result?: 'win' | 'loss' | 'draw';
  opening?: string;
}

// Generate a consistent avatar color from username
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

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center font-bold text-white flex-shrink-0 shadow`}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Story bubble component
function StoryBubble({ name, isActive }: { name: string; isActive?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
      <div className={`p-[2px] rounded-full ${isActive ? 'bg-gradient-to-tr from-blue-500 via-violet-500 to-pink-500' : 'bg-slate-200'}`}>
        <div className="p-[2px] bg-white rounded-full">
          <Avatar name={name} size="md" />
        </div>
      </div>
      <span className="text-[11px] text-slate-500 font-medium truncate w-14 text-center">{name}</span>
    </div>
  );
}

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [filter, setFilter] = useState<'explore' | 'following' | 'mine'>('explore');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const currentUsername = JSON.parse(localStorage.getItem('chess_profile') || '{}').username || 'Player';
  const following: string[] = JSON.parse(localStorage.getItem('chess_following') || '[]');

  useEffect(() => {
    fetchFeed();
    const savedLikes = localStorage.getItem('chess_likes');
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));
    const saved = localStorage.getItem('chess_saved');
    if (saved) setSavedPosts(JSON.parse(saved));
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/social/feed');
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    const isLiked = likedPosts.includes(id);
    const newLikes = isLiked ? likedPosts.filter(p => p !== id) : [...likedPosts, id];
    setLikedPosts(newLikes);
    localStorage.setItem('chess_likes', JSON.stringify(newLikes));
    setPosts(posts.map(p => p.id === id ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p));
    try {
      await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, unlike: isLiked })
      });
    } catch (e) {}
  };

  const handleSave = (id: string) => {
    const isSaved = savedPosts.includes(id);
    const next = isSaved ? savedPosts.filter(p => p !== id) : [...savedPosts, id];
    setSavedPosts(next);
    localStorage.setItem('chess_saved', JSON.stringify(next));
  };

  const handleComment = async (id: string) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;
    const newComment = { id: Math.random().toString(36).substring(7), author: currentUsername, text, timestamp: Date.now() };
    setPosts(posts.map(p => p.id === id ? { ...p, comments: [...(p.comments || []), newComment] } : p));
    setCommentInputs({ ...commentInputs, [id]: '' });
    try {
      await fetch('/api/social/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, author: currentUsername, text })
      });
    } catch (e) {}
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'mine') return p.author === currentUsername;
    if (filter === 'following') return following.includes(p.author);
    return true;
  });

  // Get unique active users for stories
  const storyUsers = [...new Set(posts.map(p => p.author))].slice(0, 8);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-full bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium text-sm">Loading feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Social <span className="text-blue-600">Chess</span>
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <Share2 size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stories Row */}
      {storyUsers.length > 0 && (
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
              <StoryBubble name={currentUsername} isActive={false} />
              {storyUsers.filter(u => u !== currentUsername).map(u => (
                <StoryBubble key={u} name={u} isActive={true} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-[57px] z-10">
        <div className="max-w-lg mx-auto flex">
          {(['explore', 'following', 'mine'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-3 text-sm font-bold capitalize transition-all border-b-2 ${
                filter === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab === 'mine' ? 'My Posts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto pb-8">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
              <Crown size={36} className="text-slate-300" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg">No games here yet</p>
              <p className="text-slate-400 text-sm mt-1">
                {filter === 'following' ? 'Follow players to see their games' : 'Play a game and share it to the feed!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPosts.map(post => (
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
                currentUsername={currentUsername}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialPostItem({ post, likedPosts, savedPosts, handleLike, handleSave, handleComment, commentInputs, setCommentInputs, currentUsername }: any) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const lastTap = useRef(0);

  useEffect(() => {
    try {
      const chess = new Chess();
      if (post.pgn) {
        chess.loadPgn(post.pgn);
        const hist = chess.history({ verbose: true });
        setHistory(hist);
        if (post.fen) {
          const fenIndex = hist.findIndex((m: any) => m.after === post.fen || m.before === post.fen);
          setMoveIndex(fenIndex !== -1 ? fenIndex + 1 : hist.length);
        } else {
          setMoveIndex(hist.length);
        }
      }
    } catch (e) {}
  }, [post.pgn, post.fen]);

  const currentFen = React.useMemo(() => {
    if (history.length === 0) return post.fen || 'start';
    if (moveIndex === 0) return 'start';
    if (moveIndex > history.length) return history[history.length - 1].after;
    return history[moveIndex - 1].after;
  }, [history, moveIndex, post.fen]);

  const hasMoves = history.length > 0;
  const isLiked = likedPosts.includes(post.id);
  const isSaved = savedPosts.includes(post.id);
  const visibleComments = showAllComments ? (post.comments || []) : (post.comments || []).slice(-2);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) {
        handleLike(post.id);
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 800);
      }
    }
    lastTap.current = now;
  };

  const resultBadge = post.result === 'win'
    ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><Trophy size={10} /> Win</span>
    : post.result === 'loss'
    ? <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Loss</span>
    : post.result === 'draw'
    ? <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Zap size={10} /> Draw</span>
    : null;

  return (
    <div className="bg-white">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.author} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">@{post.author}</span>
              {resultBadge}
            </div>
            <span className="text-xs text-slate-400">{timeAgo(post.timestamp)}</span>
          </div>
        </div>
        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <MoreHorizontal size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Caption */}
      {post.comment && (
        <div className="px-4 pb-2 text-sm text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">@{post.author} </span>
          {post.comment}
        </div>
      )}

      {/* Chessboard */}
      <div
        className="relative bg-slate-900 cursor-pointer select-none"
        onClick={handleDoubleTap}
      >
        <div className="max-w-sm mx-auto py-4 px-4">
          <div className="rounded-xl overflow-hidden shadow-2xl">
            <Chessboard
              showBoardNotation={false}
              position={currentFen}
              arePiecesDraggable={false}
              animationDuration={150}
            />
          </div>
        </div>

        {/* Double-tap heart animation */}
        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart size={80} className="text-white fill-white opacity-90 animate-ping" />
          </div>
        )}

        {/* Move navigator */}
        {hasMoves && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setMoveIndex(Math.max(0, moveIndex - 1)); }}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              {moveIndex}/{history.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setMoveIndex(Math.min(history.length, moveIndex + 1)); }}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleLike(post.id)}
            className="flex items-center gap-1.5 transition-transform active:scale-90"
          >
            <Heart
              size={24}
              className={`transition-all duration-200 ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-700 hover:text-slate-900'}`}
            />
          </button>
          <button className="flex items-center gap-1.5">
            <MessageSquare size={24} className="text-slate-700 hover:text-slate-900 transition-colors" />
          </button>
          <button className="flex items-center gap-1.5">
            <Share2 size={22} className="text-slate-700 hover:text-slate-900 transition-colors" />
          </button>
        </div>
        <button onClick={() => handleSave(post.id)}>
          <Bookmark
            size={24}
            className={`transition-all duration-200 ${isSaved ? 'fill-slate-800 text-slate-800' : 'text-slate-700 hover:text-slate-900'}`}
          />
        </button>
      </div>

      {/* Likes count */}
      <div className="px-4 pb-1">
        <span className="font-bold text-sm text-slate-900">{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
      </div>

      {/* Comments */}
      <div className="px-4 pb-3">
        {post.comments && post.comments.length > 2 && !showAllComments && (
          <button
            onClick={() => setShowAllComments(true)}
            className="text-sm text-slate-400 hover:text-slate-600 font-medium mb-1 transition-colors"
          >
            View all {post.comments.length} comments
          </button>
        )}
        <div className="space-y-1">
          {visibleComments.map((c: any) => (
            <div key={c.id} className="text-sm">
              <span className="font-bold text-slate-900">@{c.author} </span>
              <span className="text-slate-600">{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      <div className="px-4 pb-4 flex items-center gap-3 border-t border-slate-50 pt-3">
        <Avatar name={currentUsername} size="sm" />
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-blue-400 transition-colors">
          <input
            type="text"
            value={commentInputs[post.id] || ''}
            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          {commentInputs[post.id] && (
            <button
              onClick={() => handleComment(post.id)}
              className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors"
            >
              Post
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
