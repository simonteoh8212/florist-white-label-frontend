"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { StoreConfig } from "@/config/stores";
import { StoreEmergencyStatus } from "@/lib/storeStatus";
import { useTranslation } from "@/i18n/localeStore";
import {
  CalendarClock,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";

interface StorePausedAnnouncementModalProps {
  store: StoreConfig;
  storeStatus?: StoreEmergencyStatus;
}

interface NextWorkingDayInfo {
  dateStr: string;
  labelEn: string;
  labelZh: string;
  isTomorrow: boolean;
}

/**
 * Computes the next valid operating day by checking tomorrow blocks,
 * weekly rest days (closedDaysOfWeek), and specific blackout dates.
 */
function computeNextWorkingDay(
  store: StoreConfig,
  storeStatus?: StoreEmergencyStatus
): NextWorkingDayInfo {
  const closedDays = store.deliveryTimeConfig?.closedDaysOfWeek || [];
  const blackoutDates = store.deliveryTimeConfig?.blackoutDates || [];
  const isTomorrowBlocked = Boolean(storeStatus?.isTomorrowBlocked);

  const dayNamesEn = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayNamesZh = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const monthNamesEn = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let offset = 1; offset <= 14; offset++) {
    const candidate = new Date();
    candidate.setDate(candidate.getDate() + offset);

    const yyyy = candidate.getFullYear();
    const mm = String(candidate.getMonth() + 1).padStart(2, "0");
    const dd = String(candidate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = candidate.getDay();

    // Check if tomorrow is specifically blocked by the florist
    if (offset === 1 && isTomorrowBlocked) {
      continue;
    }

    // Check if this weekday is closed
    if (closedDays.includes(dayOfWeek)) {
      continue;
    }

    // Check if this date is a blackout date
    if (blackoutDates.includes(dateStr)) {
      continue;
    }

    // Found valid operating day!
    const isTomorrow = offset === 1;
    const dayNameEn = dayNamesEn[dayOfWeek];
    const dayNameZh = dayNamesZh[dayOfWeek];
    const monthEn = monthNamesEn[candidate.getMonth()];
    const dateNum = candidate.getDate();

    const labelEn = isTomorrow
      ? `Tomorrow (${dayNameEn}, ${monthEn} ${dateNum})`
      : `${dayNameEn}, ${monthEn} ${dateNum}`;

    const labelZh = isTomorrow
      ? `明天（${dayNameZh}，${candidate.getMonth() + 1}月${dateNum}日）`
      : `${dayNameZh}（${candidate.getMonth() + 1}月${dateNum}日）`;

    return { dateStr, labelEn, labelZh, isTomorrow };
  }

  // Fallback
  return {
    dateStr: "",
    labelEn: "Next Working Day",
    labelZh: "下一个营业日",
    isTomorrow: false,
  };
}

export function StorePausedAnnouncementModal({
  store,
  storeStatus,
}: StorePausedAnnouncementModalProps) {
  const { locale } = useTranslation();
  const isZh = locale === "zh";

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const todayDayOfWeek = useMemo(() => new Date().getDay(), []);

  // Determine pause/closure conditions
  const isTodayPaused = Boolean(storeStatus?.isTodayPaused);
  const isWeeklyClosedDay = Boolean(
    store.deliveryTimeConfig?.closedDaysOfWeek?.includes(todayDayOfWeek)
  );
  const isBlackoutDate = Boolean(
    store.deliveryTimeConfig?.blackoutDates?.includes(todayStr)
  );

  const isNotOperatingToday =
    isTodayPaused || isWeeklyClosedDay || isBlackoutDate;

  // Next operating day
  const nextWorkingDay = useMemo(
    () => computeNextWorkingDay(store, storeStatus),
    [store, storeStatus]
  );

  // Modal display state (session-aware)
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isNotOperatingToday) {
      setIsOpen(false);
      return;
    }

    // Check if customer already dismissed this announcement in current session
    try {
      const sessionKey = `florist_pause_notice_${store.slug}_${todayStr}`;
      const dismissed = sessionStorage.getItem(sessionKey);
      if (!dismissed) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, [isNotOperatingToday, store.slug, todayStr]);

  if (!isOpen || !isNotOperatingToday) {
    return null;
  }

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      const sessionKey = `florist_pause_notice_${store.slug}_${todayStr}`;
      sessionStorage.setItem(sessionKey, "true");
    } catch {
      // ignore
    }
  };

  const handlePreOrderClick = () => {
    handleDismiss();
    // Scroll down to catalog smoothly
    const catalogEl =
      document.getElementById("catalog-section") ||
      document.querySelector("main section:nth-of-type(2)");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // WhatsApp general inquiry link
  const cleanPhone = store.whatsapp.replace(/[^0-9]/g, "");
  const waPreOrderMessage = isZh
    ? `你好 ${store.name}，请问可以向您咨询预订 ${nextWorkingDay.labelZh} 的鲜花订单吗？`
    : `Hi ${store.name}, I'd like to check about pre-ordering flowers for ${nextWorkingDay.labelEn}.`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    waPreOrderMessage
  )}`;

  // Status Titles & Subtitles
  let badgeText = isZh ? "今日即日配送暂停" : "Same-Day Delivery Paused Today";
  let mainTitle = isZh
    ? "本店今日暂停即日送花"
    : "Same-Day Delivery Paused Today";
  let description = isZh
    ? "因单量已满或花艺师正在全力筹备中，本店今日暂停接收新的即日当日送达订单。"
    : "Due to high order volume or atelier capacity, our florists are not taking new same-day delivery orders for today.";

  if (isWeeklyClosedDay && !isTodayPaused) {
    badgeText = isZh ? "今日店铺例休" : "Shop Regular Rest Day";
    mainTitle = isZh ? "今日店铺例行休息" : "Studio Closed Today";
    description = isZh
      ? "今天是本店每周常规例休备花日，当日无法即时发货，欢迎提前预订后续营业日的花礼！"
      : "Today is our weekly rest and fresh bloom preparation day. Same-day dispatches are unavailable.";
  } else if (isBlackoutDate && !isTodayPaused) {
    badgeText = isZh ? "特别节日休业" : "Special Holiday Closure";
    mainTitle = isZh ? "今日公休" : "Closed for Special Holiday";
    description = isZh
      ? "今日为本店特别休息日，现已开放下一营业日的花礼预约。"
      : "Our atelier is closed today for a special occasion. We are actively accepting pre-orders for our next working day.";
  }

  const targetDateLabel = isZh
    ? nextWorkingDay.labelZh
    : nextWorkingDay.labelEn;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200/90 shadow-2xl overflow-hidden relative animate-scale-up">
        {/* Top Accent Strip */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: store.primaryColor }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors flex items-center justify-center cursor-pointer shadow-2xs z-10"
          aria-label="Close Announcement"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 text-center space-y-4">
          {/* Badge & Icon */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                <CalendarClock className="h-8 w-8 stroke-[1.8]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80">
              <AlertTriangle className="h-3 w-3 text-amber-700" />
              <span>{badgeText}</span>
            </span>
          </div>

          {/* Heading & Reason */}
          <div>
            <h3 className="text-lg font-bold text-stone-900 tracking-tight leading-snug">
              {mainTitle}
            </h3>
            <p className="mt-1.5 text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              {description}
            </p>
          </div>

          {/* Florist Custom Announcement / Emergency Notice (if set) */}
          {storeStatus?.emergencyNotice && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-left flex items-start gap-2.5 shadow-2xs">
              <Info className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 leading-relaxed">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800 mb-0.5">
                  {isZh ? "花店最新通告" : "Florist Note:"}
                </span>
                <span>{storeStatus.emergencyNotice}</span>
              </div>
            </div>
          )}

          {/* Pre-Order Advance Booking Highlight Box */}
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/90 p-4 text-left shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                {isZh
                  ? "支持提前预订后续营业日"
                  : "Pre-Orders Welcome for Next Working Day"}
              </span>
            </div>
            <p className="text-[11px] text-emerald-950/80 leading-relaxed">
              {isZh
                ? "您仍可在此正常浏览选购花礼，并预约选择最早于以下营业日送达或自取："
                : "You can still browse our fresh floral catalog and schedule your bouquet delivery or store pickup starting:"}
            </p>

            <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <Calendar className="h-4 w-4 text-emerald-700" />
                <span>{targetDateLabel}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                {isZh ? "开放预订中" : "Slots Open"}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handlePreOrderClick}
              className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isZh
                  ? `浏览花礼并预订 (${targetDateLabel})`
                  : `Browse Flowers & Pre-Order for ${nextWorkingDay.isTomorrow ? "Tomorrow" : "Next Working Day"}`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs border border-stone-200 transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <Image
                src="/icons/whatsapp.svg"
                alt="WhatsApp"
                width={15}
                height={15}
                className="h-3.5 w-3.5 shrink-0"
                unoptimized
              />
              <span>
                {isZh ? "有紧急问题？联系花艺师" : "Urgent request? Chat on WhatsApp"}
              </span>
            </a>
          </div>

          <p className="text-[10px] text-stone-400">
            {isZh
              ? "点击上方按钮即可进入花礼目录预约后续日期"
              : "Click above to view our bouquets and reserve your delivery slot"}
          </p>
        </div>
      </div>
    </div>
  );
}
