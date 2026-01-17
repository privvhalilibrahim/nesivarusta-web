import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Admin authentication kontrolü
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Feedbacks'leri çek (en yeni önce)
    const feedbacksSnap = await db
      .collection("feedbacks")
      .orderBy("created_at", "desc")
      .limit(100) // Son 100 feedback
      .get();

    const feedbacks = feedbacksSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        email: data.email || "",
        content: data.content || "",
        user_id: data.user_id || "",
        ip_address: data.ip_address || "",
        source: data.source || "web",
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      feedbacks,
    });
  } catch (error: any) {
    console.error("Feedbacks fetch error:", error);
    return NextResponse.json(
      { error: "Geri bildirimler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Admin authentication kontrolü
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { feedback_id, user_id } = body;

    if (!feedback_id || !user_id) {
      return NextResponse.json(
        { error: "feedback_id and user_id are required" },
        { status: 400 }
      );
    }

    // Feedback'i kontrol et
    const feedbackRef = db.collection("feedbacks").doc(feedback_id);
    const feedbackDoc = await feedbackRef.get();

    if (!feedbackDoc.exists) {
      return NextResponse.json(
        { error: "Geri bildirim bulunamadı" },
        { status: 404 }
      );
    }

    // Batch işlem
    const batch = db.batch();

    // 1. Feedback'i sil
    batch.delete(feedbackRef);

    // 2. User'ın total_feedbacks'ini azalt
    const userRef = db.collection("users").doc(user_id);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const currentTotal = userDoc.data()?.total_feedbacks || 0;
      if (currentTotal > 0) {
        batch.update(userRef, {
          total_feedbacks: admin.firestore.FieldValue.increment(-1),
        });
      }
    }

    // Batch commit
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Geri bildirim başarıyla silindi",
    });
  } catch (error: any) {
    console.error("Feedback delete error:", error);
    return NextResponse.json(
      { error: "Geri bildirim silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
