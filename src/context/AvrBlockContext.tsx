import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AvrBlockModal from '../components/AvrBlockModal';
import {useAuth} from '../hooks/useAuth';
import {subscribeAvrBlocked} from '../utils/avrBlock';

interface AvrBlockContextValue {
  isAvrBlocked: boolean;
  /** false + модалка «Подтвердите АВР», если клиенту заблокированы заказы. */
  ensureOrderAllowed: () => boolean;
}

const AvrBlockContext = createContext<AvrBlockContextValue | null>(null);

export function AvrBlockProvider({children}: {children: React.ReactNode}) {
  const {user, refreshUserData} = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const isAvrBlocked = user?.avrBlocked === true;

  // Сервер отклонил заказ (флаг включили в CRM, а локальный user ещё старый) —
  // показываем модалку и подтягиваем свежий профиль, чтобы следующие нажатия блокировались сразу.
  useEffect(
    () =>
      subscribeAvrBlocked(() => {
        setModalVisible(true);
        void refreshUserData({silent: true});
      }),
    [refreshUserData],
  );

  const ensureOrderAllowed = useCallback(() => {
    if (!isAvrBlocked) {
      return true;
    }
    setModalVisible(true);
    return false;
  }, [isAvrBlocked]);

  const value = useMemo(
    () => ({isAvrBlocked, ensureOrderAllowed}),
    [isAvrBlocked, ensureOrderAllowed],
  );

  return (
    <AvrBlockContext.Provider value={value}>
      {children}
      <AvrBlockModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </AvrBlockContext.Provider>
  );
}

export function useAvrBlock(): AvrBlockContextValue {
  const ctx = useContext(AvrBlockContext);
  if (!ctx) {
    throw new Error('useAvrBlock must be used within AvrBlockProvider');
  }
  return ctx;
}
