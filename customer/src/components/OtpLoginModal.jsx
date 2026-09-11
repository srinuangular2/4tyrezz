import AuthFlow from './AuthFlow';

export default function OtpLoginModal({ onClose, onSuccess }) {
  return (
    <AuthFlow
      variant="modal"
      onClose={onClose}
      onSuccess={onSuccess || onClose}
    />
  );
}
