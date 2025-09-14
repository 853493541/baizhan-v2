import ScheduleDetail from "../ScheduleDetail";

interface Props {
  params: { id: string };
}

export default function SchedulePage({ params }: Props) {
  return <ScheduleDetail scheduleId={params.id} />;
}
