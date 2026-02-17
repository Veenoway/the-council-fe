"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

function WalletIcon({ connector }: { connector: any }) {
  const [icon, setIcon] = useState<string>("");

  useEffect(() => {
    connector?.rkDetails?.iconUrl?.().then(setIcon);
  }, [connector]);

  if (!icon && !connector?.icon)
    return <Wallet className="w-6 h-6 text-zinc-500" />;
  return (
    <img
      src={icon || connector?.icon}
      alt={connector?.rkDetails?.name}
      className="w-6 h-6 rounded-full"
    />
  );
}

export default WalletIcon;
