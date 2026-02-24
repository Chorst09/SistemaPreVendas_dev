// src/components/partners/PartnerView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import '@/styles/print.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Package, Search, Eye, FileText, Building, Globe, User, Lock } from "lucide-react";
import PartnerForm from "./PartnerForm"; // Assumindo que você tem este componente
import { Partner } from "@/lib/types"; // Assumindo que você tem este tipo

// Importar Firebase
import { getFirestore, doc, collection, setDoc, deleteDoc, getDocs } from "firebase/firestore";
// Importação de User e useAuth removidas
// import { User } from "firebase/auth";
// import { useAuth } from "@/hooks/use-auth";
import { getFirebaseApp } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { PartnerType } from "@/lib/types/enums";


// Defina as props para o componente
interface PartnerViewProps {
  partnerType: string; // Ex: "Cliente" ou "Fornecedor"
}

const PartnerView: React.FC<PartnerViewProps> = ({ partnerType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPartner, setViewingPartner] = useState<Partner | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Uso de useAuth removido
  // const { user, loading: loadingAuth } = useAuth();
  // Não precisamos mais do estado de carregamento de autenticação aqui

  // Obtém a instância do Firestore (db)
  const app = getFirebaseApp();
  const db = app ? getFirestore(app) : null;

  // Função para construir a referência da coleção Firestore (agora sem subcoleção de usuário)
  const getPartnersCollectionRef = () => {
    if (!db) return null;
    // Altere o caminho da coleção para ser direto, sem o userId
    return collection(db, "partners"); // Coleção "partners" no nível raiz
  };

  // Função para carregar parceiros do Firestore
  const loadPartners = async () => {
    // Verifica se Firestore está disponível antes de tentar carregar
    if (!db) {
      setPartners([]);
      setLoadingPartners(false);
      console.error("Firestore não disponível para carregar parceiros.");
      return;
    }

    setLoadingPartners(true); // Indica que o carregamento começou
    const partnersCollectionRef = getPartnersCollectionRef(); // Usa a nova função

    if (!partnersCollectionRef) {
      setLoadingPartners(false);
      console.error("Referência da coleção de parceiros não disponível.");
      return;
    }

    try {
      const querySnapshot = await getDocs(partnersCollectionRef);
      const loadedPartners: Partner[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id) || Date.now(), // Converte para number ou usa timestamp
          name: data.name || '',
          type: data.type || 'Distribuidor',
          contact: data.contact || '',
          phone: data.phone || '',
          status: data.status || 'Ativo',
          mainContact: data.mainContact,
          site: data.site,
          siteEcommerce: data.siteEcommerce,
          products: data.products,
          sitePartner: data.sitePartner,
          siteRO: data.siteRO,
          templateRO: data.templateRO,
          procedimentoRO: data.procedimentoRO,
          login: data.login,
          password: data.password,
          loginEcommerce: data.loginEcommerce,
          passwordEcommerce: data.passwordEcommerce,
          vendedoresResponsaveis: data.vendedoresResponsaveis || []
        } as Partner;
      });

      // Filtrar por partnerType, se necessário, no cliente após carregar tudo
      // Ou você pode adicionar uma query no getDocs para filtrar no lado do servidor
      const filteredPartners = loadedPartners.filter(p => p.type === partnerType); // Exemplo de filtro

      setPartners(filteredPartners); // Atualiza o estado local com os parceiros carregados e filtrados
      console.log(`Parceiros (${partnerType}) carregados:`, filteredPartners);
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error);
      // Implementar tratamento de erro na UI (ex: exibir mensagem de erro)
    } finally {
      setLoadingPartners(false); // Indica que o carregamento terminou
    }
  };

  // Efeito para carregar parceiros quando o componente monta
  useEffect(() => {
    loadPartners();
    // Removida a dependência 'user'
  }, [db, partnerType]); // Adicionada dependência 'db' e 'partnerType'


  const handleOpenModal = (partner?: Partner) => {
    setEditingPartner(partner || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingPartner(null);
    setIsModalOpen(false);
  };

  const handleViewPartner = (partner: Partner) => {
    setViewingPartner(partner);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewingPartner(null);
    setIsViewModalOpen(false);
  };

  const handlePrintPDF = () => {
    if (viewingPartner) {
      window.print();
    }
  };

  // Função para verificar se é uma URL válida
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Componente para renderizar link ou texto
  const LinkOrText = ({ text, className = "" }: { text: string; className?: string }) => {
    if (isValidUrl(text)) {
      return (
        <a
          href={text}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 ${className}`}
        >
          {text}
          <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      );
    }
    return <span className={className}>{text}</span>;
  };

  // Função para remover campos undefined dos dados
  const cleanDataForFirestore = (data: any) => {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        // Sempre preservar vendedoresResponsaveis, mesmo se for array vazio
        if (key === 'vendedoresResponsaveis') {
          cleaned[key] = Array.isArray(data[key]) ? data[key] : [];
          console.log(`Preservando ${key}:`, cleaned[key]); // Debug log específico
        } else if (data[key] !== '') {
          cleaned[key] = data[key];
        }
      }
    });
    console.log('Dados após limpeza completa:', cleaned); // Debug log
    console.log('Vendedores após limpeza:', cleaned.vendedoresResponsaveis); // Debug log específico
    return cleaned;
  };

  // Lógica para salvar/atualizar parceiro no Firestore
  const handleSave = async (partnerData: Partner) => {
    console.log('Dados recebidos para salvar:', partnerData); // Debug log
    console.log('Vendedores no partnerData:', partnerData.vendedoresResponsaveis); // Debug log

    // Verifica se Firestore está disponível antes de salvar
    if (!db) {
      console.error("Firestore não disponível para salvar.");
      // Implementar feedback para o usuário (ex: toast de erro)
      return;
    }

    const partnersCollectionRef = getPartnersCollectionRef(); // Usa a nova função

    if (!partnersCollectionRef) {
      console.error("Referência da coleção de parceiros não disponível.");
      // Implementar feedback para o usuário
      return;
    }

    try {
      if (partnerData.id) {
        // Editando um parceiro existente (o ID do documento já existe)
        const partnerDocRef = doc(partnersCollectionRef, partnerData.id.toString());
        // Cria um objeto com os dados a serem salvos, excluindo o ID (que já está no caminho)
        const { id, ...rawDataToSave } = partnerData;
        const dataToSave = cleanDataForFirestore(rawDataToSave);
        
        console.log('Dados limpos para salvar:', dataToSave); // Debug log
        console.log('Vendedores nos dados limpos:', dataToSave.vendedoresResponsaveis); // Debug log
        
        await setDoc(partnerDocRef, dataToSave, { merge: true }); // Atualiza o documento mesclando os dados
        console.log("Parceiro atualizado no Firestore:", partnerData.id);

      } else {
        // Adicionando um novo parceiro (Firestore gerará o ID do documento)
        // doc() sem um ID específico cria uma referência com um ID automático
        const newPartnerRef = doc(partnersCollectionRef);
        // Inclua o partnerType nos dados ao salvar um novo parceiro
        const rawDataToSave = { ...partnerData, type: partnerType };
        const dataToSave = cleanDataForFirestore(rawDataToSave);
        
        console.log('Dados limpos para novo parceiro:', dataToSave); // Debug log
        
        await setDoc(newPartnerRef, dataToSave); // Salva os dados no novo documento
        console.log("Novo parceiro adicionado ao Firestore com ID:", newPartnerRef.id);

        // Atualizar o estado local com o novo parceiro incluindo o ID gerado pelo Firestore e o type
        setPartners([...partners, {
          ...dataToSave,
          id: parseInt(newPartnerRef.id) || Date.now(),
          type: partnerType as PartnerType
        }]);

      }

      // Após salvar no Firestore, recarrega a lista para manter o estado local sincronizado
      loadPartners();

      handleCloseModal(); // Fecha o modal após salvar
      // Implementar toast de sucesso
    } catch (error) {
      console.error("Erro ao salvar parceiro no Firestore:", error);
      // Implementar tratamento de erro na UI (com toast)
    }
  };

  // Lógica para excluir parceiro do Firestore
  const handleDelete = async (partnerId: string) => {
    // Verifica se Firestore está disponível antes de excluir
    if (!db) {
      console.error("Firestore não disponível para excluir.");
      // Implementar feedback para o usuário
      return;
    }

    const partnersCollectionRef = getPartnersCollectionRef(); // Usa a nova função

    if (!partnersCollectionRef) {
      console.error("Referência da coleção de parceiros não disponível.");
      // Implementar feedback para o usuário
      return;
    }

    // Confirmação antes de excluir
    if (window.confirm("Tem certeza que deseja excluir este parceiro?")) {
      try {
        const partnerDocRef = doc(partnersCollectionRef, partnerId); // Obtém a referência do documento pelo ID
        await deleteDoc(partnerDocRef); // Exclui o documento do Firestore
        console.log("Parceiro excluído do Firestore:", partnerId);
        // Atualiza o estado local removendo o parceiro excluído para uma resposta rápida na UI
        setPartners(partners.filter(p => p.id.toString() !== partnerId));
        // Implementar toast de sucesso
      } catch (error) {
        console.error("Erro ao excluir parceiro do Firestore:", error);
        // Implementar tratamento de erro na UI (com toast)
      }
    }
  };

  // Filtrar parceiros baseado no termo de busca
  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (partner.products && partner.products.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card className="shadow-lg">
      {/* Não precisamos mais verificar loadingAuth */}
      {/* {!loadingAuth && ( */}
      <>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle className="text-2xl mb-4 sm:mb-0">Lista de {partnerType}s</CardTitle>
          {/* O botão "Novo" não depende mais do usuário logado */}
          {/* {user && ( */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenModal()}>
                <PlusCircle size={20} className="mr-2" />
                Novo {partnerType}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPartner ? `Editar ${partnerType}` : `Adicionar Novo ${partnerType}`}</DialogTitle>
              </DialogHeader>
              {/* Renderiza o formulário de parceiro */}
              {isModalOpen && (
                <PartnerForm
                  partner={editingPartner}
                  onSave={handleSave}
                  onCancel={handleCloseModal}
                  partnerType={partnerType as any}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Modal de Visualização */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visualizar {partnerType}: {viewingPartner?.name}
                  </DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintPDF}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Imprimir PDF
                  </Button>
                </div>
              </DialogHeader>
              
              {viewingPartner && (
                <div id="partner-print-content" className="space-y-6">
                  {/* Cabeçalho Moderno */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">{viewingPartner.name}</h1>
                        <p className="text-blue-100 text-lg font-medium">{viewingPartner.type}</p>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                          viewingPartner.status === 'Ativo' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            viewingPartner.status === 'Ativo' ? 'bg-green-200' : 'bg-red-200'
                          }`}></div>
                          {viewingPartner.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cards de Informações */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Card de Contato */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-3 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Informações de Contato</h3>
                      </div>
                      <div className="space-y-4">
                        {viewingPartner.mainContact && (
                          <div className="flex items-start gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Contato Principal</p>
                              <p className="text-lg font-semibold text-gray-800">{viewingPartner.mainContact}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <a 
                              href={`mailto:${viewingPartner.contact}`}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                            >
                              {viewingPartner.contact}
                            </a>
                          </div>
                        </div>
                        {viewingPartner.phone && (
                          <div className="flex items-start gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Telefone</p>
                              <a 
                                href={`tel:${viewingPartner.phone.replace(/\D/g, '')}`}
                                className="text-lg font-semibold text-orange-600 hover:text-orange-800 hover:underline transition-colors duration-200"
                              >
                                {viewingPartner.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card de Produtos/Serviços */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-indigo-100 p-3 rounded-lg mr-3">
                          <Package className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Produtos/Serviços</h3>
                      </div>
                      {viewingPartner.products ? (
                        <div className="flex flex-wrap gap-2">
                          {viewingPartner.products.split(',').map((product, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              {product.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">Nenhum produto/serviço cadastrado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações Específicas por Tipo */}
                  {viewingPartner.type === 'Distribuidor' && (
                    <div className="space-y-6">
                      {/* Header da Seção */}
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">Informações do Portal</h3>
                      </div>
                      
                      {/* Cards de Sites e Acessos */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Portal Principal */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-500 p-2 rounded-lg mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-bold text-blue-800">Portal Principal</h4>
                          </div>
                          <div className="space-y-3">
                            {viewingPartner.site && (
                              <div className="bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-200 transition-colors">
                                <p className="text-sm font-medium text-blue-600 mb-2">Site</p>
                                <LinkOrText 
                                  text={viewingPartner.site} 
                                  className="font-semibold break-all text-sm"
                                />
                              </div>
                            )}
                            {viewingPartner.login && (
                              <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <p className="text-sm font-medium text-blue-600 mb-1">Login</p>
                                <p className="text-gray-800 font-semibold">{viewingPartner.login}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* E-commerce */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center mb-4">
                            <div className="bg-purple-500 p-2 rounded-lg mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-bold text-purple-800">E-commerce</h4>
                          </div>
                          <div className="space-y-3">
                            {viewingPartner.siteEcommerce && (
                              <div className="bg-white rounded-lg p-3 border border-purple-100 hover:border-purple-200 transition-colors">
                                <p className="text-sm font-medium text-purple-600 mb-2">Site</p>
                                <LinkOrText 
                                  text={viewingPartner.siteEcommerce} 
                                  className="font-semibold break-all text-sm"
                                />
                              </div>
                            )}
                            {viewingPartner.loginEcommerce && (
                              <div className="bg-white rounded-lg p-3 border border-purple-100">
                                <p className="text-sm font-medium text-purple-600 mb-1">Login</p>
                                <p className="text-gray-800 font-semibold">{viewingPartner.loginEcommerce}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vendedores Responsáveis */}
                      {viewingPartner.vendedoresResponsaveis && viewingPartner.vendedoresResponsaveis.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
                          <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-lg mr-4">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800">Vendedores Responsáveis</h4>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {viewingPartner.vendedoresResponsaveis.map((vendedor, index) => (
                              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-l-blue-500 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                {/* Fornecedor em destaque */}
                                <div className="flex items-center mb-3">
                                  <div className="bg-blue-500 p-2 rounded-lg mr-3">
                                    <Building className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-lg font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                    {vendedor.fornecedor}
                                  </span>
                                </div>
                                
                                {/* Nome do vendedor */}
                                <div className="mb-4">
                                  <p className="text-lg font-semibold text-gray-800">{vendedor.vendedor}</p>
                                </div>
                                
                                {/* Informações de contato */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-1.5 rounded-lg">
                                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                    </div>
                                    <span className="font-medium text-gray-800">{vendedor.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-1.5 rounded-lg">
                                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <span className="font-medium text-gray-800">{vendedor.email}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informações de Fornecedor */}
                  {viewingPartner.type === 'Fornecedor' && (
                    <div className="space-y-6">
                      {/* Header da Seção */}
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-lg mr-4 shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          Acessos ao Partner
                        </h3>
                      </div>
                      
                      {/* Acessos ao Partner */}
                      {viewingPartner.acessosPartner && viewingPartner.acessosPartner.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {viewingPartner.acessosPartner.map((acesso, index) => (
                            <div key={index} className="bg-white border-2 border-emerald-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:border-emerald-300">
                              {/* Header do Card */}
                              <div className="flex items-center mb-4">
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-lg mr-3 shadow-md">
                                  <Globe className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-emerald-800">{acesso.nome}</h4>
                                  <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mt-1"></div>
                                </div>
                              </div>

                              {/* Site */}
                              <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                                <div className="flex items-center mb-2">
                                  <svg className="w-4 h-4 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                  </svg>
                                  <span className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Site</span>
                                </div>
                                <LinkOrText 
                                  text={acesso.site} 
                                  className="font-semibold text-gray-800 break-all text-sm leading-relaxed"
                                />
                              </div>

                              {/* Credenciais */}
                              <div className="space-y-3">
                                {/* Login */}
                                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                  <div className="flex items-center mb-1">
                                    <User className="w-4 h-4 text-blue-600 mr-2" />
                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Login</span>
                                  </div>
                                  <p className="font-bold text-gray-800 text-sm">{acesso.login}</p>
                                </div>

                                {/* Senha */}
                                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                                  <div className="flex items-center mb-1">
                                    <Lock className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Senha</span>
                                  </div>
                                  <p className="font-bold text-gray-800 text-sm font-mono bg-purple-100 px-2 py-1 rounded border">
                                    {acesso.senha}
                                  </p>
                                </div>
                              </div>

                              {/* Badge de Status */}
                              <div className="mt-4 pt-3 border-t border-emerald-100">
                                <div className="flex items-center justify-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                    Ativo
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-semibold text-gray-600 mb-2">Nenhum Acesso Cadastrado</h4>
                          <p className="text-gray-500">Este fornecedor ainda não possui acessos ao partner configurados.</p>
                        </div>
                      )}

                      {/* Template RO */}
                      {viewingPartner.templateRO && (
                        <div className="bg-white border-2 border-blue-200 rounded-xl shadow-lg p-6">
                          <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg mr-3 shadow-md">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Template RO
                              </h4>
                              <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mt-1"></div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="font-bold text-gray-800 text-lg">{viewingPartner.templateRO}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Procedimento para RO */}
                      {viewingPartner.procedimentoRO && (
                        <div className="bg-white border-2 border-indigo-200 rounded-xl shadow-lg p-6">
                          <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-lg mr-3 shadow-md">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Procedimento para RO
                              </h4>
                              <div className="w-20 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mt-1"></div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-lg p-6">
                            <div className="prose prose-indigo max-w-none">
                              <p className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium text-base">
                                {viewingPartner.procedimentoRO}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
          {/* )} */}
        </CardHeader>
        <CardContent>
          {/* Campo de busca e estatísticas */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, contato ou produtos..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {!loadingPartners && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {filteredPartners.length} de {partners.length} {partnerType.toLowerCase()}s
                </span>
                <span>
                  {partners.filter(p => p.products && p.products.trim()).length} com produtos/serviços cadastrados
                </span>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            {/* Renderiza o loader enquanto carrega a lista de parceiros */}
            {loadingPartners ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando {partnerType}s...</span>
              </div>
            ) : filteredPartners.length === 0 ? (
              // Mensagem se não houver parceiros
              <p className="text-center text-gray-500">
                {searchTerm ? `Nenhum ${partnerType} encontrado para "${searchTerm}".` : `Nenhum ${partnerType} encontrado.`}
              </p>
            ) : (
              // Renderiza a tabela de parceiros
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Mapeia a lista de parceiros para linhas da tabela */}
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>{partner.name}</TableCell>
                      <TableCell>{partner.type}</TableCell>
                      <TableCell>{partner.contact}</TableCell>
                      <TableCell>{partner.phone}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {partner.products ? (
                            (() => {
                              const productList = partner.products.split(',').map(p => p.trim()).filter(p => p);
                              const displayProducts = productList.slice(0, 3);
                              const remainingCount = productList.length - 3;

                              return (
                                <div className="flex flex-wrap items-center gap-1">
                                  <Package className="h-4 w-4 text-blue-600 mr-1" />
                                  <div className="flex flex-wrap gap-1">
                                    {displayProducts.map((product, index) => (
                                      <span
                                        key={index}
                                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                        title={product}
                                      >
                                        {product.length > 15 ? `${product.substring(0, 15)}...` : product}
                                      </span>
                                    ))}
                                    {remainingCount > 0 && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs bg-gray-100 hover:bg-gray-200"
                                          >
                                            +{remainingCount} mais
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                          <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                              <Package className="h-5 w-5" />
                                              Produtos/Serviços - {partner.name}
                                            </DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-2">
                                            <p className="text-sm text-gray-600">
                                              Total de itens: {productList.length}
                                            </p>
                                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                                              {productList.map((product, index) => (
                                                <span
                                                  key={index}
                                                  className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                                                >
                                                  {product}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="flex items-center text-gray-400 text-sm">
                              <Package className="h-4 w-4 mr-1" />
                              Nenhum produto/serviço cadastrado
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{partner.status}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {/* Botão Visualizar */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewPartner(partner)}
                            title="Visualizar"
                          >
                            <Eye size={18} className="text-blue-500" />
                          </Button>
                          {/* Botão Editar */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenModal(partner)}
                            title="Editar"
                          >
                            <Edit size={18} />
                          </Button>
                          {/* Botão Excluir */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(partner.id.toString())}
                            title="Excluir"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </>
      {/* )} */}
    </Card>
  );
};

export default PartnerView;
