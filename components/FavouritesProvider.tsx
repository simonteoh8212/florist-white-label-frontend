"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ToastData {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface FavouritesContextType {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => boolean;
  remove: (id: string) => void;
  isFavouritesOpen: boolean;
  setIsFavouritesOpen: (open: boolean) => void;
  openFavourites: () => void;
  closeFavourites: () => void;
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
}

const FavouritesContext = createContext<FavouritesContextType | null>(null);

const KEY = "af-wish";

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isFavouritesOpen, setIsFavouritesOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydration safety: render with empty list first, then load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setIds(parsed);
        }
      }
    } catch (err) {
      console.warn("Failed to load wishlist from localStorage:", err);
    }
  }, []);

  const save = useCallback((nextIds: string[]) => {
    setIds(nextIds);
    try {
      localStorage.setItem(KEY, JSON.stringify(nextIds));
    } catch (err) {
      console.warn("Failed to save wishlist to localStorage:", err);
    }
  }, []);

  const showToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ message, action });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 1800);
    },
    []
  );

  const toggle = useCallback(
    (id: string) => {
      const on = !ids.includes(id);
      const next = on ? [...ids, id] : ids.filter((x) => x !== id);
      save(next);

      if (on) {
        showToast("Saved to favourites", {
          label: "View ›",
          onClick: () => setIsFavouritesOpen(true),
        });
      } else {
        showToast("Removed from favourites");
      }

      return on;
    },
    [ids, save, showToast]
  );

  const remove = useCallback(
    (id: string) => {
      const next = ids.filter((x) => x !== id);
      save(next);
      showToast("Removed from favourites");
    },
    [ids, save, showToast]
  );

  const openFavourites = useCallback(() => setIsFavouritesOpen(true), []);
  const closeFavourites = useCallback(() => setIsFavouritesOpen(false), []);

  return (
    <FavouritesContext.Provider
      value={{
        ids,
        has: (id: string) => ids.includes(id),
        toggle,
        remove,
        isFavouritesOpen,
        setIsFavouritesOpen,
        openFavourites,
        closeFavourites,
        showToast,
      }}
    >
      {children}

      {/* Global Wishlist Toast */}
      {toast && (
        <div
          className="toast show cursor-pointer"
          role="status"
          aria-live="polite"
          onClick={() => {
            if (toast.action) {
              toast.action.onClick();
            }
          }}
        >
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="act focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
              onClick={(e) => {
                e.stopPropagation();
                toast.action?.onClick();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </FavouritesContext.Provider>
  );
}

export const useFavourites = (): FavouritesContextType => {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error("useFavourites must be used within a FavouritesProvider");
  }
  return context;
};
