import { CircleEllipsis, Heart, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "../pages-css/ProfilePage.module.css";

export type PostItem = {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  initialLikes: number;
  publishedAt: string;
};

type PostCardProps = {
  post: PostItem;
  onShare?: (post: PostItem) => void;
};

export default function PostCard({ post, onShare }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.initialLikes);

  const likesLabel = useMemo(() => likes.toLocaleString(), [likes]);

  const handleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikes((count) => count + (next ? 1 : -1));
      return next;
    });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post);
      return;
    }
    window.alert(`Share clicked for: ${post.title}`);
  };

  return (
    <article className={styles.postCard}>
      <img src={post.imageUrl} alt={post.title} className={styles.postImage} />

      <div className={styles.postContent}>
        <div className={styles.postTopRow}>
          <h3>{post.title}</h3>
          <time>{post.publishedAt}</time>
        </div>

        <p>{post.caption}</p>

        <div className={styles.postActions}>
          <button
            type="button"
            className={`${styles.actionBtn} ${liked ? styles.likeActive : ""}`}
            onClick={handleLike}
            aria-pressed={liked}
          >
            <Heart size={18} />
            <span>{likesLabel}</span>
          </button>

          <div className={styles.shareArea}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.moreBtn}`}
              aria-label="More actions"
            >
              <CircleEllipsis size={18} />
            </button>

            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleShare}
              aria-label={`Share ${post.title}`}
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
