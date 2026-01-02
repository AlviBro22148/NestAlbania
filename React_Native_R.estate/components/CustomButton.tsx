import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  className?: string;
  textVariant?: "default" | "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  className = "",
  textVariant = "default",
  disabled = false,
  loading = false,
  ...props
}) => {
  const textColorClass =
    textVariant === "primary"
      ? "text-black-300"
      : textVariant === "secondary"
        ? "text-gray-600"
        : "text-white";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`py-4 px-6 rounded-xl items-center justify-center ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={`font-rubik-bold text-base ${textColorClass}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
