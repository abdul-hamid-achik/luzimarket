"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorId: string;
  vendorName: string;
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
  const [state, dispatch] = useReducer(wishlistReducer, {
    items: [],
  });

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        dispatch({ type: "LOAD_WISHLIST", payload: parsedWishlist });
      } catch (error) {
        console.error("Error loading wishlist from storage:", error);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const addToWishlist = (item: WishlistItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeFromWishlist = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
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