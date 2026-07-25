import type {User} from '../types';

interface ClientSavedAddress {
  name: string;
  street?: string;
  floor?: string;
  apartment?: string;
  link?: string;
  phone?: string;
  point?: {lat?: number; lon?: number};
}

interface FrozenOrderAddress {
  name?: string;
  actual?: string;
  link?: string;
  phone?: string;
  point?: {lat?: number; lon?: number};
}

export interface RepeatOrderAddress {
  actual: string;
  name: string;
  phone: string;
  point: {lat: number | string; lon: number | string};
  link: string;
}

function buildActualFromClientAddress(address: ClientSavedAddress): string {
  let actual = address.street || '';
  if (address.floor) {
    actual += `, этаж ${address.floor}`;
  }
  if (address.apartment) {
    actual += `, квартира ${address.apartment}`;
  }
  return actual;
}

/**
 * При повторе заказа адрес должен браться из актуальных данных клиента (Профиль → Адреса),
 * а не из address, замороженного в старом заказе — клиент мог изменить этаж/квартиру/
 * координаты уже после того заказа, и повтор не должен доставлять по устаревшим данным.
 * Ищем текущий адрес клиента по name (та же метка, что была на момент заказа); если адрес
 * с таким именем удалён/переименован, используем данные из заказа как раньше.
 */
export function resolveRepeatOrderAddress(
  user: Pick<User, 'addresses' | 'phone'> | null | undefined,
  orderAddress: FrozenOrderAddress | null | undefined,
): RepeatOrderAddress | null {
  if (!orderAddress) return null;

  const currentAddress = user?.addresses?.find(
    a => a.name === orderAddress.name,
  ) as ClientSavedAddress | undefined;

  if (!currentAddress) {
    return {
      actual: orderAddress.actual || '',
      name: orderAddress.name || '',
      phone: orderAddress.phone || user?.phone || '',
      point: {
        lat: orderAddress.point?.lat ?? '',
        lon: orderAddress.point?.lon ?? '',
      },
      link: orderAddress.link || '',
    };
  }

  return {
    actual: buildActualFromClientAddress(currentAddress),
    name: currentAddress.name,
    phone: currentAddress.phone || user?.phone || '',
    point: {
      lat: currentAddress.point?.lat ?? '',
      lon: currentAddress.point?.lon ?? '',
    },
    link: currentAddress.link || '',
  };
}
