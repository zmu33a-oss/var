import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Flag,
  ImageIcon,
  List,
  MapPin,
  Plus,
  Smile,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { supabase } from "./supabase";
import styles from "../pages-css/ChatPage.module.css";
import { createAdminReport } from "../lib/adminStore";
import { buildXHandle, type XPost } from "../lib/xPosts";
import { useAuth } from "../lib/AuthContext";

// ────────────────────────────── Types ──────────────────────────────
type Group = {
  id: string;
  name: string;
  is_private: boolean;
  created_at?: string;
  avatar_url?: string | null;
  created_by?: string | null;
  dm_key?: string | null;
  last_message?: string;
  last_message_at?: string;
  unread?: number;
};

type GroupReadState = {
  group_id: string;
  last_read_at: string;
};

type Message = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  user_id?: string;
  text?: string;
};

type AppUser = {
  id: string;
  email?: string;
  full_name?: string;
};

type GroupMember = {
  user_id: string;
  full_name?: string;
  email?: string;
  isCreator: boolean;
};

// ────────────────────────────── Main Component ──────────────────────────────
export default function ChatPage({
  initialGroupId,
  initialComposer,
  onCreatePost,
  onClose,
}: {
  initialGroupId?: string;
  initialComposer?: "dm" | "group" | "post" | null;
  onCreatePost?: (post: XPost) => void;
  onClose?: () => void;
}) {
  const { user: authUser, profile } = useAuth();
  const [me, setMe] = useState<AppUser | null>(() => {
    if (!authUser) return null;

    return {
      id: authUser.id,
      email: authUser.email,
      full_name:
        profile?.full_name ??
        authUser.user_metadata?.full_name ??
        authUser.user_metadata?.name,
    };
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState("");

  // modals
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [dmTarget, setDmTarget] = useState("");
  const [dmDraft, setDmDraft] = useState("");
  const [postDraft, setPostDraft] = useState("");
  const [creating, setCreating] = useState(false);

  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [managingGroup, setManagingGroup] = useState(false);
  const [groupMetaError, setGroupMetaError] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const postImageRef = useRef<HTMLInputElement>(null);
  const chatRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authUser) {
      setMe(null);
      return;
    }

    setMe((currentUser) => {
      const nextUser = {
        id: authUser.id,
        email: authUser.email,
        full_name:
          profile?.full_name ??
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name,
      };

      if (
        currentUser?.id === nextUser.id &&
        currentUser?.email === nextUser.email &&
        currentUser?.full_name === nextUser.full_name
      ) {
        return currentUser;
      }

      return nextUser;
    });
  }, [
    authUser?.id,
    authUser?.email,
    authUser?.user_metadata?.full_name,
    authUser?.user_metadata?.name,
    profile?.full_name,
  ]);

  // ── fetch current user ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setMe({ id: data.user.id, email: data.user.email });
      }
    });
  }, []);

  // ── fetch user's groups ──
  useEffect(() => {
    if (!me) return;
    fetchGroups();
  }, [me]);

  useEffect(() => {
    if (!initialComposer) return;

    if (initialComposer === "dm") {
      setShowNewGroup(false);
      setShowNewPost(false);
      setShowNewDM(true);
      return;
    }

    if (initialComposer === "group") {
      setShowNewDM(false);
      setShowNewPost(false);
      setShowNewGroup(true);
      return;
    }

    if (initialComposer === "post") {
      setShowNewDM(false);
      setShowNewGroup(false);
      setShowNewPost(true);
    }
  }, [initialComposer]);

  const mergeGroups = (items: Group[]) => {
    const unique = new Map<string, Group>();
    items.forEach((group) => {
      if (group?.id) {
        unique.set(group.id, group);
      }
    });

    return Array.from(unique.values()).sort(
      (left, right) =>
        new Date(right.last_message_at ?? right.created_at ?? 0).getTime() -
        new Date(left.last_message_at ?? left.created_at ?? 0).getTime(),
    );
  };

  const buildDmKey = (leftUserId: string, rightUserId: string) =>
    `dm:${[leftUserId, rightUserId].sort().join(":")}`;

  const withUnreadState = (items: Group[], readStates: GroupReadState[]) => {
    const readStatesByGroupId = new Map(
      readStates.map((state) => [state.group_id, state.last_read_at]),
    );

    return items.map((group) => {
      const lastReadAt = readStatesByGroupId.get(group.id);
      const hasUnread = Boolean(
        group.last_message_at &&
        new Date(group.last_message_at).getTime() >
          new Date(lastReadAt ?? 0).getTime(),
      );

      return {
        ...group,
        unread: hasUnread ? 1 : 0,
      } satisfies Group;
    });
  };

  const syncLocalGroupPreview = (
    groupId: string,
    lastMessage: string,
    lastMessageAt: string,
    unread = 0,
  ) => {
    setGroups((currentGroups) =>
      mergeGroups(
        currentGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                last_message: lastMessage,
                last_message_at: lastMessageAt,
                unread,
              }
            : group,
        ),
      ),
    );

    setActiveGroup((currentGroup) =>
      currentGroup?.id === groupId
        ? {
            ...currentGroup,
            last_message: lastMessage,
            last_message_at: lastMessageAt,
            unread,
          }
        : currentGroup,
    );
  };

  const fetchGroupReadStates = async (groupIds: string[]) => {
    if (!me || groupIds.length === 0) {
      return [] as GroupReadState[];
    }

    const { data, error } = await supabase
      .from("group_read_states")
      .select("group_id, last_read_at")
      .eq("user_id", me.id)
      .in("group_id", groupIds);

    if (error) {
      return [] as GroupReadState[];
    }

    return (data ?? []) as GroupReadState[];
  };

  const markGroupAsRead = async (groupId: string) => {
    if (!me) return;

    const lastReadAt = new Date().toISOString();

    await supabase.from("group_read_states").upsert(
      {
        group_id: groupId,
        user_id: me.id,
        last_read_at: lastReadAt,
      },
      { onConflict: "group_id,user_id" },
    );

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              unread: 0,
            }
          : group,
      ),
    );
  };

  const normalizeMessage = (row: any): Message => ({
    id: row.id,
    group_id: row.group_id,
    sender_id: row.sender_id ?? row.user_id,
    content: row.content ?? row.text ?? "",
    created_at: row.created_at,
    sender_name: row.sender_name,
    user_id: row.user_id,
    text: row.text,
  });

  const insertMessageToGroup = async (
    groupId: string,
    senderId: string,
    content: string,
  ) => {
    let err: { message?: string } | null = null;
    let savedRow: any = null;

    const primary = await supabase
      .from("messages")
      .insert({
        group_id: groupId,
        user_id: senderId,
        text: content,
      })
      .select("id, group_id, user_id, text, created_at")
      .single();

    err = primary.error;
    savedRow = primary.data;

    if (err) {
      const fallback = await supabase
        .from("messages")
        .insert({
          group_id: groupId,
          sender_id: senderId,
          content,
        })
        .select("id, group_id, sender_id, content, created_at")
        .single();

      err = fallback.error;
      savedRow = fallback.data;
    }

    return { err, savedRow };
  };

  const fetchOwnedGroups = async () => {
    const primary = await supabase
      .from("groups")
      .select(
        "id, name, is_private, avatar_url, created_by, dm_key, last_message, last_message_at",
      )
      .eq("created_by", me!.id);

    if (!primary.error) {
      return {
        data: (primary.data ?? []) as Group[],
        error: null as { message?: string } | null,
      };
    }

    const fallback = await supabase
      .from("groups")
      .select("id, name, is_private")
      .eq("created_by", me!.id);

    if (!fallback.error) {
      return {
        data: ((fallback.data ?? []) as Group[]).map((group) => ({
          ...group,
          created_by: me!.id,
        })),
        error: null as { message?: string } | null,
      };
    }

    return {
      data: [] as Group[],
      error: fallback.error ?? primary.error,
    };
  };

  const fetchGroupsByIds = async (groupIds: string[]) => {
    if (groupIds.length === 0) {
      return {
        data: [] as Group[],
        error: null as { message?: string } | null,
      };
    }

    const primary = await supabase
      .from("groups")
      .select(
        "id, name, is_private, avatar_url, created_by, dm_key, last_message, last_message_at",
      )
      .in("id", groupIds);

    if (!primary.error) {
      return {
        data: (primary.data ?? []) as Group[],
        error: null as { message?: string } | null,
      };
    }

    const fallback = await supabase
      .from("groups")
      .select("id, name, is_private")
      .in("id", groupIds);

    if (!fallback.error) {
      return {
        data: (fallback.data ?? []) as Group[],
        error: null as { message?: string } | null,
      };
    }

    return {
      data: [] as Group[],
      error: fallback.error ?? primary.error,
    };
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    setError("");

    let memberIds: string[] = [];
    let memberErr: { message?: string } | null = null;
    let ownedData: Group[] | null = null;
    let ownedErr: { message?: string } | null = null;

    const memberships = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", me!.id);

    if (memberships.error) {
      memberErr = memberships.error;
    } else {
      memberIds = (memberships.data ?? [])
        .map((row) => row.group_id)
        .filter(Boolean);
    }

    const ownedGroups = await fetchOwnedGroups();

    ownedData = ownedGroups.data;
    ownedErr = ownedGroups.error;

    let memberGroups: Group[] = [];
    if (memberIds.length > 0) {
      const memberGroupsRes = await fetchGroupsByIds(memberIds);

      if (memberGroupsRes.error) {
        memberErr = memberGroupsRes.error;
      } else {
        memberGroups = memberGroupsRes.data;
      }
    }

    if (memberErr && ownedErr) {
      setError("تعذر جلب المجموعات");
      setLoadingGroups(false);
      return;
    }

    const list = mergeGroups([
      ...memberGroups,
      ...((ownedData ?? []) as Group[]),
    ]);
    const readStates = await fetchGroupReadStates(
      list.map((group) => group.id),
    );
    const nextList = withUnreadState(list, readStates);

    setGroups(nextList);
    setLoadingGroups(false);

    if (initialGroupId) {
      const target = nextList.find((group) => group.id === initialGroupId);
      if (target) setActiveGroup(target);
    } else if (activeGroup) {
      const refreshedActiveGroup = nextList.find(
        (group) => group.id === activeGroup.id,
      );

      if (refreshedActiveGroup) {
        setActiveGroup((prev) => ({ ...prev, ...refreshedActiveGroup }));
      }
    }
  };

  const fetchMessages = async (groupId: string) => {
    setLoadingMsgs(true);

    let data: any[] | null = null;
    let err: { message?: string } | null = null;

    const primary = await supabase
      .from("messages")
      .select("id, group_id, user_id, text, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200);

    data = primary.data;
    err = primary.error;

    if (err) {
      const fallback = await supabase
        .from("messages")
        .select("id, group_id, sender_id, content, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);

      data = fallback.data;
      err = fallback.error;
    }

    if (err) {
      setError("تعذر جلب الرسائل");
      setLoadingMsgs(false);
      return;
    }

    setMessages((data ?? []).map(normalizeMessage));
    setLoadingMsgs(false);
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
  };

  const subscribeRealtime = (groupId: string) => {
    realtimeRef.current?.unsubscribe();

    realtimeRef.current = supabase
      .channel(`chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = normalizeMessage(payload.new);
          setMessages((prev) => {
            if (prev.find((message) => message.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          syncLocalGroupPreview(groupId, newMsg.content, newMsg.created_at, 0);
          if (newMsg.sender_id !== me?.id) {
            void markGroupAsRead(groupId);
          }
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            60,
          );
        },
      )
      .subscribe();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeGroup || !me) return;

    const content = msgText.trim();
    setMsgText("");
    setError("");

    const { err, savedRow } = await insertMessageToGroup(
      activeGroup.id,
      me.id,
      content,
    );

    if (err) {
      setError("تعذر إرسال الرسالة");
      setMsgText(content);
      return;
    }

    if (savedRow) {
      const sentMessage = normalizeMessage(savedRow);
      setMessages((prev) => {
        if (prev.find((message) => message.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });
      syncLocalGroupPreview(
        activeGroup.id,
        sentMessage.content,
        sentMessage.created_at,
        0,
      );
      void markGroupAsRead(activeGroup.id);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        60,
      );
    } else {
      fetchMessages(activeGroup.id);
    }
  };

  useEffect(() => {
    if (!activeGroup) return;
    fetchMessages(activeGroup.id);
    subscribeRealtime(activeGroup.id);
    void markGroupAsRead(activeGroup.id);

    return () => {
      realtimeRef.current?.unsubscribe();
    };
  }, [activeGroup?.id]);

  // ── create group ──
  const createGroup = async () => {
    if (!newGroupName.trim() || !me) return;
    setError("");
    setSuccessMsg("");
    setCreating(true);

    const baseGroupData: Record<string, unknown> = {
      name: newGroupName.trim(),
      is_private: false,
      created_by: me.id,
    };

    let grp: Group | null = null;
    let grpErr: { message?: string } | null = null;

    if (groupImage) {
      const withImage = await supabase
        .from("groups")
        .insert({ ...baseGroupData, avatar_url: groupImage })
        .select()
        .single();

      grp = withImage.data;
      grpErr = withImage.error;
    }

    if (!grp) {
      const fallbackInsert = await supabase
        .from("groups")
        .insert(baseGroupData)
        .select()
        .single();

      grp = fallbackInsert.data;
      grpErr = fallbackInsert.error;
    }

    if (grpErr || !grp) {
      setError(grpErr?.message || "تعذر إنشاء المجموعة");
      setCreating(false);
      return;
    }

    const createdGroup: Group = {
      ...grp,
      avatar_url: groupImage ?? grp.avatar_url ?? null,
      last_message: grp.last_message ?? undefined,
      last_message_at: grp.last_message_at ?? undefined,
    };

    const { error: memberErr } = await supabase
      .from("group_members")
      .insert({ group_id: createdGroup.id, user_id: me.id });

    if (memberErr) {
      setError(
        memberErr.message || "تم إنشاء القروب لكن تعذر ربطه بعضويتك تلقائيًا",
      );
    }

    setCreating(false);
    setSuccessMsg(`✅ تم إنشاء قروب "${createdGroup.name}" بنجاح!`);
    setNewGroupName("");
    setGroupImage(null);
    setGroups((prev) => mergeGroups([createdGroup, ...prev]));
    await fetchGroups();

    setTimeout(() => {
      setShowNewGroup(false);
      setSuccessMsg("");
      setActiveGroup(createdGroup);
    }, 1600);
  };

  const handleGroupImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageForGroup(file, 300, 0.85);
      setGroupImage(dataUrl);
    } catch {
      /* ignore */
    }
    e.target.value = "";
  };

  const handlePostImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await resizeImageForGroup(file, 1400, 0.92);
      setPostImage(dataUrl);
      setError("");
    } catch {
      setError("تعذر تحميل الصورة");
    }

    e.target.value = "";
  };

  const closeChat = () => {
    setShowNewDM(false);
    setShowNewGroup(false);
    setShowNewPost(false);
    setShowGroupDrawer(false);
    setShowGroupDetails(false);
    setGroupMetaError("");
    onClose?.();
  };

  const closeNewDMModal = () => {
    setShowNewDM(false);
    setDmTarget("");
    setDmDraft("");
    setError("");
  };

  const closeNewPostModal = () => {
    setShowNewPost(false);
    setPostDraft("");
    setPostImage(null);
    setError("");
    onClose?.();
  };

  const handleSelectGroup = (group: Group) => {
    setActiveGroup(group);
    setShowGroupDrawer(false);
    setShowGroupDetails(false);
    setGroupMetaError("");
  };

  const fetchGroupMembers = async (group: Group) => {
    setLoadingMembers(true);
    setGroupMetaError("");

    const membershipRes = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", group.id);

    if (membershipRes.error) {
      setGroupMetaError("تعذر جلب أعضاء القروب");
      setLoadingMembers(false);
      return;
    }

    const memberIds = Array.from(
      new Set(
        (membershipRes.data ?? []).map((row) => row.user_id).filter(Boolean),
      ),
    );

    if (memberIds.length === 0) {
      setGroupMembers([]);
      setLoadingMembers(false);
      return;
    }

    const usersRes = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", memberIds);

    if (usersRes.error) {
      setGroupMetaError("تعذر جلب بيانات أعضاء القروب");
      setLoadingMembers(false);
      return;
    }

    const userMap = new Map(
      (usersRes.data ?? []).map((user) => [user.id, user]),
    );

    const nextMembers = memberIds
      .map((userId) => {
        const user = userMap.get(userId);

        return {
          user_id: userId,
          full_name: user?.full_name,
          email: user?.email,
          isCreator: group.created_by === userId,
        };
      })
      .sort((left, right) => {
        if (left.isCreator) return -1;
        if (right.isCreator) return 1;
        if (left.user_id === me?.id) return -1;
        if (right.user_id === me?.id) return 1;

        return (left.full_name || left.email || left.user_id).localeCompare(
          right.full_name || right.email || right.user_id,
          "ar",
        );
      });

    setGroupMembers(nextMembers);
    setLoadingMembers(false);
  };

  const openGroupDetails = async () => {
    if (!activeGroup) return;

    setShowGroupDetails(true);
    setGroupMembers([]);
    await fetchGroupMembers(activeGroup);
  };

  const removeMemberFromGroup = async (member: GroupMember) => {
    if (!activeGroup || !me || activeGroup.created_by !== me.id) return;
    if (member.isCreator) return;

    const confirmed = window.confirm(
      `هل تريد حذف ${member.full_name || member.email || "هذا المستخدم"} من القروب؟`,
    );

    if (!confirmed) return;

    setManagingGroup(true);
    setGroupMetaError("");

    const { error: deleteErr } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", activeGroup.id)
      .eq("user_id", member.user_id);

    if (deleteErr) {
      setGroupMetaError(deleteErr.message || "تعذر حذف المستخدم من القروب");
      setManagingGroup(false);
      return;
    }

    setGroupMembers((prev) =>
      prev.filter((groupMember) => groupMember.user_id !== member.user_id),
    );
    setManagingGroup(false);
  };

  const deleteActiveGroup = async () => {
    if (!activeGroup || !me || activeGroup.created_by !== me.id) return;

    const confirmed = window.confirm(
      `سيتم حذف القروب \"${friendlyName(activeGroup)}\" نهائيًا. هل تريد المتابعة؟`,
    );

    if (!confirmed) return;

    const deletingGroupId = activeGroup.id;

    setManagingGroup(true);
    setGroupMetaError("");

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", deletingGroupId);
    await supabase.from("messages").delete().eq("group_id", deletingGroupId);

    const { error: deleteErr } = await supabase
      .from("groups")
      .delete()
      .eq("id", deletingGroupId);

    if (deleteErr) {
      setGroupMetaError(deleteErr.message || "تعذر حذف القروب");
      setManagingGroup(false);
      return;
    }

    setGroups((prev) => prev.filter((group) => group.id !== deletingGroupId));
    setMessages([]);
    setActiveGroup(null);
    setShowGroupDetails(false);
    setShowGroupDrawer(false);
    setGroupMembers([]);
    setManagingGroup(false);
    await fetchGroups();
  };

  // ── create DM (private group of 2) ──
  const createDM = async () => {
    if (!dmTarget.trim() || !me) return;
    setError("");
    setCreating(true);
    const initialMessage = dmDraft.trim();

    // find target user by email
    const { data: targetUser, error: findErr } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("email", dmTarget.trim())
      .single();

    if (findErr || !targetUser) {
      setError("لم يتم العثور على هذا المستخدم");
      setCreating(false);
      return;
    }

    const dmName = `DM:${me.id}:${targetUser.id}`;
    const dmKey = buildDmKey(me.id, targetUser.id);

    // check if DM already exists
    const existingByKey = await supabase
      .from("groups")
      .select(
        "id, name, is_private, avatar_url, created_by, dm_key, last_message, last_message_at",
      )
      .eq("dm_key", dmKey)
      .single();

    const existing =
      existingByKey.data ??
      (
        await supabase
          .from("groups")
          .select(
            "id, name, is_private, avatar_url, created_by, last_message, last_message_at",
          )
          .eq("name", dmName)
          .single()
      ).data;

    if (existing) {
      if (initialMessage) {
        const { err: messageErr } = await insertMessageToGroup(
          existing.id,
          me.id,
          initialMessage,
        );

        if (messageErr) {
          setError("تم فتح الدردشة لكن تعذر إرسال الرسالة الأولى");
        }
      }

      setActiveGroup(existing);
      closeNewDMModal();
      setCreating(false);
      return;
    }

    const { data: grp, error: grpErr } = await supabase
      .from("groups")
      .insert({
        name: dmName,
        is_private: true,
        created_by: me.id,
        dm_key: dmKey,
      })
      .select()
      .single();

    if (grpErr) {
      const legacyInsert = await supabase
        .from("groups")
        .insert({ name: dmName, is_private: true, created_by: me.id })
        .select()
        .single();

      if (legacyInsert.error || !legacyInsert.data) {
        setError("تعذر إنشاء الدردشة");
        setCreating(false);
        return;
      }

      await supabase.from("group_members").insert([
        { group_id: legacyInsert.data.id, user_id: me.id },
        { group_id: legacyInsert.data.id, user_id: targetUser.id },
      ]);

      if (initialMessage) {
        const { err: messageErr } = await insertMessageToGroup(
          legacyInsert.data.id,
          me.id,
          initialMessage,
        );

        if (messageErr) {
          setError("تم إنشاء الدردشة لكن تعذر إرسال الرسالة الأولى");
        }
      }

      setCreating(false);
      closeNewDMModal();
      await fetchGroups();
      setActiveGroup({
        ...legacyInsert.data,
        name: targetUser.full_name || targetUser.email || dmName,
      });
      return;
    }

    if (!grp) {
      setError("تعذر إنشاء الدردشة");
      setCreating(false);
      return;
    }

    await supabase.from("group_members").insert([
      { group_id: grp.id, user_id: me.id },
      { group_id: grp.id, user_id: targetUser.id },
    ]);

    if (initialMessage) {
      const { err: messageErr } = await insertMessageToGroup(
        grp.id,
        me.id,
        initialMessage,
      );

      if (messageErr) {
        setError("تم إنشاء الدردشة لكن تعذر إرسال الرسالة الأولى");
      }
    }

    setCreating(false);
    closeNewDMModal();
    await fetchGroups();
    void markGroupAsRead(grp.id);
    setActiveGroup({
      ...grp,
      name: targetUser.full_name || targetUser.email || dmName,
    });
  };

  const createPost = () => {
    if (!me) return;

    const content = postDraft.trim();
    if (!content && !postImage) return;

    const displayName =
      me.full_name?.trim() || me.email?.split("@")[0]?.trim() || "زميع";

    onCreatePost?.({
      id: Date.now(),
      user: displayName,
      handle: buildXHandle(displayName),
      authorId: me.id,
      time: "الآن",
      content,
      image: postImage ?? undefined,
      stats: {
        replies: 0,
        retweets: 0,
        likes: 0,
        shares: 0,
      },
    });

    setPostDraft("");
    setPostImage(null);
  };

  const friendlyName = (g: Group) => {
    if (!g.is_private) return g.name;
    const parts = g.name.split(":");
    return parts.length >= 3 ? `دردشة خاصة` : g.name;
  };

  const filteredGroups = groups.filter((group) =>
    friendlyName(group)
      .toLowerCase()
      .includes(groupSearch.trim().toLowerCase()),
  );

  const showInlineEmptyState =
    !activeGroup &&
    !showNewGroup &&
    !showNewDM &&
    !loadingGroups &&
    filteredGroups.length === 0;

  const canManageActiveGroup = Boolean(
    activeGroup &&
    me &&
    !activeGroup.is_private &&
    activeGroup.created_by === me.id,
  );

  const showComposerMode = (showNewDM || showNewPost) && !activeGroup;
  const dmComposerAvatar = (
    me?.full_name?.trim()?.[0] ||
    me?.email?.trim()?.[0] ||
    "Z"
  ).toUpperCase();
  const composerAvatarUrl =
    profile?.avatar_url ?? authUser?.user_metadata?.avatar_url ?? null;
  const reportActorLabel =
    me?.full_name?.trim() || me?.email?.trim() || authUser?.email || "user";

  useEffect(() => {
    const root = chatRootRef.current;
    if (!root) return;

    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    html.style.overflow = "hidden";

    const viewport = window.visualViewport;
    const baseHeight = viewport?.height ?? window.innerHeight;

    const updateKeyboardOffset = () => {
      const visibleHeight = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboardOffset = Math.max(
        0,
        baseHeight - (visibleHeight + offsetTop),
      );

      root.style.setProperty("--keyboard-offset", `${keyboardOffset}px`);
    };

    updateKeyboardOffset();

    viewport?.addEventListener("resize", updateKeyboardOffset);
    viewport?.addEventListener("scroll", updateKeyboardOffset);

    return () => {
      viewport?.removeEventListener("resize", updateKeyboardOffset);
      viewport?.removeEventListener("scroll", updateKeyboardOffset);
      root.style.setProperty("--keyboard-offset", "0px");

      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      html.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const renderGroupAvatar = (group: Group) => {
    if (group.avatar_url) {
      return (
        <img
          src={group.avatar_url}
          alt={friendlyName(group)}
          className={styles.groupAvatarImg}
        />
      );
    }

    return group.is_private ? "👤" : <Users size={16} />;
  };

  const reportActiveGroup = async () => {
    if (!activeGroup) return;

    try {
      await createAdminReport({
        targetType: "group",
        targetId: activeGroup.id,
        source: "chat",
        summary: friendlyName(activeGroup),
        reason: "بلاغ على قروب من واجهة الدردشة",
        reporterLabel: reportActorLabel,
      });
      window.alert("تم إرسال البلاغ على القروب");
    } catch {
      window.alert("تعذر إرسال البلاغ الآن");
    }
  };

  const reportMessage = async (message: Message) => {
    if (!activeGroup) return;

    try {
      await createAdminReport({
        targetType: "message",
        targetId: message.id,
        source: "chat",
        summary: message.content,
        reason: `بلاغ على رسالة من قروب ${friendlyName(activeGroup)}`,
        reporterLabel: reportActorLabel,
      });
      window.alert("تم إرسال البلاغ على الرسالة");
    } catch {
      window.alert("تعذر إرسال البلاغ الآن");
    }
  };

  // ────────────────────────────── Render ──────────────────────────────
  if (!me) {
    return (
      <div className={styles.centered}>
        <p>يرجى تسجيل الدخول للوصول إلى الدردشة</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.chatOverlay} ${showComposerMode ? styles.chatOverlayComposerMode : ""}`}
      dir="rtl"
    >
      <div
        ref={chatRootRef}
        className={`${styles.chatRoot} ${showComposerMode ? styles.chatRootComposerMode : ""}`}
      >
        {!activeGroup && !showNewDM && !showNewPost && (
          <button className={styles.closeChatBtn} onClick={closeChat}>
            <X size={18} />
          </button>
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`${styles.sidebar} ${showComposerMode ? styles.sidebarHidden : ""}`}
        >
          <header className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>الدردشة</h2>
          </header>

          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              placeholder="بحث"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>

          {error && <p className={styles.errBanner}>{error}</p>}

          {loadingGroups ? (
            <p className={styles.loadingText}>جاري التحميل...</p>
          ) : filteredGroups.length === 0 ? (
            <div className={styles.sidebarEmptyState}>
              <button
                type="button"
                className={styles.createGroupBtn}
                onClick={() => setShowNewGroup(true)}
              >
                <Plus size={18} />
                <span>إنشاء قروب</span>
              </button>
              <p className={styles.emptyText}>
                اختر قروبًا من القائمة أو أنشئ قروبًا جديدًا
              </p>
            </div>
          ) : (
            <ul className={styles.groupList}>
              {filteredGroups.map((g) => (
                <li
                  key={g.id}
                  className={`${styles.groupItem} ${activeGroup?.id === g.id ? styles.groupItemActive : ""}`}
                  onClick={() => handleSelectGroup(g)}
                >
                  <div className={styles.groupAvatar}>
                    {renderGroupAvatar(g)}
                  </div>
                  <div className={styles.groupInfo}>
                    <span className={styles.groupName}>{friendlyName(g)}</span>
                    {g.last_message && (
                      <span className={styles.groupLastMsg}>
                        {g.last_message}
                      </span>
                    )}
                  </div>
                  {(g.unread ?? 0) > 0 && (
                    <span className={styles.unreadBadge}>{g.unread}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!showInlineEmptyState && (
            <div className={styles.sidebarFooter}>Xtik</div>
          )}
        </aside>

        {/* ── Chat Window ── */}
        {activeGroup && (
          <section className={styles.chatWindow}>
            <button
              type="button"
              className={`${styles.drawerBackdrop} ${showGroupDrawer ? styles.drawerBackdropVisible : styles.drawerBackdropHidden}`}
              aria-label="إغلاق قائمة القروبات"
              onClick={() => setShowGroupDrawer(false)}
            />

            <aside
              className={`${styles.groupDrawer} ${showGroupDrawer ? styles.groupDrawerOpen : styles.groupDrawerClosed}`}
            >
              <button
                type="button"
                className={styles.groupDrawerHandle}
                onClick={() => setShowGroupDrawer((current) => !current)}
                title={
                  showGroupDrawer
                    ? "إغلاق قائمة القروبات"
                    : "فتح قائمة القروبات"
                }
                aria-label={
                  showGroupDrawer
                    ? "إغلاق قائمة القروبات"
                    : "فتح قائمة القروبات"
                }
              >
                <Users size={16} />
              </button>

              <header className={styles.groupDrawerHeader}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setShowGroupDrawer(false)}
                  title="إغلاق القائمة"
                >
                  <ArrowRight size={18} />
                </button>
                <span className={styles.groupDrawerTitle}>القروبات</span>
                <span className={styles.modalGhostBtn} />
              </header>

              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  placeholder="بحث"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                />
              </div>

              {error && <p className={styles.errBanner}>{error}</p>}

              {loadingGroups ? (
                <p className={styles.loadingText}>جاري التحميل...</p>
              ) : filteredGroups.length === 0 ? (
                <p className={styles.emptyText}>لا توجد قروبات مطابقة</p>
              ) : (
                <ul className={styles.groupList}>
                  {filteredGroups.map((group) => (
                    <li
                      key={group.id}
                      className={`${styles.groupItem} ${activeGroup.id === group.id ? styles.groupItemActive : ""}`}
                      onClick={() => handleSelectGroup(group)}
                    >
                      <div className={styles.groupAvatar}>
                        {renderGroupAvatar(group)}
                      </div>
                      <div className={styles.groupInfo}>
                        <span className={styles.groupName}>
                          {friendlyName(group)}
                        </span>
                        {group.last_message && (
                          <span className={styles.groupLastMsg}>
                            {group.last_message}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.sidebarFooter}>Xtik</div>
            </aside>

            <header className={styles.chatHeader}>
              <button
                className={styles.backBtn}
                onClick={() => setShowGroupDrawer(true)}
                title="التنقل بين القروبات"
              >
                <Users size={18} />
              </button>

              <button
                type="button"
                className={styles.chatTitleBtn}
                onClick={openGroupDetails}
              >
                <div className={styles.chatGroupAvatar}>
                  {renderGroupAvatar(activeGroup)}
                </div>
                <div className={styles.chatIdentity}>
                  <span className={styles.chatTitle}>
                    {friendlyName(activeGroup)}
                  </span>
                  <span className={styles.chatTitleMeta}>
                    عرض الأعضاء والإدارة
                  </span>
                </div>
              </button>

              <div className={styles.chatHeaderActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="تبليغ على القروب"
                  onClick={() => void reportActiveGroup()}
                >
                  <Flag size={17} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="إغلاق الدردشة"
                  onClick={closeChat}
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className={styles.messages}>
              {loadingMsgs ? (
                <p className={styles.loadingText}>جاري تحميل الرسائل...</p>
              ) : messages.length === 0 ? (
                <p className={styles.emptyText}>لا توجد رسائل بعد، كن الأول!</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.msgBubble} ${msg.sender_id === me.id ? styles.msgMine : styles.msgOther}`}
                  >
                    {msg.sender_id !== me.id && (
                      <span className={styles.msgSender}>
                        {msg.sender_name ?? msg.sender_id.slice(0, 6)}
                      </span>
                    )}
                    <p className={styles.msgContent}>{msg.content}</p>
                    <div className={styles.msgMetaRow}>
                      <span className={styles.msgTime}>
                        {new Date(msg.created_at).toLocaleTimeString("ar", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.sender_id !== me.id && (
                        <button
                          type="button"
                          className={styles.msgReportBtn}
                          title="تبليغ على الرسالة"
                          onClick={() => void reportMessage(msg)}
                        >
                          <Flag size={12} />
                          <span>بلاغ</span>
                        </button>
                      )}
                    </div>
                    {msg.sender_id === me.id && (
                      <Check size={12} className={styles.msgCheck} />
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form className={styles.inputRow} onSubmit={sendMessage}>
              <div className={styles.msgComposer}>
                <button type="button" className={styles.attachBtn}>
                  <Plus size={18} />
                </button>
                <input
                  className={styles.msgInput}
                  placeholder="اكتب رسالة..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className={styles.shootBtn}
                disabled={!msgText.trim()}
              >
                <Camera size={17} />
                <span>شوت</span>
              </button>
            </form>
          </section>
        )}
      </div>

      {showGroupDetails && activeGroup && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowGroupDetails(false)}
        >
          <div
            className={`${styles.modal} ${styles.groupDetailsModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <span>{friendlyName(activeGroup)}</span>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setShowGroupDetails(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.groupDetailsHint}>
              اضغط على العضو لإدارته، ويمكن لمالك القروب حذف الأعضاء أو حذف
              القروب بالكامل.
            </p>

            {groupMetaError && (
              <p className={styles.errBanner}>{groupMetaError}</p>
            )}

            {loadingMembers ? (
              <p className={styles.loadingText}>جاري تحميل أعضاء القروب...</p>
            ) : groupMembers.length === 0 ? (
              <p className={styles.emptyText}>
                لا يوجد أعضاء ظاهرون في هذا القروب.
              </p>
            ) : (
              <div className={styles.memberList}>
                {groupMembers.map((member) => (
                  <div key={member.user_id} className={styles.memberRow}>
                    <div className={styles.memberMeta}>
                      <span className={styles.memberName}>
                        {member.full_name ||
                          member.email ||
                          member.user_id.slice(0, 8)}
                      </span>
                      <span className={styles.memberEmail}>
                        {member.email || member.user_id}
                      </span>
                    </div>

                    <div className={styles.memberActions}>
                      {member.isCreator && (
                        <span className={styles.memberBadge}>المالك</span>
                      )}

                      {canManageActiveGroup && !member.isCreator && (
                        <button
                          type="button"
                          className={styles.memberDeleteBtn}
                          title="حذف العضو"
                          onClick={() => removeMemberFromGroup(member)}
                          disabled={managingGroup}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!canManageActiveGroup && (
              <p className={styles.groupOwnerNote}>
                إدارة الحذف متاحة فقط لمالك القروب.
              </p>
            )}

            {canManageActiveGroup && (
              <button
                type="button"
                className={styles.deleteGroupBtn}
                onClick={deleteActiveGroup}
                disabled={managingGroup}
              >
                <Trash2 size={16} />
                <span>{managingGroup ? "جاري الحذف..." : "حذف القروب"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── New Group Modal ── */}
      {showNewGroup && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!successMsg) {
              setShowNewGroup(false);
              setGroupImage(null);
              setNewGroupName("");
            }
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {successMsg ? (
              <div className={styles.successWrap}>
                <span className={styles.successIcon}>✅</span>
                <p className={styles.successText}>{successMsg}</p>
              </div>
            ) : (
              <>
                <div className={styles.modalHeaderCentered}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => {
                      setShowNewGroup(false);
                      setGroupImage(null);
                      setNewGroupName("");
                    }}
                  >
                    <X size={18} />
                  </button>
                  <span>انشاء قروب جديد</span>
                  <span className={styles.modalGhostBtn} />
                </div>

                <div className={styles.groupCreatorLayout}>
                  <div className={styles.groupCreatorMain}>
                    <input
                      className={styles.modalInput}
                      placeholder="اسم القروب"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createGroup()}
                      autoFocus
                    />
                  </div>

                  <div className={styles.groupImgWrap}>
                    <button
                      type="button"
                      className={styles.groupImgBtn}
                      onClick={() => imageRef.current?.click()}
                    >
                      {groupImage ? (
                        <img
                          src={groupImage}
                          alt="group"
                          className={styles.groupImgPreview}
                        />
                      ) : (
                        <Plus size={34} className={styles.groupImgIcon} />
                      )}
                    </button>
                    <span className={styles.groupImgLabel}>اضافة صورة</span>
                    <input
                      ref={imageRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleGroupImageChange}
                    />
                  </div>
                </div>

                <button
                  className={styles.modalBtn}
                  onClick={createGroup}
                  disabled={creating || !newGroupName.trim()}
                >
                  {creating ? "جاري الإنشاء..." : "إنشاء"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── New DM Modal ── */}
      {showNewDM && (
        <div
          className={`${styles.modalOverlay} ${styles.dmComposeOverlay}`}
          onClick={closeNewDMModal}
        >
          <div
            className={`${styles.modal} ${styles.dmComposeModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dmComposeHeader}>
              <button className={styles.iconBtn} onClick={closeNewDMModal}>
                <X size={18} />
              </button>
              <button
                className={styles.dmComposeSubmit}
                onClick={createDM}
                disabled={creating || !dmTarget.trim()}
              >
                {creating ? "جاري البدء..." : "ابدأ"}
              </button>
            </div>

            <div className={styles.dmComposeBody}>
              <div className={styles.dmComposerAvatar}>
                {composerAvatarUrl ? (
                  <img
                    src={composerAvatarUrl}
                    alt="avatar"
                    className={styles.dmComposerAvatarImg}
                  />
                ) : (
                  dmComposerAvatar
                )}
              </div>

              <div className={styles.dmComposeFields}>
                <input
                  className={`${styles.modalInput} ${styles.dmRecipientInput}`}
                  placeholder="إيميل المستخدم"
                  type="email"
                  value={dmTarget}
                  onChange={(e) => setDmTarget(e.target.value)}
                  autoFocus
                />

                <textarea
                  className={styles.dmComposeTextarea}
                  placeholder="ماذا يحدث؟"
                  value={dmDraft}
                  onChange={(e) => setDmDraft(e.target.value)}
                />

                <div className={styles.dmComposeMeta}>
                  <Users size={16} />
                  <span>يمكن بدء الدردشة الخاصة مباشرة</span>
                </div>
              </div>
            </div>

            <div className={styles.dmComposeToolbar}>
              <button type="button" className={styles.dmComposeToolBtn}>
                <ImageIcon size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <Camera size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <Smile size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <List size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <CalendarDays size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <MapPin size={22} />
              </button>
            </div>

            {error && <p className={styles.errBanner}>{error}</p>}
          </div>
        </div>
      )}

      {showNewPost && (
        <div
          className={`${styles.modalOverlay} ${styles.dmComposeOverlay}`}
          onClick={closeNewPostModal}
        >
          <div
            className={`${styles.modal} ${styles.dmComposeModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dmComposeHeader}>
              <button className={styles.iconBtn} onClick={closeNewPostModal}>
                <X size={18} />
              </button>
              <button
                className={styles.dmComposeSubmit}
                onClick={createPost}
                disabled={!postDraft.trim() && !postImage}
              >
                نشر
              </button>
            </div>

            <div className={styles.dmComposeBody}>
              <div className={styles.dmComposerAvatar}>
                {composerAvatarUrl ? (
                  <img
                    src={composerAvatarUrl}
                    alt="avatar"
                    className={styles.dmComposerAvatarImg}
                  />
                ) : (
                  dmComposerAvatar
                )}
              </div>

              <div className={styles.dmComposeFields}>
                <textarea
                  className={styles.dmComposeTextarea}
                  placeholder="ماذا يحدث؟"
                  value={postDraft}
                  onChange={(e) => setPostDraft(e.target.value)}
                  autoFocus
                />

                <div className={styles.dmComposeMeta}>
                  <Users size={16} />
                  <span>بإمكان الجميع الرد</span>
                </div>

                {postImage && (
                  <div className={styles.postImagePreviewWrap}>
                    <img
                      src={postImage}
                      alt="post preview"
                      className={styles.postImagePreview}
                    />
                    <button
                      type="button"
                      className={styles.postImageRemoveBtn}
                      onClick={() => setPostImage(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.dmComposeToolbar}>
              <button
                type="button"
                className={styles.dmComposeToolBtn}
                onClick={() => postImageRef.current?.click()}
              >
                <ImageIcon size={22} />
              </button>
              <button
                type="button"
                className={styles.dmComposeToolBtn}
                onClick={() => postImageRef.current?.click()}
              >
                <Camera size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <Smile size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <List size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <CalendarDays size={22} />
              </button>
              <button type="button" className={styles.dmComposeToolBtn}>
                <MapPin size={22} />
              </button>
            </div>

            <input
              ref={postImageRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePostImageChange}
            />

            {error && <p className={styles.errBanner}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function resizeImageForGroup(
  file: File,
  maxSize: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else {
          if (h > maxSize) {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
