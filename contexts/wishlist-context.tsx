"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useSession } from "next-auth/react";
import { addToWishlist as addToWishlistDB, removeFromWishlist as removeFromWishlistDB, getUserWishlist, syncWishlistFromLocal } from "@/lib/actions/wishlist";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorId: string;
  vendorName: string;
  addedAt?: Date | null;
}

interface WishlistState {
  items: WishlistItem[];
}

type WishlistAction =
  | { type: "ADD_ITEM"; payload: WishlistItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "CLEAR_WISHLIST" }
  | { type: "LOAD_WISHLIST"; payload: WishlistItem[] };

const WishlistContext = createContext<{
  state: WishlistState;
  dispatch: React.Dispatch<WishlistAction>;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  getTotalItems: () => number;
} | null>(null);

const WISHLIST_STORAGE_KEY = "luzimarket-wishlist";

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "ADD_ITEM": {
      const exists = state.items.some(item => item.id === action.payload.id);
      if (exists) return state;

      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };

    case "CLEAR_WISHLIST":
      return {
        ...state,
        items: [],
      };

    case "LOAD_WISHLIST":
      return {
        ...state,
        items: action.payload,
      };

    default:
      return state;
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [state, dispatch] = useReducer(wishlistReducer, {
    items: [],
  });

  // Load wishlist based on authentication status
  useEffect(() => {
    const loadWishlist = async () => {
      if (status === "loading") return;
      
      if (session?.user?.id) {
        // User is logged in, load from database
        const dbWishlist = await getUserWishlist();
        dispatch({ type: "LOAD_WISHLIST", payload: dbWishlist });
        
        // Sync any local items to database
        const localWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (localWishlist) {
          try {
            const parsedWishlist = JSON.parse(localWishlist);
            const productIds = parsedWishlist.map((item: WishlistItem) => item.id);
            await syncWishlistFromLocal(productIds);
            // Clear local storage after sync
            localStorage.removeItem(WISHLIST_STORAGE_KEY);
          } catch (error) {
            console.error("Error syncing local wishlist:", error);
          }
        }
      } else {
        // User is not logged in, load from localStorage
        const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (savedWishlist) {
          try {
            const parsedWishlist = JSON.parse(savedWishlist);
            dispatch({ type: "LOAD_WISHLIST", payload: parsedWishlist });
          } catch (error) {
            console.error("Error loading wishlist from storage:", error);
          }
        }
      }
    };
    
    loadWishlist();
  }, [session, status]);

  // Save wishlist to localStorage only for non-authenticated users
  useEffect(() => {
    if (!session?.user?.id) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items, session]);

  const addToWishlist = async (item: WishlistItem) => {
    // Add to local state immediately for optimistic UI
    dispatch({ type: "ADD_ITEM", payload: item });
    
    // If user is logged in, also save to database
    if (session?.user?.id) {
      const result = await addToWishlistDB(item.id);
      if (result.error) {
        // Revert on error
        dispatch({ type: "REMOVE_ITEM", payload: item.id });
        console.error("Failed to add to wishlist:", result.error);
      }
    }
  };

  const removeFromWishlist = async (id: string) => {
    // Remove from local state immediately for optimistic UI
    dispatch({ type: "REMOVE_ITEM", payload: id });
    
    // If user is logged in, also remove from database
    if (session?.user?.id) {
      const result = await removeFromWishlistDB(id);
      if (result.error) {
        // Revert on error - need to get the item back
        console.error("Failed to remove from wishlist:", result.error);
      }
    }
  };

  const isInWishlist = (id: string) => {
    return state.items.some(item => item.id === id);
  };

  const clearWishlist = () => {
    dispatch({ type: "CLEAR_WISHLIST" });
  };

  const getTotalItems = () => {
    return state.items.length;
  };

  return (
    <WishlistContext.Provider
      value={{
        state,
        dispatch,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        getTotalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    // Instead of throwing an error, return default values for graceful fallback
    console.warn("useWishlist is being used outside of WishlistProvider, returning default values");
    return {
      state: { items: [] },
      dispatch: () => { },
      addToWishlist: () => { },
      removeFromWishlist: () => { },
      isInWishlist: () => false,
      clearWishlist: () => { },
      getTotalItems: () => 0,
    };
  }
  return context;
}