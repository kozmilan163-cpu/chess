import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Heart, MessageSquare } from 'lucide-react';
import { Chess, Move } from 'chess.js';

interface Post {
  id: string;
  pgn: string;
  fen?: string;
  author: string;
  comment: string;
  likes: number;
  timestamp: number;
  comments?: Array<{ id: string; author: string; text: string; timestamp: number }>;
}

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const currentUsername = JSON.parse(localStorage.getItem('chess_profile') || '{}').username || 'Player';

  useEffect(() => {
    fetchFeed();
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
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    const isLiked = likedPosts.includes(id);
    
    const newLikes = isLiked 
      ? likedPosts.filter(postId => postId !== id) 
      : [...likedPosts, id];
      
    // Optimistic UI update
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
    
    // Optimistic UI update
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
    : posts.filter(p => p.author === currentUsername);

  if (loading) {
    return <div className="flex justify-center items-center min-h-full bg-slate-50 text-slate-900">Loading...</div>;
  }

  const getDisplayPosition = (post: Post) => {
    if (post.fen) return post.fen;
    try {
      const chess = new Chess();
      chess.loadPgn(post.pgn);
      return chess.fen();
    } catch(e) {
      return 'start';
    }
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-4 text-center text-slate-900">Social Feed</h1>
        
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-2xl font-bold transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-500 hover:text-white'}`}
          >
            Explore
          </button>
          <button 
            onClick={() => setFilter('mine')}
            className={`px-6 py-2 rounded-2xl font-bold transition-all ${filter === 'mine' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-500 hover:text-white'}`}
          >
            My Feed
          </button>
        </div>
        
        {filteredPosts.length === 0 ? (
          <div className="text-center font-medium text-slate-500 bg-white p-8 rounded-2xl shadow border border-slate-200">
            {filter === 'all' ? "No games shared yet. Play a game and share it!" : "You haven't shared any games yet."}
          </div>
        ) : (
          <div className="space-y-8">
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
               />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialPostItem({ post, likedPosts, handleLike, handleComment, commentInputs, setCommentInputs, currentUsername }: any) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

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

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div className="font-bold text-lg text-blue-600">@{post.author}</div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{new Date(post.timestamp).toLocaleDateString()}</div>
      </div>
      
      {post.comment && (
        <div className="p-4 text-slate-600 font-medium leading-relaxed italic">
          "{post.comment}"
        </div>
      )}
      
      <div className="p-6 flex flex-col items-center justify-center bg-slate-100 relative group">
        <div className="w-full max-w-[300px] flex flex-col items-center">
          <div className="w-full rounded overflow-hidden shadow-xl mb-4">
            <Chessboard showBoardNotation={false} position={currentFen} arePiecesDraggable={false} animationDuration={1} />
          </div>
          {hasMoves && (
            <div className="flex gap-2 w-full justify-center">
               <button onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold">&larr;</button>
               <span className="text-sm font-bold w-16 text-center pt-1.5">{moveIndex} / {history.length}</span>
               <button onClick={() => setMoveIndex(Math.min(history.length, moveIndex + 1))} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold">&rarr;</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-200 flex flex-col gap-4">
        <div className="flex gap-6">
          <button 
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-2 font-bold transition-all ${likedPosts.includes(post.id) ? "text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Heart size={20} className={likedPosts.includes(post.id) ? "fill-[#81b64c]" : ""} />
            <span>{post.likes}</span>
          </button>
          <div className="flex items-center gap-2 font-bold text-slate-600">
            <MessageSquare size={20} />
            <span>{post.comments?.length || 0}</span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-3 bg-slate-100 p-4 rounded-lg">
          {post.comments && post.comments.length > 0 && (
            <div className="space-y-2 mb-4">
              {post.comments.map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-bold text-blue-600">@{c.author}</span>
                  <span className="text-slate-600 ml-2">{c.text}</span>
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
              placeholder="Write a comment..."
              className="flex-1 bg-slate-200 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600 transition-colors"
            />
            <button 
              onClick={() => handleComment(post.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 font-bold text-xs rounded-lg transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
