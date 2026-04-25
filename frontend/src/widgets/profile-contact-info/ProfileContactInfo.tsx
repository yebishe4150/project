import { useState, type ReactNode } from "react"
import {
  Camera,
  CircleUserRound,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Send,
} from "lucide-react"
import styles from "./ProfileContactInfo.module.css"

export type ContactInfoValues = {
  email: string
  phoneNumber: string
  login: string
}

type Props = {
  initialValues: ContactInfoValues
  onCancel: () => void
  onSave: (values: ContactInfoValues) => void
}

type Field = {
  key: keyof ContactInfoValues
  label: string
  placeholder: string
  icon: ReactNode
  type?: "text" | "email" | "tel"
}

const fields: Field[] = [
  {
    key: "email",
    label: "Email",
    placeholder: "your.email@example.com",
    type: "email",
    icon: <Mail aria-hidden="true" />,
  },
  {
    key: "phoneNumber",
    label: "Phone Number",
    placeholder: "+1 (555) 000-0000",
    type: "tel",
    icon: <Phone aria-hidden="true" />,
  },
  {
    key: "login",
    label: "Login",
    placeholder: "username",
    icon: <CircleUserRound aria-hidden="true" />,
  },
]

type SocialItem = {
  label: string
  className: string
  icon: ReactNode
}

const socialItems: SocialItem[] = [
  {
    label: "Instagram",
    className: styles.instagram,
    icon: <Camera aria-hidden="true" />,
  },
  {
    label: "Telegram",
    className: styles.telegram,
    icon: <Send aria-hidden="true" />,
  },
  {
    label: "VK",
    className: styles.vk,
    icon: <MessageCircle aria-hidden="true" />,
  },
  {
    label: "YouTube",
    className: styles.youtube,
    icon: <Play aria-hidden="true" />,
  },
  {
    label: "Facebook",
    className: styles.facebook,
    icon: <Globe aria-hidden="true" />,
  },
]

export const ProfileContactInfo = ({ initialValues, onCancel, onSave }: Props) => {
  const [values, setValues] = useState(initialValues)

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>Edit Profile</h2>

        <div className={styles.fields}>
          {fields.map((field) => (
            <label className={styles.field} key={field.key}>
              <span className={styles.label}>
                <span className={styles.labelIcon}>{field.icon}</span>
                {field.label}
              </span>

              <input
                className={styles.input}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>

        <div className={styles.socialTitle}>Connect Social Media</div>

        <div className={styles.socialRow}>
          {socialItems.map((item) => (
            <button key={item.label} className={`${styles.socialButton} ${item.className}`} type="button" aria-label={item.label}>
              {item.icon}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.saveButton} type="button" onClick={() => onSave(values)}>
            Save Changes
          </button>
        </div>
      </div>
    </section>
  )
}
