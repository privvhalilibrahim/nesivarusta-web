import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chat_id, user_id, soft_delete } = body;

    if (!chat_id || !user_id) {
      return NextResponse.json(
        { error: "chat_id and user_id are required" },
        { status: 400 }
      );
    }

    if (soft_delete) {
      // SOFT DELETE: Mesajları gerçekten silme, sadece deleted flag'i ekle
      // Bu şekilde veri kaybı olmaz, sadece kullanıcı görmesin
      const messagesSnap = await db
        .collection("messages")
        .where("chat_id", "==", chat_id)
        .where("user_id", "==", user_id)
        .get();

      if (messagesSnap.empty) {
        return NextResponse.json({ success: true, message: "Chat not found" });
      }

      // Batch update - tüm mesajları deleted olarak işaretle
      const batch = db.batch();
      messagesSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          deleted: true,
          deleted_at: new Date(),
        });
      });

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: "Chat soft deleted successfully",
        deleted_count: messagesSnap.docs.length,
      });
    } else {
      // HARD DELETE: Mesajları gerçekten sil
      const messagesSnap = await db
        .collection("messages")
        .where("chat_id", "==", chat_id)
        .where("user_id", "==", user_id)
        .get();

      if (messagesSnap.empty) {
        return NextResponse.json({ success: true, message: "Chat not found" });
      }

      // Batch delete - tüm mesajları sil
      const batch = db.batch();
      messagesSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: "Chat deleted successfully",
        deleted_count: messagesSnap.docs.length,
      });
    }
  } catch (error: any) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat", details: error.message },
      { status: 500 }
    );
  }
}

