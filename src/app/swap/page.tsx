import { SwapCard } from '@/components/swap/SwapCard';

export const metadata = {
  title: 'Swap | Caldera',
  description: 'Swap tokens on the Basalt DEX',
};

export default function SwapPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-8">
      <SwapCard />
    </div>
  );
}
