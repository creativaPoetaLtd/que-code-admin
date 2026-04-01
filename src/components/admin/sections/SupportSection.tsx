"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Headphones,
  MessageSquare,
  Send,
  RefreshCw,
  Loader2,
  User,
  Clock,
  ChevronLeft,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import type {
  SupportChat,
  SupportChatMessage,
} from "@/types/admin.types";

// ── helpers ─────────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getInitials(chat: SupportChat): string {
  // Find the non-admin participant
  const user = chat.participants?.find((p) => p.user?.email)?.user;
  if (!user) return "?";
  return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
}

function getUserName(chat: SupportChat): string {
  const user = chat.participants?.find((p) => p.user?.email)?.user;
  if (!user) return "Unknown User";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
}

function getLastMessage(chat: SupportChat): string {
  // Prefer dedicated lastMessage field from API; fall back to messages array
  if (chat.lastMessage) return chat.lastMessage.content ?? "No messages yet";
  const msgs = chat.messages;
  if (!msgs || msgs.length === 0) return "No messages yet";
  return msgs[msgs.length - 1]?.content ?? "No messages yet";
}

// ── Main component ───────────────────────────────────────────────────
export default function SupportSection() {
  const { toast } = useToast();

  const [chats, setChats] = useState<SupportChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [hasJoined, setHasJoined] = useState<Record<string, boolean>>({});
  const [showMobileThread, setShowMobileThread] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch all support chats ─────────────────────────────────────
  const loadChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      const res = await adminAPI.getAllSupportChats({ page: 1, limit: 50 });
      setChats(res?.data?.chats ?? []);
    } catch {
      // silent — background poll
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    chatsInterval.current = setInterval(loadChats, 10_000);
    return () => {
      if (chatsInterval.current) clearInterval(chatsInterval.current);
    };
  }, [loadChats]);

  // ── Join + load messages when a chat is selected ────────────────
  const loadMessages = useCallback(async (chatId: string, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);
      const res = await adminAPI.getAdminSupportChatMessages(chatId, { page: 1, limit: 100 });
      setMessages(res?.data?.messages ?? []);
    } catch {
      // silent
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectChat = useCallback(
    async (chatId: string) => {
      setSelectedChatId(chatId);
      setMessages([]);
      setShowMobileThread(true);

      // Auto-join if not already
      if (!hasJoined[chatId]) {
        try {
          await adminAPI.joinSupportChat(chatId);
          setHasJoined((prev) => ({ ...prev, [chatId]: true }));
        } catch {
          // already joined or minor error — ignore
        }
      }

      await loadMessages(chatId);

      // Mark all messages in this chat as read
      try {
        await adminAPI.markAdminSupportChatAsRead(chatId);
        // Optimistically clear unread badge for this chat
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0, lastUnreadAt: null } : c))
        );
        // Signal the header to refresh its unread count immediately
        window.dispatchEvent(new CustomEvent("support-chats-read"));
      } catch {
        // non-critical — ignore
      }
    },
    [hasJoined, loadMessages],
  );

  // ── Poll messages every 4 seconds when a chat is open ──────────
  useEffect(() => {
    if (pollInterval.current) clearInterval(pollInterval.current);

    if (selectedChatId) {
      pollInterval.current = setInterval(async () => {
        await loadMessages(selectedChatId, true);
        // If there are still unread messages in this chat, mark them as read
        // (covers new messages arriving while the admin has the chat open)
        const hasUnread = chats.find((c) => c.id === selectedChatId)?.unreadCount ?? 0;
        if (hasUnread > 0) {
          try {
            await adminAPI.markAdminSupportChatAsRead(selectedChatId);
            setChats((prev) =>
              prev.map((c) =>
                c.id === selectedChatId ? { ...c, unreadCount: 0, lastUnreadAt: null } : c
              )
            );
            window.dispatchEvent(new CustomEvent("support-chats-read"));
          } catch {
            // non-critical
          }
        }
      }, 4_000);
    }

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [selectedChatId, loadMessages]);

  // ── Scroll to bottom on new messages ───────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────
  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedChatId || sending) return;

    setSending(true);
    setMessageText("");

    try {
      const res = await adminAPI.adminSendSupportMessage(selectedChatId, text);
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  return (
    <div className="flex bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
      {/* ── Chat list (left panel) ────────────────────────────────── */}
      <div
        className={`${showMobileThread ? "hidden md:flex" : "flex"} md:flex flex-col w-full md:w-80 border-r border-gray-200 bg-white`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-800">Support Chats</span>
          </div>
          <button
            onClick={loadChats}
            disabled={loadingChats}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loadingChats ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats && chats.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 px-4">
              <MessageSquare className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No support chats yet</p>
              <p className="text-xs mt-1">Users will appear here when they start a support conversation</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === selectedChatId;
              return (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors text-left ${
                    isActive
                      ? "bg-green-50 border-l-4 border-l-green-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm shrink-0">
                    {getInitials(chat)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{getUserName(chat)}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{getLastMessage(chat)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(chat.updatedAt)}
                    </p>
                  </div>
                  {(chat.unreadCount ?? 0) > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-green-500 text-white rounded-full text-[11px] font-bold px-1.5">
                      {(chat.unreadCount ?? 0) > 99 ? "99+" : chat.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Message thread (right panel) ─────────────────────────────── */}
      <div className={`${showMobileThread ? "flex" : "hidden md:flex"} flex-1 flex-col bg-white`}>
        {!selectedChat ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-8">
            <Headphones className="w-14 h-14 mb-4 text-gray-200" />
            <p className="text-base font-semibold text-gray-700">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-2">
              Choose a support chat from the list to view and reply to the user's messages.
            </p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => setShowMobileThread(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                {getInitials(selectedChat)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{getUserName(selectedChat)}</p>
                <p className="text-xs text-gray-500">
                  {selectedChat.participants?.find((p) => p.user?.email)?.user?.email ?? ""}
                </p>
              </div>
              <button
                onClick={() => loadMessages(selectedChatId!)}
                disabled={loadingMessages}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                title="Refresh messages"
              >
                <RefreshCw className={`w-4 h-4 ${loadingMessages ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <MessageSquare className="w-10 h-10 mb-3 text-gray-200" />
                  <p className="text-sm">No messages yet. Send the first reply.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  // Messages from the user (not admin) show on left; admin's own messages on right
                  // We determine "own" messages by checking if the sender is NOT in the user-side participants
                  // Simple heuristic: if message senderId matches user participant's userId → user, else admin
                  const userParticipant = selectedChat.participants?.find(
                    (p) => p.user && p.userId !== msg.senderId
                  );
                  // If msg.senderId equals the user (non-admin first-participant) it's user side
                  const firstUserParticipantId = selectedChat.participants?.[0]?.userId;
                  const isUserMsg = msg.senderId === firstUserParticipantId;

                  return (
                    <div key={msg.id} className={`flex ${isUserMsg ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          isUserMsg
                            ? "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                            : "bg-green-500 text-white rounded-br-sm"
                        }`}
                      >
                        {isUserMsg && msg.sender && (
                          <p className="text-xs font-semibold text-green-600 mb-1">
                            {msg.sender.firstName} {msg.sender.lastName}
                          </p>
                        )}
                        <p className="wrap-break-wordbreak-words leading-relaxed">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 text-right ${
                            isUserMsg ? "text-gray-400" : "text-green-100"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-4 py-3 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply… (Enter to send)"
                  rows={1}
                  className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 max-h-32 overflow-y-auto"
                  style={{ minHeight: "40px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending}
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    messageText.trim() && !sending
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  aria-label="Send reply"
                >
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
