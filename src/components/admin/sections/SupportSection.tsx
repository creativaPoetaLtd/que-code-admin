"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Headphones,
  MessageSquare,
  Send,
  RefreshCw,
  Loader2,
  Clock,
  ChevronLeft,
  Paperclip,
  Download,
  FileText,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import type {
  SupportChat,
  SupportChatMessage,
} from "@/types/admin.types";

// helpers
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return "Today";
  if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function groupByDate(msgs: SupportChatMessage[]): { label: string; messages: SupportChatMessage[] }[] {
  const groups: { label: string; messages: SupportChatMessage[] }[] = [];
  for (const msg of msgs) {
    const label = getDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.messages.push(msg);
    else groups.push({ label, messages: [msg] });
  }
  return groups;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function getInitials(chat: SupportChat): string {
  const user = chat.participants?.find((p) => p.user?.email)?.user;
  if (!user) return "?";
  return ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase();
}

function getUserName(chat: SupportChat): string {
  const user = chat.participants?.find((p) => p.user?.email)?.user;
  if (!user) return "Unknown User";
  return ((user.firstName ?? "") + " " + (user.lastName ?? "")).trim();
}

function getLastMessage(chat: SupportChat): string {
  if (chat.lastMessage) return chat.lastMessage.content || "Media";
  const msgs = chat.messages;
  if (!msgs || msgs.length === 0) return "No messages yet";
  return msgs[msgs.length - 1]?.content || "Media";
}

function TextWithLinks({ text, isOwn }: { text: string; isOwn: boolean }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part: string, i: number) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            className={"underline break-all " + (isOwn ? "text-green-100" : "text-blue-600")}>
            {part}
          </a>
        ) : (
          <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>
        )
      )}
    </>
  );
}

function MediaContent({ msg, isOwn }: { msg: SupportChatMessage; isOwn: boolean }) {
  const handleDownload = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
    } catch { window.open(url, "_blank"); }
  };
  const { mediaType, mediaUrl, thumbnailUrl, fileName, fileSize, content } = msg;
  if (mediaType === "image" && mediaUrl) {
    return (
      <div className="space-y-1">
        <div className="relative group rounded-xl overflow-hidden max-w-xs">
          <img src={mediaUrl} alt={fileName || "Image"} onClick={() => window.open(mediaUrl, "_blank")}
            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity rounded-xl" />
          <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
            onClick={() => handleDownload(mediaUrl, fileName || "image.jpg")}>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
        {content && content !== "Sent a image" && <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{content}</p>}
      </div>
    );
  }
  if (mediaType === "video" && mediaUrl) {
    return (
      <div className="space-y-1">
        <video src={mediaUrl} controls poster={thumbnailUrl} className="w-full h-auto rounded-xl max-w-xs" preload="metadata" />
        {content && content !== "Sent a video" && <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{content}</p>}
      </div>
    );
  }
  if (mediaType === "audio" && mediaUrl) {
    return (
      <div className="space-y-1">
        <audio src={mediaUrl} controls className="w-full max-w-xs" />
        {content && content !== "Sent a audio" && <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{content}</p>}
      </div>
    );
  }
  if (mediaType === "document" && mediaUrl) {
    return (
      <div className="space-y-1">
        <div className={"flex items-center gap-3 rounded-xl p-3 max-w-xs " + (isOwn ? "bg-green-600/40" : "bg-gray-100")}>
          <FileText className={"w-8 h-8 shrink-0 " + (isOwn ? "text-white" : "text-gray-500")} />
          <div className="flex-1 min-w-0">
            <p className={"text-sm font-medium truncate " + (isOwn ? "text-white" : "text-gray-800")}>{fileName || "Document"}</p>
            {fileSize && <p className={"text-xs " + (isOwn ? "text-green-100" : "text-gray-500")}>{formatFileSize(fileSize)}</p>}
          </div>
          <button onClick={() => handleDownload(mediaUrl, fileName || "document")}
            className={"shrink-0 p-1.5 rounded-lg " + (isOwn ? "hover:bg-green-600/60 text-white" : "hover:bg-gray-200 text-gray-600")}>
            <Download className="w-4 h-4" />
          </button>
        </div>
        {content && content !== "Sent a document" && <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{content}</p>}
      </div>
    );
  }
  if (mediaUrl) {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
        className={"text-sm underline " + (isOwn ? "text-green-100" : "text-blue-600")}>
        {fileName || "View attachment"}
      </a>
    );
  }
  return <p className="text-sm italic opacity-70">Unsupported media</p>;
}

