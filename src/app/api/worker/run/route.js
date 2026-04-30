import { runSendWorker } from "@/server/worker/send.worker";

export async function GET() {
  console.log("🕒 Worker API triggered");

  await runSendWorker();

  return Response.json({ success: true });
}