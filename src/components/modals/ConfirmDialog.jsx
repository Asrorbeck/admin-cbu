import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const ConfirmDialog = ({ open, title, description, confirmText = "Tasdiqlash", cancelText = "Bekor qilish", onConfirm, onCancel }) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </Dialog.Title>
                  {description && (
                    <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ConfirmDialog;


