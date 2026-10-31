import { NotificationInbox } from "../../../shared/notifications/NotificationInbox";

/** MB Shop bildirim kutusu: siparis durumu ve MB Shop kampanyalari (MB FIT bildirimlerinden ayri). */
export default function StoreNotificationsRoute() {
  return <NotificationInbox app="mbshop" />;
}
