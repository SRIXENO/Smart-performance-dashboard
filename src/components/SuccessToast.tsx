'use client';

import StatusToast from './StatusToast';

type SuccessToastProps = {
  message: string;
  onClose: () => void;
};

export default function SuccessToast({ message, onClose }: SuccessToastProps) {
  return <StatusToast message={message} onClose={onClose} variant="success" />;
}
