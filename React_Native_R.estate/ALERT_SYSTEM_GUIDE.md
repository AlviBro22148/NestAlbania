# Custom Alert System Guide

## Overview
We've implemented a beautiful, professional custom alert system to replace the default React Native alerts. The new system includes:

- **Custom Alert Modals** - Beautiful, animated modal alerts with icons
- **Toast Notifications** - Non-blocking toast messages
- **Smooth Animations** - Spring animations and fade effects
- **Type-Based Styling** - Different colors and icons for success, error, warning, and info

## Components Created

### 1. AlertContext (`contexts/AlertContext.tsx`)
Global context provider that manages alerts and toasts.

### 2. CustomAlert (`components/CustomAlert.tsx`)
Beautiful modal alert component with:
- Animated entrance/exit
- Type-specific icons and colors
- Support for multiple buttons
- Destructive and cancel button styles

### 3. ToastNotification (`components/ToastNotification.tsx`)
Non-blocking toast notifications that appear at the top of the screen.

## Usage

### Basic Setup
The AlertProvider is already added to the app root layout, so no additional setup is needed.

### Using Alerts in Components

```typescript
import { useAlert } from "@/contexts/AlertContext";

const MyComponent = () => {
  const { showAlert, showToast } = useAlert();

  // Show an alert
  const handleAction = () => {
    showAlert({
      type: "success", // "success" | "error" | "warning" | "info"
      title: "Success!",
      message: "Operation completed successfully",
      buttons: [
        { text: "OK", style: "default" }
      ]
    });
  };

  // Show a toast
  const handleQuickNotification = () => {
    showToast("Item saved!", "success", 3000); // message, type, duration(ms)
  };

  return (...);
};
```

### Alert Types and Colors

| Type      | Icon              | Color   | Use Case                    |
|-----------|-------------------|---------|-----------------------------|
| `success` | Checkmark Circle  | Green   | Successful operations       |
| `error`   | Close Circle      | Red     | Errors and failures         |
| `warning` | Warning           | Orange  | Warnings and confirmations  |
| `info`    | Information       | Blue    | Informational messages      |

### Button Styles

```typescript
{
  text: "Cancel",
  style: "cancel", // Gray background
  onPress: () => console.log("Cancelled")
}

{
  text: "Delete",
  style: "destructive", // Red text on light red background
  onPress: () => deleteItem()
}

{
  text: "OK",
  style: "default", // Primary color background
  onPress: () => confirmAction()
}
```

## Migration from Alert.alert

### Before (Old System):
```typescript
import { Alert } from "react-native";

Alert.alert("Error", "Something went wrong");

Alert.alert("Delete Item", "Are you sure?", [
  { text: "Cancel", style: "cancel" },
  { text: "Delete", style: "destructive", onPress: () => deleteItem() }
]);
```

### After (New System):
```typescript
import { useAlert } from "@/contexts/AlertContext";

const { showAlert, showToast } = useAlert();

// For simple messages, use toast
showToast("Something went wrong", "error");

// For confirmation dialogs
showAlert({
  type: "warning",
  title: "Delete Item",
  message: "Are you sure?",
  buttons: [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => deleteItem() }
  ]
});
```

## Files Already Updated

✅ `app/_layout.tsx` - AlertProvider added
✅ `app/(root)/(tabs)/budget-calculator.tsx`
✅ `app/(root)/(tabs)/create-property.tsx`
✅ `app/(root)/(tabs)/community.tsx`
✅ `app/(root)/(tabs)/community/post/[id].tsx`

## Remaining Files to Update

The following files still use `Alert.alert` and should be migrated:

- `app/(root)/(admin)/blog-manager.tsx`
- `app/(root)/(tabs)/community/create.tsx`
- `app/(root)/(tabs)/edit-profile.tsx`
- `app/(root)/(tabs)/edit-property/[propertyId].tsx`
- `app/(root)/(tabs)/feedback.tsx`
- `app/(root)/(tabs)/help-center.tsx`
- `app/(root)/(tabs)/market.tsx`
- `app/(root)/(tabs)/news.tsx`
- `app/(root)/(tabs)/notification-settings.tsx`
- `app/(root)/(tabs)/notifications.tsx`
- `app/(root)/(tabs)/profile.tsx`
- `app/(root)/(tabs)/security.tsx`
- `app/(root)/(tabs)/services.tsx`
- `app/(root)/(tabs)/user-properties.tsx`
- `app/auth/sign-in.tsx`
- `app/auth/sign-up.tsx`

## Best Practices

### When to Use Alerts vs Toasts

**Use Alerts (showAlert) when:**
- User needs to make a decision (confirm/cancel)
- Displaying critical errors that need acknowledgment
- Showing important success messages with actions

**Use Toasts (showToast) when:**
- Showing quick feedback (saved, deleted, etc.)
- Non-critical notifications
- Status updates that don't require user action

### Examples

```typescript
// ✅ Good - Use toast for quick feedback
showToast("Property saved!", "success");

// ✅ Good - Use alert for confirmations
showAlert({
  type: "warning",
  title: "Delete Property",
  message: "This cannot be undone",
  buttons: [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: handleDelete }
  ]
});

// ❌ Bad - Don't use alert for simple notifications
showAlert({
  type: "success",
  title: "Success",
  message: "Item saved"
}); // Use toast instead!
```

## Customization

### Changing Colors
Edit the `getTypeConfig()` function in `components/CustomAlert.tsx` and `components/ToastNotification.tsx`.

### Adjusting Animation
Modify the animation parameters in `CustomAlert.tsx`:
```typescript
Animated.spring(scaleAnim, {
  toValue: 1,
  useNativeDriver: true,
  tension: 50, // Adjust for faster/slower animation
  friction: 7,  // Adjust for more/less bounce
})
```

### Toast Duration
Default is 3000ms. Change when calling:
```typescript
showToast("Message", "success", 5000); // 5 seconds
```

## Features

- ✨ Beautiful, modern UI design
- 🎨 Type-specific colors and icons
- ⚡ Smooth spring animations
- 📱 Fully responsive
- 🌍 Works with i18n translations
- ♿ Accessible with proper contrast
- 🎯 TypeScript support with full type safety
