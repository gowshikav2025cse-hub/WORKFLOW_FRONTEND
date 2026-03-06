'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Linkedin, CheckCircle2, AlertCircle, Loader2, Trash2,
  Calendar, Clock, Send, RefreshCw, Plus, X, Repeat2,
  ExternalLink, User, Mail, Image as ImageIcon, Zap,
} from 'lucide-react';
import {
  getLinkedInStatus, disconnectLinkedIn, scheduleLinkedInPost,
  postLinkedInNow, getScheduledLinkedInPosts, cancelScheduledPost,
  getLinkedInAuthUrl,
  type LinkedInStatus, type ScheduledPost,
} from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-600',
    failed:    'bg-red-50 text-red-500',
    running:   'bg-blue-50 text-blue-600',
    active:    'bg-emerald-50 text-emerald-600',
    archived:  'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] ?? 'bg-gray-100 text-gray-400'}`}>
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [liStatus, setLiStatus] = useState<LinkedInStatus | null>(null);
  const [liLoading, setLiLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Compose form
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [postMode, setPostMode] = useState<'now' | 'schedule'>('schedule');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Load LinkedIn status
  const loadStatus = useCallback(async () => {
    setLiLoading(true);
    try {
      const s = await getLinkedInStatus();
      setLiStatus(s);
    } catch {
      setLiStatus({ connected: false });
    } finally {
      setLiLoading(false);
    }
  }, []);

  // Load scheduled posts
  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const data = await getScheduledLinkedInPosts();
      setPosts(data);
    } catch {
      // ignore
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadPosts();

    // Check URL for OAuth success/error redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'linkedin') {
      showToast('success', `Connected as ${decodeURIComponent(params.get('name') || 'LinkedIn user')}!`);
      window.history.replaceState({}, '', window.location.pathname);
      loadStatus();
    } else if (params.get('error')) {
      showToast('error', `OAuth error: ${decodeURIComponent(params.get('error') || 'unknown')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [loadStatus, loadPosts]);

  const handleConnect = () => {
    window.location.href = getLinkedInAuthUrl();
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect LinkedIn?')) return;
    setDisconnecting(true);
    try {
      await disconnectLinkedIn();
      setLiStatus({ connected: false });
      showToast('success', 'LinkedIn disconnected');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { showToast('error', 'Post content is required'); return; }
    if (postMode === 'schedule' && !scheduledAt) { showToast('error', 'Please pick a date/time'); return; }

    setSubmitting(true);
    try {
      if (postMode === 'now') {
        await postLinkedInNow({ content, imageUrl: imageUrl || undefined });
        showToast('success', liStatus?.connected ? 'Posted to LinkedIn!' : 'Workflow created (simulation — connect LinkedIn to post for real)');
      } else {
        const res = await scheduleLinkedInPost({
          content,
          scheduledAt: new Date(scheduledAt).toISOString(),
          repeat,
          imageUrl: imageUrl || undefined,
        });
        showToast('success', `Post scheduled for ${fmtDate(res.scheduledAt)}`);
      }
      setContent('');
      setImageUrl('');
      setScheduledAt('');
      loadPosts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this scheduled post?')) return;
    try {
      await cancelScheduledPost(id);
      showToast('success', 'Scheduled post cancelled');
      setPosts((p) => p.filter((x) => x._id !== id));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  // Character count
  const charCount = content.length;
  const charOver  = charCount > 3000;

  return (
    <div className="min-h-screen gradient-mesh px-8 py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg animate-fade-in-scale text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Integrations</h1>
        <p className="text-sm text-gray-500">Connect services and build automated posting agents</p>
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-6xl">

        {/* ── Left column: LinkedIn Connect card ── */}
        <div className="col-span-1 space-y-4">

          {/* LinkedIn Connect Card */}
          <div className="glass-card p-5 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center shrink-0">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">LinkedIn</h2>
                <p className="text-[11px] text-gray-400">Auto-post to your profile</p>
              </div>
            </div>

            {liLoading ? (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking connection…
              </div>
            ) : liStatus?.connected ? (
              <>
                <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-700 truncate">{liStatus.displayName}</p>
                    <p className="text-[10px] text-emerald-600/70 truncate">{liStatus.email}</p>
                  </div>
                </div>
                {liStatus.profilePicture && (
                  <div className="flex items-center gap-2 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={liStatus.profilePicture} alt="profile" className="w-8 h-8 rounded-full border border-gray-200" />
                    <div>
                      <p className="text-[10px] text-gray-500">Signed in as</p>
                      <p className="text-xs font-medium text-gray-700">{liStatus.displayName}</p>
                    </div>
                  </div>
                )}
                {liStatus.connectedAt && (
                  <p className="text-[10px] text-gray-400 mb-3">
                    Connected {fmtDate(liStatus.connectedAt)}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={loadStatus}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-red-500 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-50"
                  >
                    {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-700">
                    {liStatus?.expired ? 'Token expired — please reconnect' : 'Not connected'}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                  Connect your LinkedIn account to post content automatically on a schedule.
                  Posts will be published to <strong>your public LinkedIn feed</strong>.
                </p>
                <button
                  onClick={handleConnect}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                             bg-[#0A66C2] text-white text-xs font-semibold hover:bg-[#004182] transition-colors"
                >
                  <Linkedin className="w-4 h-4" /> Sign in with LinkedIn
                </button>

                {/* Setup note */}
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium mb-1.5">Developer setup required</p>
                  <ol className="space-y-1 text-[10px] text-gray-400">
                    <li>1. Open your <a href="https://www.linkedin.com/developers/apps/228738158/auth" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">LinkedIn App <ExternalLink className="w-2.5 h-2.5" /></a></li>
                    <li>2. Add OAuth2 redirect: <code className="bg-gray-100 px-1 rounded text-[9px]">localhost:5000/api/auth/linkedin/callback</code></li>
                    <li>3. Add products: <em>Sign In with LinkedIn using OpenID Connect</em> + <em>Share on LinkedIn</em></li>
                    <li>4. Copy <strong>Client ID</strong> + <strong>Client Secret</strong> into <code className="bg-gray-100 px-1 rounded text-[9px]">backend/.env</code></li>
                  </ol>
                </div>
              </>
            )}
          </div>

          {/* Coming soon integrations */}
          {[
            { name: 'Twitter / X', color: '#000', icon: '𝕏' },
            { name: 'Facebook', color: '#1877F2', icon: 'f' },
            { name: 'Instagram', color: '#E1306C', icon: '📷' },
          ].map((s) => (
            <div key={s.name} className="glass-card p-4 border border-gray-100 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: s.color }}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{s.name}</p>
                  <p className="text-[10px] text-gray-400">Coming soon</p>
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Soon</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Right column: Composer + Scheduled list ── */}
        <div className="col-span-2 space-y-6">

          {/* Compose card */}
          <div className="glass-card p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-800">LinkedIn Auto-Post Agent</h2>
              {!liStatus?.connected && (
                <span className="ml-auto text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                  simulation mode — connect LinkedIn to post for real
                </span>
              )}
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-gray-50 rounded-lg mb-4 w-fit border border-gray-100">
              {(['schedule', 'now'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPostMode(m)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all
                    ${postMode === m ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {m === 'schedule' ? <Calendar className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                  {m === 'schedule' ? 'Schedule' : 'Post Now'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Content textarea */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Post Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="What do you want to share on LinkedIn?&#10;&#10;Tip: Use {{data.fact}} to inject dynamic data from upstream nodes."
                  className={`w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border rounded-xl resize-none
                    focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-400
                    ${charOver ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-emerald-200'}`}
                />
                <div className={`flex justify-end mt-1 text-[10px] ${charOver ? 'text-red-500' : 'text-gray-400'}`}>
                  {charCount} / 3000
                </div>
              </div>

              {/* Image URL (optional) */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                  <ImageIcon className="w-3 h-3" /> Image URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Schedule fields */}
              {postMode === 'schedule' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                      <Clock className="w-3 h-3" /> Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                      <Repeat2 className="w-3 h-3" /> Repeat
                    </label>
                    <select
                      value={repeat}
                      onChange={(e) => setRepeat(e.target.value as 'none' | 'daily' | 'weekly')}
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all"
                    >
                      <option value="none">No repeat (once)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || charOver || !content.trim()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                           bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold
                           transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-sky-600/20"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {postMode === 'now' ? 'Posting…' : 'Scheduling…'}</>
                ) : postMode === 'now' ? (
                  <><Send className="w-4 h-4" /> Post to LinkedIn Now</>
                ) : (
                  <><Calendar className="w-4 h-4" /> Schedule Post</>
                )}
              </button>
            </form>
          </div>

          {/* Scheduled posts list */}
          <div className="glass-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-800">Scheduled Posts</h2>
                {posts.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-full">
                    {posts.length}
                  </span>
                )}
              </div>
              <button
                onClick={loadPosts}
                disabled={postsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${postsLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-14 rounded-lg animate-shimmer bg-gray-50" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 mb-1">No scheduled posts</p>
                <p className="text-[11px] text-gray-400">Use the form above to schedule your first LinkedIn post</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div key={post._id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{post.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <StatusBadge status={post.status} />
                        {post.isRunning && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> active
                          </span>
                        )}
                        {post.lastRun && (
                          <span className="text-[10px] text-gray-400">
                            Last run: <StatusBadge status={post.lastRun.status} />
                          </span>
                        )}
                        {post.executionCount > 0 && (
                          <span className="text-[10px] text-gray-400">× {post.executionCount}</span>
                        )}
                      </div>
                    </div>
                    {post.status !== 'archived' && (
                      <button
                        onClick={() => handleCancel(post._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
