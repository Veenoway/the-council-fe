"use client";

import Link from "next/link";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useAccount } from "wagmi";
import { FaXTwitter } from "react-icons/fa6";
import { LiaTelegram } from "react-icons/lia";

export function Header() {
  const { address } = useAccount();

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-[#080808]">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="The Apostate"
            className="w-10 h-10 rounded-full"
          />
          <h1 className="text-xl font-bold font-poppins uppercase">
            The Apostate
          </h1>
        </Link>
        <ul className="flex items-center gap-4 border-l-2 border-zinc-600 pl-5 ml-4">
          <li className="text-sm flex items-center gap-1">
            <Link
              href="https://t.me/TheApostateLive"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <LiaTelegram size={16} />
              Telegram
            </Link>
          </li>
          <li className="text-sm flex items-center gap-1">
            <Link
              href="https://x.com/the_apostate_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <FaXTwitter size={14} />
              Twitter
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <ConnectWalletButton />
      </div>
    </header>
  );
}
