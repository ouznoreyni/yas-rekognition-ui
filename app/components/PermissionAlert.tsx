interface PermissionAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PermissionAlert = ({ open, onOpenChange }: PermissionAlertProps) => {
  return (
    <button onClick={() => onOpenChange(true)}>
      {open ? "Close" : "Open"} Permission
    </button>
  );
};

export default PermissionAlert;
