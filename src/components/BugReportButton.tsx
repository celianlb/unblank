"use client";

import { Bug } from "lucide-react";
import Tooltip from "./Tooltip";

const BUG_REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd4cUyVtOI1w9sehNA3GuD2JD2eDdjwe1Xs67kkSCYizh390Q/viewform";

export default function BugReportButton() {
  const handleClick = () => {
    window.open(BUG_REPORT_URL, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Tooltip content="Signaler un bug" position="top">
        <button
          onClick={handleClick}
          className="flex items-center justify-center w-12 h-12 bg-[#FF506F] hover:bg-[#E8455F] border-2 border-black rounded-full shadow-[3px_3px_0px_#000000] cursor-pointer transition-colors"
        >
          <Bug className="w-6 h-6 text-white" strokeWidth={2} />
        </button>
      </Tooltip>
    </div>
  );
}