const ACCEPT = "image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";

export default function SupportSection() {
  const { toast } = useToast();
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasJoined, setHasJoined] = useState<Record<string, boolean>>({});
  const [showMobileThread, setShowMobileThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatsInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      const res = await adminAPI.getAllSupportChats({ page: 1, limit: 50 });
      setChats(res?.data?.chats ?? []);
    } catch {} finally { setLoadingChats(false); }
  }, []);

  useEffect(() => {
    loadChats();
    chatsInterval.current = setInterval(loadChats, 10000);
    return () => { if (chatsInterval.current) clearInterval(chatsInterval.current); };
  }, [loadChats]);

  const loadMessages = useCallback(async (chatId: string, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);
      const res = await adminAPI.getAdminSupportChatMessages(chatId, { page: 1, limit: 100 });
      setMessages(res?.data?.messages ?? []);
    } catch {} finally { setLoadingMessages(false); }
  }, []);

  const selectChat = useCallback(async (chatId: string) => {
    setSelectedChatId(chatId); setMessages([]); setShowMobileThread(true);
    if (!hasJoined[chatId]) {
      try { await adminAPI.joinSupportChat(chatId); setHasJoined(p => ({ ...p, [chatId]: true })); } catch {}
    }
    await loadMessages(chatId);
    try {
      await adminAPI.markAdminSupportChatAsRead(chatId);
      setChats(p => p.map(c => c.id === chatId ? { ...c, unreadCount: 0, lastUnreadAt: null } : c));
      window.dispatchEvent(new CustomEvent("support-chats-read"));
    } catch {}
  }, [hasJoined, loadMessages]);

  useEffect(() => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    if (selectedChatId) {
      pollInterval.current = setInterval(async () => {
        await loadMessages(selectedChatId, true);
        const hasUnread = chats.find(c => c.id === selectedChatId)?.unreadCount ?? 0;
        if (hasUnread > 0) {
          try {
            await adminAPI.markAdminSupportChatAsRead(selectedChatId);
            setChats(p => p.map(c => c.id === selectedChatId ? { ...c, unreadCount: 0, lastUnreadAt: null } : c));
            window.dispatchEvent(new CustomEvent("support-chats-read"));
          } catch {}
        }
      }, 4000);
    }
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, [selectedChatId, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedChatId || sending) return;
    setSending(true); setMessageText("");
    try {
      const res = await adminAPI.adminSendSupportMessage(selectedChatId, text);
      if (res?.data) setMessages(p => [...p, res.data]);
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setMessageText(text);
    } finally { setSending(false); }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !selectedChatId) return;
    setUploading(true); setUploadProgress(0);
    try {
      const res = await adminAPI.adminSendSupportMedia(selectedChatId, file, undefined, pct => setUploadProgress(pct));
      if (res?.data) setMessages(p => [...p, res.data]);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload file.", variant: "destructive" });
    } finally { setUploading(false); setUploadProgress(0); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectedChat = chats.find(c => c.id === selectedChatId) ?? null;
  const userParticipantId = selectedChat?.participants?.[0]?.userId ?? null;

  return (
    <div className="flex bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
      {/* Chat list */}
      <div className={(showMobileThread ? "hidden md:flex" : "flex") + " md:flex flex-col w-full md:w-80 border-r border-gray-200 bg-white"}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-800">Support Chats</span>
          </div>
          <button onClick={loadChats} disabled={loadingChats} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Refresh">
            <RefreshCw className={"w-4 h-4 " + (loadingChats ? "animate-spin" : "")} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats && chats.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 px-4">
              <MessageSquare className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No support chats yet</p>
              <p className="text-xs mt-1">Users will appear here when they start a support conversation</p>
            </div>
          ) : chats.map(chat => {
            const isActive = chat.id === selectedChatId;
            return (
              <button key={chat.id} onClick={() => selectChat(chat.id)}
                className={"w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors text-left " + (isActive ? "bg-green-50 border-l-4 border-l-green-500" : "hover:bg-gray-50")}>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm shrink-0">{getInitials(chat)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{getUserName(chat)}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{getLastMessage(chat)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(chat.updatedAt)}</p>
                </div>
                {(chat.unreadCount ?? 0) > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-green-500 text-white rounded-full text-[11px] font-bold px-1.5">
                    {(chat.unreadCount ?? 0) > 99 ? "99+" : chat.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message thread */}
      <div className={(showMobileThread ? "flex" : "hidden md:flex") + " flex-1 flex-col bg-white"}>
        {!selectedChat ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-8">
            <Headphones className="w-14 h-14 mb-4 text-gray-200" />
            <p className="text-base font-semibold text-gray-700">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-2">Choose a support chat from the list to view and reply.</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowMobileThread(false)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">{getInitials(selectedChat)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{getUserName(selectedChat)}</p>
                <p className="text-xs text-gray-500">{selectedChat.participants?.find(p => p.user?.email)?.user?.email ?? ""}</p>
              </div>
              <button onClick={() => loadMessages(selectedChatId!)} disabled={loadingMessages} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Refresh">
                <RefreshCw className={"w-4 h-4 " + (loadingMessages ? "animate-spin" : "")} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <MessageSquare className="w-10 h-10 mb-3 text-gray-200" />
                  <p className="text-sm">No messages yet. Send the first reply.</p>
                </div>
              ) : groupByDate(messages).map(group => (
                <div key={group.label}>
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-200/60 px-3 py-1 rounded-full">{group.label}</span>
                  </div>
                  {group.messages.map(msg => {
                    const isUserMsg = msg.senderId === userParticipantId;
                    const isMedia = msg.messageType !== "text";
                    return (
                      <div key={msg.id} className={"flex mb-1 " + (isUserMsg ? "justify-start" : "justify-end")}>
                        <div className={"max-w-[70%] px-3 py-2.5 rounded-2xl text-sm " + (isUserMsg ? "bg-white border border-gray-200 text-gray-900 rounded-bl-sm" : "bg-green-500 text-white rounded-br-sm")}>
                          {isUserMsg && msg.sender && (
                            <p className="text-xs font-semibold text-green-600 mb-1">{msg.sender.firstName} {msg.sender.lastName}</p>
                          )}
                          {isMedia ? (
                            <MediaContent msg={msg} isOwn={!isUserMsg} />
                          ) : (
                            <p className="break-words leading-relaxed"><TextWithLinks text={msg.content} isOwn={!isUserMsg} /></p>
                          )}
                          <p className={"text-[10px] mt-1 text-right " + (isUserMsg ? "text-gray-400" : "text-green-100")}>{formatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              {uploading && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: uploadProgress + "%" }} />
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileSelected} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || sending}
                  className={"shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors " + (uploading || sending ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100")} title="Attach file">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-green-500" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <textarea value={messageText} onChange={e => setMessageText(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Type your reply... (Enter to send)" rows={1}
                  className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 max-h-32 overflow-y-auto"
                  style={{ minHeight: "40px" }} />
                <button onClick={sendMessage} disabled={!messageText.trim() || sending || uploading}
                  className={"shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors " + (messageText.trim() && !sending && !uploading ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed")} aria-label="Send reply">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}