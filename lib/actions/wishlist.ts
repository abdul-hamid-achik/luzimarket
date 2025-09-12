"use server";

import { db } from "@/db";
import { wishlists, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addToWishlist(productId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "You must be logged in to add items to wishlist" };
  }

  try {
    // Check if already in wishlist
    const existing = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.userId, session.user.id),
        eq(wishlists.productId, productId)
      ),
    });

    if (existing) {
      return { error: "Item already in wishlist" };
    }

    // Add to wishlist
    await db.insert(wishlists).values({
      userId: session.user.id,
      productId,
    });

    revalidatePath("/wishlist");
    return { success: true };
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return { error: "Failed to add item to wishlist" };
  }
}

export async function removeFromWishlist(productId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "You must be logged in to remove items from wishlist" };
  }

  try {
    await db.delete(wishlists).where(
      and(
        eq(wishlists.userId, session.user.id),
        eq(wishlists.productId, productId)
      )
    );

    revalidatePath("/wishlist");
    return { success: true };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return { error: "Failed to remove item from wishlist" };
  }
}

export async function getUserWishlist() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  try {
    const items = await db.query.wishlists.findMany({
      where: eq(wishlists.userId, session.user.id),
      with: {
        product: {
          with: {
            vendor: true,
            category: true,
          }
        }
      },
      orderBy: (wishlists, { desc }) => [desc(wishlists.addedAt)],
    });

    return items.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      image: item.product.images?.[0] || "",
      vendorId: item.product.vendorId,
      vendorName: item.product.vendor.businessName,
      addedAt: item.addedAt,
    }));
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
}

export async function syncWishlistFromLocal(localItems: string[]) {
  const session = await auth();
  
  if (!session?.user?.id || !localItems.length) {
    return { success: false };
  }

  try {
    // Get existing wishlist items
    const existing = await db.query.wishlists.findMany({
      where: eq(wishlists.userId, session.user.id),
      columns: {
        productId: true,
      }
    });

    const existingIds = new Set(existing.map(item => item.productId));
    
    // Add items not already in database
    const toAdd = localItems.filter(id => !existingIds.has(id));
    
    if (toAdd.length > 0) {
      await db.insert(wishlists).values(
        toAdd.map(productId => ({
          userId: session.user.id,
          productId,
        }))
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing wishlist:", error);
    return { success: false };
  }
}