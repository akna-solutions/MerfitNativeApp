import { NotificationInbox } from "../../../shared/notifications/NotificationInbox";

/** MB FIT bildirim kutusu. MB Shop bildirimleri burada degil, /pages/store/notifications'ta listelenir. */
export default function NotificationsScreen() {
  return <NotificationInbox app="mbfit" />;
}
