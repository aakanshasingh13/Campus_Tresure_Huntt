import * as RNWeb from 'react-native-web';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

// Re-export everything from react-native-web as base
export * from 'react-native-web';

export const TurboModuleRegistry = {
  get: (_name: string) => null,
  getEnforcing: (_name: string) => ({}),
};

// ============================================================================
// 1. ROCK-SOLID HIGH-PERFORMANCE TOUCHABLE OPACITY (INSTANT FIRST-CLICK)
// ============================================================================
export interface TouchableOpacityProps {
  onPress?: (event: any) => void;
  onPressIn?: (event: any) => void;
  onPressOut?: (event: any) => void;
  onLongPress?: (event: any) => void;
  onClick?: (event: any) => void;
  activeOpacity?: number;
  disabled?: boolean;
  style?: any;
  children?: any;
  testID?: string;
  accessibilityRole?: string;
  [key: string]: any;
}

export const TouchableOpacity = React.forwardRef<any, TouchableOpacityProps>((props, ref) => {
  const {
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    onClick,
    activeOpacity = 0.65,
    disabled = false,
    style,
    children,
    ...rest
  } = props;

  const [isPressed, setIsPressed] = useState(false);
  const longPressTimerRef = useRef<any>(null);

  const handlePointerDown = (e: any) => {
    if (disabled) return;
    setIsPressed(true);
    onPressIn?.(e);
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(e);
      }, 500);
    }
  };

  const handlePointerUp = (e: any) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressed(false);
    onPressOut?.(e);
  };

  const handlePointerCancel = (e: any) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressed(false);
    onPressOut?.(e);
  };

  // Immediate, strictly-fires-on-first-click handler.
  // Prioritizes onPress, falls back to onClick, preventing double-execution when both props are passed.
  const handleClick = (e: any) => {
    if (disabled) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return;
    }
    if (onPress) {
      onPress(e);
    } else if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e: any) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onPress) {
        onPress(e);
      } else if (onClick) {
        onClick(e);
      }
    }
  };

  const combinedStyle = useMemo(() => {
    const baseStyle = {
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      touchAction: 'manipulation' as const,
      transition: 'opacity 0.08s ease, filter 0.08s ease',
      ...(isPressed && !disabled ? { opacity: activeOpacity } : {}),
    };
    if (Array.isArray(style)) {
      return [baseStyle, ...style];
    }
    return [baseStyle, style];
  }, [style, isPressed, disabled, activeOpacity]);

  return React.createElement(
    RNWeb.View,
    {
      ref,
      role: 'button',
      tabIndex: disabled ? -1 : 0,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerCancel,
      onPointerCancel: handlePointerCancel,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      style: combinedStyle,
      ...rest,
    },
    children
  );
});

TouchableOpacity.displayName = 'TouchableOpacity';

// ============================================================================
// 2. ROCK-SOLID PRESSABLE
// ============================================================================
export const Pressable = React.forwardRef<any, any>((props, ref) => {
  const {
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    onClick,
    disabled = false,
    style,
    children,
    ...rest
  } = props;

  const [isPressed, setIsPressed] = useState(false);
  const longPressTimerRef = useRef<any>(null);

  const handlePointerDown = (e: any) => {
    if (disabled) return;
    setIsPressed(true);
    onPressIn?.(e);
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(e);
      }, 500);
    }
  };

  const handlePointerUp = (e: any) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressed(false);
    onPressOut?.(e);
  };

  const handlePointerCancel = (e: any) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressed(false);
    onPressOut?.(e);
  };

  const handleClick = (e: any) => {
    if (disabled) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return;
    }
    if (onPress) {
      onPress(e);
    } else if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e: any) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onPress) {
        onPress(e);
      } else if (onClick) {
        onClick(e);
      }
    }
  };

  const resolvedStyle = typeof style === 'function' ? style({ pressed: isPressed }) : style;
  const resolvedChildren = typeof children === 'function' ? children({ pressed: isPressed }) : children;

  const combinedStyle = useMemo(() => {
    const baseStyle = {
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      touchAction: 'manipulation' as const,
    };
    if (Array.isArray(resolvedStyle)) {
      return [baseStyle, ...resolvedStyle];
    }
    return [baseStyle, resolvedStyle];
  }, [resolvedStyle, disabled]);

  return React.createElement(
    RNWeb.View,
    {
      ref,
      role: 'button',
      tabIndex: disabled ? -1 : 0,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerCancel,
      onPointerCancel: handlePointerCancel,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      style: combinedStyle,
      ...rest,
    },
    resolvedChildren
  );
});

Pressable.displayName = 'Pressable';

export const TouchableHighlight = TouchableOpacity;
export const TouchableWithoutFeedback = TouchableOpacity;

// ============================================================================
// 3. SEAMLESS WEB-SAFE MODAL (NO DELAY, RENDERS IMMEDIATELY, FULL COVERAGE)
// ============================================================================
export interface ModalProps {
  visible?: boolean;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  onRequestClose?: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
  children?: React.ReactNode;
  style?: any;
  [key: string]: any;
}

export const Modal: React.FC<ModalProps> = ({
  visible = true,
  transparent = false,
  animationType = 'none',
  onRequestClose,
  onShow,
  onDismiss,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (visible && onShow) {
      onShow();
    }
    return () => {
      if (visible && onDismiss) {
        onDismiss();
      }
    };
  }, [visible, onShow, onDismiss]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onRequestClose) {
        e.stopPropagation();
        onRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onRequestClose]);

  if (!visible || !mounted || typeof document === 'undefined') {
    return null;
  }

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: transparent ? 'transparent' : '#050b1a',
    pointerEvents: 'auto',
    animation: animationType === 'fade'
      ? 'campusModalFadeIn 0.16s ease-out forwards'
      : animationType === 'slide'
      ? 'campusModalSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      : 'none',
  };

  return createPortal(
    React.createElement(
      'div',
      {
        role: 'dialog',
        'aria-modal': 'true',
        style: modalOverlayStyle,
        onClick: (e: any) => {
          e.stopPropagation();
        },
      },
      children
    ),
    document.body
  );
};

Modal.displayName = 'Modal';

// ============================================================================
// 4. SCROLLVIEW WITH TAP PERSISTENCE (PREVENTS EATEN / BLOCKED CLICKS)
// ============================================================================
const OrigScrollView = RNWeb.ScrollView;
export const ScrollView = React.forwardRef<any, any>((props, ref) => {
  return React.createElement(OrigScrollView, {
    keyboardShouldPersistTaps: 'always',
    ...props,
    ref,
  });
});

ScrollView.displayName = 'ScrollView';

// Default export bundles overridden components with all react-native-web primitives
const defaultExport = {
  ...RNWeb,
  TouchableOpacity,
  Pressable,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  TurboModuleRegistry,
};

export default defaultExport;
