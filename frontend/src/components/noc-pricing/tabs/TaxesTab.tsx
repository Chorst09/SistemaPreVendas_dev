'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useConfigurationStore } from '@/lib/stores/configuration-store';

interface TaxesTabProps {
  data: {
    federalTax: number;
    stateTax: number;
    municipalTax: number;
    socialCharges: number;
  };
  onChange: (data: any) => void;
}

export function TaxesTab({ data, onChange }: TaxesTabProps) {
  const { taxRegimes, nocConfig, setNocConfig } = useConfigurationStore();

  const selectedRegime = nocConfig.taxRegimeId
    ? taxRegimes.find(r => r.id === nocConfig.taxRegimeId)
    : taxRegimes.find(r => r.active) || null;

  const handleRegimeChange = (regimeId: string) => {
    const regime = taxRegimes.find(r => r.id === regimeId);
    if (regime) {
      setNocConfig({ taxRegimeId: regimeId });

      if (regime.type === 'iva') {
        const ivaTotal = regime.ivaTotal || 0;
        onChange({
          federalTax: ivaTotal,
          stateTax: 0,
          municipalTax: 0,
          socialCharges: 0
        });
      } else {
        const federal = (regime.pis || 0) + (regime.cofins || 0) + (regime.irpj || 0) + (regime.csll || 0);
        const state = regime.icms || 0;
        const municipal = regime.iss || 0;
        const social = regime.anexoI || regime.anexoIII || regime.meiTaxa || 0;
        onChange({
          federalTax: federal,
          stateTax: state,
          municipalTax: municipal,
          socialCharges: social
        });
      }
    }
  };

  const totalTax = data.federalTax + data.stateTax + data.municipalTax + data.socialCharges;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regime Tributário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecione o Regime Tributário</Label>
            <Select
              value={nocConfig.taxRegimeId || taxRegimes.find(r => r.active)?.id || ''}
              onValueChange={handleRegimeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o regime" />
              </SelectTrigger>
              <SelectContent>
                {taxRegimes.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} {r.active ? '(Ativo)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRegime && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold">{selectedRegime.name}</span>
                <Badge variant="outline">
                  {selectedRegime.type === 'iva' ? 'IVA (IBS+CBS)' :
                   selectedRegime.type === 'presumido' ? 'Lucro Presumido' :
                   selectedRegime.type === 'real' ? 'Lucro Real' :
                   selectedRegime.type === 'simples' ? 'Simples Nacional' : 'MEI'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedRegime.type === 'iva' ? (
                  <>
                    <div>CBS: <strong>{selectedRegime.ivaCbs}%</strong></div>
                    <div>IBS: <strong>{selectedRegime.ivaIbs}%</strong></div>
                    <div className="col-span-2">Total IVA: <strong>{selectedRegime.ivaTotal}%</strong></div>
                  </>
                ) : (
                  <>
                    <div>PIS: <strong>{selectedRegime.pis}%</strong></div>
                    <div>COFINS: <strong>{selectedRegime.cofins}%</strong></div>
                    <div>IRPJ: <strong>{selectedRegime.irpj}%</strong></div>
                    <div>CSLL: <strong>{selectedRegime.csll}%</strong></div>
                    <div>ICMS: <strong>{selectedRegime.icms}%</strong></div>
                    <div>ISS: <strong>{selectedRegime.iss}%</strong></div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carga Tributária Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600">
              {totalTax.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Total de impostos aplicados ao projeto
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
