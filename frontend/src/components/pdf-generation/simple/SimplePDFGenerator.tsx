// @ts-nocheck
/**
 * Simplified PDF Generator for testing
 * This is a minimal implementation to test PDF generation
 */

import React from 'react'

interface SimpleProposalData {
  clientName: string
  projectName: string
  totalMonthly: number
  totalAnnual: number
  equipments: Array<{
    model: string
    brand: string
    type: string
    monthlyVolume: number
    monthlyCost: number
  }>
}

export class SimplePDFGenerator {
  async generateSimplePDF(data: SimpleProposalData): Promise<{ blob: Blob; url: string }> {
    try {
      console.log('Iniciando geração de PDF simples')
      
      // Import jsPDF dynamically
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF
      
      console.log('jsPDF importado:', jsPDF)
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 16
      const money = (value: number) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      const addFooter = () => {
        doc.setFontSize(8)
        doc.setTextColor(120)
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 10)
        doc.text('Proposta de Outsourcing de Impressão', pageWidth - margin, pageHeight - 10, { align: 'right' })
      }
      const ensureSpace = (needed = 28) => {
        if (yPos + needed > pageHeight - 18) {
          addFooter()
          doc.addPage()
          yPos = 22
        }
      }
      const sectionTitle = (title: string) => {
        ensureSpace(18)
        doc.setFillColor(20, 54, 92)
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F')
        doc.setTextColor(255)
        doc.setFontSize(11)
        doc.text(title, margin + 4, yPos + 7)
        yPos += 16
        doc.setTextColor(25)
      }

      doc.setFillColor(13, 32, 58)
      doc.rect(0, 0, pageWidth, 34, 'F')
      doc.setTextColor(255)
      doc.setFontSize(18)
      doc.text('PROPOSTA COMERCIAL', margin, 18)
      doc.setFontSize(11)
      doc.text('Outsourcing de Impressão', margin, 27)

      let yPos = 46
      doc.setTextColor(25)
      sectionTitle('Dados do Cliente')
      doc.setFontSize(10)
      doc.text(`Cliente: ${data.clientName}`, margin, yPos)
      doc.text(`Projeto: ${data.projectName}`, margin, yPos + 7)
      yPos += 18

      sectionTitle('Resumo Financeiro')
      doc.setFontSize(10)
      doc.text(`Valor mensal: ${money(data.totalMonthly)}`, margin, yPos)
      doc.text(`Valor total do contrato: ${money(data.totalAnnual)}`, margin + 78, yPos)
      yPos += 16

      sectionTitle('Equipamentos e Frota')
      data.equipments.forEach((equipment, index) => {
        ensureSpace(30)
        const details = equipment.details || equipment.detalhesCalculo || {}
        const isFranchise = details.modalidadeLocacao === 'franquia'
          || details.modalidade === 'franquia'
          || (Number(details.franquiaMensal || 0) > 0 && Number(details.valorFranquia || 0) > 0)
        const hasColorExcess = isFranchise && Number(details.valorPaginaExcedenteColor || 0) > 0
        const equipmentBoxHeight = isFranchise && hasColorExcess ? 30 : 24
        doc.setFillColor(245, 247, 250)
        doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, equipmentBoxHeight, 2, 2, 'F')
        doc.setFontSize(10)
        doc.setTextColor(20)
        doc.text(`${index + 1}. ${equipment.brand} ${equipment.model}`, margin + 3, yPos)
        doc.setFontSize(8)
        doc.setTextColor(80)
        doc.text(`Tipo: ${equipment.type}`, margin + 3, yPos + 7)
        doc.text(`Prazo: ${details.prazoContrato || equipment.contractMonths || '-'} meses`, margin + 52, yPos + 7)
        doc.text(`Mensal: ${money(equipment.monthlyCost)}`, margin + 100, yPos + 7)
        if (isFranchise) {
          doc.text(`Franquia: ${Number(details.franquiaMensal || equipment.monthlyVolume || 0).toLocaleString('pt-BR')} páginas/mês`, margin + 3, yPos + 14)
          doc.text(`Página excedente Mono: R$ ${Number(details.valorPaginaExcedenteMono || details.custoPorPaginaMono || equipment.pageCost || 0).toFixed(4)}`, margin + 76, yPos + 14)
          if (hasColorExcess) {
            doc.text(`Página excedente Color: R$ ${Number(details.valorPaginaExcedenteColor || details.custoPorPaginaColor || 0).toFixed(4)}`, margin + 76, yPos + 20)
          }
        } else {
          doc.text(`Valor por página: R$ ${Number(details.valorPorPagina || details.custoPorPagina || equipment.pageCost || 0).toFixed(4)}`, margin + 3, yPos + 14)
        }
        yPos += equipmentBoxHeight + 6

        const fleet = details.impressoras || []
        if (fleet.length > 0) {
          ensureSpace(10 + fleet.length * 7)
          doc.setFontSize(8)
          doc.setTextColor(60)
          doc.text('Frota:', margin + 6, yPos)
          yPos += 6
          fleet.forEach((printer: any) => {
            ensureSpace(8)
            doc.text(`- ${printer.quantidade || 1}x ${printer.marca} ${printer.modelo} (${printer.tipo})`, margin + 10, yPos)
            yPos += 6
          })
        }

        const infrastructure = details.infraestrutura || []
        if (infrastructure.length > 0) {
          ensureSpace(10 + infrastructure.length * 7)
          doc.setFontSize(8)
          doc.setTextColor(60)
          doc.text(`Infraestrutura (${details.infraestruturaModo === 'mensal-separado' ? 'mensal separada' : 'incluída na locação'}):`, margin + 6, yPos)
          yPos += 6
          infrastructure.forEach((item: any) => {
            ensureSpace(8)
            doc.text(`- ${item.quantidade || 1}x ${item.tipo}: ${item.descricao}`, margin + 10, yPos)
            yPos += 6
          })
        }
      })

      addFooter()
      
      // Generate blob
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      
      console.log('PDF simples gerado com sucesso:', { blobSize: blob.size })
      
      return { blob, url }
    } catch (error) {
      console.error('Erro na geração do PDF simples:', error)
      throw error
    }
  }
}

export default SimplePDFGenerator
