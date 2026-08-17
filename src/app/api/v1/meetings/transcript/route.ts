import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload a transcript file." },
        { status: 400 }
      );
    }

    // Generate a unique meeting ID (e.g. meeting_9f82ab14)
    const randomId = Math.random().toString(36).substring(2, 10);
    const meetingId = `meeting_${randomId}`;

    // Read basic info for logging/debugging
    const fileName = file.name || "transcript.txt";
    const fileSize = file.size;

    console.log(`[API] Received transcript: ${fileName} (${fileSize} bytes). Assigned ID: ${meetingId}`);

    // Return 202 Accepted as requested
    return NextResponse.json(
      {
        meeting_id: meetingId,
        status: "processing",
        message: "Transcript received and queued for asynchronous processing",
        file_name: fileName,
        received_at: new Date().toISOString(),
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("[API] Error handling transcript upload:", error);
    return NextResponse.json(
      { error: "Failed to process transcript upload", details: error?.message },
      { status: 500 }
    );
  }
}
