import React, { useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthStore, IniciarSesionContainer } from '@/features/autenticacion';
import { NotificadorAlertasAgronomo } from '@/features/diagnosticos';

SplashScreen.preventAutoHideAsync();

/**
 * @description Layout raíz de Agro Vision con QueryClientProvider, ThemeProvider, Stack Router,
 * control de sesión y notificador en tiempo real de alertas fitosanitarias para agrónomos y supervisores.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {estaAutenticado ? (
          <>
            <Stack screenOptions={{ headerShown: false }} />
            <NotificadorAlertasAgronomo />
          </>
        ) : (
          <IniciarSesionContainer />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
