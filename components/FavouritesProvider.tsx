"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";

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
      if (action) {
        toast(
          (t) => (
            <span className="flex items-center gap-2 text-xs font-semibold">
              <span>{message}</span>
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  action.onClick();
                }}
                className="ml-1 rounded-md bg-stone-100 hover:bg-stone-200 px-2 py-0.5 text-xs font-bold text-[var(--brand,#be185d)] cursor-pointer"
              >
                {action.label}
              </button>
            </span>
          ),
          { icon: "🌸" }
        );
      } else {
        toast.success(message);
      }
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
