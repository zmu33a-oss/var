import React, { useState } from 'react';
import styles from '../pages-css/botonfans.module.css';

const BotonFans = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [startY, setStartY] = useState(0);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // منطق السحب
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;

    if (startY < endY - 50) {
      setIsOpen(true);
    } else if (startY > endY + 50) {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className={`${styles.dropdownContainer} ${!isOpen ? styles.closed : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.dropdownContent}>
        <div className={styles.infoCard}>أخبار الجماهير</div>
        <div className={styles.infoCard}>تفاعل الجماهير</div>
        <div className={styles.infoCard}>أفضل المشجعين</div>
      </div>

      <div className={styles.tabHandle} onClick={toggleDropdown}>
        جمهور الهلال 🔥
      </div>
    </div>
  );
};

export default BotonFans;