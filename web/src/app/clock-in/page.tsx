import { ClockPanel } from "@/components/ClockPanel";

export const metadata = {
  title: "Clock in · Cash Cows",
  description: "Stake the NFT. Milk weight counts. Unstaked cows sit at 0.",
};

export default function ClockInPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-5">
      <ClockPanel />
    </div>
  );
}
