import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Heart, MessageSquare, Share2, MoreVertical } from 'lucide-react';
import { Chess, Move } from 'chess.js';

interface Post {
  id: string;
  pgn: string;
  fen?: string;
  author: string;
  avatar?: string;
  comment: string;
  likes: number;
  timestamp: number;
  comments?: Array<{ id: string; author: string; text: string; timestamp: number }>;
}

interface UserProfile {
  username: string;
  avatar?: string;
}

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'following'>('all');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);

  const profileData = JSON.parse(localStorage.getItem('chess_profile') || '{}');
  const currentUsername = profileData.username || 'Player';
  const currentAvatar = profileData.avatar;

  useEffect(() => {
    fetchFeed();
    fetchActiveUsers();
    const savedLikes = localStorage.getItem('chess_likes');
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/social/feed');
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const res = await fetch('/api/social/active-users');
      const data = await res.json();
      setActiveUsers(data);
    } catch (e) {
      setActiveUsers([]);
    }
  };

  const handleLike = async (id: string) => {
    const isLiked = likedPosts.includes(id);
    const newLikes = isLiked 
      ? likedPosts.filter(postId => postId !== id) 
      : [...likedPosts, id];
      
    setLikedPosts(newLikes);
    localStorage.setItem('chess_likes', JSON.stringify(newLikes));
    setPosts(posts.map(p => p.id === id ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p));

    try {
      await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, unlike: isLiked })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (id: string) => {
    const text = commentInputs[id];
    if (!text) return;

    const newCommentLocal = {
      id: Math.random().toString(36).substring(7),
      author: currentUsername,
      text,
      timestamp: Date.now()
    };
    
    setPosts(posts.map(p => p.id === id ? { ...p, comments: [...(p.comments || []), newCommentLocal] } : p));
    setCommentInputs({ ...commentInputs, [id]: '' });

    try {
      await fetch('/api/social/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, author: currentUsername, text })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPosts = filter === 'all' 
    ? posts 
    : filter === 'mine'
    ? posts.filter(p => p.author === currentUsername)
    : posts;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 font-medium">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">Chess</h1>
            <div className="flex gap-3">
              <button className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                <div className="w-6 h-6 relative"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeUsers.length > 0 && (
        <div className="border-b border-slate-200 bg-white overflow-x-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 flex gap-4">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                +
              </div>
              <p className="text-xs font-medium text-slate-700 text-center w-14">Your story</p>
            </div>
            {activeUsers.map((user, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-blue-600 flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-white font-bold overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{user.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-700 text-center w-16 truncate">{user.username}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky top-14 z-30 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-8">
            <button 
              onClick={() => setFilter('all')}
              className={`py-3 px-1 font-semibold text-sm border-b-2 transition-colors ${
                filter === 'all' 
                  ? 'border-slate-900 text-slate-900' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Explore
            </button>
            <button 
              onClick={() => setFilter('following')}
              className={`py-3 px-1 font-semibold text-sm border-b-2 transition-colors ${
                filter === 'following' 
                  ? 'border-slate-900 text-slate-900' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Following
            </button>
            <button 
              onClick={() => setFilter('mine')}
              className={`py-3 px-1 font-semibold text-sm border-b-2 transition-colors ${
                filter === 'mine' 
                  ? 'border-slate-900 text-slate-900' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              My Posts
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 px-4">
            <div className="text-6xl mb-4">♟️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {filter === 'all' ? 'No games shared yet' : filter === 'mine' ? 'Share your first game' : 'Follow players to see their games'}
            </h2>
            <p className="text-slate-600 text-center max-w-sm mb-6">
              {filter === 'all' 
                ? 'Play a game and share it to the feed to get started!' 
                : filter === 'mine'
                ? 'Finish a game and tap Share to post it here.'
                : 'Find players you enjoy watching and follow them.'}
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-colors">
              {filter === 'all' ? 'Play Now' : filter === 'mine' ? 'Start Game' : 'Explore Players'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredPosts.map(post => (
              <SocialPostItem 
                key={post.id} 
                post={post} 
                likedPosts={likedPosts} 
                handleLike={handleLike} 
                handleComment={handleComment} 
                commentInputs={commentInputs} 
                setCommentInputs={setCommentInputs} 
                currentUsername={currentUsername} 
                currentAvatar={currentAvatar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialPostItem({ 
  post, 
  likedPosts, 
  handleLike, 
  handleComment, 
  commentInputs, 
  setCommentInputs, 
  currentUsername,
  currentAvatar
}: any) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const isLiked = likedPosts.includes(post.id);

  useEffect(() => {
    try {
      const chess = new Chess();
      if (post.pgn) {
        chess.loadPgn(post.pgn);
        const hist = chess.history({ verbose: true });
        setHistory(hist);
        
        if (post.fen) {
          const fenIndex = hist.findIndex(m => m.after === post.fen || m.before === post.fen);
          if (fenIndex !== -1) {
            setMoveIndex(fenIndex + 1);
          } else {
            setMoveIndex(hist.length);
          }
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
  const timeAgo = getTimeAgo(post.timestamp);

  return (
    <div className="bg-white py-4">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-blue-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
            {post.avatar ? (
              <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
            ) : (
              <span>{post.author.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{post.author}</p>
            <p className="text-xs text-slate-500">{timeAgo}</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
          <MoreVertical size={20} className="text-slate-600" />
        </button>
      </div>

      {post.comment && (
        <div className="px-4 py-2">
          <p className="text-slate-900 text-sm leading-relaxed">
            <span className="font-semibold">{post.author}</span> {post.comment}
          </p>
        </div>
      )}

      <div className="w-full aspect-square bg-slate-100 flex flex-col items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm">
          <div className="w-full aspect-square rounded-lg overflow-hidden shadow-lg bg-white">
            <Chessboard 
              showBoardNotation={false} 
              position={currentFen} 
              arePiecesDraggable={false} 
              animationDuration={200}
            />
          </div>

          {hasMoves && (
            <div className="flex gap-3 items-center justify-center mt-4">
              <button 
                onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))}
                className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold transition-colors"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-slate-700 w-20 text-center">
                {moveIndex} / {history.length}
              </span>
              <button 
                onClick={() => setMoveIndex(Math.min(history.length, moveIndex + 1))}
                className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold transition-colors"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-slate-200">
        <div className="flex gap-6 mb-3">
          <button 
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-2 font-semibold text-sm transition-colors ${
              isLiked 
                ? 'text-red-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart 
              size={20} 
              className={isLiked ? 'fill-red-600' : ''}
            />
            <span>{post.likes}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 font-semibold text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <MessageSquare size={20} />
            <span>{post.comments?.length || 0}</span>
          </button>
          <button className="flex items-center gap-2 font-semibold text-sm text-slate-600 hover:text-slate-900 transition-colors">
            <Share2 size={20} />
          </button>
        </div>

        {post.likes > 0 && (
          <p className="text-sm font-semibold text-slate-900 mb-3">
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </p>
        )}
      </div>

      {showComments && (
        <div className="px-4 py-3 border-t border-slate-200">
          <div className="space-y-3 mb-4">
            {post.comments && post.comments.map(c => (
              <div key={c.id} className="text-sm">
                <span className="font-semibold text-slate-900">{c.author}</span>
                <span className="text-slate-700 ml-2">{c.text}</span>
                <p className="text-xs text-slate-500 mt-1">{getTimeAgo(c.timestamp)}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                value={commentInputs[post.id] || ''}
                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {commentInputs[post.id] && (
                <button 
                  onClick={() => handleComment(post.id)}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                >
                  Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(timestamp).toLocaleDateString();
}
