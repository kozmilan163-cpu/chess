import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Heart, MessageSquare, Share2, ChevronLeft, ChevronRight, Clock, UserPlus, UserCheck } from 'lucide-react';
import { RankBadge } from './RankBadge';
import { Chess } from 'chess.js';

interface Post {
  id: string;
  pgn: string;
  fen?: string;
  author: string;
  authorAvatar?: string;
  authorRating?: number;
  comment: string;
  likes: number;
  timestamp: number;
  comments?: Array<{ id: string; author: string; text: string; timestamp: number }>;
}

// Generate avatar color from username hash
const getAvatarColor = (username: string): string => {
  const colors = ['from-red-400 to-pink-500', 'from-blue-400 to-indigo-500', 'from-green-400 to-emerald-500', 'from-yellow-400 to-orange-500', 'from-purple-400 to-pink-500', 'from-cyan-400 to-blue-500'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
};

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'following'>('all');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [followingPlayers, setFollowingPlayers] = useState<string[]>([]);

  const currentUsername = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('chess_profile') || '{}').username || 'Player' : 'Player';

  const toggleFollow = (playerUsername: string) => {
    let newFollowing = followingPlayers.includes(playerUsername)
      ? followingPlayers.filter(u => u !== playerUsername)
      : [...followingPlayers, playerUsername];
    
    setFollowingPlayers(newFollowing);
    localStorage.setItem('chess_following', JSON.stringify(newFollowing));
  };

  useEffect(() => {
    fetchFeed();
    const savedLikes = localStorage.getItem('chess_likes');
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));
    
    const savedFollowing = localStorage.getItem('chess_following');
    if (savedFollowing) setFollowingPlayers(JSON.parse(savedFollowing));
  }, []);

  const fetchFeed = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('chess_social_feed') || '[]');
      setPosts(stored.length > 0 ? stored : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (id: string) => {
    const isLiked = likedPosts.includes(id);
    const newLikes = isLiked ? likedPosts.filter(postId => postId !== id) : [...likedPosts, id];
    
    setLikedPosts(newLikes);
    localStorage.setItem('chess_likes', JSON.stringify(newLikes));
    
    setPosts(posts.map(p => 
      p.id === id ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p
    ));
  };

  const handleComment = (id: string) => {
    const text = commentInputs[id];
    if (!text) return;

    const newComment = {
      id: Math.random().toString(36).substring(7),
      author: currentUsername,
      text,
      timestamp: Date.now()
    };
    
    setPosts(posts.map(p => 
      p.id === id ? { ...p, comments: [...(p.comments || []), newComment] } : p
    ));
    setCommentInputs({ ...commentInputs, [id]: '' });
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'mine') return p.author === currentUsername;
    if (filter === 'following') return followingPlayers.includes(p.author);
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="animate-pulse text-center">
        <div className="text-4xl mb-4">♟</div>
        <p>Loading feed...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-6 text-center">Chess Feed</h1>
          
          {/* Story Bubbles */}
          {posts.length > 0 && (
            <div className="mb-6 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {[...new Set(posts.map(p => p.author))].slice(0, 8).map(author => (
                <button 
                  key={author}
                  className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(author)} flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-110 transition-transform border-2 border-white dark:border-slate-800 relative`}
                  title={`@${author}`}
                >
                  {author.charAt(0).toUpperCase()}
                  <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-br from-blue-400 to-indigo-600 opacity-0 hover:opacity-10 transition-opacity"></div>
                </button>
              ))}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {['all', 'mine', 'following'].map(tab => (
              <button 
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  filter === tab 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {tab === 'all' ? '🌍 Explore' : tab === 'mine' ? '👤 My Posts' : '💙 Following'}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">♟</div>
            <p className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
              {filter === 'all' ? 'No games yet!' : filter === 'mine' ? 'You haven\'t shared any games' : 'No posts from players you follow'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              {filter === 'all' ? 'Play a game and share it to start the feed.' : 'Share your first game!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map(post => (
              <SocialPostCard 
                key={post.id} 
                post={post} 
                likedPosts={likedPosts} 
                handleLike={handleLike} 
                handleComment={handleComment} 
                commentInputs={commentInputs} 
                setCommentInputs={setCommentInputs} 
                currentUsername={currentUsername}
                isFollowing={followingPlayers.includes(post.author)}
                onToggleFollow={() => toggleFollow(post.author)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialPostCard({ post, likedPosts, handleLike, handleComment, commentInputs, setCommentInputs, currentUsername, isFollowing, onToggleFollow }: any) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    try {
      const chess = new Chess();
      if (post.pgn) {
        chess.loadPgn(post.pgn);
        const hist = chess.history({ verbose: true });
        setHistory(hist);
        
        if (post.fen) {
          const fenIndex = hist.findIndex(m => m.after === post.fen || m.before === post.fen);
          setMoveIndex(fenIndex !== -1 ? fenIndex + 1 : hist.length);
        } else {
          setMoveIndex(hist.length);
        }
      }
    } catch(e) {}
  }, [post.pgn, post.fen]);

  const currentFen = React.useMemo(() => {
    if (history.length === 0) return post.fen || 'start';
    if (moveIndex === 0) return 'start';
    if (moveIndex > history.length) return history[history.length - 1].after;
    return history[moveIndex - 1].after;
  }, [history, moveIndex, post.fen]);

  const hasMoves = history.length > 0;
  const isLiked = likedPosts.includes(post.id);

  const handleDoubleClick = () => {
    if (!isLiked) {
      handleLike(post.id);
      setShowLikeAnimation(true);
      if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
      likeTimeoutRef.current = setTimeout(() => setShowLikeAnimation(false), 800);
    }
  };

  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-300 transition-all hover:shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(post.author)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
            {post.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-lg text-slate-900 dark:text-slate-100">@{post.author}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(post.timestamp)}
            </div>
          </div>
        </div>
        {post.author !== currentUsername && (
          <button 
            onClick={onToggleFollow}
            className={`ml-2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isFollowing 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck size={12} /> Following
              </>
            ) : (
              <>
                <UserPlus size={12} /> Follow
              </>
            )}
          </button>
        )}
      </div>

      {/* Caption */}
      {post.comment && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
          "{post.comment}"
        </div>
      )}

      {/* Chess Board */}
      <div className="relative p-6 flex flex-col items-center bg-slate-100 dark:bg-slate-900 group" onDoubleClick={handleDoubleClick}>
        <div className="w-full max-w-[300px] flex flex-col items-center">
          <div className="w-full rounded-lg overflow-hidden shadow-xl mb-4 ring-2 ring-slate-300 dark:ring-slate-600">
            <Chessboard 
              showBoardNotation={false} 
              position={currentFen} 
              arePiecesDraggable={false} 
              animationDuration={1}
              customBoardStyle={{backgroundColor: '#f1f5f9'}}
            />
          </div>
          
          {/* Move Counter */}
          {hasMoves && (
            <div className="flex items-center justify-center gap-4 w-full">
              <button 
                onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))}
                className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-12 text-center">
                {moveIndex} / {history.length}
              </span>
              <button 
                onClick={() => setMoveIndex(Math.min(history.length, moveIndex + 1))}
                className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Double-Tap Like Animation */}
        {showLikeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart 
              size={80} 
              className="text-red-500 fill-red-500 animate-ping" 
              style={{animation: 'ping 0.6s cubic-bezier(0, 0, 0.2, 1) 1'}}
            />
          </div>
        )}
      </div>

      {/* Engagement Bar */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-6">
        <button 
          onClick={() => handleLike(post.id)}
          className="flex items-center gap-2 font-bold transition-all transform hover:scale-110"
        >
          <Heart 
            size={22} 
            className={`transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-125' : 'text-slate-400 dark:text-slate-500 hover:text-red-500'}`}
          />
          <span className={isLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}>{post.likes}</span>
        </button>
        
        <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
          <MessageSquare size={22} />
          <span>{post.comments?.length || 0}</span>
        </div>

        <button className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-semibold text-sm transition-colors">
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Comments Section */}
      <div className="space-y-3 bg-slate-50 dark:bg-slate-700/50 p-4">
        {post.comments && post.comments.length > 0 && (
          <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
            {post.comments.map(c => (
              <div key={c.id} className="text-sm">
                <span className="font-bold text-blue-600 dark:text-blue-400">@{c.author}</span>
                <span className="text-slate-700 dark:text-slate-300 ml-2">{c.text}</span>
                <div className="text-xs text-slate-500 dark:text-slate-500 ml-0 mt-1">{timeAgo(c.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={commentInputs[post.id] || ''}
            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
            placeholder="Add a comment..."
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all"
          />
          <button 
            onClick={() => handleComment(post.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold text-sm rounded-lg transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
