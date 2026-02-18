export interface TaxRegime {
  id: string
  name: string
  type: TaxRegimeType
  active: boolean
  pis: number
  cofins: number
  csll: number
  irpj: number
  icms: number
  iss: number
  basePresuncaoVenda: number
  basePresuncaoServico: number
  anexoI: number
  anexoIII: number
  meiTaxa: number
  createdAt: Date
  updatedAt: Date
}

export type TaxRegimeType = "presumido" | "real" | "simples" | "mei"

export const initialTaxRegimes: TaxRegime[] = [
  {
    id: "presumido_padrao",
    name: "Lucro Presumido",
    type: "presumido",
    active: true,
    pis: 0.65,
    cofins: 3,
    csll: 9,
    irpj: 15,
    icms: 18,
    iss: 5,
    basePresuncaoVenda: 8,
    basePresuncaoServico: 32,
    anexoI: 0,
    anexoIII: 0,
    meiTaxa: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "real_padrao",
    name: "Lucro Real",
    type: "real",
    active: false,
    pis: 1.65,
    cofins: 7.6,
    csll: 9,
    irpj: 15,
    icms: 18,
    iss: 5,
    basePresuncaoVenda: 0,
    basePresuncaoServico: 0,
    anexoI: 0,
    anexoIII: 0,
    meiTaxa: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "simples_padrao",
    name: "Simples Nacional",
    type: "simples",
    active: false,
    pis: 0,
    cofins: 0,
    csll: 0,
    irpj: 0,
    icms: 0,
    iss: 0,
    basePresuncaoVenda: 0,
    basePresuncaoServico: 0,
    anexoI: 8,
    anexoIII: 11.2,
    meiTaxa: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mei_padrao",
    name: "MEI",
    type: "mei",
    active: false,
    pis: 0,
    cofins: 0,
    csll: 0,
    irpj: 0,
    icms: 0,
    iss: 0,
    basePresuncaoVenda: 0,
    basePresuncaoServico: 0,
    anexoI: 0,
    anexoIII: 0,
    meiTaxa: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]
