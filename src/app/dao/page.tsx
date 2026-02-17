// src/app/dao/page.tsx

import { Metadata } from "next";
import { DaoClient } from "@/components/DAO";
import { Header } from "./Header";

export const metadata: Metadata = {
  title: "DAO | The Council",
  description: "$COUNCIL holders vote on the future of The Council",
};

export default function DaoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-10">
      <Header />
      <DaoClient />
      <footer className="h-8 border-t border-zinc-800 flex items-center justify-center px-4 text-xs text-zinc-700 bg-[#080808] fixed bottom-0 w-full">
        Powered by $COUNCIL · Fully onchain governance
      </footer>
    </div>
  );
}
