import React from "react";
import styles from "../pages-css/ProfileX.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileX: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <>
      <div
        className={`${styles["overlay"]} ${
          isOpen ? styles["overlay-open"] : ""
        }`}
        onClick={onClose}
      ></div>

      <div
        className={`${styles["profile-x"]} ${
          isOpen ? styles["open"] : ""
        }`}
      >
        <div className={styles["profile-header"]}>
          <div className={styles["avatar"]}></div>
        </div>

        <div className={styles["profile-menu"]}>
          <button
            className={`${styles["menu-item"]} ${
              isOpen ? styles["item-show"] : styles["item-hide"]
            }`}
          >
            + رسالة جديدة
          </button>

          <button
            className={`${styles["menu-item"]} ${
              isOpen ? styles["item-show"] : styles["item-hide"]
            }`}
          >
            القروبات +
          </button>

          <button
            className={`${styles["menu-item"]} ${
              isOpen ? styles["item-show"] : styles["item-hide"]
            }`}
          >
            لايك
          </button>

          <button
            className={`${styles["menu-item"]} ${
              isOpen ? styles["item-show"] : styles["item-hide"]
            }`}
          >
            شير
          </button>

          <button
            className={`${styles["menu-item"]} ${
              isOpen ? styles["item-show"] : styles["item-hide"]
            }`}
          >
            تعليقات
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileX;