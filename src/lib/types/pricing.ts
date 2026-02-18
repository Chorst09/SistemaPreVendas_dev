export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  state: string
  isContributor: boolean
}

export interface ProductItem {
  id: string
  description: string
  quantity: number
  unitCost: number
  creditoIcmsCompra: number
  icmsDestLocal: number
  icmsST: boolean
}

export interface RentalItem {
  id: string
  description: string
  quantity: number
  assetValueBRL: number
  icmsCompra: number
  icmsPr: number
  frete: number
}

export interface ServiceItem {
  id: string
  description: string
  contractType: "clt" | "pj"
  baseSalary: number
  estimatedHours: number
}

export interface PricingCalculation {
  baseCost: number
  marginCommission: number
  taxes: number
  finalPrice: number
}

export type ICMSInterstateRates = {
  [key: string]: number
}

export const defaultICMSRates: ICMSInterstateRates = {
  AC: 7,
  AL: 7,
  AP: 7,
  AM: 7,
  BA: 7,
  CE: 7,
  DF: 7,
  ES: 7,
  GO: 7,
  MA: 7,
  MG: 12,
  MS: 7,
  MT: 7,
  PA: 7,
  PB: 7,
  PE: 7,
  PI: 7,
  PR: 19.5,
  RJ: 12,
  RN: 7,
  RO: 7,
  RR: 7,
  RS: 12,
  SC: 12,
  SE: 7,
  SP: 12,
  TO: 7,
}

export const stateNames: { [key: string]: string } = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins"
}
