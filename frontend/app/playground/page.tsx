"use client";

import React, { useState } from "react";
import PlaygroundHeader from "./PlaygroundHeader";
import CreateScheduleModal from "./CreateScheduleModal";

export default function PlaygroundPage() {
  const [showModal, setShowModal] = useState(false);

  const handleCreateSchedule = () => {
    setShowModal(true);
  };

  const handleConfirm = (conflictLevel: number, server: string, mode: "default" | "custom") => {
    console.log("✅ Schedule created with:", { conflictLevel, server, mode });
    // 🔜 here we’ll pull characters + map and prepare solver
  };

  return (
    <div>
      <PlaygroundHeader onCreateSchedule={handleCreateSchedule} />
      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
