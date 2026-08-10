import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "odysseus_wishlist";

type WishlistContextType = {
  wishlist: string[];

  isSaved: (id: string) => boolean;

  toggleWishlist: (id: string) => void;

  removeFromWishlist: (id: string) => void;
};

const WishlistContext =
  createContext<WishlistContextType | undefined>(
    undefined
  );

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Wishlist load error:", error);
    }
  }

  async function saveWishlist(items: string[]) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.log("Wishlist save error:", error);
    }
  }

  function isSaved(id: string) {
    return wishlist.includes(id);
  }

  function toggleWishlist(id: string) {
    setWishlist((current) => {
      let updated: string[];

      if (current.includes(id)) {
        updated = current.filter(
          (itemId) => itemId !== id
        );
      } else {
        updated = [...current, id];
      }

      saveWishlist(updated);

      return updated;
    });
  }

  function removeFromWishlist(id: string) {
    setWishlist((current) => {
      if (!current.includes(id)) {
        return current;
      }

      const updated = current.filter(
        (itemId) => itemId !== id
      );

      saveWishlist(updated);

      return updated;
    });
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isSaved,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}
