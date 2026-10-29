import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActivityCalendarResponse, CalendarDay } from "../../../../services/api/types";
import { fetchCalendar, peekCalendar } from "../../../../shared/calendar/calendarCache";
import { buildMonthGrid } from "../../../../shared/calendar/dates";

/**
 * Gorunen ayin izgarasi (Pazartesi baslangicli, komsu ay gunleri dahil) icin takvim verisini tek istekte
 * getirir ve onbellege alir. Ay degisince once onbellek gosterilir; `refresh` agdan tazeler. `enabled` false iken
 * (takvim kapaliyken) istek atilmaz.
 */
export function useMonthCalendar(year: number, month: number, enabled = true) {
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const [data, setData] = useState<ActivityCalendarResponse | null>(() => peekCalendar(grid.from, grid.to) ?? null);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const forceNext = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const cached = peekCalendar(grid.from, grid.to);
    setData(cached ?? null);
    setError(false);
    setLoading(!cached);
    const force = forceNext.current;
    forceNext.current = false;
    fetchCalendar(grid.from, grid.to, { force, signal: controller.signal })
      .then((response) => {
        setData(response);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [grid.from, grid.to, reloadTick, enabled]);

  const days = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    data?.days.forEach((day) => map.set(day.date, day));
    return map;
  }, [data]);

  const refresh = useCallback(() => {
    forceNext.current = true;
    setReloadTick((tick) => tick + 1);
  }, []);

  return { grid, data, days, loading, error, refresh };
}
