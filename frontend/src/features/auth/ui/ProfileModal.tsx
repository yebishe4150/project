import styles from "./ProfileModal.module.css";

type Props = {
  onClose: () => void;
};

export const ProfileModal = ({ onClose }: Props) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose}>
          x
        </button>

        <h2 className={styles.title}>Profile</h2>
        <p className={styles.text}>
          You are successfully authorized.
        </p>
      </div>
    </div>
  );
};
