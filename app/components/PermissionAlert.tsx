import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface PermissionAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PermissionAlert = ({ open, onOpenChange }: PermissionAlertProps) => {
  return (
    /*  <Alert.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Alert.Portal>
        <Alert.Overlay className='fixed inset-0 bg-black bg-opacity-50' />
        <Alert.Content className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg max-w-md w-full'>
          <Alert.Title className='text-xl font-bold mb-2'>
            Autorisation de la caméra requise
          </Alert.Title>
          <Alert.Description className='mb-4'>
            Veuillez autoriser l'accès à la caméra pour utiliser cette
            fonctionnalité. Vous devrez peut-être vérifier les paramètres de
            votre navigateur.
          </Alert.Description>
          <div className='flex justify-end'>
            <Alert.Action asChild>
              <button className='px-4 py-2 bg-blue-500 text-white rounded'>
                OK
              </button>
            </Alert.Action>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root> */
    <AlertDialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialog.Content style={{ maxWidth: '450px' }}>
        <AlertDialog.Title>Revoke access</AlertDialog.Title>
        <AlertDialog.Description className='mb-4'>
          Are you sure? This application will no longer be accessible and any
          existing sessions will be expired.
        </AlertDialog.Description>

        <div className='flex justify-end'>
          <AlertDialog.Action asChild>
            <button className='px-4 py-2 bg-blue-500 text-white rounded'>
              OK
            </button>
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};

export default PermissionAlert;
