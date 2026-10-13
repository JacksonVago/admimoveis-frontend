import { ImovelStatus } from "@/enums/imovel/enums-imovel";

export const STATUS_IMOVEL_OPTIONS = [
  { value: ImovelStatus.DISPONIVEL, label: 'Disponível' },
  { value: ImovelStatus.ALUGADO, label: 'Alugado' },
  { value: ImovelStatus.VENDIDO, label: 'Vendido' },
  { value: ImovelStatus.INDISPONIVEL, label: 'Indisponível' },
  { value: ImovelStatus.INATIVO, label: 'Inativo' },
]
