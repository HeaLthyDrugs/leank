'use client';

import { useParams, useRouter } from 'next/navigation';
import { RoomView } from '@/components/p2p/RoomView';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const handleLeave = () => {
    router.push('/');
  };

  return <RoomView roomId={roomId} onLeave={handleLeave} />;
}
