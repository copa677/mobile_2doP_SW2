import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accentPrimary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={'/login' as any} />;
  }

  if (role === 'ADMINISTRADOR') {
    return <Redirect href={'/(admin)' as any} />;
  }

  if (role === 'CLIENTE') {
    return <Redirect href={'/(client)' as any} />;
  }

  if (role === 'RECEPCIONISTA') {
    return <Redirect href={'/(receptionist)' as any} />;
  }

  return <Redirect href={'/unauthorized' as any} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
  },
});
