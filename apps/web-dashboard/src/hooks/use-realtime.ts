'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import type { Notification } from '@/stores/notification-store';

export function useRealtime() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || connectedRef.current) return;

    const socket = getSocket();
    socket.connect();
    connectedRef.current = true;

    socket.on('project:updated', (data: { projectId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.projectId] });
    });

    socket.on('license:created', (data: { projectId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    socket.on('license:updated', (data: { projectId: string; licenseId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['license', data.licenseId] });
    });

    socket.on('config:updated', (data: { projectId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['config', data.projectId] });
    });

    socket.on('notification', (notification: Notification) => {
      addNotification(notification);
    });

    socket.on('analytics:refresh', () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    return () => {
      socket.off('project:updated');
      socket.off('license:created');
      socket.off('license:updated');
      socket.off('config:updated');
      socket.off('notification');
      socket.off('analytics:refresh');
      socket.disconnect();
      connectedRef.current = false;
    };
  }, [isAuthenticated, queryClient, addNotification]);
}
