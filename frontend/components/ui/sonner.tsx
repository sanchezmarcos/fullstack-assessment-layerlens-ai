"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-white !text-gray-900 !border !border-gray-200 !shadow-md !rounded-xl",
          title: "!font-semibold !text-gray-900",
          description: "!text-gray-500",
          icon: "!mt-0.5",
          success:
            "!border-l-4 !border-l-green-500 [&_[data-icon]]:!text-green-500",
          error: "!border-l-4 !border-l-red-500 [&_[data-icon]]:!text-red-500",
          warning:
            "!border-l-4 !border-l-yellow-500 [&_[data-icon]]:!text-yellow-500",
          info: "!border-l-4 !border-l-blue-500 [&_[data-icon]]:!text-blue-500",
          closeButton:
            "!bg-white !border-gray-200 !text-gray-400 hover:!text-gray-700",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
