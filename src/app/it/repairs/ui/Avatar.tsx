import React from "react";
import { User as UserIcon } from "lucide-react";
import Image from "next/image";

interface AvatarProps {
  name?: string;
  pictureUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  pictureUrl,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-14 h-14 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 28,
    xl: 40,
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-600 shadow-sm overflow-hidden relative ${className}`}
    >
      {pictureUrl ? (
        <Image
          src={pictureUrl}
          alt={name || "User Avatar"}
          fill
          className="object-cover"
        />
      ) : name ? (
        name.charAt(0).toUpperCase()
      ) : (
        <UserIcon size={iconSizes[size]} className="text-gray-300" />
      )}
    </div>
  );
};
