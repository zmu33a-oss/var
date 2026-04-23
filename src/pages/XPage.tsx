import React, { useEffect, useRef, useState } from "react";
import {
  Ban,
  Camera,
  Flag,
  Home,
  Image as ImageIcon,
  Search,
  Bell,
  Mail,
  MessageSquare,
  MoreHorizontal,
  MapPin,
  Repeat2,
  Heart,
  Share,
} from "lucide-react";

import TopTab from "./TopTab";
import ProfileX from "./ProfileX";
import styles from "../pages-css/XPage.module.css";
import { useAuth } from "../lib/AuthContext";
import { createAdminReport } from "../lib/adminStore";
import VerificationBadge from "../components/VerificationBadge";
import { useVerificationRegistry } from "../lib/verification";
import {
  buildXHandle,
  defaultXPosts,
  type XComment,
  type XPost,
} from "../lib/xPosts";

type ChatTarget = "dm" | "group" | "post" | null;

const XPage: React.FC<{
  posts?: XPost[];
  onOpenChat?: (target?: ChatTarget) => void;
  onUpdatePost?: (postId: number, updatePost: (post: XPost) => XPost) => void;
}> = ({ posts = defaultXPosts, onOpenChat, onUpdatePost }) => {
  const { profile, user } = useAuth();
  const { getVerification } = useVerificationRegistry();
  const [isTabOpen, setIsTabOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>(
    {},
  );
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentDrafts, setEditCommentDrafts] = useState<
    Record<string, string>
  >({});
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [focusReplyComposer, setFocusReplyComposer] = useState(false);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [blockedHandles, setBlockedHandles] = useState<string[]>([]);
  const [actionToast, setActionToast] = useState("");
  const [repostPanelPostId, setRepostPanelPostId] = useState<number | null>(
    null,
  );
  const [sharePanelPostId, setSharePanelPostId] = useState<number | null>(null);
  const [shareFeedbackPostId, setShareFeedbackPostId] = useState<number | null>(
    null,
  );
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const replyComposerRef = useRef<HTMLTextAreaElement | null>(null);
  const lastScrollTopRef = useRef(0);

  const groupChats = [
    {
      id: 1,
      name: "زميع :",
      lastMsg: " فوق الجميع ياو ياو",
      time: "2د",
      unread: 3,
    },
    {
      id: 2,
      name: "عائلة البرمجة",
      lastMsg: "التنسيق صار ممتاز",
      time: "15د",
      unread: 1,
    },
    {
      id: 3,
      name: "مشروع X-New",
      lastMsg: "ضيفوا صورة داخل التغريدة",
      time: "1س",
      unread: 5,
    },
  ];

  const commentAuthorName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "مستخدم";
  const commentAuthorHandle =
    profile?.username?.trim() ||
    `@${user?.email?.split("@")[0]?.trim() || "user"}`;
  const visiblePosts = posts.filter(
    (post) => !blockedHandles.includes(post.handle),
  );
  const selectedPost =
    visiblePosts.find((post) => post.id === selectedPostId) ?? null;
  const currentAvatarUrl =
    profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const currentAvatarFrameEnabled = Boolean(
    profile?.avatar_frame_enabled ?? user?.user_metadata?.avatar_frame_enabled,
  );
  const currentUsernameHandle = profile?.username?.trim()
    ? profile.username.trim().startsWith("@")
      ? profile.username.trim()
      : `@${profile.username.trim()}`
    : null;
  const currentEmailName = user?.email?.split("@")[0]?.trim() || null;
  const currentGeneratedHandle = buildXHandle(commentAuthorName);
  const currentEmailHandle = user?.email?.split("@")[0]?.trim()
    ? `@${user.email.split("@")[0].trim()}`
    : null;
  const currentEmailGeneratedHandle = currentEmailName
    ? buildXHandle(currentEmailName)
    : null;
  const currentDisplayNameAliases = Array.isArray(
    user?.user_metadata?.x_display_name_aliases,
  )
    ? user.user_metadata.x_display_name_aliases
        .filter((value: unknown): value is string => typeof value === "string")
        .map((value: string) => value.trim())
    : [];
  const currentHandleAliases = Array.isArray(
    user?.user_metadata?.x_handle_aliases,
  )
    ? user.user_metadata.x_handle_aliases
        .filter((value: unknown): value is string => typeof value === "string")
        .map((value: string) => value.trim())
    : [];
  const currentProfileHandle =
    currentUsernameHandle ?? currentGeneratedHandle ?? currentEmailHandle;

  const isCurrentUserPost = (post: XPost) => {
    if (!user) return false;

    const trimmedUser = post.user.trim();
    const trimmedHandle = post.handle.trim();

    if (post.authorId === user.id) return true;

    return (
      trimmedUser === commentAuthorName ||
      trimmedUser === currentEmailName ||
      currentDisplayNameAliases.includes(trimmedUser) ||
      trimmedHandle === currentGeneratedHandle ||
      trimmedHandle === currentUsernameHandle ||
      trimmedHandle === currentEmailHandle ||
      trimmedHandle === currentEmailGeneratedHandle ||
      currentHandleAliases.includes(trimmedHandle)
    );
  };

  const getPostAvatarUrl = (post: XPost) =>
    isCurrentUserPost(post) ? currentAvatarUrl : null;

  const getPostDisplayName = (post: XPost) =>
    isCurrentUserPost(post) ? commentAuthorName : post.user;

  const getPostDisplayHandle = (post: XPost) =>
    isCurrentUserPost(post)
      ? (currentProfileHandle ?? post.handle)
      : post.handle;

  const getPostVerificationBadge = (post: XPost) =>
    post.authorId ? (getVerification(post.authorId)?.badge ?? null) : null;

  const getCommentVerificationBadge = (comment: XComment) =>
    comment.authorId
      ? (getVerification(comment.authorId)?.badge ?? null)
      : null;

  const renderAvatar = (
    avatarUrl: string | null,
    fallback: React.ReactNode,
    alt: string,
    containerClassName: string,
    frameEnabled = false,
  ) => (
    <div className={containerClassName}>
      {frameEnabled && (
        <img
          src="/profile-frame-rsl.svg"
          alt=""
          aria-hidden="true"
          className={styles["avatar-frame"]}
        />
      )}
      <div className={styles["avatar-face"]}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={alt} className={styles["avatar-image"]} />
        ) : (
          fallback
        )}
      </div>
    </div>
  );

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const handleScroll = () => {
      const currentScrollTop = timeline.scrollTop;

      if (currentScrollTop <= 12) {
        setIsHeaderVisible(true);
        lastScrollTopRef.current = currentScrollTop;
        return;
      }

      const scrollingDown = currentScrollTop > lastScrollTopRef.current;
      const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);

      if (scrollDelta < 6) {
        return;
      }

      setIsHeaderVisible(!scrollingDown);
      lastScrollTopRef.current = currentScrollTop;
    };

    timeline.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      timeline.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const timeline = timelineRef.current;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (timeline) {
      timeline.scrollTo({ top: 0, behavior: "auto" });
    }

    lastScrollTopRef.current = 0;
    setIsHeaderVisible(true);
  }, [posts[0]?.id]);

  useEffect(() => {
    if (!selectedPostId) return;
    if (visiblePosts.some((post) => post.id === selectedPostId)) return;

    setSelectedPostId(null);
    setFocusReplyComposer(false);
  }, [selectedPostId, visiblePosts]);

  useEffect(() => {
    if (!selectedPostId || !focusReplyComposer) return;
    replyComposerRef.current?.focus();
  }, [selectedPostId, focusReplyComposer]);

  useEffect(() => {
    if (!actionToast) return;

    const timeoutId = window.setTimeout(() => {
      setActionToast("");
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionToast]);

  const updatePost = (postId: number, updater: (post: XPost) => XPost) => {
    onUpdatePost?.(postId, updater);
  };

  const closePanels = () => {
    setMenuPostId(null);
    setRepostPanelPostId(null);
    setSharePanelPostId(null);
  };

  const openPostDetail = (postId: number, shouldFocusReply = false) => {
    closePanels();
    setSelectedPostId(postId);
    setFocusReplyComposer(shouldFocusReply);
  };

  const closePostDetail = () => {
    setSelectedPostId(null);
    setFocusReplyComposer(false);
    setEditingCommentId(null);
  };

  const handleLike = (postId: number) => {
    updatePost(postId, (post) => {
      const nextLiked = !post.likedByMe;

      return {
        ...post,
        likedByMe: nextLiked,
        stats: {
          ...post.stats,
          likes: Math.max(0, post.stats.likes + (nextLiked ? 1 : -1)),
        },
      };
    });
  };

  const handleRepost = (postId: number) => {
    setSharePanelPostId(null);
    updatePost(postId, (post) => {
      const nextReposted = !post.repostedByMe;

      return {
        ...post,
        repostedByMe: nextReposted,
        stats: {
          ...post.stats,
          retweets: Math.max(0, post.stats.retweets + (nextReposted ? 1 : -1)),
        },
      };
    });
    setRepostPanelPostId(null);
  };

  const handleComment = (postId: number) => {
    openPostDetail(postId, true);
  };

  const handleCommentDraftChange = (postId: number, value: string) => {
    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [postId]: value,
    }));
  };

  const startEditingComment = (comment: XComment) => {
    setEditingCommentId(comment.id);
    setEditCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [comment.id]: comment.text,
    }));
  };

  const cancelEditingComment = (commentId: string) => {
    setEditingCommentId((currentCommentId) =>
      currentCommentId === commentId ? null : currentCommentId,
    );
  };

  const handleEditCommentDraftChange = (commentId: string, value: string) => {
    setEditCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [commentId]: value,
    }));
  };

  const submitComment = (postId: number) => {
    const trimmedComment = commentDrafts[postId]?.trim();
    if (!trimmedComment) return;

    const nextComment: XComment = {
      id: `${postId}-${Date.now()}`,
      authorName: commentAuthorName,
      authorHandle: commentAuthorHandle.startsWith("@")
        ? commentAuthorHandle
        : `@${commentAuthorHandle}`,
      authorId: user?.id,
      text: trimmedComment,
    };

    updatePost(postId, (post) => ({
      ...post,
      comments: [...(post.comments ?? []), nextComment],
      stats: {
        ...post.stats,
        replies: post.stats.replies + 1,
      },
    }));

    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [postId]: "",
    }));
    setSelectedPostId(postId);
    setFocusReplyComposer(true);
  };

  const saveEditedComment = (postId: number, commentId: string) => {
    const trimmedComment = editCommentDrafts[commentId]?.trim();
    if (!trimmedComment) return;

    updatePost(postId, (post) => ({
      ...post,
      comments: (post.comments ?? []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              text: trimmedComment,
            }
          : comment,
      ),
    }));

    setEditingCommentId(null);
  };

  const deleteComment = (postId: number, commentId: string) => {
    updatePost(postId, (post) => ({
      ...post,
      comments: (post.comments ?? []).filter(
        (comment) => comment.id !== commentId,
      ),
      stats: {
        ...post.stats,
        replies: Math.max(0, post.stats.replies - 1),
      },
    }));

    setEditingCommentId((currentCommentId) =>
      currentCommentId === commentId ? null : currentCommentId,
    );
  };

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const helperInput = document.createElement("textarea");
    helperInput.value = text;
    helperInput.setAttribute("readonly", "true");
    helperInput.style.position = "fixed";
    helperInput.style.opacity = "0";
    document.body.appendChild(helperInput);
    helperInput.focus();
    helperInput.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(helperInput);
    return copied;
  };

  const handleShare = async (postId: number) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const postDisplayName = getPostDisplayName(post);
    const postDisplayHandle = getPostDisplayHandle(post);

    const shareText = `${post.content}\n${window.location.href}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${postDisplayName} ${postDisplayHandle}`,
          text: post.content,
          url: window.location.href,
        });
      } else if (!(await copyText(shareText))) {
        window.prompt("انسخ محتوى المشاركة", shareText);
      }

      updatePost(postId, (currentPost) => ({
        ...currentPost,
        sharedByMe: true,
        stats: {
          ...currentPost.stats,
          shares: currentPost.sharedByMe
            ? currentPost.stats.shares
            : currentPost.stats.shares + 1,
        },
      }));
      setShareFeedbackPostId(postId);
      setSharePanelPostId(null);
      window.setTimeout(() => {
        setShareFeedbackPostId((currentPostId) =>
          currentPostId === postId ? null : currentPostId,
        );
      }, 1800);
    } catch {
      // Ignore share cancellation and permission issues.
    }
  };

  const handleShareAction = async (
    postId: number,
    mode: "copy-link" | "copy-post" | "system",
  ) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    if (mode === "system" && typeof navigator.share === "function") {
      await handleShare(postId);
      return;
    }

    const shareText =
      mode === "copy-link"
        ? window.location.href
        : `${post.content}\n${window.location.href}`;

    try {
      if (!(await copyText(shareText))) {
        window.prompt("انسخ محتوى المشاركة", shareText);
      }

      updatePost(postId, (currentPost) => ({
        ...currentPost,
        sharedByMe: true,
        stats: {
          ...currentPost.stats,
          shares: currentPost.sharedByMe
            ? currentPost.stats.shares
            : currentPost.stats.shares + 1,
        },
      }));
      setShareFeedbackPostId(postId);
      setSharePanelPostId(null);
      window.setTimeout(() => {
        setShareFeedbackPostId((currentPostId) =>
          currentPostId === postId ? null : currentPostId,
        );
      }, 1800);
    } catch {
      // Ignore clipboard and prompt failures.
    }
  };

  const togglePostMenu = (postId: number) => {
    setRepostPanelPostId(null);
    setSharePanelPostId(null);
    setMenuPostId((currentPostId) =>
      currentPostId === postId ? null : postId,
    );
  };

  const reportPost = async (post: XPost) => {
    setMenuPostId(null);
    try {
      await createAdminReport({
        targetType: "x_post",
        targetId: String(post.id),
        source: "x",
        summary: post.content,
        reason: "بلاغ من واجهة X",
        reporterLabel: currentProfileHandle ?? commentAuthorHandle,
      });
      setActionToast("تم إرسال البلاغ على التغريدة");
    } catch {
      setActionToast("تعذر إرسال البلاغ الآن");
    }
    if (selectedPostId === post.id) {
      setFocusReplyComposer(false);
    }
  };

  const blockUser = (post: XPost) => {
    setBlockedHandles((currentHandles) =>
      currentHandles.includes(post.handle)
        ? currentHandles
        : [...currentHandles, post.handle],
    );
    setMenuPostId(null);
    setActionToast(`تم حظر ${getPostDisplayName(post)}`);
    if (selectedPostId === post.id) {
      closePostDetail();
    }
  };

  return (
    <div
      className={`${styles["app-container"]} ${
        isTabOpen ? styles["tab-open"] : styles["tab-closed"]
      }`}
    >
      <TopTab
        groupChats={groupChats}
        isTabOpen={isTabOpen}
        setIsTabOpen={setIsTabOpen}
        onOpenChat={onOpenChat}
      />

      <header
        className={`${styles["main-header"]} ${
          isHeaderVisible ? styles["header-visible"] : styles["header-hidden"]
        }`}
      >
        <span className={styles["header-title"]}>Xtik</span>

        <div className={styles["header-subtitle"]}>
          <span>#الهلال × النصر — الأجواء حماسية قبل بداية المباراة</span>
        </div>
      </header>

      <div ref={timelineRef} className={styles["timeline"]}>
        {visiblePosts.map((post) => {
          const postAvatarUrl = getPostAvatarUrl(post);
          const postAvatarFrameEnabled =
            currentAvatarFrameEnabled && isCurrentUserPost(post);
          const postDisplayName = getPostDisplayName(post);
          const postDisplayHandle = getPostDisplayHandle(post);
          const postVerificationBadge = getPostVerificationBadge(post);

          return (
            <article
              key={post.id}
              className={styles["post"]}
              onClick={() => openPostDetail(post.id)}
            >
              <div className={styles["post-content"]}>
                {(() => {
                  const isRepostPanelOpen = repostPanelPostId === post.id;
                  const isSharePanelOpen = sharePanelPostId === post.id;
                  const isMenuOpen = menuPostId === post.id;

                  return (
                    <>
                      <div className={styles["post-top-row"]}>
                        <button
                          type="button"
                          className={styles["post-menu-trigger"]}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePostMenu(post.id);
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        <div className={styles["post-user-info"]}>
                          <span className={styles["verifiedName"]}>
                            <b>{postDisplayName}</b>
                            {postVerificationBadge && (
                              <VerificationBadge
                                size="sm"
                                variant={postVerificationBadge}
                              />
                            )}
                          </span>
                          <span>{postDisplayHandle}</span>
                          <span>• {post.time}</span>
                        </div>
                      </div>

                      {isMenuOpen && (
                        <div
                          className={styles["post-menu"]}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={styles["post-menu-item"]}
                            onClick={() => void reportPost(post)}
                          >
                            <Flag size={16} />
                            <span>تبليغ على التغريدة</span>
                          </button>
                          <button
                            type="button"
                            className={styles["post-menu-item"]}
                            onClick={() => blockUser(post)}
                          >
                            <Ban size={16} />
                            <span>حظر اليوزر</span>
                          </button>
                        </div>
                      )}

                      <div className={styles["post-text"]}>{post.content}</div>

                      {post.image && (
                        <div className={styles["post-image-wrapper"]}>
                          <img
                            src={post.image}
                            alt="sports post"
                            className={styles["post-image"]}
                          />
                        </div>
                      )}

                      <div className={styles["post-actions"]}>
                        <button
                          type="button"
                          className={`${styles["action-item"]} ${post.comments?.length ? styles["action-item-commented"] : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComment(post.id);
                          }}
                        >
                          <MessageSquare />
                          {post.stats.replies}
                        </button>

                        <button
                          type="button"
                          className={`${styles["action-item"]} ${post.repostedByMe ? styles["action-item-reposted"] : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharePanelPostId(null);
                            setRepostPanelPostId((currentPostId) =>
                              currentPostId === post.id ? null : post.id,
                            );
                          }}
                        >
                          <Repeat2 />
                          {post.stats.retweets}
                        </button>

                        <button
                          type="button"
                          className={`${styles["action-item"]} ${post.likedByMe ? styles["action-item-liked"] : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id);
                          }}
                        >
                          <Heart />
                          {post.stats.likes}
                        </button>

                        <button
                          type="button"
                          className={`${styles["action-item"]} ${post.sharedByMe ? styles["action-item-shared"] : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRepostPanelPostId(null);
                            setSharePanelPostId((currentPostId) =>
                              currentPostId === post.id ? null : post.id,
                            );
                          }}
                        >
                          <Share />
                          {post.stats.shares}
                          {shareFeedbackPostId === post.id && (
                            <span className={styles["share-feedback"]}>
                              تم النسخ
                            </span>
                          )}
                        </button>
                      </div>
                      {isRepostPanelOpen && (
                        <div
                          className={styles["action-panel"]}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className={styles["action-panel-title"]}>
                            {post.repostedByMe
                              ? "أنت أعدت نشر هذه التغريدة"
                              : "إعادة نشر هذه التغريدة"}
                          </p>
                          <button
                            type="button"
                            className={styles["action-panel-btn"]}
                            onClick={() => handleRepost(post.id)}
                          >
                            {post.repostedByMe
                              ? "إلغاء إعادة النشر"
                              : "إعادة نشر"}
                          </button>
                        </div>
                      )}
                      {isSharePanelOpen && (
                        <div
                          className={styles["action-panel"]}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className={styles["action-panel-title"]}>
                            اختر طريقة المشاركة
                          </p>
                          {typeof navigator.share === "function" && (
                            <button
                              type="button"
                              className={styles["action-panel-btn"]}
                              onClick={() => {
                                void handleShareAction(post.id, "system");
                              }}
                            >
                              مشاركة النظام
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles["action-panel-btn"]}
                            onClick={() => {
                              void handleShareAction(post.id, "copy-link");
                            }}
                          >
                            نسخ الرابط
                          </button>
                          <button
                            type="button"
                            className={styles["action-panel-btn"]}
                            onClick={() => {
                              void handleShareAction(post.id, "copy-post");
                            }}
                          >
                            نسخ نص التغريدة
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {renderAvatar(
                postAvatarUrl,
                postDisplayName[0],
                `${postDisplayName} avatar`,
                styles["post-avatar"],
                postAvatarFrameEnabled,
              )}
            </article>
          );
        })}
      </div>

      {selectedPost ? (
        <div className={styles["detail-overlay"]}>
          <div className={styles["detail-shell"]}>
            <div className={styles["detail-header"]}>
              <button
                type="button"
                className={styles["detail-header-btn"]}
                onClick={closePostDetail}
              >
                إلغاء
              </button>
              <button
                type="button"
                className={styles["detail-publish-btn"]}
                onClick={() => submitComment(selectedPost.id)}
                disabled={!commentDrafts[selectedPost.id]?.trim()}
              >
                نشر
              </button>
            </div>

            <div className={styles["detail-body"]}>
              {(() => {
                const selectedPostDisplayName =
                  getPostDisplayName(selectedPost);
                const selectedPostDisplayHandle =
                  getPostDisplayHandle(selectedPost);
                const selectedPostVerificationBadge =
                  getPostVerificationBadge(selectedPost);

                return (
                  <div className={styles["detail-thread"]}>
                    {renderAvatar(
                      getPostAvatarUrl(selectedPost),
                      selectedPostDisplayName[0],
                      `${selectedPostDisplayName} avatar`,
                      styles["detail-avatar"],
                      currentAvatarFrameEnabled &&
                        isCurrentUserPost(selectedPost),
                    )}

                    <div className={styles["detail-main"]}>
                      <div className={styles["detail-post-head"]}>
                        <span className={styles["verifiedName"]}>
                          <b>{selectedPostDisplayName}</b>
                          {selectedPostVerificationBadge && (
                            <VerificationBadge
                              size="sm"
                              variant={selectedPostVerificationBadge}
                            />
                          )}
                        </span>
                        <span>{selectedPostDisplayHandle}</span>
                        <span>• {selectedPost.time}</span>
                      </div>

                      <p className={styles["detail-post-text"]}>
                        {selectedPost.content}
                      </p>

                      {selectedPost.image && (
                        <div className={styles["detail-post-image-wrap"]}>
                          <img
                            src={selectedPost.image}
                            alt="tweet media"
                            className={styles["detail-post-image"]}
                          />
                        </div>
                      )}

                      <p className={styles["detail-reply-label"]}>
                        ردًا على <span>{selectedPostDisplayHandle}</span>
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className={styles["detail-comments"]}>
                {selectedPost.comments?.length ? (
                  selectedPost.comments.map((comment, index) => {
                    const commentVerificationBadge =
                      getCommentVerificationBadge(comment);

                    return (
                      <div
                        key={
                          comment.id || `${selectedPost.id}-comment-${index}`
                        }
                        className={styles["comment-item"]}
                      >
                        <span className={styles["comment-author"]}>
                          <span className={styles["verifiedName"]}>
                            <span>{comment.authorName}</span>
                            {commentVerificationBadge && (
                              <VerificationBadge
                                size="sm"
                                variant={commentVerificationBadge}
                              />
                            )}
                          </span>
                          <span>{comment.authorHandle}</span>
                        </span>
                        {editingCommentId === comment.id ? (
                          <div className={styles["comment-edit-wrap"]}>
                            <input
                              type="text"
                              className={styles["comment-edit-input"]}
                              value={editCommentDrafts[comment.id] ?? ""}
                              onChange={(e) =>
                                handleEditCommentDraftChange(
                                  comment.id,
                                  e.target.value,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  saveEditedComment(
                                    selectedPost.id,
                                    comment.id,
                                  );
                                }
                              }}
                              autoFocus
                            />
                            <div className={styles["comment-actions"]}>
                              <button
                                type="button"
                                className={styles["comment-action-btn"]}
                                onClick={() =>
                                  saveEditedComment(selectedPost.id, comment.id)
                                }
                                disabled={
                                  !(editCommentDrafts[comment.id] ?? "").trim()
                                }
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                className={styles["comment-action-btn"]}
                                onClick={() => cancelEditingComment(comment.id)}
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className={styles["comment-text"]}>
                              {comment.text}
                            </p>
                            {comment.authorId === user?.id && (
                              <div className={styles["comment-actions"]}>
                                <button
                                  type="button"
                                  className={styles["comment-action-btn"]}
                                  onClick={() => startEditingComment(comment)}
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  className={styles["comment-action-btn"]}
                                  onClick={() =>
                                    deleteComment(selectedPost.id, comment.id)
                                  }
                                >
                                  حذف
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className={styles["comments-empty"]}>
                    ما فيه تعليقات إلى الآن
                  </p>
                )}
              </div>
            </div>

            <div className={styles["detail-composer"]}>
              {renderAvatar(
                currentAvatarUrl,
                commentAuthorName[0]?.toUpperCase(),
                "your avatar",
                styles["detail-composer-avatar"],
                currentAvatarFrameEnabled,
              )}

              <div className={styles["detail-composer-content"]}>
                <textarea
                  ref={replyComposerRef}
                  className={styles["detail-composer-textarea"]}
                  placeholder="نشر ردك"
                  value={commentDrafts[selectedPost.id] ?? ""}
                  onChange={(e) =>
                    handleCommentDraftChange(selectedPost.id, e.target.value)
                  }
                />

                <div className={styles["detail-composer-tools"]}>
                  <button type="button" className={styles["detail-tool-btn"]}>
                    <ImageIcon size={19} />
                  </button>
                  <button type="button" className={styles["detail-tool-btn"]}>
                    <Camera size={19} />
                  </button>
                  <button type="button" className={styles["detail-tool-btn"]}>
                    <MapPin size={19} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {actionToast && <div className={styles["toast"]}>{actionToast}</div>}

      <nav className={styles["bottom-nav"]}>
        <Mail
          className={styles["nav-icon"]}
          onClick={() => onOpenChat?.("dm")}
        />
        <Bell className={styles["nav-icon"]} />
        <Search className={styles["nav-icon"]} />
        <Home className={`${styles["nav-icon"]} ${styles["active"]}`} />
      </nav>

      <button className={styles["fab"]} onClick={() => setIsProfileOpen(true)}>
        <span>ProfiLe</span>
      </button>

      <ProfileX
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenChat={(target) => {
          setIsProfileOpen(false);
          onOpenChat?.(target);
        }}
      />
    </div>
  );
};

export default XPage;
