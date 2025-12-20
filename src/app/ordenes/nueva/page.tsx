import { obtenerCatalogosOrden } from '../actions';
import { obtenerUserInfo } from '@/app/actions';
import NuevaOrdenClient from './NuevaOrdenClient';

export const dynamic = 'force-dynamic';

export default async function NuevaOrdenPage() {
  // Cargar datos en paralelo optimizado (RPC + Auth)
  const [
    catalogosResult,
    userInfoResult
  ] = await Promise.all([
    obtenerCatalogosOrden(),
    obtenerUserInfo()
  ]);

  const tipos = catalogosResult.success ? catalogosResult.tipos : [];
  const marcas = catalogosResult.success ? catalogosResult.marcas : [];
  const modelos = catalogosResult.success ? catalogosResult.modelos : [];
  const userInfo = userInfoResult.success && userInfoResult.user ? userInfoResult.user : null;

  return (
    <NuevaOrdenClient
      tiposIniciales={tipos}
      marcasIniciales={marcas}
      modelosIniciales={modelos}
      userInfo={userInfo}
    />
  );
}
