import React, { useEffect, useState } from "react";
import { firebaseDB } from "@/config/FirebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { Product } from "@/interfaces/Product";
import { toast } from "react-toastify";

export function useGetWishListProduct(accountId: string) {
  const [wishList, setWishList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firebaseDB, `/accounts/${accountId}/wishlist`),
      async (snapshot) => {
        const newWishList = snapshot.docs.map((doc) =>
          Product.fromFirestore(doc.id, doc.data())
        );

        setWishList(newWishList);
        setIsLoading(false);
      }
    );

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, [accountId]); // Depend on userId so it reruns the effect when userId changes

  return { wishList, isLoading };
}

export function useAddWishList(accountId: string) {
  const addWishList = async (product: Product) => {
    try {
      if (!accountId) {
        toast.error("Please login first.");
        return { ok: false, message: "User does not exist" };
      }

      // check if product already exists in wishlist
      const querySnapshot = await getDocs(
        collection(firebaseDB, `/accounts/${accountId}/wishlist`)
      );
      const existingProduct = querySnapshot.docs.find(
        (doc) => doc.id === product._id
      );
      if (existingProduct) {
        // remove product from wishlist
        await deleteDoc(
          doc(firebaseDB, `/accounts/${accountId}/wishlist/${product._id}`)
        );
        toast.warning("Product removed from wishlist");
        return { ok: true, message: "Product removed from wishlist" };
      }

      const docRef = doc(
        firebaseDB,
        `/accounts/${accountId}/wishlist/${product._id}`
      );
      await setDoc(docRef, { ...product });
      toast.success("Product added to wishlist");
    } catch (e) {
      return { ok: false, message: "Failed to add product to wishlist" };
    }
  };

  return { addWishList };
}

export function useRemoveWishList(accountId: string) {
  const removeWishList = async (productId: string) => {
    try {
      await deleteDoc(
        doc(firebaseDB, `/accounts/${accountId}/wishlist/${productId}`)
      );
      return { ok: true, message: "Product removed from wishlist" };
    } catch (e) {
      return { ok: false, message: "Failed to remove product from wishlist" };
    }
  };

  return { removeWishList };
}
