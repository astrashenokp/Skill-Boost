import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/* ─── POST /api/certificates ─────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    /* 1. Auth check ──────────────────────────────────────────────── */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* 2. Parse body ──────────────────────────────────────────────── */
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { courseId, score } = body as {
      courseId?: string;
      score?: number;
    };

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    /* 3. Verify course exists ────────────────────────────────────── */
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    /* 4. Check if certificate already exists ────────────────────── */
    const { data: existing } = await supabase
      .from("certificates")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (existing) {
      // Already has a certificate — return existing id
      return NextResponse.json({ certificateId: existing.id, existing: true });
    }

    /* 5. Generate a new certificate id (UUID via crypto) ─────────── */
    const newCertId = crypto.randomUUID();

    /* 6. Build QR URL ───────────────────────────────────────────── */
    const certUrl = encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://skill-boost.vercel.app"}/app/certificate/${newCertId}`
    );
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${certUrl}&size=200x200&format=png&color=F97316&bgcolor=0D1B3E`;

    /* 7. INSERT certificate ─────────────────────────────────────── */
    const { error: certError } = await supabase
      .from("certificates")
      .insert({
        id: newCertId,
        user_id: user.id,
        course_id: courseId,
        issued_at: new Date().toISOString(),
        qr_url: qrUrl,
      });

    if (certError) {
      console.error("Certificate insert error:", certError.message);
      return NextResponse.json(
        { error: "Failed to create certificate" },
        { status: 500 }
      );
    }

    /* 8. UPDATE user_progress → completed ───────────────────────── */
    const finalScore = typeof score === "number" ? Math.round(score) : 100;

    // Try update first (row should already exist from lesson visits)
    const { error: updateError } = await supabase
      .from("user_progress")
      .update({
        status: "completed",
        score: finalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    if (updateError) {
      // Row might not exist yet — insert instead
      await supabase.from("user_progress").insert({
        user_id: user.id,
        course_id: courseId,
        status: "completed",
        score: finalScore,
        completed_at: new Date().toISOString(),
      });
    }

    /* 9. Return certificate id ───────────────────────────────────── */
    return NextResponse.json(
      { certificateId: newCertId, qrUrl, existing: false },
      { status: 201 }
    );
  } catch (err) {
    console.error("Certificates API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ─── GET /api/certificates — list user's certificates ──────────────── */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("certificates")
      .select("id, course_id, issued_at, qr_url, courses(title)")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ certificates: data ?? [] });
  } catch (err) {
    console.error("Certificates GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
