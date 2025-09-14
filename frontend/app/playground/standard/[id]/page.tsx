"use client";

import { useParams } from "next/navigation";
import ScheduleDetail from "./ScheduleDetail";

export default function SchedulePage() {
  const params = useParams();
  const id = params?.id as string;
  return <ScheduleDetail scheduleId={id} />;
}
