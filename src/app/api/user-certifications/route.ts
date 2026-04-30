import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const certs = await db.userCertification.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(certs);
}
